'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { SummaryCards } from '@/components/SummaryCards';
import { ExpenseTable } from '@/components/ExpenseTable';
import { PositionSummaryTable } from '@/components/PositionSummaryTable';
import { AddItemModal } from '@/components/AddItemModal';
import { ManagePositionsModal } from '@/components/ManagePositionsModal';
import { SavingsCard } from '@/components/SavingsCard';
import { EditIncomeModal } from '@/components/EditIncomeModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MonthlySheet, PositionSummary } from '@/lib/types';

interface BulanClientProps {
  sheetName: string;
}

export function BulanClient({ sheetName }: BulanClientProps) {
  const [sheet, setSheet] = useState<MonthlySheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [posisiSummary, setPosisiSummary] = useState<PositionSummary[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showManagePosModal, setShowManagePosModal] = useState(false);
  const [showEditIncomeModal, setShowEditIncomeModal] = useState(false);

  const fetchSheet = async (showRefreshIndicator = false) => {
    if (!sheetName) {
      setLoading(false);
      return;
    }
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/sheets/${encodeURIComponent(sheetName)}`);
      if (res.ok) {
        const data = await res.json();
        setSheet(data);
        calculatePosisi(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSheet();
    const handleQuickAction = () => {
      setShowAddModal(true);
    };
    window.addEventListener('apbk:quick-action', handleQuickAction);
    return () => window.removeEventListener('apbk:quick-action', handleQuickAction);
  }, [sheetName]);

  const calculatePosisi = (data: MonthlySheet) => {
    const summaryMap = new Map<string, PositionSummary>();

    data.items.forEach((item) => {
      const p = item.posisi || 'Lainnya';
      if (!summaryMap.has(p)) {
        summaryMap.set(p, { posisi: p, budget: 0, aktual: 0, selisih: 0 });
      }

      const s = summaryMap.get(p)!;
      s.budget += item.budget || 0;
      s.aktual += item.aktual || 0;
      s.selisih += item.selisih || 0;
    });

    setPosisiSummary(Array.from(summaryMap.values()));
  };

  const existingPositions = useMemo(() => {
    if (!sheet) return ['Cash'];
    const set = new Set(sheet.items.map((i) => i.posisi).filter(Boolean));
    return Array.from(set);
  }, [sheet]);

  const completedCount = sheet?.items.filter((i) => i.checklist).length || 0;
  const totalCount = sheet?.items.length || 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="h-36 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <div className="h-36 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <div className="h-36 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        </div>
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!sheet) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-3xl p-8">
        <span className="text-4xl">🔍</span>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-3">Lembar Tidak Ditemukan</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Sheet &quot;{sheetName}&quot; tidak dapat diakses atau belum dibuat di spreadsheet.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
        >
          ← Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumbs & Header */}
      <div className="sticky top-0 z-30 -mx-3.5 px-3.5 py-2.5 mb-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800/80 sm:relative sm:top-auto sm:mx-0 sm:px-0 sm:py-0 sm:bg-transparent sm:dark:bg-transparent sm:backdrop-blur-none sm:border-none sm:mb-0 transition-all">
        <nav className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400 dark:text-slate-500 mb-2">
          <Link href="/" prefetch={false} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-slate-700 dark:text-slate-300 font-semibold">{sheet.name}</span>
        </nav>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <Link
              href="/"
              prefetch={false}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 active:scale-95 transition-all shadow-xs shrink-0"
              title="Kembali ke Dashboard"
            >
              ←
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                  {sheet.name}
                </h1>
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 shrink-0">
                  {completedCount}/{totalCount} Dibayar
                </span>
              </div>
              <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Rincian Anggaran, Realisasi, dan Alokasi Rekening
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />

            <button
              onClick={() => fetchSheet(true)}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 active:scale-95 transition-all shadow-xs"
              title="Sinkronkan data dengan Google Sheets"
            >
              <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
              <span className="hidden sm:inline">
                {isRefreshing ? 'Menyinkronkan...' : 'Sinkron'}
              </span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="hidden sm:inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-sm shadow-indigo-200 dark:shadow-none"
            >
              <span>➕</span>
              <span>Tambah Item</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Floating Action Button (FAB) */}
      <button
        type="button"
        onClick={() => setShowAddModal(true)}
        className="md:hidden fixed bottom-20 right-4 z-30 w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center text-xl shadow-lg shadow-indigo-400/40 dark:shadow-none active:scale-90 transition-transform"
        aria-label="Tambah Pos Pengeluaran"
      >
        ➕
      </button>

      {/* Summary Cards */}
      <SummaryCards
        totalBudget={sheet.totalBudget}
        totalAktual={sheet.totalAktual}
        totalSelisih={sheet.totalSelisih}
        completedCount={completedCount}
        totalCount={totalCount}
      />

      {/* Cashflow & Savings Card */}
      <SavingsCard
        savingsInfo={sheet.savingsInfo}
        totalBudget={sheet.totalBudget}
        onOpenEditModal={() => setShowEditIncomeModal(true)}
      />

      {/* Main Expense Table Section */}
      <section className="bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl sm:rounded-3xl p-3.5 sm:p-7 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Daftar Pos Pengeluaran
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Klik pada nama item, anggaran, atau tombol ✏️ untuk mengedit rincian
            </p>
          </div>
        </div>

        <ExpenseTable
          items={sheet.items}
          sheetName={sheet.name}
          onUpdate={() => fetchSheet(false)}
          onOpenAddModal={() => setShowAddModal(true)}
        />
      </section>

      {/* Breakdown per Posisi / Rekening Section */}
      <section className="bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl sm:rounded-3xl p-3.5 sm:p-7 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Ringkasan Alokasi per Rekening
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Otomatis dikelompokkan berdasarkan kolom rekening layaknya Pivot Table
            </p>
          </div>

          <button
            onClick={() => setShowManagePosModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors w-fit"
          >
            <span>⚙️</span>
            <span>Kelola / Ganti Nama Rekening</span>
          </button>
        </div>

        <PositionSummaryTable summaries={posisiSummary} />
      </section>

      {/* Edit Income & Savings Modal */}
      {showEditIncomeModal && (
        <EditIncomeModal
          isOpen={showEditIncomeModal}
          sheetName={sheet.name}
          currentIncomeFormula={sheet.savingsInfo?.incomeFormula}
          currentIncome={sheet.savingsInfo?.income}
          currentAccount={sheet.savingsInfo?.targetAccount}
          currentKeterangan={sheet.savingsInfo?.keterangan}
          totalBudget={sheet.totalBudget}
          onClose={() => setShowEditIncomeModal(false)}
          onSuccess={() => fetchSheet(true)}
        />
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <AddItemModal
          sheetName={sheet.name}
          existingPositions={existingPositions}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => fetchSheet(true)}
        />
      )}

      {/* Manage Positions Modal */}
      {showManagePosModal && (
        <ManagePositionsModal
          sheetName={sheet.name}
          items={sheet.items}
          summaries={posisiSummary}
          onClose={() => setShowManagePosModal(false)}
          onSuccess={() => fetchSheet(true)}
        />
      )}
    </div>
  );
}
