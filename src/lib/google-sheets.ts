import { google } from 'googleapis';

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

export function getSheets() {
  let auth;

  // 1. Direct JSON string or Base64 JSON in GOOGLE_SERVICE_ACCOUNT_KEY
  const rawKey = getEnv('GOOGLE_SERVICE_ACCOUNT_KEY');
  if (rawKey && rawKey.trim()) {
    try {
      let jsonStr = rawKey.trim();
      // Auto-decode if it's base64 encoded
      if (!jsonStr.startsWith('{')) {
        try {
          const decoded = Buffer.from(jsonStr, 'base64').toString('utf-8');
          if (decoded.startsWith('{')) jsonStr = decoded;
        } catch {}
      }

      const credentials = JSON.parse(jsonStr);
      // Clean up escaped newlines if private_key was stringified with \n
      if (credentials.private_key) {
        credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
      }

      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      return google.sheets({ version: 'v4', auth });
    } catch (error: any) {
      console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY:', error);
      throw new Error(`Format GOOGLE_SERVICE_ACCOUNT_KEY tidak valid: ${error.message}`);
    }
  }

  // 2. Individual environment variables (EMAIL & PRIVATE_KEY)
  const clientEmail = getEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL') || getEnv('GOOGLE_CLIENT_EMAIL');
  const privateKey = getEnv('GOOGLE_PRIVATE_KEY');
  if (clientEmail && privateKey) {
    try {
      const formattedKey = privateKey.replace(/\\n/g, '\n');
      auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: clientEmail.trim(),
          private_key: formattedKey,
          project_id: getEnv('GOOGLE_PROJECT_ID') || undefined,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      return google.sheets({ version: 'v4', auth });
    } catch (error: any) {
      console.error('Failed to authenticate with GOOGLE_SERVICE_ACCOUNT_EMAIL/PRIVATE_KEY:', error);
      throw error;
    }
  }

  // 3. Fallback to local file path (for local development or Docker)
  const keyPath = getEnv('GOOGLE_SERVICE_ACCOUNT_KEY_PATH');
  if (keyPath) {
    try {
      auth = new google.auth.GoogleAuth({
        keyFile: keyPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      return google.sheets({ version: 'v4', auth });
    } catch (error: any) {
      console.error('Failed to load credentials from file path:', error);
      throw error;
    }
  }

  throw new Error(
    'Kredensial Google Service Account belum disetel di Environment Variables. Pastikan GOOGLE_SERVICE_ACCOUNT_KEY (atau GOOGLE_SERVICE_ACCOUNT_EMAIL & GOOGLE_PRIVATE_KEY) sudah ditambahkan di Cloudflare Pages.'
  );
}
