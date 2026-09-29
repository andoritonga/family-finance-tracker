import { ExpenseItem, PositionSummary } from './types';

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

export function parseSheetData(rows: string[][]): { items: ExpenseItem[], positionSummaries: PositionSummary[] } {
  const items: ExpenseItem[] = [];
  const positionSummaries: PositionSummary[] = [];
  
  if (!rows || rows.length <= 1) return { items, positionSummaries };
  
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
      } else {
        items.push({
          no: parseInt(col0, 10),
          pengeluaran: col1,
          budget: parseRupiah(row[2] || ''),
          aktual: row[3] !== undefined && row[3] !== null && row[3].trim() !== '' ? parseRupiah(row[3]) : null,
          selisih: parseRupiah(row[4] || ''),
          checklist: (row[5] || '').toUpperCase() === 'TRUE',
          posisi: (row[6] || '').trim(),
          keterangan: (row[7] || '').trim()
        });
        continue;
      }
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
  
  return { items, positionSummaries };
}
