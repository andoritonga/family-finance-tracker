'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';

export type Language = 'id' | 'en';

export const translations = {
  id: {
    // Brand & Header
    appTitle: 'APBK Finansial',
    appSubtitle: 'Pencatatan & Analisis Keuangan Keluarga',
    liveSync: 'Live Sync',
    monthlyBudget: 'Anggaran Bulanan',
    trendAnalytics: 'Analisis Tren',
    generateNewMonth: 'Generate Bulan Baru',

    // Theme & Language
    toggleThemeLight: 'Ganti ke Mode Terang',
    toggleThemeDark: 'Ganti ke Mode Gelap',
    switchToEnglish: 'Ganti ke Bahasa Inggris',
    switchToIndonesian: 'Ganti ke Bahasa Indonesia',
    languageLabel: 'Bahasa',

    // Navigation / Bottom Dock
    navSummary: 'Ringkasan',
    navSheets: 'Lembar',
    navAction: 'Aksi Cepat',
    navAnalytics: 'Analisis',

    // Dashboard & Months
    sheetOverview: 'Ringkasan Anggaran',
    allMonths: 'Semua Bulan',
    selectPeriod: 'Pilih Periode Lembar Kerja',
    selectMonthDesc: 'Pilih bulan untuk melihat rincian pengeluaran, checklist bayar, dan arus kas',
    totalSheets: 'Lembar Tersedia',
    latestSheet: 'Lembar Terbaru',
    searchMonthPlaceholder: 'Cari nama bulan atau tahun...',
    noMonthFound: 'Bulan tidak ditemukan',
    noMonthFoundDesc: 'Coba kata kunci lain atau generate lembar bulan baru',

    // Financial Summary Cards
    combinedIncome: 'Pendapatan Bersama',
    totalExpenses: 'Total Pengeluaran',
    netSavings: 'Sisa Saldo (Tabungan)',
    paidProgress: 'Progres Terbayar',
    unpaidBalance: 'Sisa Belum Bayar',
    paid: 'Terbayar',
    unpaid: 'Belum Bayar',
    items: 'item',
    budgetLabel: 'Anggaran',
    actualLabel: 'Aktual',
    differenceLabel: 'Selisih',
    savingsAllocation: 'Alokasi ke tabungan/dana darurat',
    deficitWarning: 'Pengeluaran melebihi pendapatan!',

    // Expense Table & Actions
    searchExpensePlaceholder: 'Cari pengeluaran, rekening, atau catatan...',
    filterAll: 'Semua',
    filterUnpaid: 'Belum Bayar',
    filterPaid: 'Sudah Bayar',
    colNo: 'No',
    colExpense: 'Item Pengeluaran',
    colBudget: 'Anggaran',
    colActual: 'Aktual',
    colDifference: 'Selisih',
    colAccount: 'Rekening / Posisi',
    colNotes: 'Catatan',
    colPay: 'Bayar',
    colAction: 'Edit',
    clickToEdit: 'klik untuk edit',
    fillActual: 'Isi aktual',
    overBudget: 'Lebih',
    underBudget: 'Hemat',
    onBudget: 'Pas',
    noExpenseFound: 'Tidak ada pengeluaran yang cocok',
    noExpenseFoundDesc: 'Coba sesuaikan filter pencarian atau tambahkan item baru',
    showingExpenses: 'Menampilkan {count} dari {total} pengeluaran',
    markPaid: 'Tandai sudah bayar',
    markUnpaid: 'Tandai belum bayar',

    // Bulan Page Actions
    backToDashboard: 'Kembali ke Ringkasan',
    syncData: 'Sinkronkan',
    syncing: 'Menyinkronkan...',
    addExpense: 'Tambah Pengeluaran',
    manageIncome: 'Atur Pendapatan',
    manageAccounts: 'Kelola Rekening',

    // Modals - Add / Edit Expense
    addItemTitle: 'Tambah Pos Pengeluaran',
    addItemDesc: 'Tambahkan pos anggaran baru ke lembar',
    editItemTitle: 'Edit Pos Pengeluaran',
    editItemDesc: 'Perbarui detail anggaran atau posisi rekening',
    expenseName: 'Nama Pengeluaran',
    expenseNamePlaceholder: 'Misal: Belanja Mingguan, Listrik, Internet',
    budgetAmount: 'Nominal Anggaran (Rp)',
    budgetPlaceholder: 'Contoh: 500000',
    actualAmount: 'Nominal Aktual (Rp)',
    actualPlaceholder: 'Kosongkan jika belum terealisasi',
    accountPosition: 'Rekening / Posisi',
    accountPlaceholder: 'Pilih atau ketik nama rekening...',
    notes: 'Catatan Tambahan',
    notesPlaceholder: 'Opsional: keterangan atau tanggal jatuh tempo',
    paymentStatus: 'Status Pembayaran',
    paymentStatusPaid: 'Sudah Dibayar / Checklist',
    paymentStatusUnpaid: 'Belum Dibayar',
    cancel: 'Batal',
    save: 'Simpan',
    saving: 'Menyimpan...',
    delete: 'Hapus Item',
    deleting: 'Menghapus...',
    confirmDelete: 'Apakah Anda yakin ingin menghapus item ini?',

    // Modals - Income & Allocation
    editIncomeTitle: 'Atur Pendapatan & Alokasi Tabungan',
    incomeFormula: 'Rincian / Formula Pendapatan Bersama',
    formulaHint: 'Mendukung penjumlahan (+)',
    formulaExpl: 'Masukkan angka langsung (misal: 20000000) atau rincian (misal: 11500000 + 3650000 + 4190000)',
    calculatedTotal: 'Total Pendapatan Terhitung',
    totalBudgeted: 'Total Anggaran Pengeluaran',
    autoSavings: 'Sisa Otomatis Masuk Tabungan',
    targetAccount: 'Rekening Tujuan Tabungan',
    pocketNote: 'Catatan / Pocket',

    // Modals - Generate Month
    generateTitle: 'Generate Bulan Baru',
    generateDesc: 'Salin pos anggaran dari bulan sebelumnya otomatis',
    selectTargetPeriod: 'Pilih Periode Target',
    targetMonth: 'Bulan Target',
    targetYear: 'Tahun Target',
    generateFeature1: 'Menghasilkan tab baru di Google Sheets',
    generateFeature2: 'Nilai Aktual dikosongkan & checklist direset',
    generateFeature3: 'Formula Selisih & Rekening otomatis terpasang',
    processGenerate: 'Generate Lembar',
    generating: 'Memproses...',

    // Modals - Manage Positions
    managePositionsTitle: 'Kelola Rekening / Posisi',
    managePositionsDesc: 'Ubah nama rekening secara massal untuk semua item terkait',
    existingAccounts: 'Daftar Rekening yang Digunakan',
    bulkRename: 'Ganti Nama Rekening Massal',
    renameFrom: 'Dari Rekening',
    renameTo: 'Menjadi Rekening Baru',
    renameToPlaceholder: 'Nama baru...',
    applyRename: 'Terapkan Perubahan',

    // Analytics Page
    analyticsTitle: 'Analisis Tren Keuangan',
    analyticsSubtitle: 'Statistik perbandingan anggaran, realisasi, dan rasio tabungan antar bulan',
    averageIncome: 'Rata-rata Pendapatan',
    averageExpenses: 'Rata-rata Pengeluaran',
    averageSavings: 'Rata-rata Tabungan',
    savingsRate: 'Tingkat Tabungan (Savings Rate)',
    budgetVsActualChart: 'Perbandingan Anggaran vs Realisasi',
    cashflowTrend: 'Tren Arus Kas Bulanan',
    expenseDistribution: 'Distribusi Alokasi Berdasarkan Rekening',
  },
  en: {
    // Brand & Header
    appTitle: 'APBK Financial',
    appSubtitle: 'Family Finance Recording & Analytics',
    liveSync: 'Live Sync',
    monthlyBudget: 'Monthly Budget',
    trendAnalytics: 'Trend Analytics',
    generateNewMonth: 'Generate New Month',

    // Theme & Language
    toggleThemeLight: 'Switch to Light Mode',
    toggleThemeDark: 'Switch to Dark Mode',
    switchToEnglish: 'Switch to English',
    switchToIndonesian: 'Switch to Indonesian',
    languageLabel: 'Language',

    // Navigation / Bottom Dock
    navSummary: 'Summary',
    navSheets: 'Sheets',
    navAction: 'Quick Action',
    navAnalytics: 'Analytics',

    // Dashboard & Months
    sheetOverview: 'Budget Overview',
    allMonths: 'All Months',
    selectPeriod: 'Select Worksheet Period',
    selectMonthDesc: 'Select a month to view detailed expenses, payment checklist, and cash flow',
    totalSheets: 'Available Sheets',
    latestSheet: 'Latest Sheet',
    searchMonthPlaceholder: 'Search month name or year...',
    noMonthFound: 'No months found',
    noMonthFoundDesc: 'Try a different search keyword or generate a new month sheet',

    // Financial Summary Cards
    combinedIncome: 'Combined Income',
    totalExpenses: 'Total Expenses',
    netSavings: 'Net Savings (Balance)',
    paidProgress: 'Paid Progress',
    unpaidBalance: 'Unpaid Balance',
    paid: 'Paid',
    unpaid: 'Unpaid',
    items: 'items',
    budgetLabel: 'Budget',
    actualLabel: 'Actual',
    differenceLabel: 'Variance',
    savingsAllocation: 'Allocation to savings/emergency fund',
    deficitWarning: 'Expenses exceed income!',

    // Expense Table & Actions
    searchExpensePlaceholder: 'Search expenses, accounts, or notes...',
    filterAll: 'All',
    filterUnpaid: 'Unpaid',
    filterPaid: 'Paid',
    colNo: 'No',
    colExpense: 'Expense Item',
    colBudget: 'Budget',
    colActual: 'Actual',
    colDifference: 'Variance',
    colAccount: 'Account / Position',
    colNotes: 'Notes',
    colPay: 'Paid',
    colAction: 'Edit',
    clickToEdit: 'click to edit',
    fillActual: 'Enter actual',
    overBudget: 'Over',
    underBudget: 'Under',
    onBudget: 'On target',
    noExpenseFound: 'No matching expenses',
    noExpenseFoundDesc: 'Try adjusting your search filter or add a new expense',
    showingExpenses: 'Showing {count} of {total} expenses',
    markPaid: 'Mark as paid',
    markUnpaid: 'Mark as unpaid',

    // Bulan Page Actions
    backToDashboard: 'Back to Summary',
    syncData: 'Sync Data',
    syncing: 'Syncing...',
    addExpense: 'Add Expense',
    manageIncome: 'Manage Income',
    manageAccounts: 'Manage Accounts',

    // Modals - Add / Edit Expense
    addItemTitle: 'Add Expense Item',
    addItemDesc: 'Add a new budget item to the sheet',
    editItemTitle: 'Edit Expense Item',
    editItemDesc: 'Update budget details or account position',
    expenseName: 'Expense Name',
    expenseNamePlaceholder: 'E.g.: Groceries, Electricity, Internet',
    budgetAmount: 'Budget Amount (Rp)',
    budgetPlaceholder: 'E.g.: 500000',
    actualAmount: 'Actual Amount (Rp)',
    actualPlaceholder: 'Leave blank if not realized yet',
    accountPosition: 'Account / Position',
    accountPlaceholder: 'Select or type account name...',
    notes: 'Additional Notes',
    notesPlaceholder: 'Optional: details or due date',
    paymentStatus: 'Payment Status',
    paymentStatusPaid: 'Paid / Checked',
    paymentStatusUnpaid: 'Unpaid',
    cancel: 'Cancel',
    save: 'Save',
    saving: 'Saving...',
    delete: 'Delete Item',
    deleting: 'Deleting...',
    confirmDelete: 'Are you sure you want to delete this item?',

    // Modals - Income & Allocation
    editIncomeTitle: 'Manage Income & Savings Allocation',
    incomeFormula: 'Combined Income Breakdown / Formula',
    formulaHint: 'Supports addition (+)',
    formulaExpl: 'Enter direct amount (e.g. 20000000) or breakdown (e.g. 11500000 + 3650000 + 4190000)',
    calculatedTotal: 'Calculated Total Income',
    totalBudgeted: 'Total Budgeted Expenses',
    autoSavings: 'Automatically Directed to Savings',
    targetAccount: 'Savings Target Account',
    pocketNote: 'Pocket / Note',

    // Modals - Generate Month
    generateTitle: 'Generate New Month',
    generateDesc: 'Automatically copy budget items from previous month',
    selectTargetPeriod: 'Select Target Period',
    targetMonth: 'Target Month',
    targetYear: 'Target Year',
    generateFeature1: 'Creates a new tab in Google Sheets',
    generateFeature2: 'Actual amounts cleared & checklist reset',
    generateFeature3: 'Variance & Account formulas automatically linked',
    processGenerate: 'Generate Sheet',
    generating: 'Processing...',

    // Modals - Manage Positions
    managePositionsTitle: 'Manage Accounts / Positions',
    managePositionsDesc: 'Bulk rename accounts for all associated items',
    existingAccounts: 'Currently Used Accounts',
    bulkRename: 'Bulk Rename Account',
    renameFrom: 'From Account',
    renameTo: 'To New Account',
    renameToPlaceholder: 'New name...',
    applyRename: 'Apply Changes',

    // Analytics Page
    analyticsTitle: 'Financial Trend Analytics',
    analyticsSubtitle: 'Comparison statistics of budget, actual spending, and savings rate across months',
    averageIncome: 'Average Income',
    averageExpenses: 'Average Expenses',
    averageSavings: 'Average Savings',
    savingsRate: 'Savings Rate',
    budgetVsActualChart: 'Budget vs Actual Comparison',
    cashflowTrend: 'Monthly Cash Flow Trend',
    expenseDistribution: 'Allocation Distribution by Account',
  },
} as const;

