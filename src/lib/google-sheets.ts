// Lightweight Google Sheets API v4 client using native Web Crypto (crypto.subtle) & fetch.
// Avoids bundling the massive `googleapis` / `google-auth-library` packages in Cloudflare Workers,
// reducing cold-start bundle size and cutting per-request CPU time from ~1000ms to <2ms.

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

let cachedKeySource = '';
let cachedCryptoKey: CryptoKey | null = null;
let cachedClientEmail = '';
let cachedTokenUri = 'https://oauth2.googleapis.com/token';
let cachedToken: CachedToken | null = null;
let inflightTokenPromise: Promise<string> | null = null;

export function getEnv(key: string): string {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key]!;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require('@opennextjs/cloudflare');
    const ctx = getCloudflareContext();
    if (ctx && ctx.env && ctx.env[key]) {
      return String(ctx.env[key]);
    }
  } catch {
    // Cloudflare context not available or outside request
  }
  return '';
}

export function getSpreadsheetId(): string {
  return getEnv('GOOGLE_SPREADSHEET_ID') || '';
}

// Backwards-compatible export that evaluates dynamically
export const SPREADSHEET_ID = new Proxy(String, {
  apply: () => getSpreadsheetId(),
  get: (_target, prop) => {
    const val = getSpreadsheetId();
    if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf') {
      return () => val;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const member = (val as any)[prop];
    return typeof member === 'function' ? member.bind(val) : member;
  },
}) as unknown as string;

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlEncodeString(str: string): string {
  return base64UrlEncodeBytes(new TextEncoder().encode(str));
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN [A-Z ]+-----/g, '')
    .replace(/-----END [A-Z ]+-----/g, '')
    .replace(/\s+/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function resolveServiceAccountCredentials(): ServiceAccountCredentials {
  // 1. Direct JSON string or Base64 JSON in GOOGLE_SERVICE_ACCOUNT or GOOGLE_SERVICE_ACCOUNT_KEY
  const rawKey = getEnv('GOOGLE_SERVICE_ACCOUNT') || getEnv('GOOGLE_SERVICE_ACCOUNT_KEY');
  if (rawKey && rawKey.trim()) {
    try {
      let jsonStr = rawKey.trim();
      if (!jsonStr.startsWith('{')) {
        try {
          const decoded = Buffer.from(jsonStr, 'base64').toString('utf-8');
          if (decoded.startsWith('{')) jsonStr = decoded;
        } catch {}
      }
      const parsed = JSON.parse(jsonStr);
      if (parsed.private_key) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      }
      if (!parsed.client_email || !parsed.private_key) {
        throw new Error('client_email atau private_key tidak ditemukan di JSON');
      }
      return {
        client_email: parsed.client_email.trim(),
        private_key: parsed.private_key,
        token_uri: parsed.token_uri || 'https://oauth2.googleapis.com/token',
      };
    } catch (error: any) {
      console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT:', error);
      throw new Error(`Format GOOGLE_SERVICE_ACCOUNT tidak valid: ${error.message}`);
    }
  }

  // 2. Individual environment variables (EMAIL & PRIVATE_KEY)
  const clientEmail = getEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL') || getEnv('GOOGLE_CLIENT_EMAIL');
  const privateKey = getEnv('GOOGLE_PRIVATE_KEY');
  if (clientEmail && privateKey) {
    return {
      client_email: clientEmail.trim(),
      private_key: privateKey.replace(/\\n/g, '\n'),
      token_uri: 'https://oauth2.googleapis.com/token',
    };
  }

  // 3. Fallback to local file path (for local development or Docker)
  const keyPath = getEnv('GOOGLE_SERVICE_ACCOUNT_KEY_PATH');
  if (keyPath) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('node:fs');
      const fileContent = fs.readFileSync(/*turbopackIgnore: true*/ keyPath, 'utf-8');
      const parsed = JSON.parse(fileContent);
      if (parsed.private_key) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      }
      return {
        client_email: parsed.client_email.trim(),
        private_key: parsed.private_key,
        token_uri: parsed.token_uri || 'https://oauth2.googleapis.com/token',
      };
    } catch (error: any) {
      console.error('Failed to load credentials from file path:', error);
      throw error;
    }
  }

  throw new Error(
    'Kredensial Google Service Account belum disetel di Environment Variables. Pastikan GOOGLE_SERVICE_ACCOUNT_KEY (atau GOOGLE_SERVICE_ACCOUNT_EMAIL & GOOGLE_PRIVATE_KEY) sudah ditambahkan di Cloudflare Workers.'
  );
}

