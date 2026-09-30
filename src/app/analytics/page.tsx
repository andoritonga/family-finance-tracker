'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { formatRupiah } from '@/lib/format';

interface MonthlyTrend {
  name: string;
  month: number;
  year: number;
  budget: number;
  aktual: number;
  selisih: number;
  income?: number;
  savings?: number;
  percentUsed: number;
  itemCount: number;
  isSurplus: boolean;
}

interface TopExpense {
  name: string;
  totalBudget: number;
  totalAktual: number;
  avgMonthly: number;
  percentOfTotal?: number;
  occurrences: number;
  positions: string[];
}

interface PositionDist {
  posisi: string;
  totalBudget: number;
  totalAktual: number;
  totalSelisih: number;
  percentage: number;
  budgetPercentage?: number;
}

interface AnalyticsData {
  kpi: {
    totalMonths: number;
    totalAnnualBudget: number;
    totalAnnualAktual: number;
    totalAnnualSelisih: number;
    totalAnnualIncome?: number;
    totalAnnualSavings?: number;
    avgMonthlySpend: number;
    avgMonthlyBudget: number;
    avgMonthlyIncome?: number;
    avgMonthlySavings?: number;
    savingsRate?: number;
    disciplineRate: number;
    lowestSpendMonth: { name: string; aktual: number };
    highestSpendMonth: { name: string; aktual: number };
  } | null;
  monthlyTrends: MonthlyTrend[];
  topExpenses: TopExpense[];
  positionDistribution: PositionDist[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'ALL' | 'LAST_6' | 'LAST_3'>('ALL');
  const [activeTooltip, setActiveTooltip] = useState<MonthlyTrend | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Error fetching analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  // Filter trends based on selected time range
  const filteredTrends = useMemo(() => {
    if (!data?.monthlyTrends) return [];
    if (timeRange === 'LAST_3') return data.monthlyTrends.slice(-3);
    if (timeRange === 'LAST_6') return data.monthlyTrends.slice(-6);
    return data.monthlyTrends;
  }, [data, timeRange]);

  // Max value for chart scaling
  const maxChartValue = useMemo(() => {
    if (!filteredTrends || filteredTrends.length === 0) return 1;
    const max = Math.max(
      ...filteredTrends.map((t) => Math.max(t.budget, t.aktual))
    );
    return max > 0 ? max * 1.15 : 1;
  }, [filteredTrends]);

  return (
    <div className="space-y-10">
      <Navbar />

      {/* Page Title & Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Analisis Finansial Keluarga
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Wawasan tren belanja, efisiensi anggaran, dan kebiasaan finansial keluarga
          </p>
        </div>

        {/* Time range filters */}
        <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setTimeRange('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              timeRange === 'ALL'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Semua ({data?.monthlyTrends.length || 0} Bulan)
          </button>
          <button
            onClick={() => setTimeRange('LAST_6')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              timeRange === 'LAST_6'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            6 Bulan Terakhir
          </button>
          <button
            onClick={() => setTimeRange('LAST_3')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              timeRange === 'LAST_3'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            3 Bulan Terakhir
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
            <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
            <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
            <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          </div>
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
        </div>
      ) : !data || !data.kpi ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl">
          <span className="text-4xl">📊</span>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-3">
            Data Belum Cukup
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Belum ada lembar anggaran bulanan yang valid di Google Sheets.
          </p>
        </div>
      ) : (
        <>
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Rata-rata Pengeluaran */}
            <div className="bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Rata-rata Pengeluaran
                </span>
                <span className="text-lg">💸</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
                {formatRupiah(data.kpi.avgMonthlySpend)}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Anggaran target: {formatRupiah(data.kpi.avgMonthlyBudget)}
              </p>
            </div>

            {/* Card 2: Akumulasi Alokasi Tabungan */}
            <div className="bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Total Alokasi Tabungan
                </span>
                <span className="text-lg">🏦</span>
              </div>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
                {formatRupiah(data.kpi.totalAnnualSavings || 0)}
              </p>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                <span>Rata-rata: {formatRupiah(data.kpi.avgMonthlySavings || 0)}/bln</span>
                {data.kpi.savingsRate !== undefined && (
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                    {data.kpi.savingsRate}% rasio
                  </span>
                )}
              </div>
            </div>

            {/* Card 3: Disiplin Anggaran */}
            <div className="bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Disiplin Anggaran
                </span>
                <span className="text-lg">🎯</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
                {data.kpi.disciplineRate.toFixed(0)}%
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Bulan tanpa overbudget
                </span>
              </div>
            </div>

            {/* Card 4: Bulan Paling Efisien */}
            <div className="bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Bulan Paling Hemat
                </span>
                <span className="text-lg">🌟</span>
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
                {data.kpi.lowestSpendMonth.name}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 tabular-nums">
                {formatRupiah(data.kpi.lowestSpendMonth.aktual)}
              </p>
            </div>
          </div>

          {/* Monthly Trend Chart */}
          <section className="bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Tren Anggaran vs Realisasi Bulanan
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Grafik komparasi anggaran rencana dengan pengeluaran aktual
                </p>
              </div>

              {/* Chart Legend */}
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-indigo-200 dark:bg-indigo-900/60 border border-indigo-400 dark:border-indigo-700" />
                  <span className="text-slate-600 dark:text-slate-300">Target Anggaran</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-indigo-600 dark:bg-indigo-500" />
                  <span className="text-slate-600 dark:text-slate-300">Aktual Terpakai</span>
                </div>
              </div>
            </div>

            {/* Custom Interactive SVG/HTML Chart */}
            <div className="relative pt-6 pb-2">
              <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 border-b border-slate-200 dark:border-slate-700 px-2 sm:px-4">
                {filteredTrends.map((t) => {
                  const budgetHeight = (t.budget / maxChartValue) * 100;
                  const aktualHeight = (t.aktual / maxChartValue) * 100;
                  const isOver = t.aktual > t.budget;

                  return (
                    <div
                      key={t.name}
                      onMouseEnter={() => setActiveTooltip(t)}
                      onMouseLeave={() => setActiveTooltip(null)}
                      className="group flex-1 flex flex-col items-center justify-end h-full cursor-pointer relative"
                    >
                      {/* Bars Group */}
                      <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-full">
                        {/* Budget Bar */}
                        <div
                          className="w-1/2 max-w-[28px] bg-indigo-100 dark:bg-indigo-950/70 border-t border-x border-indigo-300 dark:border-indigo-800 rounded-t-md transition-all duration-300 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/80"
                          style={{ height: `${Math.max(4, budgetHeight)}%` }}
                        />

                        {/* Aktual Bar */}
                        <div
                          className={`w-1/2 max-w-[28px] rounded-t-md transition-all duration-300 ${
                            isOver
                              ? 'bg-rose-500 group-hover:bg-rose-600'
                              : 'bg-indigo-600 dark:bg-indigo-500 group-hover:bg-indigo-700 dark:group-hover:bg-indigo-400'
                          }`}
                          style={{ height: `${Math.max(4, aktualHeight)}%` }}
                        />
                      </div>

                      {/* X-axis Label */}
                      <div className="mt-3 text-center">
                        <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate max-w-[64px] transition-colors">
                          {t.name.split(' ')[0]}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tooltip Hover Display */}
              {activeTooltip && (
                <div className="absolute top-0 right-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl p-3 shadow-xl text-xs space-y-1 animate-fadeIn pointer-events-none z-10">
                  <p className="font-bold text-sm border-b border-slate-700 dark:border-slate-200 pb-1">
                    {activeTooltip.name}
                  </p>
                  <p className="flex justify-between gap-4">
                    <span className="text-slate-400 dark:text-slate-600">Anggaran:</span>
                    <span className="font-bold tabular-nums">
                      {formatRupiah(activeTooltip.budget)}
                    </span>
                  </p>
                  <p className="flex justify-between gap-4">
                    <span className="text-slate-400 dark:text-slate-600">Aktual:</span>
                    <span className="font-bold tabular-nums text-indigo-400 dark:text-indigo-600">
                      {formatRupiah(activeTooltip.aktual)}
                    </span>
                  </p>
                  <p className="flex justify-between gap-4">
                    <span className="text-slate-400 dark:text-slate-600">Selisih:</span>
                    <span
                      className={`font-bold tabular-nums ${
                        activeTooltip.selisih >= 0 ? 'text-emerald-400 dark:text-emerald-600' : 'text-rose-400 dark:text-rose-600'
                      }`}
                    >
                      {activeTooltip.selisih >= 0 ? '+' : ''}
                      {formatRupiah(activeTooltip.selisih)}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Two Columns: Top 10 Expenses & Account Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top 10 Expenses */}
            <section className="bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  🏆 10 Pos Pengeluaran Terbesar
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pos belanja yang paling banyak menyerap anggaran keluarga
                </p>
              </div>

              <div className="space-y-3.5">
                {data.topExpenses.map((exp, idx) => {
                  const maxExpenseVal = data.topExpenses[0]?.totalAktual || data.topExpenses[0]?.totalBudget || 1;
                  const percentOfTop = ((exp.totalAktual || exp.totalBudget) / maxExpenseVal) * 100;

                  return (
                    <div
                      key={exp.name}
                      className="p-3 bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200 truncate">
                            {exp.name}
                          </span>
                          {exp.name.toLowerCase() === 'fani' && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800 shrink-0">
                              Fani 1 & 2
                            </span>
                          )}
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white tabular-nums">
                            {formatRupiah(exp.totalAktual || exp.totalBudget)}
                          </span>
                          {exp.percentOfTotal !== undefined && (
                            <span
                              className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 tabular-nums"
                              title={`${exp.percentOfTotal}% dari total alokasi pengeluaran`}
                            >
                              {exp.percentOfTotal}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Mini Bar & Average */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-200/70 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full"
                            style={{ width: `${percentOfTop}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 tabular-nums shrink-0">
                          Rata-rata: {formatRupiah(exp.avgMonthly)}/bln
                          {exp.percentOfTotal !== undefined ? ` • ${exp.percentOfTotal}% alokasi` : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Account Distribution */}
            <section className="bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  💳 Porsi Beban per Rekening
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pembagian persentase dana pengeluaran berdasarkan dompet / rekening
                </p>
              </div>

              <div className="space-y-3.5">
                {data.positionDistribution.map((pos) => {
                  return (
                    <div
                      key={pos.posisi}
                      className="p-3.5 bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                          {pos.posisi}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white tabular-nums">
                            {formatRupiah(pos.totalAktual || pos.totalBudget)}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 tabular-nums" title={`${pos.percentage.toFixed(1)}% dari total pengeluaran`}>
                            {pos.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Percentage Bar */}
                      <div className="w-full bg-slate-200/70 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, pos.percentage)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Historical Summary Table */}
          <section className="bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Rekap Historis Seluruh Periode
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Data ringkasan dari semua lembar bulan yang tercatat di Google Sheets
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-700/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4">Periode Bulan</th>
                    <th className="py-3 px-4 text-right">Pendapatan</th>
                    <th className="py-3 px-4 text-right">Target Anggaran</th>
                    <th className="py-3 px-4 text-right">Aktual Terpakai</th>
                    <th className="py-3 px-4 text-right">Tabungan</th>
                    <th className="py-3 px-4 text-right">Sisa Anggaran</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {data.monthlyTrends.map((t) => (
                    <tr
                      key={t.name}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {t.name}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums text-slate-600 dark:text-slate-300 text-xs">
                        {t.income ? formatRupiah(t.income) : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums font-medium text-slate-600 dark:text-slate-300">
                        {formatRupiah(t.budget)}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums font-bold text-slate-900 dark:text-white">
                        {formatRupiah(t.aktual)}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                        {t.savings ? formatRupiah(t.savings) : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums text-xs">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold ${
                            t.isSurplus
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800'
                              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800'
                          }`}
                        >
                          {t.isSurplus ? '+' : ''}
                          {formatRupiah(t.selisih)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-xs font-semibold ${
                            t.isSurplus
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {t.isSurplus ? '✓ Hemat' : '⚠️ Overbudget'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Link
                          href={`/bulan/${encodeURIComponent(t.name)}`}
                          prefetch={false}
                          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Lihat Detail →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
