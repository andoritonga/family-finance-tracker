import { NextRequest, NextResponse } from 'next/server';
import { getSheets, getSpreadsheetId } from '@/lib/google-sheets';
import { parseSheetData, parseSheetName } from '@/lib/sheet-helpers';
import { cache } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    const cacheKey = `sheet:${sheetName}`;

    if (!forceRefresh) {
      const cached = cache.get(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }
    }

    const sheets = getSheets();
    const spreadsheetId = getSpreadsheetId();

    const fmtRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetName}'!A:H`,
      valueRenderOption: 'FORMATTED_VALUE',
    });

    const fmlRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetName}'!A:H`,
      valueRenderOption: 'FORMULA',
    });

    const rows = fmtRes.data.values || [];
    const formulaRows = fmlRes.data.values || [];
    const { items, positionSummaries, savingsInfo } = parseSheetData(rows, formulaRows);

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
      savingsInfo,
      totalBudget,
      totalAktual,
      totalSelisih
    };

    cache.set(cacheKey, monthlySheet, 60);

    return NextResponse.json(monthlySheet);
  } catch (error: any) {
    console.error(`Error fetching sheet:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch sheet data', details: error.message, stack: error.stack },
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
    
    // Check if this is an Income & Savings update
    if (body.action === 'updateIncome' || body.income !== undefined || body.incomeFormula !== undefined) {
      const sheets = getSheets();
      const [fmtRes, fmlRes] = await Promise.all([
        sheets.spreadsheets.values.get({
          spreadsheetId: getSpreadsheetId(),
          range: `'${sheetName}'!A:H`,
          valueRenderOption: 'FORMATTED_VALUE',
        }),
        sheets.spreadsheets.values.get({
          spreadsheetId: getSpreadsheetId(),
          range: `'${sheetName}'!A:H`,
          valueRenderOption: 'FORMULA',
        }),
      ]);

      const rows = fmtRes.data.values || [];
      const formulaRows = fmlRes.data.values || [];
      const { savingsInfo } = parseSheetData(rows, formulaRows);

      let totalRowNumber = 35;
      for (let i = 0; i < rows.length; i++) {
        const c0 = (rows[i]?.[0] || '').toLowerCase();
        const c1 = (rows[i]?.[1] || '').toLowerCase();
        if (c0 === 'jumlah' || c0 === 'total' || c1 === 'jumlah' || c1 === 'total') {
          totalRowNumber = i + 1;
          break;
        }
      }

      let cleanExpr = '';
      if (body.incomeFormula && typeof body.incomeFormula === 'string') {
        cleanExpr = body.incomeFormula.replace(/^=/, '').trim();
      } else if (body.income !== undefined) {
        cleanExpr = String(body.income);
      }

      const targetAccount = body.targetAccount || savingsInfo?.targetAccount || 'Blu Saving Fani';
      const keterangan = body.keterangan || savingsInfo?.keterangan || 'Pocket Harta';

      let nabungRowNumber = (savingsInfo?.savingsRowIndex !== undefined) ? savingsInfo.savingsRowIndex + 1 : 0;

      if (nabungRowNumber > 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: getSpreadsheetId(),
          range: `'${sheetName}'!A${nabungRowNumber}:G${nabungRowNumber}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[
              'Nabung',
              '',
              `=(${cleanExpr})-C${totalRowNumber}`,
              targetAccount,
              '',
              '',
              keterangan,
            ]],
          },
        });
      } else {
        nabungRowNumber = totalRowNumber + 2;
        await sheets.spreadsheets.values.update({
          spreadsheetId: getSpreadsheetId(),
          range: `'${sheetName}'!A${nabungRowNumber}:G${nabungRowNumber}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[
              'Nabung',
              '',
              `=(${cleanExpr})-C${totalRowNumber}`,
              targetAccount,
              '',
              '',
              keterangan,
            ]],
          },
        });
      }
      cache.delete(`sheet:${sheetName}`);
      cache.delete('analytics');
      return NextResponse.json({ success: true, message: 'Income and savings updated successfully' });
    }

    const { rowIndex, pengeluaran, budget, aktual, checklist, posisi, keterangan } = body;
    
    if (typeof rowIndex !== 'number') {
      return NextResponse.json({ error: 'rowIndex is required and must be a number' }, { status: 400 });
    }

    const sheets = getSheets();
    
    // In Google Sheets, rows are 1-indexed. Items start at row 2, so sheetRow = rowIndex + 2.
    const sheetRow = rowIndex + 2;
    
    const updateData: { range: string; values: any[][] }[] = [];

    if (pengeluaran !== undefined) {
      updateData.push({
        range: `'${sheetName}'!B${sheetRow}`,
        values: [[pengeluaran.trim()]],
      });
    }

    if (budget !== undefined) {
      const numBudget = typeof budget === 'number' ? budget : parseInt(String(budget || 0).replace(/[^0-9-]/g, ''), 10) || 0;
      updateData.push({
        range: `'${sheetName}'!C${sheetRow}`,
        values: [[numBudget]],
      });
      updateData.push({
        range: `'${sheetName}'!E${sheetRow}`,
        values: [[`=C${sheetRow}-D${sheetRow}`]],
      });
    }

    if (aktual !== undefined) {
      updateData.push({
        range: `'${sheetName}'!D${sheetRow}`,
        values: [[aktual !== null && aktual !== undefined && aktual !== '' ? aktual : '']],
      });
      updateData.push({
        range: `'${sheetName}'!E${sheetRow}`,
        values: [[`=C${sheetRow}-D${sheetRow}`]],
      });
    }

    // Selalu pertahankan formula checklist otomatis di spreadsheet agar konsisten
    if (checklist !== undefined || budget !== undefined || aktual !== undefined) {
      updateData.push({
        range: `'${sheetName}'!F${sheetRow}`,
        values: [[`=IF(E${sheetRow}=0, TRUE, FALSE)`]],
      });
    }

    if (posisi !== undefined) {
      updateData.push({
        range: `'${sheetName}'!G${sheetRow}`,
        values: [[posisi.trim()]],
      });
    }

    if (keterangan !== undefined) {
      updateData.push({
        range: `'${sheetName}'!H${sheetRow}`,
        values: [[keterangan.trim()]],
      });
    }

    if (updateData.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: getSpreadsheetId(),
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: updateData,
        },
      });
      cache.delete(`sheet:${sheetName}`);
      cache.delete('analytics');
    }

    return NextResponse.json({ success: true, message: 'Updated successfully' });
  } catch (error: any) {
    console.error(`Error updating sheet:`, error);
    return NextResponse.json(
      { error: 'Failed to update sheet data', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sheetName: string }> }
) {
  try {
    const { sheetName: rawSheetName } = await params;
    const sheetName = decodeURIComponent(rawSheetName);
    const body = await request.json();
    const { rowIndex } = body;

    if (typeof rowIndex !== 'number') {
      return NextResponse.json({ error: 'rowIndex is required' }, { status: 400 });
    }

    const sheets = getSheets();
    const meta = await sheets.spreadsheets.get({ spreadsheetId: getSpreadsheetId() });
    const targetSheet = meta.data.sheets?.find((s) => s.properties?.title === sheetName);
    if (!targetSheet || targetSheet.properties?.sheetId === undefined) {
      return NextResponse.json({ error: 'Sheet tidak ditemukan' }, { status: 404 });
    }
    const sheetId = targetSheet.properties.sheetId;

    // rowIndex is 0-based index of item. Items start at row 2 (row index 1 in 0-based dimension)
    const deleteRowIndex0Based = rowIndex + 1;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: getSpreadsheetId(),
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: deleteRowIndex0Based,
                endIndex: deleteRowIndex0Based + 1,
              },
            },
          },
        ],
      },
    });

    cache.delete(`sheet:${sheetName}`);
    cache.delete('analytics');

    return NextResponse.json({ success: true, message: 'Item berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus item pengeluaran', details: error.message },
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
      spreadsheetId: getSpreadsheetId(),
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
      spreadsheetId: getSpreadsheetId(),
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
      spreadsheetId: getSpreadsheetId(),
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
      spreadsheetId: getSpreadsheetId(),
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
            `=IF(E${newRow1Based}=0, TRUE, FALSE)`, // Checklist formula automatic
            posisi ? posisi.trim() : '',
            keterangan ? keterangan.trim() : '',
          ],
        ],
      },
    });

    cache.delete(`sheet:${sheetName}`);
    cache.delete('analytics');

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
