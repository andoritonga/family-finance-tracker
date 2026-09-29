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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sheetName: string }> }
) {
  try {
    const { sheetName: rawSheetName } = await params;
    const sheetName = decodeURIComponent(rawSheetName);
    const body = await request.json();
    
    const { pengeluaran, budget, posisi, keterangan } = body;
    
    if (!pengeluaran || typeof pengeluaran !== 'string' || !pengeluaran.trim()) {
      return NextResponse.json({ error: 'Nama pengeluaran wajib diisi' }, { status: 400 });
    }

    const sheets = getSheets();

    // 1. Get sheetId for batchUpdate insertDimension
    const meta = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    const targetSheet = meta.data.sheets?.find(
      s => s.properties?.title === sheetName
    );
    if (!targetSheet || targetSheet.properties?.sheetId === undefined) {
      return NextResponse.json({ error: 'Sheet tidak ditemukan' }, { status: 404 });
    }
    const sheetId = targetSheet.properties.sheetId;

    // 2. Fetch current rows to find where items end
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${sheetName}'!A:H`,
    });

    const rows = response.data.values || [];
    let lastItemRowIndex1Based = 1; // row 1 is header
    let maxNo = 0;

    for (let i = 1; i < rows.length; i++) {
      const col0 = (rows[i][0] || '').trim();
      if (/^\d+$/.test(col0)) {
        lastItemRowIndex1Based = i + 1;
        const no = parseInt(col0, 10);
        if (no > maxNo) maxNo = no;
      } else {
        break;
      }
    }

    // 3. Insert a new row right after the last item (before summary)
    const insertRowIndex0Based = lastItemRowIndex1Based;
    const newRow1Based = insertRowIndex0Based + 1;
    const nextNo = maxNo + 1;
    const numBudget = typeof budget === 'number' ? budget : parseInt(String(budget || 0).replace(/[^0-9-]/g, ''), 10) || 0;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            insertDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: insertRowIndex0Based,
                endIndex: insertRowIndex0Based + 1,
              },
              inheritFromBefore: true,
            },
          },
        ],
      },
    });

    // 4. Populate values into the newly inserted row
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${sheetName}'!A${newRow1Based}:H${newRow1Based}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            nextNo,
            pengeluaran.trim(),
            numBudget,
            '', // Aktual empty
            `=C${newRow1Based}-D${newRow1Based}`, // Selisih formula
            'FALSE', // Checklist false
            posisi ? posisi.trim() : '',
            keterangan ? keterangan.trim() : '',
          ],
        ],
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Item pengeluaran berhasil ditambahkan',
      item: {
        no: nextNo,
        pengeluaran: pengeluaran.trim(),
        budget: numBudget,
        aktual: null,
        selisih: numBudget,
        checklist: false,
        posisi: posisi ? posisi.trim() : '',
        keterangan: keterangan ? keterangan.trim() : '',
      },
    });
  } catch (error: any) {
    console.error(`Error adding item to sheet:`, error);
    return NextResponse.json(
      { error: 'Gagal menambahkan item pengeluaran', details: error.message },
      { status: 500 }
    );
  }
}
