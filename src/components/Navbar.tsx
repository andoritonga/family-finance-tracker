'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';

interface NavbarProps {
  onOpenGenerateModal?: () => void;
}

export function Navbar({ onOpenGenerateModal }: NavbarProps) {
  const pathname = usePathname();
  const isAnalytics = pathname === '/analytics';
  const isDashboard = pathname === '/' || pathname.startsWith('/bulan');

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800">
      {/* Brand & Tabs */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-black text-xl shadow-sm shadow-indigo-200 dark:shadow-none group-hover:scale-105 transition-transform">
            📊
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                APBK Finansial
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                ● Live Sync
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Pencatatan & Analisis Keuangan Keluarga
            </p>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-xs font-semibold">
          <Link
            href="/"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
              isDashboard
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>📑</span>
            <span>Anggaran Bulanan</span>
          </Link>
          <Link
            href="/analytics"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
              isAnalytics
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>📈</span>
            <span>Analisis Tren</span>
          </Link>
        </nav>
      </div>

      {/* Action Buttons & Theme */}
      <div className="flex items-center gap-2.5">
        <ThemeToggle />

        {onOpenGenerateModal && (
          <button
            onClick={onOpenGenerateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm shadow-indigo-200 dark:shadow-none"
          >
            <span>✨</span>
            <span>Generate Bulan Baru</span>
          </button>
        )}
      </div>
    </header>
  );
}
