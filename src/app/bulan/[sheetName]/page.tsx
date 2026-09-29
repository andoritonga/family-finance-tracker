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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [posisiSummary, setPosisiSummary] = useState<PositionSummary[]>([]);

  const fetchSheet = async (showRefreshIndicator = false) => {
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

  const completedCount = sheet?.items.filter((i) => i.checklist).length || 0;
  const totalCount = sheet?.items.length || 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-36 bg-slate-200/70 rounded-lg animate-pulse" />
        <div className="h-10 w-64 bg-slate-200/70 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="h-36 bg-slate-200/70 rounded-2xl animate-pulse" />
          <div className="h-36 bg-slate-200/70 rounded-2xl animate-pulse" />
          <div className="h-36 bg-slate-200/70 rounded-2xl animate-pulse" />
        </div>
        <div className="h-96 bg-slate-200/70 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!sheet) {
    return (
      <div className="text-center py-20 bg-white border border-slate-200/80 rounded-3xl p-8">
        <span className="text-4xl">🔍</span>
        <h2 className="text-xl font-bold text-slate-800 mt-3">Lembar Tidak Ditemukan</h2>
        <p className="text-slate-500 text-sm mt-1">
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
      <div>
        <nav className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-2">
          <Link href="/" className="hover:text-indigo-600 transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-slate-700 font-semibold">{sheet.name}</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-10 h-10 flex items-center justify-center bg-white rounded-xl border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 hover:shadow-sm transition-all"
              title="Kembali ke Dashboard"
            >
              ←
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  {sheet.name}
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  {completedCount}/{totalCount} Dibayar
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Rincian Anggaran, Aktual, dan Pembagian Rekening
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchSheet(true)}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
          >
            <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
            {isRefreshing ? 'Menyinkronkan...' : 'Sinkronkan Data'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards
        totalBudget={sheet.totalBudget}
        totalAktual={sheet.totalAktual}
        totalSelisih={sheet.totalSelisih}
        completedCount={completedCount}
        totalCount={totalCount}
      />

      {/* Main Expense Table Section */}
      <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Daftar Pos Pengeluaran
            </h2>
            <p className="text-xs text-slate-500">
              Ubah nilai kolom aktual langsung dengan klik angka pada tabel
            </p>
          </div>
        </div>

        <ExpenseTable
          items={sheet.items}
          sheetName={sheet.name}
          onUpdate={() => fetchSheet(false)}
        />
      </section>

      {/* Breakdown per Posisi / Rekening Section */}
      <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Ringkasan Alokasi per Rekening
          </h2>
          <p className="text-xs text-slate-500">
            Pembagian beban pengeluaran berdasarkan dompet / rekening bank
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posisiSummary.map((pos) => {
            const percent = pos.budget > 0 ? (pos.aktual / pos.budget) * 100 : 0;
            const cappedPercent = Math.min(100, Math.max(0, percent));
            const isSurplus = pos.selisih >= 0;

            return (
              <div
                key={pos.posisi}
                className="bg-slate-50/70 border border-slate-200/70 rounded-2xl p-4.5 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-slate-800 truncate">
                    {pos.posisi}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      isSurplus
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                        : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                    }`}
                  >
                    {isSurplus ? 'Sisa ' : 'Over '}
                    {formatRupiah(Math.abs(pos.selisih))}
                  </span>
                </div>

                <div className="space-y-1.5 my-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Anggaran:</span>
                    <span className="font-semibold text-slate-700 tabular-nums">
                      {formatRupiah(pos.budget)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Aktual:</span>
                    <span className="font-bold text-indigo-700 tabular-nums">
                      {formatRupiah(pos.aktual)}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      percent > 100
                        ? 'bg-rose-500'
                        : percent > 85
                        ? 'bg-amber-500'
                        : 'bg-indigo-600'
                    }`}
                    style={{ width: `${cappedPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
