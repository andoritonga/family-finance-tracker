export interface ExpenseItem {
  no: number;
  pengeluaran: string;
  budget: number;
  aktual: number | null;
  selisih: number | null;
  checklist: boolean;
  posisi: string;
  keterangan: string;
}

export interface MonthlySheet {
  name: string;  // e.g. 'September 2026'
  month: number; // 1-12
  year: number;
  items: ExpenseItem[];
  totalBudget: number;
  totalAktual: number;
  totalSelisih: number;
}

export interface PositionSummary {
  posisi: string;
  budget: number;
  aktual: number;
  selisih: number;
}
