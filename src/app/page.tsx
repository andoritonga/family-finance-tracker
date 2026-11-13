'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, ArrowRight } from 'lucide-react';
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

  const rememberSheet = (name: string) => {
    try {
      localStorage.setItem('apbk:lastSheet', name);
      window.dispatchEvent(new CustomEvent('apbk:sheet-selected'));
    } catch {}
  };

  const fetchSheets = async () => {
    try {
      const res = await fetch('/api/sheets');
      if (res.ok) {
        const data: SheetInfo[] = await res.json();
        setSheets(data);
        if (data.length > 0) {
          const defaultMonth = data[0].name;
          setSelectedMonthName(defaultMonth);
          rememberSheet(defaultMonth);
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
    rememberSheet(name);
    fetchCurrentSheet(name);
  };

  const completedItemsCount = currentSheet?.items.filter((i) => i.checklist).length || 0;
  const totalItemsCount = currentSheet?.items.length || 0;

  return (
    <div className="space-y-6">
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
          {/* Clean Horizontal Period Switcher */}
          {sheets.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
              {sheets.map((s) => {
                const isSelected = s.name === selectedMonthName;
                return (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => handleMonthChange(s.name)}
                    className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-medium transition-all active:scale-95 flex items-center gap-1.5 shrink-0 ${
                      isSelected
                        ? 'bg-slate-900 dark:bg-indigo-600 text-white font-semibold'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 opacity-70" strokeWidth={1.75} />
                    <span>{formatSheetMonth(s.name)}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Active Month Showcase (Flat, breathable layout) */}
          {currentSheet && (
            <div className="space-y-6">
              {/* Month Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
                      {formatSheetMonth(currentSheet.name)}
                    </h2>
                    {loadingDetail && (
                      <span className="text-xs text-slate-400 dark:text-slate-500 animate-pulse">
                        {language === 'id' ? 'Memuat...' : 'Loading...'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {t('sheetOverview')}
                  </p>
                </div>

                <Link
                  href={`/bulan/${encodeURIComponent(currentSheet.name)}`}
                  prefetch={false}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all"
                >
                  <span>{language === 'id' ? 'Buka Rincian Pos' : 'Open Sheet Details'}</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={2} />
                </Link>
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
              <SavingsCard
                savingsInfo={currentSheet.savingsInfo}
                totalBudget={currentSheet.totalBudget}
                onOpenEditModal={() => setShowEditIncomeModal(true)}
              />

              {/* Orderly Breakdown per Posisi / Rekening */}
              {currentSheet.positionSummaries && currentSheet.positionSummaries.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {language === 'id' ? 'Alokasi Rekening' : 'Account Allocation'}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {language === 'id'
                        ? 'Distribusi anggaran dan realisasi per pos rekening'
                        : 'Budget distribution and actuals by account position'}
                    </p>
                  </div>
                  <PositionSummaryTable summaries={currentSheet.positionSummaries} />
                </div>
              )}
            </div>
          )}
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
