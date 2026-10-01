'use client';

import React from 'react';
import { SavingsInfo } from '@/lib/types';
import { formatRupiah } from '@/lib/format';
import { useLanguage } from '@/lib/i18n';

interface SavingsCardProps {
  savingsInfo?: SavingsInfo | null;
  totalBudget: number;
  onOpenEditModal: () => void;
}

export function SavingsCard({
  savingsInfo,
  totalBudget,
  onOpenEditModal,
}: SavingsCardProps) {
  const { t, language } = useLanguage();
  // If no savings info in sheet, fallback or still allow setting income
  const income = savingsInfo?.income || (savingsInfo?.nominal ? savingsInfo.nominal + totalBudget : totalBudget);
  const savingsNominal = savingsInfo?.nominal !== undefined
    ? savingsInfo.nominal
    : Math.max(0, income - totalBudget);

  const targetAccount = savingsInfo?.targetAccount || 'Blu Saving Fani';
  const keterangan = savingsInfo?.keterangan || 'Pocket Harta';
  const formulaStr = savingsInfo?.incomeFormula;

  const expensePercent = income > 0 ? (totalBudget / income) * 100 : 0;
  const savingsPercent = income > 0 ? (savingsNominal / income) * 100 : 0;

  return (
    <div className="relative overflow-hidden border border-slate-200/80 dark:border-slate-700/80 rounded-3xl bg-gradient-to-br from-white via-indigo-50/20 to-violet-50/20 dark:from-slate-800 dark:via-slate-850 dark:to-indigo-950/20 p-6 sm:p-7 shadow-sm">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-200/70 dark:border-slate-700/70">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl border border-indigo-200/50 dark:border-indigo-800/50">
            💰
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {t('cashflowSavings')}
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                {t('liveFormula')}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('cashflowDesc')}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenEditModal}
          className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-200 active:scale-95 transition-all shadow-sm"
          title={language === 'id' ? 'Ubah rincian atau total pendapatan' : 'Edit income breakdown or total'}
        >
          <span>✏️</span>
          <span>{t('editIncome')}</span>
        </button>
      </div>

      {/* 3 Metric Columns: Pendapatan -> Pengeluaran -> Tabungan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {/* 1. Pendapatan Bersama */}
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              {t('totalIncome')}
            </span>
            <span>💵</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
            {formatRupiah(income)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 font-mono truncate" title={formulaStr || t('combinedIncomeSub')}>
            {formulaStr ? `${t('breakdown')}: ${formulaStr}` : t('combinedIncomeSub')}
          </div>
        </div>

        {/* 2. Total Pengeluaran */}
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              {t('expenseAllocation')}
            </span>
            <span>💳</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums tracking-tight">
            {formatRupiah(totalBudget)}
          </div>
          <div className="mt-1 text-[11px] text-indigo-600/80 dark:text-indigo-400/80 font-medium">
            {expensePercent.toFixed(1)}% {t('ofIncome')}
          </div>
        </div>

        {/* 3. Masuk ke Tabungan */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60 shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 mb-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              {t('intoSavings')}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">🏦</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 tabular-nums tracking-tight">
            {formatRupiah(savingsNominal)}
          </div>
          <div className="mt-1 flex items-center justify-between gap-1 text-[11px] text-emerald-700/90 dark:text-emerald-300/90 font-medium">
            <span>{savingsPercent.toFixed(1)}% {t('saved')}</span>
            <span className="font-mono text-[10px] truncate" title={`${targetAccount} (${keterangan})`}>
              → {targetAccount}
            </span>
          </div>
        </div>
      </div>

      {/* Cashflow Ratio Visual Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400 inline-block" />
            {t('expenses')} ({expensePercent.toFixed(1)}%)
          </span>
          <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            {t('savings')} ({savingsPercent.toFixed(1)}%)
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden flex">
          <div
            className="bg-indigo-600 dark:bg-indigo-500 h-full transition-all duration-500"
            style={{ width: `${Math.min(100, expensePercent)}%` }}
            title={`${t('expenses')}: ${expensePercent.toFixed(1)}%`}
          />
          <div
            className="bg-emerald-500 h-full transition-all duration-500"
            style={{ width: `${Math.min(100, savingsPercent)}%` }}
            title={`${t('savings')}: ${savingsPercent.toFixed(1)}%`}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-0.5">
          <span>{t('targetAccountLabel')}: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{targetAccount}</strong></span>
          <span>{t('notesLabel')}: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{keterangan}</strong></span>
        </div>
      </div>
    </div>
  );
}
