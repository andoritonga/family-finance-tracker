'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { GenerateModal } from '@/components/GenerateModal';
import { formatRupiah } from '@/lib/format';
import { useLanguage } from '@/lib/i18n';
import {
  BarChart3,
  ArrowUpRight,
  Landmark,
  Target,
  Sparkles,
  Trophy,
  CreditCard,
  Calendar,
} from 'lucide-react';

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
  const { t, formatSheetMonth, language } = useLanguage();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'ALL' | 'LAST_6' | 'LAST_3'>('LAST_6');
  const [activeTooltip, setActiveTooltip] = useState<MonthlyTrend | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setTimeRange('ALL');
    }
    fetchAnalytics();
    const handleQuickAction = () => setShowGenerateModal(true);
    window.addEventListener('apbk:quick-action', handleQuickAction);
    return () => window.removeEventListener('apbk:quick-action', handleQuickAction);
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
    <div className="space-y-10 max-w-full overflow-x-clip">
      <Navbar onOpenGenerateModal={() => setShowGenerateModal(true)} />

      {/* Page Title & Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('analyticsTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('analyticsSubtitle')}
          </p>
        </div>

        {/* Time range filters */}
        <div className="grid grid-cols-3 sm:inline-flex w-full sm:w-auto rounded-xl p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-[11px] sm:text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => {
              setTimeRange('ALL');
              setActiveTooltip(null);
            }}
            className={`px-2 sm:px-3 py-1.5 rounded-lg transition-all truncate ${
              timeRange === 'ALL'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {language === 'id'
              ? `Semua (${data?.monthlyTrends.length || 0})`
              : `All (${data?.monthlyTrends.length || 0})`}
          </button>
          <button
            onClick={() => {
              setTimeRange('LAST_6');
              setActiveTooltip(null);
            }}
            className={`px-2 sm:px-3 py-1.5 rounded-lg transition-all truncate ${
              timeRange === 'LAST_6'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {language === 'id' ? '6 Bulan' : 'Last 6M'}
          </button>
          <button
            onClick={() => {
              setTimeRange('LAST_3');
              setActiveTooltip(null);
            }}
            className={`px-2 sm:px-3 py-1.5 rounded-lg transition-all truncate ${
              timeRange === 'LAST_3'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {language === 'id' ? '3 Bulan' : 'Last 3M'}
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
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl">
          <BarChart3 className="w-9 h-9 text-slate-400 mx-auto" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mt-3">
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
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('averageExpenses')}
                </span>
                <ArrowUpRight className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
                {formatRupiah(data.kpi.avgMonthlySpend)}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 tabular-nums">
                {t('targetBudgetLabel')}: {formatRupiah(data.kpi.avgMonthlyBudget)}
              </p>
            </div>

            {/* Card 2: Akumulasi Alokasi Tabungan */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('totalSavingsAlloc')}
                </span>
                <Landmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
              </div>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
                {formatRupiah(data.kpi.totalAnnualSavings || 0)}
              </p>
              <div className="mt-1 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 tabular-nums">
                <span>{language === 'id' ? 'Rata-rata' : 'Average'}: {formatRupiah(data.kpi.avgMonthlySavings || 0)}{t('perMonth')}</span>
                {data.kpi.savingsRate !== undefined && (
                  <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                    {data.kpi.savingsRate}% {t('ratio')}
                  </span>
                )}
              </div>
            </div>

            {/* Card 3: Disiplin Anggaran */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('budgetDiscipline')}
                </span>
                <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" strokeWidth={1.75} />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
                {data.kpi.disciplineRate.toFixed(0)}%
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {t('monthsWithinBudget')}
                </span>
              </div>
            </div>

            {/* Card 4: Bulan Paling Efisien */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('lowestSpendMonth')}
                </span>
                <Sparkles className="w-4 h-4 text-amber-500" strokeWidth={1.75} />
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
                {formatSheetMonth(data.kpi.lowestSpendMonth.name)}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1 tabular-nums">
                {formatRupiah(data.kpi.lowestSpendMonth.aktual)}
              </p>
            </div>
          </div>

          {/* Monthly Trend Chart (Option 3: Vertical Bars for 3M/6M, Horizontal Bars on Mobile when ALL is selected) */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-7 space-y-5 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  {t('budgetVsActualTrend')}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('budgetVsActualSub')}
                </p>
              </div>

              {/* Chart Legend */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-indigo-200 dark:bg-indigo-900/60 border border-indigo-400 dark:border-indigo-700 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300">{t('budgetTargetLegend')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-indigo-600 dark:bg-indigo-500 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300">{t('actualSpentLegend')}</span>
                </div>
              </div>
            </div>

            {/* Mobile Horizontal Bar View when timeRange === 'ALL' (Zero horizontal scroll) */}
            {timeRange === 'ALL' && (
              <div className="block md:hidden space-y-2.5 pt-1">
                {[...filteredTrends].reverse().map((trend) => {
                  const budgetWidth = Math.min(100, Math.max(4, (trend.budget / maxChartValue) * 100));
                  const aktualWidth = Math.min(100, Math.max(4, (trend.aktual / maxChartValue) * 100));
                  const isOver = trend.aktual > trend.budget;
                  const percent = trend.budget > 0 ? (trend.aktual / trend.budget) * 100 : 0;

                  return (
                    <div
                      key={trend.name}
                      className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                          {formatSheetMonth(trend.name)}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-bold text-xs text-slate-900 dark:text-white tabular-nums">
                            {formatRupiah(trend.aktual)}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums ${
                              isOver
                                ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300'
                                : 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300'
                            }`}
                          >
                            {percent.toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      {/* Stacked Horizontal Bars: Budget vs Actual */}
                      <div className="space-y-1">
                        {/* Budget Target Bar */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200/60 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-indigo-200 dark:bg-indigo-900/80 border border-indigo-400/70 dark:border-indigo-700 h-full rounded-full transition-all duration-300"
                              style={{ width: `${budgetWidth}%` }}
                            />
                          </div>
                        </div>
                        {/* Actual Spent Bar */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200/60 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isOver
                                  ? 'bg-rose-500'
                                  : 'bg-indigo-600 dark:bg-indigo-500'
                              }`}
                              style={{ width: `${aktualWidth}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 tabular-nums">
                        <span>
                          {t('budgetLabel')}: {formatRupiah(trend.budget)}
                        </span>
                        <span
                          className={`font-semibold ${
                            trend.selisih >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {t('differenceLabel')}: {trend.selisih >= 0 ? '+' : ''}
                          {formatRupiah(trend.selisih)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Vertical Bar Chart (Shown on Mobile for 3M/6M, and always on Desktop) */}
            <div className={`${timeRange === 'ALL' ? 'hidden md:block' : 'block'} relative pt-6 pb-2`}>
              <div className="overflow-x-auto no-scrollbar">
                <div
                  className={`h-56 sm:h-64 flex items-end justify-between gap-1.5 sm:gap-3 border-b border-slate-200 dark:border-slate-700 px-1 sm:px-4 ${
                    timeRange === 'ALL' ? 'min-w-[640px]' : 'w-full'
                  }`}
                >
                  {filteredTrends.map((trendItem) => {
                    const budgetHeight = (trendItem.budget / maxChartValue) * 100;
                    const aktualHeight = (trendItem.aktual / maxChartValue) * 100;
                    const isOver = trendItem.aktual > trendItem.budget;
                    const formattedName = formatSheetMonth(trendItem.name);
                    const parts = formattedName.split(' ');
                    const shortMonth = parts[0] ? parts[0].slice(0, 3) : formattedName;
                    const shortYear = parts[1] ? `'${parts[1].slice(-2)}` : '';

                    return (
                      <div
                        key={trendItem.name}
                        onClick={() =>
                          setActiveTooltip((prev) =>
                            prev?.name === trendItem.name ? null : trendItem
                          )
                        }
                        onMouseEnter={() => setActiveTooltip(trendItem)}
                        onMouseLeave={() => setActiveTooltip(null)}
                        className="group flex-1 min-w-0 flex flex-col items-center justify-end h-full cursor-pointer relative"
                      >
                        {/* Bars Group */}
                        <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full">
                          {/* Budget Bar */}
                          <div
                            className="w-1/2 max-w-[26px] bg-indigo-100 dark:bg-indigo-950/70 border-t border-x border-indigo-300 dark:border-indigo-800 rounded-t-md transition-all duration-300 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/80"
                            style={{ height: `${Math.max(4, budgetHeight)}%` }}
                          />

                          {/* Aktual Bar */}
                          <div
                            className={`w-1/2 max-w-[26px] rounded-t-md transition-all duration-300 ${
                              isOver
                                ? 'bg-rose-500 group-hover:bg-rose-600'
                                : 'bg-indigo-600 dark:bg-indigo-500 group-hover:bg-indigo-700 dark:group-hover:bg-indigo-400'
                            }`}
                            style={{ height: `${Math.max(4, aktualHeight)}%` }}
                          />
                        </div>

                        {/* X-axis Label */}
                        <div className="mt-2.5 text-center w-full">
                          <span className="block sm:hidden text-[10px] font-semibold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate transition-colors">
                            {shortMonth} {shortYear}
                          </span>
                          <span className="hidden sm:block text-[11px] font-semibold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate transition-colors">
                            {timeRange === 'ALL' ? `${shortMonth} ${shortYear}` : parts[0]}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tooltip Hover/Tap Display */}
              {activeTooltip && (
                <div className="absolute top-0 right-2 sm:right-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl p-3 shadow-xl text-xs space-y-1 animate-fadeIn pointer-events-none z-10">
                  <p className="font-bold text-sm border-b border-slate-700 dark:border-slate-200 pb-1">
                    {formatSheetMonth(activeTooltip.name)}
                  </p>
                  <p className="flex justify-between gap-4">
                    <span className="text-slate-400 dark:text-slate-600">{t('budgetLabel')}:</span>
                    <span className="font-bold tabular-nums">
                      {formatRupiah(activeTooltip.budget)}
                    </span>
                  </p>
                  <p className="flex justify-between gap-4">
                    <span className="text-slate-400 dark:text-slate-600">{t('actualLabel')}:</span>
                    <span className="font-bold tabular-nums text-indigo-400 dark:text-indigo-600">
                      {formatRupiah(activeTooltip.aktual)}
                    </span>
                  </p>
                  <p className="flex justify-between gap-4">
                    <span className="text-slate-400 dark:text-slate-600">{t('differenceLabel')}:</span>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 10 Expenses */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500 shrink-0" strokeWidth={1.75} />
                  <span>{t('top10Expenses')}</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('top10ExpensesSub')}
                </p>
              </div>

              <div className="space-y-3">
                {data.topExpenses.map((exp, idx) => {
                  const maxExpenseVal = data.topExpenses[0]?.totalAktual || data.topExpenses[0]?.totalBudget || 1;
                  const percentOfTop = ((exp.totalAktual || exp.totalBudget) / maxExpenseVal) * 100;

                  return (
                    <div
                      key={exp.name}
                      className="p-3 bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0 truncate">
                          <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200 truncate">
                            {exp.name}
                          </span>
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white tabular-nums">
                            {formatRupiah(exp.totalAktual || exp.totalBudget)}
                          </span>
                          {exp.percentOfTotal !== undefined && (
                            <span
                              className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 tabular-nums"
                              title={`${exp.percentOfTotal}% ${language === 'id' ? 'dari total alokasi pengeluaran' : 'of total expense allocation'}`}
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
                          {language === 'id' ? 'Rata-rata' : 'Average'}: {formatRupiah(exp.avgMonthly)}{t('perMonth')}
                          {exp.percentOfTotal !== undefined ? ` • ${exp.percentOfTotal}% ${t('allocation')}` : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Account Distribution */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" strokeWidth={1.75} />
                  <span>{t('accountShareTitle')}</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('accountShareSub')}
                </p>
              </div>

              <div className="space-y-3">
                {data.positionDistribution.map((pos) => {
                  return (
                    <div
                      key={pos.posisi}
                      className="p-3.5 bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                          {pos.posisi}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white tabular-nums">
                            {formatRupiah(pos.totalAktual || pos.totalBudget)}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 tabular-nums" title={`${pos.percentage.toFixed(1)}% ${t('ofTotalSpending')}`}>
                            {pos.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Percentage Bar */}
                      <div className="w-full bg-slate-200/70 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-500"
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
          <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {t('historicalRecapTitle')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('historicalRecapSub')}
              </p>
            </div>

            {/* Mobile Card View (Zero horizontal scrolling on phone/PWA) */}
            <div className="block md:hidden space-y-3">
              {data.monthlyTrends.map((trend) => {
                const percent =
                  trend.budget > 0
                    ? (trend.aktual / trend.budget) * 100
                    : trend.percentUsed || 0;
                const cappedPercent = Math.min(100, Math.max(0, percent));

                return (
                  <div
                    key={trend.name}
                    className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-700/80 space-y-3"
                  >
                    {/* Card Header: Month Name, Surplus/Deficit Badge & Detail Link */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={1.75} />
                        <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                          {formatSheetMonth(trend.name)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            trend.isSurplus
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800'
                          }`}
                        >
                          {trend.isSurplus ? t('surplusBadge') : t('deficitBadge')}
                        </span>

                        <Link
                          href={`/bulan/${encodeURIComponent(trend.name)}`}
                          prefetch={false}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
                        >
                          {t('viewDetails')}
                        </Link>
                      </div>
                    </div>

                    {/* Progress Bar Realisasi */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        <span>{t('accountRealization')}</span>
                        <span className="font-bold tabular-nums text-slate-700 dark:text-slate-200">
                          {percent.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200/80 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            percent > 100
                              ? 'bg-rose-500'
                              : percent > 85
                              ? 'bg-amber-500'
                              : 'bg-indigo-600 dark:bg-indigo-500'
                          }`}
                          style={{ width: `${cappedPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* 3-Column Primary Metrics: Budget, Actual, Difference */}
                    <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/70 text-xs items-center">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                          {t('colBudget')}
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums text-[11px] sm:text-xs">
                          {formatRupiah(trend.budget)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                          {t('colActual')}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white tabular-nums text-[11px] sm:text-xs">
                          {formatRupiah(trend.aktual)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                          {t('colDifference')}
                        </span>
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold tabular-nums ${
                            trend.isSurplus
                              ? 'bg-emerald-100/80 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-100/80 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {trend.isSurplus ? '+' : ''}
                          {formatRupiah(trend.selisih)}
                        </span>
                      </div>
                    </div>

                    {/* Secondary Footer Row: Income & Savings */}
                    <div className="grid grid-cols-2 gap-2 pt-0.5 text-[11px]">
                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-100/80 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold truncate mr-1">
                          {t('combinedIncome')}
                        </span>
                        <span className="font-semibold tabular-nums shrink-0">
                          {trend.income ? formatRupiah(trend.income) : '-'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300">
                        <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-semibold truncate mr-1">
                          {t('savings')}
                        </span>
                        <span className="font-bold tabular-nums shrink-0">
                          {trend.savings ? formatRupiah(trend.savings) : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-700/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4">{t('colMonthPeriod')}</th>
                    <th className="py-3 px-4 text-right">{t('combinedIncome')}</th>
                    <th className="py-3 px-4 text-right">{t('colBudget')}</th>
                    <th className="py-3 px-4 text-right">{t('colActual')}</th>
                    <th className="py-3 px-4 text-right">{t('savings')}</th>
                    <th className="py-3 px-4 text-right">{t('colDifference')}</th>
                    <th className="py-3 px-4 text-center">{t('statusBeban')}</th>
                    <th className="py-3 px-4 text-center">{t('colAction')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {data.monthlyTrends.map((trend) => (
                    <tr
                      key={trend.name}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {formatSheetMonth(trend.name)}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums text-slate-600 dark:text-slate-300 text-xs">
                        {trend.income ? formatRupiah(trend.income) : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums font-medium text-slate-600 dark:text-slate-300">
                        {formatRupiah(trend.budget)}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums font-bold text-slate-900 dark:text-white">
                        {formatRupiah(trend.aktual)}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                        {trend.savings ? formatRupiah(trend.savings) : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums text-xs">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold ${
                            trend.isSurplus
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800'
                              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800'
                          }`}
                        >
                          {trend.isSurplus ? '+' : ''}
                          {formatRupiah(trend.selisih)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-xs font-semibold ${
                            trend.isSurplus
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {trend.isSurplus ? t('surplusBadge') : t('deficitBadge')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Link
                          href={`/bulan/${encodeURIComponent(trend.name)}`}
                          prefetch={false}
                          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          {t('viewDetails')}
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

      {showGenerateModal && (
        <GenerateModal onClose={() => setShowGenerateModal(false)} />
      )}
    </div>
  );
}
