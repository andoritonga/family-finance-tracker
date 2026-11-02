import { NextRequest, NextResponse } from 'next/server';
import { getSheets, getSpreadsheetId } from '@/lib/google-sheets';
import { parseSheetData, parseSheetName } from '@/lib/sheet-helpers';
import { evaluateArithmeticExpression, parseRupiah, sanitizeSheetText } from '@/lib/format';
import { cache } from '@/lib/cache';
import {
  isDemoMode,
  getDemoMonthlySheet,
  updateDemoIncome,
  updateDemoExpenseItem,
  bulkRenameDemoPosition,
  deleteDemoExpenseItem,
  addDemoExpenseItem,
} from '@/lib/demo-store';

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

    if (isDemoMode()) {
      const demoSheet = await getDemoMonthlySheet(sheetName);
      if (!demoSheet) {
        return NextResponse.json({ error: 'Sheet tidak ditemukan' }, { status: 404 });
      }
      return NextResponse.json(demoSheet);
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

    const [fmtRes, fmlRes] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${sheetName}'!A:H`,
        valueRenderOption: 'FORMATTED_VALUE',
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${sheetName}'!A:H`,
        valueRenderOption: 'FORMULA',
      }),
    ]);

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

    if (isDemoMode()) {
      if (body.action === 'bulkRenamePosition') {
        const { oldPosisi, newPosisi } = body;
        if (!oldPosisi || !newPosisi || typeof newPosisi !== 'string' || !newPosisi.trim()) {
          return NextResponse.json({ error: 'Nama rekening lama dan baru wajib diisi' }, { status: 400 });
        }
        const updatedCount = await bulkRenameDemoPosition(sheetName, oldPosisi, newPosisi);
        return NextResponse.json({
          success: true,
          updatedCount,
          message: 'Rekening berhasil diperbarui secara massal',
        });
      }
      if (body.action === 'updateIncome' || body.income !== undefined || body.incomeFormula !== undefined) {
        await updateDemoIncome(sheetName, body);
        return NextResponse.json({ success: true, message: 'Income and savings updated successfully' });
      }
      const { rowIndex } = body;
      if (typeof rowIndex !== 'number') {
        return NextResponse.json({ error: 'rowIndex is required and must be a number' }, { status: 400 });
      }
      await updateDemoExpenseItem(sheetName, body);
      return NextResponse.json({ success: true, message: 'Updated successfully' });
    }

    // 1. Bulk Rename Account Position in a single batchUpdate call
    if (body.action === 'bulkRenamePosition') {
      const { oldPosisi, newPosisi } = body;
      if (!oldPosisi || !newPosisi || typeof newPosisi !== 'string' || !newPosisi.trim()) {
        return NextResponse.json({ error: 'Nama rekening lama dan baru wajib diisi' }, { status: 400 });
      }

      const sheets = getSheets();
      const spreadsheetId = getSpreadsheetId();
      const fmtRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${sheetName}'!A:H`,
        valueRenderOption: 'FORMATTED_VALUE',
      });

      const rows = fmtRes.data.values || [];
      const { items } = parseSheetData(rows);
      const sanitizedNewPos = sanitizeSheetText(newPosisi);

      const batchData = items
        .filter(item => item.posisi === oldPosisi && item.sheetRow)
        .map(item => ({
          range: `'${sheetName}'!G${item.sheetRow}`,
          values: [[sanitizedNewPos]],
        }));

      if (batchData.length > 0) {
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId,
          requestBody: {
            valueInputOption: 'USER_ENTERED',
            data: batchData,
          },
        });
        cache.delete(`sheet:${sheetName}`);
        cache.delete('analytics');
      }

      return NextResponse.json({
        success: true,
        updatedCount: batchData.length,
        message: 'Rekening berhasil diperbarui secara massal',
      });
    }
    
    // 2. Check if this is an Income & Savings update
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
        const candidate = body.incomeFormula.replace(/^=/, '').replace(/[^0-9+\-*/().\s]/g, '').trim();
        if (evaluateArithmeticExpression(candidate) !== null) {
          cleanExpr = candidate;
        }
      }
      if (!cleanExpr && body.income !== undefined) {
        const numIncome = parseRupiah(body.income);
        cleanExpr = String(Math.max(0, numIncome));
      }
      if (!cleanExpr) {
        return NextResponse.json({ error: 'Formula atau nominal pendapatan tidak valid' }, { status: 400 });
      }

      const targetAccount = sanitizeSheetText(body.targetAccount || savingsInfo?.targetAccount || 'Blu BCA Saving');
      const keterangan = sanitizeSheetText(body.keterangan || savingsInfo?.keterangan || 'Pocket Tabungan & Investasi');

      const nabungRowNumber = (savingsInfo?.savingsRowIndex !== undefined)
        ? savingsInfo.savingsRowIndex + 1
        : totalRowNumber + 2;

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

      cache.delete(`sheet:${sheetName}`);
      cache.delete('analytics');
      return NextResponse.json({ success: true, message: 'Income and savings updated successfully' });
    }

    const { rowIndex, sheetRow: explicitSheetRow, pengeluaran, budget, aktual, checklist, posisi, keterangan } = body;
    
    if (typeof explicitSheetRow !== 'number' && typeof rowIndex !== 'number') {
      return NextResponse.json({ error: 'rowIndex or sheetRow is required and must be a number' }, { status: 400 });
    }

    const sheets = getSheets();
    
    // Prefer exact 1-based sheetRow when provided; fallback to rowIndex + 2
    const sheetRow = typeof explicitSheetRow === 'number' && explicitSheetRow >= 2
      ? explicitSheetRow
      : rowIndex + 2;
    
    const updateData: { range: string; values: any[][] }[] = [];

    if (pengeluaran !== undefined) {
      updateData.push({
        range: `'${sheetName}'!B${sheetRow}`,
        values: [[sanitizeSheetText(pengeluaran)]],
      });
    }

    if (budget !== undefined) {
      const numBudget = parseRupiah(budget);
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
      const hasAktual = aktual !== null && aktual !== undefined && aktual !== '';
      updateData.push({
        range: `'${sheetName}'!D${sheetRow}`,
        values: [[hasAktual ? parseRupiah(aktual) : '']],
      });
      updateData.push({
        range: `'${sheetName}'!E${sheetRow}`,
        values: [[`=C${sheetRow}-D${sheetRow}`]],
      });
    }

    if (checklist !== undefined || budget !== undefined || aktual !== undefined) {
      const checkFormula = checklist === false
        ? `=IF(AND(ISNUMBER(D${sheetRow}), E${sheetRow}<=0), TRUE, FALSE)`
        : `=IF(E${sheetRow}<=0, TRUE, FALSE)`;
      updateData.push({
        range: `'${sheetName}'!F${sheetRow}`,
        values: [[checkFormula]],
      });
    }

    if (posisi !== undefined) {
      updateData.push({
        range: `'${sheetName}'!G${sheetRow}`,
        values: [[sanitizeSheetText(posisi)]],
      });
    }

    if (keterangan !== undefined) {
      updateData.push({
        range: `'${sheetName}'!H${sheetRow}`,
        values: [[sanitizeSheetText(keterangan)]],
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
    const { rowIndex, sheetRow: explicitSheetRow } = body;

    if (typeof explicitSheetRow !== 'number' && typeof rowIndex !== 'number') {
      return NextResponse.json({ error: 'rowIndex or sheetRow is required' }, { status: 400 });
    }

    if (isDemoMode()) {
      const ok = await deleteDemoExpenseItem(sheetName, rowIndex);
      if (!ok) {
        return NextResponse.json({ error: 'Item tidak ditemukan' }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: 'Item berhasil dihapus' });
    }

    const sheets = getSheets();
    const spreadsheetId = getSpreadsheetId();
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const targetSheet = meta.data.sheets?.find((s) => s.properties?.title === sheetName);
    if (!targetSheet || targetSheet.properties?.sheetId === undefined) {
      return NextResponse.json({ error: 'Sheet tidak ditemukan' }, { status: 404 });
    }
    const sheetId = targetSheet.properties.sheetId;

    // 0-based dimension index in Google Sheets
    const deleteRowIndex0Based = typeof explicitSheetRow === 'number' && explicitSheetRow >= 2
      ? explicitSheetRow - 1
      : rowIndex + 1;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
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

    // Re-number the remaining item rows (1..N) so item.no stays sequential and unique
    const afterRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetName}'!A:B`,
      valueRenderOption: 'FORMATTED_VALUE',
    });
    const afterRows = afterRes.data.values || [];
    const renumberValues: number[][] = [];
    for (let i = 1; i < afterRows.length; i++) {
      const col0 = (afterRows[i]?.[0] || '').trim();
      if (/^\d+$/.test(col0)) {
        renumberValues.push([renumberValues.length + 1]);
      } else {
        break;
      }
    }
    if (renumberValues.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${sheetName}'!A2:A${renumberValues.length + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: renumberValues },
      });
    }

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

    if (isDemoMode()) {
      const item = await addDemoExpenseItem(sheetName, { pengeluaran, budget, posisi, keterangan });
      if (!item) {
        return NextResponse.json({ error: 'Sheet tidak ditemukan' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        message: 'Item pengeluaran berhasil ditambahkan',
        item,
      });
    }

    const sheets = getSheets();
    const spreadsheetId = getSpreadsheetId();

    // 1 & 2. Fetch spreadsheet metadata and current rows in parallel
    const [meta, response] = await Promise.all([
      sheets.spreadsheets.get({ spreadsheetId }),
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${sheetName}'!A:H`,
      }),
    ]);

    const targetSheet = meta.data.sheets?.find(
      s => s.properties?.title === sheetName
    );
    if (!targetSheet || targetSheet.properties?.sheetId === undefined) {
      return NextResponse.json({ error: 'Sheet tidak ditemukan' }, { status: 404 });
    }
    const sheetId = targetSheet.properties.sheetId;

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
    const numBudget = parseRupiah(budget);
    const safePengeluaran = sanitizeSheetText(pengeluaran);
    const safePosisi = posisi ? sanitizeSheetText(posisi) : '';
    const safeKeterangan = keterangan ? sanitizeSheetText(keterangan) : '';

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
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
      spreadsheetId,
      range: `'${sheetName}'!A${newRow1Based}:H${newRow1Based}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            nextNo,
            safePengeluaran,
            numBudget,
            '', // Aktual empty
            `=C${newRow1Based}-D${newRow1Based}`, // Selisih formula
            `=IF(E${newRow1Based}=0, TRUE, FALSE)`, // Checklist formula automatic
            safePosisi,
            safeKeterangan,
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
        sheetRow: newRow1Based,
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
