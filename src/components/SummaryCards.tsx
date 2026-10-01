'use client';

import React from 'react';
import { formatRupiah } from '@/lib/format';

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
  const isSurplus = totalSelisih >= 0;
  const percentUsed = totalBudget > 0 ? (totalAktual / totalBudget) * 100 : 0;
  const cappedPercent = Math.min(100, Math.max(0, percentUsed));

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 mb-6 sm:mb-8">
      {/* Total Budget Card */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200 group">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <span className="text-[10px] sm:text-xs font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
            Anggaran
          </span>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm sm:text-lg">
            🎯
          </div>
        </div>
        <div className="space-y-0.5 sm:space-y-1">
          <p className="text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
            {formatRupiah(totalBudget)}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 line-clamp-1">
            {totalCount !== undefined ? `${totalCount} pos terencana` : 'Target bulanan'}
          </p>
        </div>
        <div className="hidden sm:flex mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Item Terencana</span>
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {totalCount !== undefined ? `${totalCount} pengeluaran` : 'Semua Pos'}
          </span>
        </div>
      </div>

      {/* Total Aktual Card */}
      <div className="relative overflow-hidden bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200 group">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <span className="text-[10px] sm:text-xs font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
            Aktual
          </span>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-sm sm:text-lg">
            💸
          </div>
        </div>
        <div className="space-y-0.5 sm:space-y-1">
          <p className="text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
            {formatRupiah(totalAktual)}
          </p>
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full ${
                percentUsed > 100
                  ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  : percentUsed > 80
                  ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                  : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              }`}
            >
              {percentUsed.toFixed(0)}% terpakai
            </span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-100 dark:border-slate-700/60">
          <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 sm:h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                percentUsed > 100
                  ? 'bg-rose-500'
                  : percentUsed > 80
                  ? 'bg-amber-500'
                  : 'bg-indigo-500'
              }`}
              style={{ width: `${cappedPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Sisa / Selisih Card (Highlighted full width on mobile) */}
      <div
        className={`col-span-2 md:col-span-1 relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border transition-all duration-200 ${
          isSurplus
            ? 'bg-gradient-to-br from-emerald-50/40 via-white to-teal-50/30 dark:from-slate-800 dark:via-slate-800 dark:to-emerald-950/30 border-emerald-200/70 dark:border-emerald-800/60'
            : 'bg-gradient-to-br from-rose-50/40 via-white to-orange-50/30 dark:from-slate-800 dark:via-slate-800 dark:to-rose-950/30 border-rose-200/70 dark:border-rose-800/60'
        }`}
      >
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <span className="text-[10px] sm:text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
            {isSurplus ? 'Sisa Anggaran' : 'Kelebihan Pengeluaran'}
          </span>
          <div
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-sm sm:text-lg ${
              isSurplus
                ? 'bg-emerald-100/70 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-100/70 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
            }`}
          >
            {isSurplus ? '🛡️' : '⚠️'}
          </div>
        </div>
        <div className="flex items-baseline justify-between sm:block space-y-0.5 sm:space-y-1">
          <p
            className={`text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight tabular-nums ${
              isSurplus ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatRupiah(Math.abs(totalSelisih))}
          </p>
          <span className="sm:hidden text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {completedCount !== undefined && totalCount !== undefined
              ? `${completedCount}/${totalCount} Lunas`
              : isSurplus
              ? 'Surplus'
              : 'Defisit'}
          </span>
        </div>
        <div className="hidden sm:flex mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Status Checklist</span>
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {completedCount !== undefined && totalCount !== undefined
              ? `${completedCount}/${totalCount} terbayar`
              : isSurplus
              ? 'Aman (Surplus)'
              : 'Defisit'}
          </span>
        </div>
      </div>
    </div>
  );
}