async function getAccessToken(): Promise<string> {
  const nowMs = Date.now();
  if (cachedToken && nowMs < cachedToken.expiresAt - 60_000) {
    return cachedToken.accessToken;
  }

  if (inflightTokenPromise) {
    return inflightTokenPromise;
  }

  inflightTokenPromise = (async () => {
    try {
      const creds = resolveServiceAccountCredentials();
      const keySource = `${creds.client_email}:${creds.private_key.length}`;

      if (!cachedCryptoKey || cachedKeySource !== keySource) {
        const keyBuffer = pemToArrayBuffer(creds.private_key);
        cachedCryptoKey = await globalThis.crypto.subtle.importKey(
          'pkcs8',
          keyBuffer,
          { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
          false,
          ['sign']
        );
        cachedKeySource = keySource;
        cachedClientEmail = creds.client_email;
        cachedTokenUri = creds.token_uri || 'https://oauth2.googleapis.com/token';
      }

      const nowSec = Math.floor(Date.now() / 1000);
      const headerB64 = base64UrlEncodeString(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payloadB64 = base64UrlEncodeString(
        JSON.stringify({
          iss: cachedClientEmail,
          scope: 'https://www.googleapis.com/auth/spreadsheets',
          aud: cachedTokenUri,
          iat: nowSec,
          exp: nowSec + 3600,
        })
      );

      const signingInput = `${headerB64}.${payloadB64}`;
      const signatureBuffer = await globalThis.crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        cachedCryptoKey,
        new TextEncoder().encode(signingInput)
      );
      const signatureB64 = base64UrlEncodeBytes(new Uint8Array(signatureBuffer));
      const assertion = `${signingInput}.${signatureB64}`;

      const res = await fetch(cachedTokenUri, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${assertion}`,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OAuth token exchange failed (${res.status}): ${errText}`);
      }

      const tokenData = (await res.json()) as { access_token: string; expires_in?: number };
      const ttlSeconds = tokenData.expires_in || 3600;
      cachedToken = {
        accessToken: tokenData.access_token,
        expiresAt: Date.now() + ttlSeconds * 1000,
      };
      return cachedToken.accessToken;
    } finally {
      inflightTokenPromise = null;
    }
  })();

  return inflightTokenPromise;
}

async function sheetsRequest<T = any>(
  url: string,
  init?: RequestInit
): Promise<{ data: T }> {
  const token = await getAccessToken();
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    let errMsg = `Google Sheets API error (${res.status})`;
    try {
      const parsed = JSON.parse(errText);
      if (parsed?.error?.message) {
        errMsg = parsed.error.message;
      }
    } catch {
      if (errText) errMsg = `${errMsg}: ${errText}`;
    }
    throw new Error(errMsg);
  }

  const data = (await res.json()) as T;
  return { data };
}

export function getSheets() {
  // Validate credentials upfront so misconfiguration throws immediately
  resolveServiceAccountCredentials();

  const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

  return {
    spreadsheets: {
      async get(params: { spreadsheetId: string; fields?: string }) {
        const fields = params.fields || 'sheets.properties(sheetId,title)';
        const url = `${BASE_URL}/${encodeURIComponent(params.spreadsheetId)}?fields=${encodeURIComponent(fields)}`;
        return sheetsRequest<{
          sheets?: Array<{
            properties?: {
              sheetId?: number;
              title?: string;
            };
          }>;
        }>(url);
      },

      async batchUpdate(params: { spreadsheetId: string; requestBody: any }) {
        const url = `${BASE_URL}/${encodeURIComponent(params.spreadsheetId)}:batchUpdate`;
        return sheetsRequest(url, {
          method: 'POST',
          body: JSON.stringify(params.requestBody),
        });
      },

      values: {
        async get(params: {
          spreadsheetId: string;
          range: string;
          valueRenderOption?: string;
        }) {
          const qs = params.valueRenderOption
            ? `?valueRenderOption=${encodeURIComponent(params.valueRenderOption)}`
            : '';
          const url = `${BASE_URL}/${encodeURIComponent(params.spreadsheetId)}/values/${encodeURIComponent(params.range)}${qs}`;
          return sheetsRequest<{
            range?: string;
            majorDimension?: string;
            values?: any[][];
          }>(url);
        },

        async batchGet(params: {
          spreadsheetId: string;
          ranges: string[];
          valueRenderOption?: string;
        }) {
          const searchParams = new URLSearchParams();
          for (const r of params.ranges) {
            searchParams.append('ranges', r);
          }
          if (params.valueRenderOption) {
            searchParams.set('valueRenderOption', params.valueRenderOption);
          }
          const url = `${BASE_URL}/${encodeURIComponent(params.spreadsheetId)}/values:batchGet?${searchParams.toString()}`;
          return sheetsRequest<{
            spreadsheetId?: string;
            valueRanges?: Array<{
              range?: string;
              majorDimension?: string;
              values?: any[][];
            }>;
          }>(url);
        },

        async update(params: {
          spreadsheetId: string;
          range: string;
          valueInputOption?: string;
          requestBody: { values: any[][] };
        }) {
          const valueInputOption = params.valueInputOption || 'USER_ENTERED';
          const url = `${BASE_URL}/${encodeURIComponent(params.spreadsheetId)}/values/${encodeURIComponent(params.range)}?valueInputOption=${encodeURIComponent(valueInputOption)}`;
          return sheetsRequest(url, {
            method: 'PUT',
            body: JSON.stringify(params.requestBody),
          });
        },

        async batchUpdate(params: {
          spreadsheetId: string;
          requestBody: {
            valueInputOption?: string;
            data: Array<{ range: string; values: any[][] }>;
          };
        }) {
          const url = `${BASE_URL}/${encodeURIComponent(params.spreadsheetId)}/values:batchUpdate`;
          return sheetsRequest(url, {
            method: 'POST',
            body: JSON.stringify(params.requestBody),
          });
        },
      },
    },
  };
}

