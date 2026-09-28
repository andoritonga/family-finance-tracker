'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SummaryCards } from '@/components/SummaryCards';
import { GenerateModal } from '@/components/GenerateModal';
import { MonthlySheet } from '@/lib/types';

interface SheetInfo {
  name: string;
  month: number;
  year: number;
}

export default function Dashboard() {
  const [sheets, setSheets] = useState<SheetInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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
          fetchCurrentSheet(data[0].name);
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
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">APBK Keluarga Micha 💰</h1>
          <p className="text-slate-500 mt-1">Dashboard Anggaran Pengeluaran Belanja Keluarga</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap"
        >
          <span>📅</span> Generate Bulan Baru
        </button>
      </header>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 skeleton"></div>
            <div className="h-32 skeleton"></div>
            <div className="h-32 skeleton"></div>
          </div>
          <div className="h-64 skeleton"></div>
        </div>
      ) : (
        <>
          {currentSheet ? (
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-800">Bulan Ini ({currentSheet.name})</h2>
                <Link 
                  href={`/bulan/${encodeURIComponent(currentSheet.name)}`}
                  className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center gap-1"
                >
                  Lihat Detail <span>→</span>
                </Link>
              </div>
              
              <SummaryCards 
                totalBudget={currentSheet.totalBudget}
                totalAktual={currentSheet.totalAktual}
                totalSelisih={currentSheet.totalSelisih}
              />
              
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm font-medium text-slate-600 mb-1">
                  <span>Progress Pengeluaran</span>
                  <span>{currentSheet.totalBudget > 0 ? ((currentSheet.totalAktual / currentSheet.totalBudget) * 100).toFixed(1) : 0}%</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, currentSheet.totalBudget > 0 ? (currentSheet.totalAktual / currentSheet.totalBudget) * 100 : 0)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-slate-500 mt-2 text-right">
                  {currentSheet.items.filter(i => i.checklist).length} dari {currentSheet.items.length} item selesai
                </div>
              </div>
            </section>
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
              <p className="text-slate-500 mb-4">Belum ada data bulan ini.</p>
            </div>
          )}

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Daftar Bulan</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sheets.map((sheet) => (
                <Link 
                  key={sheet.name} 
                  href={`/bulan/${encodeURIComponent(sheet.name)}`}
                  className="group block bg-white rounded-xl p-5 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg text-slate-800 group-hover:text-indigo-600 transition-colors">{sheet.name}</h3>
                    <span className="text-slate-400 group-hover:text-indigo-400">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
      
      {showModal && <GenerateModal onClose={() => { setShowModal(false); fetchSheets(); }} />}
    </div>
  );
}
