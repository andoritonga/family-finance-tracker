'use client';

import React from 'react';
import { PositionSummary } from '@/lib/types';
import { formatRupiah } from '@/lib/format';

interface PositionSummaryTableProps {
  summaries: PositionSummary[];
}

export function PositionSummaryTable({ summaries }: PositionSummaryTableProps) {
  if (!summaries || summaries.length === 0) return null;

  const totalBudget = summaries.reduce((sum, item) => sum + (item.budget || 0), 0);
  const totalAktual = summaries.reduce((sum, item) => sum + (item.aktual || 0), 0);
  const totalSelisih = summaries.reduce((sum, item) => sum + (item.selisih || 0), 0);
  const overallPercent = totalBudget > 0 ? (totalAktual / totalBudget) * 100 : 0;

  const getAccountIcon = (name: string) => {
    const p = name.toLowerCase();
    if (p.includes('cash') || p.includes('tunai')) return '💵';
    if (p.includes('blu')) return '💳';
    if (p.includes('seabank')) return '🏦';
    if (p.includes('jago')) return '📱';
    if (p.includes('bca') || p.includes('mandiri') || p.includes('bri') || p.includes('bni')) return '🏛️';
    return '💼';
  };

  return (
    <div className="space-y-4">
      {/* Mobile Card View (Zero horizontal scrolling on phone) */}
      <div className="block md:hidden space-y-3">
        {summaries.map((pos) => {
          const percent = pos.budget > 0 ? (pos.aktual / pos.budget) * 100 : 0;
          const allocationPercent = totalBudget > 0 ? (pos.budget / totalBudget) * 100 : 0;
          const cappedPercent = Math.min(100, Math.max(0, percent));
          const isSurplus = pos.selisih >= 0;

          return (
            <div
              key={pos.posisi}
              className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/90 shadow-xs space-y-2.5"
            >
              {/* Header: Icon, Name, and % Allocation badge */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg flex-shrink-0">{getAccountIcon(pos.posisi)}</span>
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                    {pos.posisi}
                  </span>
                </div>
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 tabular-nums flex-shrink-0"
                  title={`${allocationPercent.toFixed(1)}% dari total anggaran bulanan`}
                >
                  {allocationPercent.toFixed(1)}% alokasi
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <span>Realisasi Rekening</span>
                  <span className="font-bold tabular-nums text-slate-700 dark:text-slate-200">
                    {percent.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      percent > 100
                        ? 'bg-rose-500'
                        : percent > 80
                        ? 'bg-amber-500'
                        : 'bg-indigo-600 dark:bg-indigo-500'
                    }`}
                    style={{ width: `${cappedPercent}%` }}
                  />
                </div>
              </div>

              {/* 3-Column Financial Metrics Bar */}
              <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 text-xs items-center">
                {/* Anggaran */}
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                    Target
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums text-xs">
                    {formatRupiah(pos.budget)}
                  </span>
                </div>

                {/* Terpakai */}
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                    Terpakai
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white tabular-nums text-xs">
                    {formatRupiah(pos.aktual)}
                  </span>
                </div>

                {/* Sisa */}
                <div className="text-right">
                  <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                    Sisa
                  </span>
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold tabular-nums ${
                      isSurplus
                        ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {formatRupiah(pos.selisih)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Mobile Total Keseluruhan Card */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-950 dark:text-indigo-200">
            <span className="uppercase tracking-wider">Total Semua Rekening</span>
            <span>{overallPercent.toFixed(1)}% Terpakai</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-indigo-200/50 dark:border-indigo-800/50">
            <div>
              <span className="text-[9px] uppercase font-bold text-indigo-700/70 dark:text-indigo-300/70 block">
                Total Target
              </span>
              <span className="font-bold text-slate-800 dark:text-white tabular-nums">
                {formatRupiah(totalBudget)}
              </span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-indigo-700/70 dark:text-indigo-300/70 block">
                Total Terpakai
              </span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                {formatRupiah(totalAktual)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[9px] uppercase font-bold text-indigo-700/70 dark:text-indigo-300/70 block">
                Total Sisa
              </span>
              <span
                className={`font-bold tabular-nums ${
                  totalSelisih >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatRupiah(totalSelisih)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Table View (Spacious table on wide screens) */}
      <div className="hidden md:block overflow-hidden border border-slate-200/80 dark:border-slate-700/80 rounded-2xl bg-white dark:bg-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/40 border-b border-slate-200/80 dark:border-slate-700/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4">Rekening / Pos Alokasi</th>
                <th className="py-3.5 px-4 text-right">Target Anggaran</th>
                <th className="py-3.5 px-4 text-center">% Porsi Alokasi</th>
                <th className="py-3.5 px-4 text-right">Aktual Terpakai</th>
                <th className="py-3.5 px-4 text-right">Sisa / Selisih</th>
                <th className="py-3.5 px-4 text-center w-44">Realisasi Pos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {summaries.map((pos) => {
                const percent = pos.budget > 0 ? (pos.aktual / pos.budget) * 100 : 0;
                const allocationPercent = totalBudget > 0 ? (pos.budget / totalBudget) * 100 : 0;
                const cappedPercent = Math.min(100, Math.max(0, percent));
                const isSurplus = pos.selisih >= 0;

                return (
                  <tr
                    key={pos.posisi}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{getAccountIcon(pos.posisi)}</span>
                        <span>{pos.posisi}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-medium text-slate-600 dark:text-slate-300 tabular-nums">
                      {formatRupiah(pos.budget)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 tabular-nums"
                        title={`${allocationPercent.toFixed(1)}% dari total anggaran bulanan`}
                      >
                        {allocationPercent.toFixed(1)}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-semibold text-slate-900 dark:text-white tabular-nums">
                      {formatRupiah(pos.aktual)}
                    </td>

                    <td className="py-3.5 px-4 text-right tabular-nums text-xs">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold ${
                          isSurplus
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800'
                            : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800'
                        }`}
                      >
                        {formatRupiah(pos.selisih)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              percent > 100
                                ? 'bg-rose-500'
                                : percent > 80
                                ? 'bg-amber-500'
                                : 'bg-indigo-600 dark:bg-indigo-500'
                            }`}
                            style={{ width: `${cappedPercent}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 w-11 text-right tabular-nums">
                          {percent.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Table Total Summary Row */}
            <tfoot>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-t-2 border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-xs">
                <td className="py-3.5 px-4 uppercase tracking-wider">Total Keseluruhan</td>
                <td className="py-3.5 px-4 text-right tabular-nums text-sm">
                  {formatRupiah(totalBudget)}
                </td>
                <td className="py-3.5 px-4 text-center tabular-nums text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                  100%
                </td>
                <td className="py-3.5 px-4 text-right tabular-nums text-sm text-indigo-600 dark:text-indigo-400">
                  {formatRupiah(totalAktual)}
                </td>
                <td className="py-3.5 px-4 text-right tabular-nums text-sm">
                  <span
                    className={
                      totalSelisih >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }
                  >
                    {formatRupiah(totalSelisih)}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {overallPercent.toFixed(1)}% Realisasi
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
