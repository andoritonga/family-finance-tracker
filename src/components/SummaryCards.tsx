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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
      {/* Total Budget Card */}
      <div className="relative overflow-hidden bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            Total Anggaran
          </span>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
            🎯
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
            {formatRupiah(totalBudget)}
          </p>
          <p className="text-xs text-slate-400">Target pengeluaran bulan ini</p>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Item Terencana</span>
          <span className="font-semibold text-slate-700">
            {totalCount !== undefined ? `${totalCount} pengeluaran` : 'Semua Pos'}
          </span>
        </div>
      </div>

      {/* Total Aktual Card */}
      <div className="relative overflow-hidden bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            Aktual Terpakai
          </span>
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
            💸
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
            {formatRupiah(totalAktual)}
          </p>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                percentUsed > 100
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : percentUsed > 80
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {percentUsed.toFixed(1)}% terpakai
            </span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
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

      {/* Sisa / Selisih Card */}
      <div className="relative overflow-hidden bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            {isSurplus ? 'Sisa Anggaran' : 'Kelebihan Pengeluaran'}
          </span>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform ${
              isSurplus
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-rose-50 text-rose-600'
            }`}
          >
            {isSurplus ? '🛡️' : '⚠️'}
          </div>
        </div>
        <div className="space-y-1">
          <p
            className={`text-2xl lg:text-3xl font-bold tracking-tight tabular-nums ${
              isSurplus ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {formatRupiah(Math.abs(totalSelisih))}
          </p>
          <p className="text-xs text-slate-400">
            {isSurplus ? 'Tersisa dari total budget' : 'Melebihi target anggaran'}
          </p>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Status Checklist</span>
          <span className="font-semibold text-slate-700">
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
