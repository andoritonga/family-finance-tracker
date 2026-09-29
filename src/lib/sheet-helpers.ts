import { ExpenseItem, PositionSummary, SavingsInfo } from './types';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function parseRupiah(value: string): number {
  if (!value) return 0;
  const parsed = parseInt(value.replace(/[^0-9-]/g, ''), 10);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value);
}

export function getMonthName(month: number): string {
  return MONTH_NAMES[month - 1] || '';
}

export function getSheetName(month: number, year: number): string {
  return `${getMonthName(month)} ${year}`;
}

export function parseSheetName(name: string): { month: number; year: number } | null {
  const parts = name.split(' ');
  if (parts.length !== 2) return null;
  
  const monthName = parts[0];
  const yearStr = parts[1];
  
  const monthIndex = MONTH_NAMES.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
  if (monthIndex === -1) return null;
  
  const year = parseInt(yearStr, 10);
  if (isNaN(year)) return null;
  
  return { month: monthIndex + 1, year };
}

export function parseNabungFormula(formulaStr: string): { income: number; incomeFormula: string; totalCellRow?: number } | null {
  if (!formulaStr || typeof formulaStr !== 'string') return null;
  const match = formulaStr.match(/^=\s*\((.+)\)\s*-\s*[A-Z]+(\d+)/i) ||
                formulaStr.match(/^=\s*(.+)\s*-\s*[A-Z]+(\d+)/i);
  if (match) {
    const expr = match[1].trim();
    if (/^[0-9+\-*/.\s]+$/.test(expr)) {
      try {
        const val = Function(`'use strict'; return (${expr})`)();
        if (typeof val === 'number' && !isNaN(val)) {
          return {
            income: val,
            incomeFormula: expr,
            totalCellRow: match[2] ? parseInt(match[2], 10) : undefined
          };
        }
      } catch {
        // ignore
      }
    }
  }
  return null;
}

export function parseSheetData(
  rows: string[][],
  formulaRows?: (string | number)[][]
): {
  items: ExpenseItem[];
  positionSummaries: PositionSummary[];
  savingsInfo: SavingsInfo | null;
} {
  const items: ExpenseItem[] = [];
  const positionSummaries: PositionSummary[] = [];
  let savingsInfo: SavingsInfo | null = null;
  let totalRowIndex: number | undefined;
  
  if (!rows || rows.length <= 1) return { items, positionSummaries, savingsInfo };
  
  let isParsingItems = true;
  let isParsingPositions = false;
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    
    const col0 = (row[0] || '').trim();
    const col1 = (row[1] || '').trim();
    
    if (isParsingItems) {
      const isItemNo = /^\d+$/.test(col0);
      const isTotalWord = /^(jumlah|total|grand total|subtotal|nabung)$/i.test(col0) || /^(total|jumlah|grand total)$/i.test(col1);
      
      if (!isItemNo || isTotalWord || !col0) {
        isParsingItems = false;
        if (/^(jumlah|total)$/i.test(col0) || /^(jumlah|total)$/i.test(col1)) {
          totalRowIndex = i;
        }
      } else {
        const budget = parseRupiah(row[2] || '');
        const aktual = row[3] !== undefined && row[3] !== null && row[3].trim() !== '' ? parseRupiah(row[3]) : null;
        const selisih = parseRupiah(row[4] || '');
        const rawChecklist = (row[5] || '').toUpperCase() === 'TRUE';
        // Otomatis terchecklist jika selisih <= 0 (dan aktual sudah diisi) atau jika cell bernilai TRUE
        const isZeroDiff = aktual !== null && (budget - aktual) <= 0;
        const checklist = rawChecklist || isZeroDiff;

        items.push({
          no: parseInt(col0, 10),
          pengeluaran: col1,
          budget,
          aktual,
          selisih,
          checklist,
          posisi: (row[6] || '').trim(),
          keterangan: (row[7] || '').trim()
        });
        continue;
      }
    }
    
    // Check for Nabung row
    if (col0.toLowerCase().includes('nabung')) {
      const nominal = parseRupiah(row[2] || '');
      const targetAccount = (row[3] || '').trim();
      const keterangan = (row[6] || row[7] || '').trim();
      
      let income = 0;
      let incomeFormula = '';
      
      const rawFormula = formulaRows && formulaRows[i] && formulaRows[i][2] !== undefined
        ? String(formulaRows[i][2])
        : '';
        
      const parsedFormula = parseNabungFormula(rawFormula);
      if (parsedFormula) {
        income = parsedFormula.income;
        incomeFormula = parsedFormula.incomeFormula;
      } else {
        const totalItemsBudget = items.reduce((sum, item) => sum + item.budget, 0);
        income = nominal + totalItemsBudget;
        incomeFormula = income.toString();
      }
      
      savingsInfo = {
        nominal,
        targetAccount,
        keterangan,
        income,
        incomeFormula,
        savingsRowIndex: i,
        totalRowIndex,
      };
      continue;
    }
    
    // Position Section
    if (!isParsingPositions) {
      if (col1 === 'Posisi') {
        isParsingPositions = true;
      }
    } else {
      if (!col1 || col1.toLowerCase().includes('grand total') || col1.toLowerCase().includes('transfer') || col1.toLowerCase().includes('total')) {
        continue;
      }
      if (col1 && row[2] !== undefined) {
        positionSummaries.push({
          posisi: col1,
          budget: parseRupiah(row[2] || ''),
          aktual: parseRupiah(row[3] || ''),
          selisih: parseRupiah(row[4] || '')
        });
      }
    }
  }
  
  return { items, positionSummaries, savingsInfo };
}
