import { google } from 'googleapis';

export const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || '';

export function getSheets() {
  let auth;

  // 1. Direct JSON string or Base64 JSON in GOOGLE_SERVICE_ACCOUNT_KEY
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
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
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (clientEmail && privateKey) {
    try {
      const formattedKey = privateKey.replace(/\\n/g, '\n');
      auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: clientEmail.trim(),
          private_key: formattedKey,
          project_id: process.env.GOOGLE_PROJECT_ID,
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
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
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
