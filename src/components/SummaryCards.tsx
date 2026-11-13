'use client';

import React from 'react';
import { Target, ArrowUpRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import { formatRupiah } from '@/lib/format';
import { useLanguage } from '@/lib/i18n';
import { AnimatedNumber } from '@/components/AnimatedNumber';
import { ProgressRing } from '@/components/ProgressRing';

interface SummaryCardsProps {
  totalBudget: number;
  totalAktual: number;
  totalSelisih: number;
  completedCount?: number;
  totalCount?: number;
}

export function SummaryCards({
  totalBudget,
  totalAktual,
  totalSelisih,
  completedCount,
  totalCount,
}: SummaryCardsProps) {
  const { t, language } = useLanguage();
  const isSurplus = totalSelisih >= 0;
  const percentUsed = totalBudget > 0 ? (totalAktual / totalBudget) * 100 : 0;
  const cappedPercent = Math.min(100, Math.max(0, percentUsed));

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
      {/* Total Budget Card */}
      <div
        className="animate-card-enter bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300/90 dark:hover:border-slate-700 rounded-2xl p-4 sm:p-5 transition-all duration-200 active:scale-[0.985]"
        style={{ animationDelay: '0ms' }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold tracking-wide text-slate-400 dark:text-slate-500 uppercase">
            {t('budgetLabel')}
          </span>
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center">
            <Target className="w-4 h-4" strokeWidth={1.75} />
          </div>
        </div>
        <p className="text-lg sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white tabular-nums">
          <AnimatedNumber value={totalBudget} formatter={formatRupiah} />
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
          {totalCount !== undefined
            ? `${totalCount} ${language === 'id' ? 'pos terencana' : 'planned items'}`
            : language === 'id'
            ? 'Target bulanan'
            : 'Monthly target'}
        </p>
      </div>

      {/* Total Aktual Card */}
      <div
        className="animate-card-enter bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300/90 dark:hover:border-slate-700 rounded-2xl p-4 sm:p-5 transition-all duration-200 active:scale-[0.985]"
        style={{ animationDelay: '60ms' }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold tracking-wide text-slate-400 dark:text-slate-500 uppercase">
            {t('actualLabel')}
          </span>
          <ProgressRing
            percent={percentUsed}
            size={36}
            strokeWidth={3.5}
            colorClassName={
              percentUsed > 100
                ? 'text-rose-500'
                : percentUsed > 80
                ? 'text-amber-500'
                : 'text-indigo-600 dark:text-indigo-400'
            }
            label={`${Math.round(percentUsed)}%`}
          />
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-lg sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white tabular-nums">
            <AnimatedNumber value={totalAktual} formatter={formatRupiah} />
          </p>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" strokeWidth={2} />
        </div>
        <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className={`animate-bar-x h-full rounded-full transition-all duration-500 ${
              percentUsed > 100
                ? 'bg-rose-500'
                : percentUsed > 80
                ? 'bg-amber-500'
                : 'bg-indigo-600 dark:bg-indigo-500'
            }`}
            style={{ width: `${cappedPercent}%`, animationDelay: '160ms' }}
          />
        </div>
      </div>

      {/* Sisa / Selisih Card */}
      <div
        className="animate-card-enter col-span-2 md:col-span-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300/90 dark:hover:border-slate-700 rounded-2xl p-4 sm:p-5 transition-all duration-200 active:scale-[0.985]"
        style={{ animationDelay: '120ms' }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold tracking-wide text-slate-400 dark:text-slate-500 uppercase">
            {isSurplus
              ? language === 'id'
                ? 'Sisa Anggaran'
                : 'Remaining Budget'
              : language === 'id'
              ? 'Kelebihan Pengeluaran'
              : 'Over Budget'}
          </span>
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isSurplus
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
            }`}
          >
            {isSurplus ? (
              <ShieldCheck className="w-4 h-4" strokeWidth={1.75} />
            ) : (
              <AlertTriangle className="w-4 h-4" strokeWidth={1.75} />
            )}
          </div>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <p
            className={`text-lg sm:text-2xl font-semibold tracking-tight tabular-nums ${
              isSurplus ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            <AnimatedNumber value={Math.abs(totalSelisih)} formatter={formatRupiah} />
          </p>
          {completedCount !== undefined && totalCount !== undefined && (
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 tabular-nums">
              {completedCount}/{totalCount} {language === 'id' ? 'lunas' : 'paid'}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
          {isSurplus
            ? language === 'id'
              ? 'Dalam batas anggaran'
              : 'Within budget'
            : language === 'id'
            ? 'Melebihi anggaran bulanan'
            : 'Exceeds monthly budget'}
        </p>
      </div>
    </div>
  );
}
