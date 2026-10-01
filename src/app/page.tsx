'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SummaryCards } from '@/components/SummaryCards';
import { PositionSummaryTable } from '@/components/PositionSummaryTable';
import { GenerateModal } from '@/components/GenerateModal';
import { SavingsCard } from '@/components/SavingsCard';
import { EditIncomeModal } from '@/components/EditIncomeModal';
import { Navbar } from '@/components/Navbar';
import { MonthlySheet } from '@/lib/types';
import { useLanguage } from '@/lib/i18n';

interface SheetInfo {
  name: string;
  month: number;
  year: number;
}

export default function Dashboard() {
  const { t, formatSheetMonth, language } = useLanguage();
  const [sheets, setSheets] = useState<SheetInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEditIncomeModal, setShowEditIncomeModal] = useState(false);
  const [selectedMonthName, setSelectedMonthName] = useState<string>('');
  const [currentSheet, setCurrentSheet] = useState<MonthlySheet | null>(null);

  useEffect(() => {
    fetchSheets();
    const handleQuickAction = () => {
      setShowModal(true);
    };
    window.addEventListener('apbk:quick-action', handleQuickAction);
    return () => window.removeEventListener('apbk:quick-action', handleQuickAction);
  }, []);

  const fetchSheets = async () => {
    try {
      const res = await fetch('/api/sheets');
      if (res.ok) {
        const data: SheetInfo[] = await res.json();
        setSheets(data);
        if (data.length > 0) {
          const defaultMonth = data[0].name;
          setSelectedMonthName(defaultMonth);
          fetchCurrentSheet(defaultMonth);
        } else {
          setLoading(false);
        }
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const fetchCurrentSheet = async (name: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/sheets/${encodeURIComponent(name)}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentSheet(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setLoadingDetail(false);
    }
  };

  const handleMonthChange = (name: string) => {
    setSelectedMonthName(name);
    fetchCurrentSheet(name);
  };

  const completedItemsCount = currentSheet?.items.filter((i) => i.checklist).length || 0;
  const totalItemsCount = currentSheet?.items.length || 0;

  return (
    <div className="space-y-10">
      {/* Top Navigation */}
      <Navbar onOpenGenerateModal={() => setShowModal(true)} />

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="h-36 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
            <div className="h-36 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
            <div className="h-36 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          </div>
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        </div>
      ) : (
        <>
          {/* Horizontal Scrollable Month Pills Carousel */}
          {sheets.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {t('selectPeriod')}
                </span>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  {sheets.length} {language === 'id' ? 'Bulan' : 'Months'}
                </span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-3.5 px-3.5 sm:mx-0">
                {sheets.map((s) => {
                  const isSelected = s.name === selectedMonthName;
                  return (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => handleMonthChange(s.name)}
                      className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5 shrink-0 shadow-xs ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-300 dark:shadow-none font-bold scale-[1.02]'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-750'
                      }`}
                    >
                      <span>🗓️</span>
                      <span>{formatSheetMonth(s.name)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Month Showcase */}
          {currentSheet && (
            <section className="bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-sm">
              {/* Month Header & Quick Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 mb-5 sm:mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg">
                      {t('sheetOverview')}
                    </span>
                    {loadingDetail && (
                      <span className="text-xs text-slate-400 dark:text-slate-500 animate-pulse">
                        {language === 'id' ? 'Memuat data...' : 'Loading data...'}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                    {formatSheetMonth(currentSheet.name)}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedMonthName}
                    onChange={(e) => handleMonthChange(e.target.value)}
                    className="hidden sm:block text-sm font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl px-3.5 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    {sheets.map((s) => (
                      <option key={s.name} value={s.name}>
                        {formatSheetMonth(s.name)}
                      </option>
                    ))}
                  </select>

                  <Link
                    href={`/bulan/${encodeURIComponent(currentSheet.name)}`}
                    prefetch={false}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-sm shadow-indigo-200 dark:shadow-none"
                  >
                    <span>{language === 'id' ? 'Buka Rincian Pos' : 'Open Sheet Details'}</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>

              {/* Summary Cards */}
              <SummaryCards
                totalBudget={currentSheet.totalBudget}
                totalAktual={currentSheet.totalAktual}
                totalSelisih={currentSheet.totalSelisih}
                completedCount={completedItemsCount}
                totalCount={totalItemsCount}
              />

              {/* Cashflow & Savings Card */}
              <div className="mt-6">
                <SavingsCard
                  savingsInfo={currentSheet.savingsInfo}
                  totalBudget={currentSheet.totalBudget}
                  onOpenEditModal={() => setShowEditIncomeModal(true)}
                />
              </div>

              {/* Orderly Breakdown per Posisi / Rekening */}
              {currentSheet.positionSummaries && currentSheet.positionSummaries.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {language === 'id' ? 'Alokasi Rekening' : 'Account Allocation'}
                      </h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {language === 'id'
                          ? 'Distribusi anggaran dan realisasi per pos rekening'
                          : 'Budget distribution and actuals by account position'}
                      </p>
                    </div>
                  </div>
                  <PositionSummaryTable summaries={currentSheet.positionSummaries} />
                </div>
              )}
            </section>
          )}

          {/* All Months Grid */}
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {t('allMonths')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'id'
                  ? `Total ${sheets.length} periode tercatat di Google Sheets`
                  : `Total of ${sheets.length} periods recorded in Google Sheets`}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sheets.map((sheet) => {
                const isSelected = sheet.name === selectedMonthName;
                return (
                  <div
                    key={sheet.name}
                    className={`relative group bg-white dark:bg-slate-800 rounded-2xl p-5 border transition-all duration-200 ${
                      isSelected
                        ? 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/10 shadow-sm'
                        : 'border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-sm group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/60 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        🗓️
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-800">
                        {sheet.year}
                      </span>
                    </div>

                    <h3 className="font-bold text-lg text-slate-900 dark:text-white tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {formatSheetMonth(sheet.name)}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      {language === 'id' ? `Periode ke-${sheet.month}` : `Period ${sheet.month}`}
                    </p>

                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                      <button
                        onClick={() => handleMonthChange(sheet.name)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {isSelected
                          ? language === 'id'
                            ? '✓ Terpilih'
                            : '✓ Selected'
                          : language === 'id'
                          ? 'Lihat Ringkasan'
                          : 'View Summary'}
                      </button>

                      <Link
                        href={`/bulan/${encodeURIComponent(sheet.name)}`}
                        prefetch={false}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                      >
                        {language === 'id' ? 'Buka Lembar' : 'Open Sheet'} <span>→</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* Edit Income & Savings Modal */}
      {showEditIncomeModal && currentSheet && (
        <EditIncomeModal
          isOpen={showEditIncomeModal}
          sheetName={currentSheet.name}
          currentIncomeFormula={currentSheet.savingsInfo?.incomeFormula}
          currentIncome={currentSheet.savingsInfo?.income}
          currentAccount={currentSheet.savingsInfo?.targetAccount}
          currentKeterangan={currentSheet.savingsInfo?.keterangan}
          totalBudget={currentSheet.totalBudget}
          onClose={() => setShowEditIncomeModal(false)}
          onSuccess={() => fetchCurrentSheet(currentSheet.name)}
        />
      )}

      {showModal && (
        <GenerateModal
          onClose={() => {
            setShowModal(false);
            fetchSheets();
          }}
        />
      )}
    </div>
  );
}
