import { NextResponse } from 'next/server';
import { isDemoMode, resetDemoData } from '@/lib/demo-store';

export const dynamic = 'force-dynamic';

export async function POST() {
  if (!isDemoMode()) {
    return NextResponse.json({ error: 'Demo mode is not active' }, { status: 400 });
  }
  await resetDemoData();
  return NextResponse.json({
    success: true,
    message: 'Demo data has been reset to default initial state',
  });
}

export async function GET() {
  return NextResponse.json({
    demoMode: isDemoMode(),
  });
}
