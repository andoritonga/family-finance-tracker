import { NextRequest, NextResponse } from 'next/server';
import { getSheets, SPREADSHEET_ID } from '@/lib/google-sheets';
import { parseSheetData, parseSheetName } from '@/lib/sheet-helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sheetName: string }> }
) {
  try {
    const { sheetName: rawSheetName } = await params;
    const sheetName = decodeURIComponent(rawSheetName);
    const parsedName = parseSheetName(sheetName);
    
    if (!parsedName) {
      return NextResponse.json({ error: 'Invalid sheet name format' }, { status: 400 });
    }

    const sheets = getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${sheetName}'!A:H`,
    });

    const rows = response.data.values || [];
    const { items, positionSummaries } = parseSheetData(rows);

    let totalBudget = 0;
    let totalAktual = 0;
    let totalSelisih = 0;

    items.forEach(item => {
      totalBudget += item.budget;
      totalAktual += item.aktual || 0;
      totalSelisih += item.selisih || 0;
    });

    const monthlySheet = {
      name: sheetName,
      month: parsedName.month,
      year: parsedName.year,
      items,
      positionSummaries,
      totalBudget,
      totalAktual,
      totalSelisih
    };

    return NextResponse.json(monthlySheet);
  } catch (error: any) {
    console.error(`Error fetching sheet:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch sheet data', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sheetName: string }> }
) {
  try {
    const { sheetName: rawSheetName } = await params;
    const sheetName = decodeURIComponent(rawSheetName);
    const body = await request.json();
    
    const { rowIndex, aktual, checklist } = body;
    
    if (typeof rowIndex !== 'number') {
      return NextResponse.json({ error: 'rowIndex is required and must be a number' }, { status: 400 });
    }

    const sheets = getSheets();
    
    // In Google Sheets, rows are 1-indexed. Items start at row 2, so sheetRow = rowIndex + 2.
    const sheetRow = rowIndex + 2;
    
    const updateData = [
      {
        range: `'${sheetName}'!D${sheetRow}`,
        values: [[aktual !== null && aktual !== undefined ? aktual : '']]
      },
      {
        range: `'${sheetName}'!F${sheetRow}`,
        values: [[checklist ? 'TRUE' : 'FALSE']]
      }
    ];

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: updateData
      }
    });

    return NextResponse.json({ success: true, message: 'Updated successfully' });
  } catch (error: any) {
    console.error(`Error updating sheet:`, error);
    return NextResponse.json(
      { error: 'Failed to update sheet data', details: error.message },
      { status: 500 }
    );
  }
}
