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

    // Savings Card
    cashflowSavings: 'Cashflow & Alokasi Tabungan',
    liveFormula: 'Formula Live',
    cashflowDesc: 'Perhitungan otomatis: Pendapatan Bersama dikurangi Total Pengeluaran',
    editIncome: 'Edit Pendapatan',
    totalIncome: 'Total Pendapatan',
    breakdown: 'Rincian',
    combinedIncomeSub: 'Pendapatan Berdua',
    expenseAllocation: 'Alokasi Pengeluaran',
    ofIncome: 'dari pendapatan',
    intoSavings: 'Masuk ke Tabungan',
    saved: 'ditabung',
    expenses: 'Pengeluaran',
    savings: 'Tabungan',
    targetAccountLabel: 'Rekening Tujuan',
    notesLabel: 'Catatan',

    // Position Summary Table
    allocation: 'alokasi',
    accountRealization: 'Realisasi Rekening',
    targetLabel: 'Target',
    spentLabel: 'Terpakai',
    budgetShare: 'Porsi Anggaran',
    balanceDiff: 'Selisih Saldo',
    statusBeban: 'Status Beban',
    safeSurplus: 'Aman (Surplus)',
    overBudgetTag: 'Over Budget',
    totalMonthlyExpenses: 'Total Pengeluaran Bulan Ini',
    allocationTitle: 'Ringkasan Alokasi per Rekening',
    allocationDesc: 'Otomatis dikelompokkan berdasarkan kolom rekening layaknya Pivot Table',
    manageAccountsBtn: 'Kelola / Ganti Nama Rekening',

    // Expense Table & Actions
    searchExpensePlaceholder: 'Cari pengeluaran, rekening, atau catatan...',
    filterAll: 'Semua',
    filterUnpaid: 'Belum',
    filterPaid: 'Selesai',
    colNo: 'No',
    colExpense: 'Item Pengeluaran',
    colBudget: 'Anggaran',
    colActual: 'Aktual',
    colDifference: 'Selisih',
    colAccount: 'Rekening / Posisi',
    colNotes: 'Catatan',
    colPay: 'Bayar',
    colAction: 'Edit',
    colMonthPeriod: 'Periode Bulan',
    clickToEdit: 'Klik untuk mengedit nominal aktual',
    fillActual: 'Isi aktual',
    notSet: 'Belum diisi',
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
    expenseListTitle: 'Daftar Pos Pengeluaran',
    expenseListSub: 'Klik pada nama item, anggaran, atau tombol ✏️ untuk mengedit rincian',

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
    newAccountOption: '+ Tambah Rekening Baru...',
    newAccountPlaceholder: 'Ketik nama rekening baru...',
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
    analyticsTitle: 'Analisis Finansial Keluarga',
    analyticsSubtitle: 'Wawasan tren belanja, efisiensi anggaran, dan kebiasaan finansial keluarga',
    averageExpenses: 'Rata-rata Pengeluaran',
    targetBudgetLabel: 'Anggaran target',
    totalSavingsAlloc: 'Total Alokasi Tabungan',
    ratio: 'rasio',
    budgetDiscipline: 'Disiplin Anggaran',
    monthsWithinBudget: 'Bulan tanpa overbudget',
    lowestSpendMonth: 'Bulan Paling Hemat',
    budgetVsActualTrend: 'Tren Anggaran vs Realisasi Bulanan',
    budgetVsActualSub: 'Grafik komparasi anggaran rencana dengan pengeluaran aktual',
    budgetTargetLegend: 'Target Anggaran',
    actualSpentLegend: 'Aktual Terpakai',
    top10Expenses: '10 Pos Pengeluaran Terbesar',
    top10ExpensesSub: 'Pos belanja yang paling banyak menyerap anggaran keluarga',
    accountShareTitle: 'Porsi Beban per Rekening',
    accountShareSub: 'Pembagian persentase dana pengeluaran berdasarkan dompet / rekening',
    historicalRecapTitle: 'Rekap Historis Seluruh Periode',
    historicalRecapSub: 'Data ringkasan dari semua lembar bulan yang tercatat di Google Sheets',
    surplusBadge: '✓ Hemat',
    deficitBadge: '⚠️ Overbudget',
    viewDetails: 'Lihat Detail →',
    ofTotalSpending: 'dari total pengeluaran',
    notEnoughData: 'Data Belum Cukup',
    notEnoughDataSub: 'Belum ada lembar anggaran bulanan yang valid di Google Sheets.',
    perMonth: '/bln',
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

    // Savings Card
    cashflowSavings: 'Cash Flow & Savings Allocation',
    liveFormula: 'Live Formula',
    cashflowDesc: 'Automatic calculation: Combined Income minus Total Expenses',
    editIncome: 'Edit Income',
    totalIncome: 'Total Income',
    breakdown: 'Breakdown',
    combinedIncomeSub: 'Combined Household Income',
    expenseAllocation: 'Expense Allocation',
    ofIncome: 'of income',
    intoSavings: 'Directed to Savings',
    saved: 'saved',
    expenses: 'Expenses',
    savings: 'Savings',
    targetAccountLabel: 'Destination Account',
    notesLabel: 'Notes',

    // Position Summary Table
    allocation: 'allocation',
    accountRealization: 'Account Spending',
    targetLabel: 'Target',
    spentLabel: 'Spent',
    budgetShare: 'Budget Share',
    balanceDiff: 'Variance',
    statusBeban: 'Status',
    safeSurplus: 'Safe (Surplus)',
    overBudgetTag: 'Over Budget',
    totalMonthlyExpenses: 'Total Monthly Spending',
    allocationTitle: 'Account Allocation Summary',
    allocationDesc: 'Automatically grouped by account column like a Pivot Table',
    manageAccountsBtn: 'Manage / Rename Accounts',

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
    colMonthPeriod: 'Month Period',
    clickToEdit: 'Click to edit actual amount',
    fillActual: 'Enter actual',
    notSet: 'Not set',
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
    expenseListTitle: 'Expense Items List',
    expenseListSub: 'Click on item name, budget, or ✏️ to edit details',

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
    newAccountOption: '+ Add New Account...',
    newAccountPlaceholder: 'Type new account name...',
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
    analyticsTitle: 'Family Financial Analytics',
    analyticsSubtitle: 'Insights on spending trends, budget efficiency, and family financial habits',
    averageExpenses: 'Average Spending',
    targetBudgetLabel: 'Target budget',
    totalSavingsAlloc: 'Total Savings Allocation',
    ratio: 'ratio',
    budgetDiscipline: 'Budget Discipline',
    monthsWithinBudget: 'Months within budget',
    lowestSpendMonth: 'Most Efficient Month',
    budgetVsActualTrend: 'Monthly Budget vs Actual Trend',
    budgetVsActualSub: 'Comparison chart of planned budget vs actual spending',
    budgetTargetLegend: 'Budget Target',
    actualSpentLegend: 'Actual Spent',
    top10Expenses: 'Top 10 Largest Expenses',
    top10ExpensesSub: 'Expenses consuming the largest share of family budget',
    accountShareTitle: 'Expense Share by Account',
    accountShareSub: 'Percentage breakdown of spending by wallet / account',
    historicalRecapTitle: 'Historical Period Recap',
    historicalRecapSub: 'Summary data from all monthly sheets recorded in Google Sheets',
    surplusBadge: '✓ Surplus',
    deficitBadge: '⚠️ Deficit',
    viewDetails: 'View Details →',
    ofTotalSpending: 'of total spending',
    notEnoughData: 'Not Enough Data',
    notEnoughDataSub: 'No valid monthly budget sheets found in Google Sheets.',
    perMonth: '/mo',
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
