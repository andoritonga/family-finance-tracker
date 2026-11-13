import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/google-sheets';
import { isDemoMode } from '@/lib/demo-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (isDemoMode()) {
    return NextResponse.json({
      ok: true,
      demoMode: true,
      time: new Date().toISOString(),
    });
  }

  const serviceAccountKey = getEnv('GOOGLE_SERVICE_ACCOUNT') || getEnv('GOOGLE_SERVICE_ACCOUNT_KEY');
  const serviceAccountEmail = getEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL') || getEnv('GOOGLE_CLIENT_EMAIL');
  const privateKey = getEnv('GOOGLE_PRIVATE_KEY');
  const keyPath = getEnv('GOOGLE_SERVICE_ACCOUNT_KEY_PATH');
  const spreadsheetId = getEnv('GOOGLE_SPREADSHEET_ID');

  const hasAuth =
    Boolean(serviceAccountKey && serviceAccountKey.length > 0) ||
    Boolean(serviceAccountEmail && privateKey) ||
    Boolean(keyPath);
  const hasSpreadsheetId = Boolean(spreadsheetId && spreadsheetId.length > 0);

  return NextResponse.json({
    ok: hasAuth && hasSpreadsheetId,
    time: new Date().toISOString(),
  });
}

