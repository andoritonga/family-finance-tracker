import { NextResponse } from 'next/server';
import { getEnv } from '@/lib/google-sheets';

export const dynamic = 'force-dynamic';

export async function GET() {
  const serviceAccountKey = getEnv('GOOGLE_SERVICE_ACCOUNT_KEY');
  const serviceAccountEmail = getEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL') || getEnv('GOOGLE_CLIENT_EMAIL');
  const privateKey = getEnv('GOOGLE_PRIVATE_KEY');
  const spreadsheetId = getEnv('GOOGLE_SPREADSHEET_ID');

  let processEnvKeys: string[] = [];
  try {
    processEnvKeys = Object.keys(process.env);
  } catch {}

  let cfKeys: string[] = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require('@opennextjs/cloudflare');
    const ctx = getCloudflareContext();
    if (ctx && ctx.env) {
      cfKeys = Object.keys(ctx.env);
    }
  } catch (e: any) {
    cfKeys = [`error: ${e.message}`];
  }

  return NextResponse.json({
    deployVersion: 'v2-opennext-debug-0148913',
    time: new Date().toISOString(),
    status: {
      hasServiceAccountKey: Boolean(serviceAccountKey && serviceAccountKey.length > 0),
      serviceAccountKeyLength: serviceAccountKey ? serviceAccountKey.length : 0,
      hasServiceAccountEmail: Boolean(serviceAccountEmail && serviceAccountEmail.length > 0),
      hasPrivateKey: Boolean(privateKey && privateKey.length > 0),
      hasSpreadsheetId: Boolean(spreadsheetId && spreadsheetId.length > 0),
      spreadsheetIdValue: spreadsheetId ? `${spreadsheetId.slice(0, 5)}...` : null,
    },
    diagnostics: {
      processEnvKeys: processEnvKeys.filter(k => !k.includes('KEY') && !k.includes('SECRET')),
      cfKeys: cfKeys.filter(k => !k.includes('KEY') && !k.includes('SECRET')),
      allProcessEnvMatchesGoogle: processEnvKeys.filter(k => k.toLowerCase().includes('google') || k.toLowerCase().includes('sheet')),
      allCfMatchesGoogle: cfKeys.filter(k => k.toLowerCase().includes('google') || k.toLowerCase().includes('sheet')),
    }
  });
}
