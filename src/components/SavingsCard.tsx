'use client';

import React from 'react';
import { PiggyBank, Pencil } from 'lucide-react';
import { SavingsInfo } from '@/lib/types';
import { formatRupiah } from '@/lib/format';
import { useLanguage } from '@/lib/i18n';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { ProgressRing } from '@/components/ProgressRing';

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
  const income = savingsInfo?.income || (savingsInfo?.nominal ? savingsInfo.nominal + totalBudget : totalBudget);
  const savingsNominal =
    savingsInfo?.nominal !== undefined
      ? savingsInfo.nominal
      : Math.max(0, income - totalBudget);

  const targetAccount = savingsInfo?.targetAccount || 'Blu BCA Saving';
  const keterangan = savingsInfo?.keterangan || 'Pocket Tabungan & Investasi';
  const formulaStr = savingsInfo?.incomeFormula;

  const expensePercent = income > 0 ? (totalBudget / income) * 100 : 0;
  const savingsPercent = income > 0 ? (savingsNominal / income) * 100 : 0;

  return (
    <div
      className="animate-card-enter bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300/90 dark:hover:border-slate-700 rounded-2xl p-5 sm:p-6 transition-colors"
      style={{ animationDelay: '160ms' }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
            <PiggyBank className="w-4 h-4" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white tracking-tight truncate">
              {t('cashflowSavings')}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
              {targetAccount} · {keterangan}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <ProgressRing
            percent={savingsPercent}
            size={38}
            strokeWidth={3.5}
            colorClassName="text-emerald-500"
            label={`${Math.round(savingsPercent)}%`}
          />
          <button
            onClick={onOpenEditModal}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 active:scale-95 transition-all"
            title={language === 'id' ? 'Ubah rincian atau total pendapatan' : 'Edit income breakdown or total'}
          >
            <Pencil className="w-3 h-3" strokeWidth={1.75} />
            <span>{t('editIncome')}</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Columns separated cleanly by subtle dividers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-0 sm:divide-x divide-slate-100 dark:divide-slate-800 mb-5">
        {/* 1. Pendapatan Bersama */}
        <div className="sm:pr-5">
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide block mb-1">
            {t('totalIncome')}
          </span>
          <div className="text-xl font-semibold text-slate-900 dark:text-white tabular-nums tracking-tight">
            <AnimatedNumber value={income} formatter={formatRupiah} />
          </div>
          {formulaStr && (
            <div className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 font-mono truncate" title={formulaStr}>
              {formulaStr}
            </div>
          )}
        </div>

        {/* 2. Total Pengeluaran */}
        <div className="sm:px-5">
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide block mb-1">
            {t('expenseAllocation')}
          </span>
          <div className="text-xl font-semibold text-slate-900 dark:text-white tabular-nums tracking-tight">
            <AnimatedNumber value={totalBudget} formatter={formatRupiah} />
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {expensePercent.toFixed(1)}% {t('ofIncome')}
          </div>
        </div>

        {/* 3. Masuk ke Tabungan */}
        <div className="sm:pl-5">
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide block mb-1">
            {t('intoSavings')}
          </span>
          <div className="text-xl font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
            <AnimatedNumber value={savingsNominal} formatter={formatRupiah} />
          </div>
          <div className="mt-1 text-xs text-emerald-600/80 dark:text-emerald-400/80 font-medium tabular-nums">
            {savingsPercent.toFixed(1)}% {t('saved')}
          </div>
        </div>
      </div>

      {/* Slim Cashflow Ratio Progress Bar */}
      <div className="space-y-2">
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
          <div
            className="animate-bar-x bg-indigo-600 dark:bg-indigo-500 h-full transition-all duration-700"
            style={{ width: `${Math.min(100, expensePercent)}%`, animationDelay: '220ms' }}
            title={`${t('expenses')}: ${expensePercent.toFixed(1)}%`}
          />
          <div
            className="animate-bar-x bg-emerald-500 h-full transition-all duration-700"
            style={{ width: `${Math.min(100, savingsPercent)}%`, animationDelay: '300ms' }}
            title={`${t('savings')}: ${savingsPercent.toFixed(1)}%`}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-500 inline-block" />
            {t('expenses')} ({expensePercent.toFixed(1)}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            {t('savings')} ({savingsPercent.toFixed(1)}%)
          </span>
        </div>
      </div>
    </div>
  );
}
