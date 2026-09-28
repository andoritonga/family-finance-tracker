import { NextResponse } from 'next/server';
import { getSheets, SPREADSHEET_ID } from '@/lib/google-sheets';
import { parseSheetName } from '@/lib/sheet-helpers';

export async function GET() {
  try {
    const sheets = getSheets();
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
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
      { error: 'Failed to fetch sheets', details: error.message },
      { status: 500 }
    );
  }
}
