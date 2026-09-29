'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SummaryCards } from '@/components/SummaryCards';
import { GenerateModal } from '@/components/GenerateModal';
import { MonthlySheet } from '@/lib/types';
import { formatRupiah } from '@/lib/format';

interface SheetInfo {
  name: string;
  month: number;
  year: number;
}

export default function Dashboard() {
  const [sheets, setSheets] = useState<SheetInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedMonthName, setSelectedMonthName] = useState<string>('');
  const [currentSheet, setCurrentSheet] = useState<MonthlySheet | null>(null);

  useEffect(() => {
    fetchSheets();
  }, []);

  const fetchSheets = async () => {
    try {
      const res = await fetch('/api/sheets');
      if (res.ok) {
        const data: SheetInfo[] = await res.json();
        setSheets(data);
        if (data.length > 0) {
          const defaultMonth = data[0].name;
          setSelectedMonthName(defaultMonth);
          fetchCurrentSheet(defaultMonth);
        } else {
          setLoading(false);
        }
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const fetchCurrentSheet = async (name: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/sheets/${encodeURIComponent(name)}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentSheet(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setLoadingDetail(false);
    }
  };

  const handleMonthChange = (name: string) => {
    setSelectedMonthName(name);
    fetchCurrentSheet(name);
  };

  const completedItemsCount = currentSheet?.items.filter((i) => i.checklist).length || 0;
  const totalItemsCount = currentSheet?.items.length || 0;

  return (
    <div className="space-y-10">
      {/* Top Navigation / Brand Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-black text-xl shadow-sm shadow-indigo-200">
            📊
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                APBK Finansial
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                ● Live Sync
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pencatatan & Pengelolaan Anggaran Pengeluaran Keluarga
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm shadow-indigo-200"
        >
          <span>✨</span> Generate Bulan Baru
        </button>
      </header>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="h-36 bg-slate-200/70 rounded-2xl animate-pulse" />
            <div className="h-36 bg-slate-200/70 rounded-2xl animate-pulse" />
            <div className="h-36 bg-slate-200/70 rounded-2xl animate-pulse" />
          </div>
          <div className="h-64 bg-slate-200/70 rounded-2xl animate-pulse" />
        </div>
      ) : (
        <>
          {/* Active Month Showcase */}
          {currentSheet && (
            <section className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
              {/* Month Header & Quick Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                      Ringkasan Bulanan
                    </span>
                    {loadingDetail && (
                      <span className="text-xs text-slate-400 animate-pulse">Memuat...</span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
                    {currentSheet.name}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedMonthName}
                    onChange={(e) => handleMonthChange(e.target.value)}
                    className="text-sm font-medium bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    {sheets.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>

                  <Link
                    href={`/bulan/${encodeURIComponent(currentSheet.name)}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                  >
                    Buka Detail <span>→</span>
                  </Link>
                </div>
              </div>

              {/* Summary Cards */}
              <SummaryCards
                totalBudget={currentSheet.totalBudget}
                totalAktual={currentSheet.totalAktual}
                totalSelisih={currentSheet.totalSelisih}
                completedCount={completedItemsCount}
                totalCount={totalItemsCount}
              />

              {/* Breakdown per Posisi / Rekening Preview */}
              {currentSheet.positionSummaries && currentSheet.positionSummaries.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                    Alokasi per Rekening
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {currentSheet.positionSummaries.map((pos) => (
                      <div
                        key={pos.posisi}
                        className="bg-slate-50/70 border border-slate-200/60 rounded-xl p-3 text-center"
                      >
                        <p className="text-xs font-semibold text-slate-600 truncate mb-1">
                          {pos.posisi}
                        </p>
                        <p className="text-sm font-bold text-slate-900 tabular-nums">
                          {formatRupiah(pos.aktual || pos.budget)}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {pos.aktual ? 'Aktual' : 'Budget'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* All Months Grid */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Arsip Lembar Anggaran
                </h2>
                <p className="text-xs text-slate-500">
                  Total {sheets.length} periode tercatat di Google Sheets
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sheets.map((sheet) => {
                const isSelected = sheet.name === selectedMonthName;
                return (
                  <div
                    key={sheet.name}
                    className={`relative group bg-white rounded-2xl p-5 border transition-all duration-200 ${
                      isSelected
                        ? 'border-indigo-500 ring-2 ring-indigo-500/10 shadow-sm'
                        : 'border-slate-200/80 hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        🗓️
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                        {sheet.year}
                      </span>
                    </div>

                    <h3 className="font-bold text-lg text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                      {sheet.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Periode ke-{sheet.month}</p>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => handleMonthChange(sheet.name)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected ? '✓ Terpilih' : 'Lihat Ringkasan'}
                      </button>

                      <Link
                        href={`/bulan/${encodeURIComponent(sheet.name)}`}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                      >
                        Buka Lembar <span>→</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {showModal && (
        <GenerateModal
          onClose={() => {
            setShowModal(false);
            fetchSheets();
          }}
        />
      )}
    </div>
  );
}
