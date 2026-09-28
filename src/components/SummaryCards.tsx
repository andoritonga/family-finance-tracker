import React from 'react';
import { formatRupiah } from '@/lib/format';

interface SummaryCardsProps {
  totalBudget: number;
  totalAktual: number;
  totalSelisih: number;
}

export function SummaryCards({ totalBudget, totalAktual, totalSelisih }: SummaryCardsProps) {
  const isPositive = totalSelisih >= 0;
  const percentUsed = totalBudget > 0 ? (totalAktual / totalBudget) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-indigo-500 rounded-xl p-6 text-white shadow-md">
        <h3 className="text-indigo-100 font-medium text-sm mb-1">Total Budget</h3>
        <p className="text-2xl font-bold">{formatRupiah(totalBudget)}</p>
      </div>
      
      <div className="bg-emerald-500 rounded-xl p-6 text-white shadow-md">
        <h3 className="text-emerald-100 font-medium text-sm mb-1">Total Aktual</h3>
        <p className="text-2xl font-bold">{formatRupiah(totalAktual)}</p>
        <div className="mt-2 text-xs font-medium bg-white/20 inline-block px-2 py-1 rounded">
          {percentUsed.toFixed(1)}% terpakai
        </div>
      </div>
      
      <div className={`rounded-xl p-6 text-white shadow-md ${isPositive ? 'bg-amber-500' : 'bg-red-500'}`}>
        <h3 className={`${isPositive ? 'text-amber-100' : 'text-red-100'} font-medium text-sm mb-1`}>Total Selisih</h3>
        <p className="text-2xl font-bold">{formatRupiah(totalSelisih)}</p>
        <div className="mt-2 text-xs font-medium bg-white/20 inline-block px-2 py-1 rounded">
          {isPositive ? 'Sisa' : 'Overbudget'}
        </div>
      </div>
    </div>
  );
}
