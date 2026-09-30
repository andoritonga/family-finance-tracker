import { NextRequest, NextResponse } from 'next/server';
import { getSheets, getSpreadsheetId } from '@/lib/google-sheets';
import { parseSheetName } from '@/lib/sheet-helpers';
import { cache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    if (!forceRefresh) {
      const cached = cache.get<{ name: string; month: number; year: number }[]>('sheetList');
      if (cached) {
        return NextResponse.json(cached);
      }
    }

    const sheets = getSheets();
    const spreadsheetId = getSpreadsheetId();
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });
    
    const allSheets = response.data.sheets || [];
    const monthlySheets = allSheets
      .map(sheet => {
        const name = sheet.properties?.title || '';
        const parsed = parseSheetName(name);
        if (parsed) {
          return { name, month: parsed.month, year: parsed.year };
        }
        return null;
      })
      .filter((sheet): sheet is { name: string; month: number; year: number } => sheet !== null);
      
    // Sort by date descending
    monthlySheets.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

    return NextResponse.json(monthlySheets);
  } catch (error: any) {
    console.error('Error fetching sheets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sheets', details: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}