export type TranslationKey = keyof typeof translations.id;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  formatSheetMonth: (sheetName: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const ID_TO_EN_MONTHS: Record<string, string> = {
  Januari: 'January',
  Februari: 'February',
  Maret: 'March',
  April: 'April',
  Mei: 'May',
  Juni: 'June',
  Juli: 'July',
  Agustus: 'August',
  September: 'September',
  Oktober: 'October',
  November: 'November',
  Desember: 'December',
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('id');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('language') as Language | null;
    if (saved === 'id' || saved === 'en') {
      setLanguageState(saved);
    } else {
      // Check browser preferred language
      const browserLang = navigator.language?.toLowerCase() || '';
      if (browserLang.startsWith('en')) {
        setLanguageState('en');
      } else {
        setLanguageState('id');
      }
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
    }
  };

  const toggleLanguage = () => {
    const next = language === 'id' ? 'en' : 'id';
    setLanguage(next);
  };

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    let text: string = translations[language]?.[key] ?? translations.id[key] ?? key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  // Helper to translate "Oktober 2026" to "October 2026" if language is 'en'
  const formatSheetMonth = (sheetName: string): string => {
    if (!sheetName) return '';
    if (language === 'id') return sheetName;
    
    // Split into month name and year
    const parts = sheetName.split(' ');
    if (parts.length >= 2) {
      const monthId = parts[0];
      const year = parts.slice(1).join(' ');
      if (ID_TO_EN_MONTHS[monthId]) {
        return `${ID_TO_EN_MONTHS[monthId]} ${year}`;
      }
    }
    return sheetName;
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t,
      formatSheetMonth,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language, mounted]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Return safe fallback for SSR or components outside provider
    return {
      language: 'id' as Language,
      setLanguage: () => {},
      toggleLanguage: () => {},
      t: (key: TranslationKey, params?: Record<string, string | number>) => {
        let text: string = translations.id[key] ?? key;
        if (params) {
          Object.entries(params).forEach(([k, v]) => {
            text = text.replace(`{${k}}`, String(v));
          });
        }
        return text;
      },
      formatSheetMonth: (sheetName: string) => sheetName,
    };
  }
  return context;
}
