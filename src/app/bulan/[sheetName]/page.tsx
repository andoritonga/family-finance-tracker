'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { SummaryCards } from '@/components/SummaryCards';
import { ExpenseTable } from '@/components/ExpenseTable';
import { MonthlySheet, PositionSummary } from '@/lib/types';
import { formatRupiah } from '@/lib/format';

export default function BulanPage() {
  const params = useParams();
  const sheetName = decodeURIComponent(params.sheetName as string);
  
  const [sheet, setSheet] = useState<MonthlySheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [posisiSummary, setPosisiSummary] = useState<PositionSummary[]>([]);

  const fetchSheet = async () => {
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
    }
  };

  useEffect(() => {
    fetchSheet();
  }, [sheetName]);

  const calculatePosisi = (data: MonthlySheet) => {
    const summaryMap = new Map<string, PositionSummary>();
    
    data.items.forEach(item => {
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 skeleton"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-32 skeleton"></div>
          <div className="h-32 skeleton"></div>
          <div className="h-32 skeleton"></div>
        </div>
        <div className="h-96 skeleton"></div>
      </div>
    );
  }

  if (!sheet) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-slate-800">Data tidak ditemukan</h2>
        <Link href="/" className="text-indigo-600 hover:underline mt-4 inline-block">Kembali ke Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <Link 
          href="/"
          className="w-10 h-10 flex items-center justify-center bg-white rounded-full border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-colors shadow-sm"
        >
          ←
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{sheet.name}</h1>
          <p className="text-slate-500 text-sm">Detail Anggaran & Pengeluaran</p>
        </div>
      </header>

      <SummaryCards 
        totalBudget={sheet.totalBudget}
        totalAktual={sheet.totalAktual}
        totalSelisih={sheet.totalSelisih}
      />

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Daftar Pengeluaran</h2>
        <ExpenseTable 
          items={sheet.items} 
          sheetName={sheet.name} 
          onUpdate={fetchSheet}
        />
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Ringkasan per Posisi</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Posisi</th>
                <th className="px-4 py-3 text-right">Total Budget</th>
                <th className="px-4 py-3 text-right">Total Aktual</th>
                <th className="px-4 py-3 text-right">Selisih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {posisiSummary.map((pos) => (
                <tr key={pos.posisi} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-700">{pos.posisi}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{formatRupiah(pos.budget)}</td>
                  <td className="px-4 py-3 text-right font-medium text-indigo-700">{formatRupiah(pos.aktual)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${pos.selisih >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatRupiah(pos.selisih)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
