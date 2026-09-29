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

interface SheetInfo {
  name: string;
  month: number;
  year: number;
}

export default function Dashboard() {
  const [sheets, setSheets] = useState<SheetInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEditIncomeModal, setShowEditIncomeModal] = useState(false);
  const [selectedMonthName, setSelectedMonthName] = useState<string>('');
  const [currentSheet, setCurrentSheet] = useState<MonthlySheet | null>(null);

  useEffect(() => {
    fetchSheets();
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
          {/* Active Month Showcase */}
          {currentSheet && (
            <section className="bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-sm">
              {/* Month Header & Quick Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg">
                      Ringkasan Bulanan
                    </span>
                    {loadingDetail && (
                      <span className="text-xs text-slate-400 dark:text-slate-500 animate-pulse">
                        Memuat...
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
                    {currentSheet.name}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedMonthName}
                    onChange={(e) => handleMonthChange(e.target.value)}
                    className="text-sm font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl px-3.5 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    {sheets.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>

                  <Link
                    href={`/bulan/${encodeURIComponent(currentSheet.name)}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
                  >
                    Buka Detail <span>→</span>
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
                        Alokasi Rekening
                      </h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        Distribusi anggaran dan realisasi per pos rekening
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
                Arsip Lembar Anggaran
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Total {sheets.length} periode tercatat di Google Sheets
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
                      {sheet.name}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Periode ke-{sheet.month}</p>

                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                      <button
                        onClick={() => handleMonthChange(sheet.name)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {isSelected ? '✓ Terpilih' : 'Lihat Ringkasan'}
                      </button>

                      <Link
                        href={`/bulan/${encodeURIComponent(sheet.name)}`}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                      >
                        Buka Lembar <span>→</span>
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
