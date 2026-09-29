import { NextRequest, NextResponse } from 'next/server';
import { getSheets, SPREADSHEET_ID } from '@/lib/google-sheets';
import { parseSheetName, getSheetName, parseSheetData } from '@/lib/sheet-helpers';

export async function POST(request: NextRequest) {
  try {
    const sheets = getSheets();
    
    // Parse body if present
    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      // Body is optional
    }
    
    const { sourceMonth, sourceYear, targetMonth, targetYear } = body as any;
    
    // Get all sheets
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    
    const allSheets = response.data.sheets || [];
    const monthlySheets = allSheets
      .map(sheet => {
        const name = sheet.properties?.title || '';
        const parsed = parseSheetName(name);
        return parsed ? { name, month: parsed.month, year: parsed.year, sheetId: sheet.properties?.sheetId } : null;
      })
      .filter(sheet => sheet !== null);
      
    // Sort descending
    monthlySheets.sort((a, b) => {
      if (a!.year !== b!.year) return b!.year - a!.year;
      return b!.month - a!.month;
    });

    if (monthlySheets.length === 0) {
      return NextResponse.json({ error: 'No existing sheets to use as source' }, { status: 400 });
    }

    // Determine source
    let source = monthlySheets[0]; // Latest by default
    if (sourceMonth && sourceYear) {
      const found = monthlySheets.find(s => s!.month === sourceMonth && s!.year === sourceYear);
      if (found) source = found;
      else return NextResponse.json({ error: 'Source sheet not found' }, { status: 404 });
    }
    
    // Determine target
    let tMonth = targetMonth;
    let tYear = targetYear;
    if (!tMonth || !tYear) {
      tMonth = source!.month === 12 ? 1 : source!.month + 1;
      tYear = source!.month === 12 ? source!.year + 1 : source!.year;
    }
    
    const targetName = getSheetName(tMonth, tYear);
    
    // Check if target already exists
    if (monthlySheets.some(s => s!.name === targetName)) {
      return NextResponse.json({ error: `Sheet ${targetName} already exists` }, { status: 400 });
    }
    
    // 1. Fetch source data (both formatted and formulas)
    const [sourceDataRes, sourceFormulaRes] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${source!.name}'!A:H`,
        valueRenderOption: 'FORMATTED_VALUE',
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${source!.name}'!A:H`,
        valueRenderOption: 'FORMULA',
      }),
    ]);
    
    const rows = sourceDataRes.data.values || [];
    const formulaRows = sourceFormulaRes.data.values || [];
    const { items, savingsInfo: sourceSavingsInfo } = parseSheetData(rows, formulaRows);
    
    // 2. Create new sheet
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: targetName,
              }
            }
          }
        ]
      }
    });
    
    // 3. Prepare data for the new sheet
    const targetValues: any[][] = [];
    
    // Headers
    targetValues.push(['No', 'Pengeluaran', 'Budget', 'Aktual', 'Selisih', 'Checklist', 'Posisi', 'Keterangan']);
    
    // Items
    let rowIndex = 2; // 1-based index, row 1 is header
    for (const item of items) {
      targetValues.push([
        item.no,
        item.pengeluaran,
        item.budget,
        '', // Aktual empty
        `=C${rowIndex}-D${rowIndex}`, // Selisih formula
        `=IF(E${rowIndex}=0, TRUE, FALSE)`, // Checklist formula automatic when selisih is 0
        item.posisi,
        item.keterangan
      ]);
      rowIndex++;
    }
    
    // Blank row
    targetValues.push(['', '', '', '', '', '', '', '']);
    rowIndex++;
    
    // Total Row
    const totalRow = rowIndex;
    targetValues.push([
      'Jumlah', 
      '', 
      `=SUM(C2:C${rowIndex-2})`, 
      `=SUM(D2:D${rowIndex-2})`, 
      `=C${totalRow}-D${totalRow}`, 
      '', '', ''
    ]);
    rowIndex++;
    
    // Blank row
    targetValues.push(['', '', '', '', '', '', '', '']);
    rowIndex++;

    // Nabung Row
    const nabungFormulaExpr = sourceSavingsInfo?.incomeFormula || '19340000';
    const nabungTargetAccount = sourceSavingsInfo?.targetAccount || 'Blu Saving Fani';
    const nabungKeterangan = sourceSavingsInfo?.keterangan || 'Pocket Harta';
    targetValues.push([
      'Nabung',
      '',
      `=(${nabungFormulaExpr})-C${totalRow}`,
      nabungTargetAccount,
      '',
      '',
      nabungKeterangan,
      ''
    ]);
    rowIndex++;

    // Blank row
    targetValues.push(['', '', '', '', '', '', '', '']);
    rowIndex++;
    
    // Position Summaries
    // The items go from row 2 to (totalRow-2)
    const itemsStartRow = 2;
    const itemsEndRow = totalRow - 2;
    const uniquePositions = Array.from(new Set(items.map(item => item.posisi).filter(p => Boolean(p && p.trim()))));
    const positionsToGenerate = uniquePositions.length > 0 ? uniquePositions : ['Cash', 'Bank'];
    
    targetValues.push(['', 'Posisi', 'Budget', 'Aktual', 'Selisih', '', '', '']);
    rowIndex++;
    
    for (const pos of positionsToGenerate) {
      targetValues.push([
        '',
        pos,
        `=SUMIF(G${itemsStartRow}:G${itemsEndRow}, "${pos}", C${itemsStartRow}:C${itemsEndRow})`,
        `=SUMIF(G${itemsStartRow}:G${itemsEndRow}, "${pos}", D${itemsStartRow}:D${itemsEndRow})`,
        `=SUMIF(G${itemsStartRow}:G${itemsEndRow}, "${pos}", E${itemsStartRow}:E${itemsEndRow})`,
        '', '', ''
      ]);
      rowIndex++;
    }

    // Transfer section 
    targetValues.push(['', '', '', '', '', '', '', '']);
    targetValues.push(['', 'TRANSFER', '', '', '', '', '', '']);

    // 4. Update the new sheet with values
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${targetName}'!A1`,
      valueInputOption: 'USER_ENTERED', // Needed for formulas to be evaluated
      requestBody: {
        values: targetValues
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      message: `Created sheet ${targetName}`,
      sheet: {
        name: targetName,
        month: tMonth,
        year: tYear
      }
    });
  } catch (error: any) {
    console.error('Error generating sheet:', error);
    return NextResponse.json(
      { error: 'Failed to generate sheet', details: error.message },
      { status: 500 }
    );
  }
}
