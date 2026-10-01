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
    <header className="sticky top-0 z-30 -mx-3.5 px-3.5 py-3 mb-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800/80 sm:relative sm:top-auto sm:mx-0 sm:px-0 sm:py-0 sm:bg-transparent sm:dark:bg-transparent sm:backdrop-blur-none sm:border-b sm:border-slate-200/80 sm:dark:border-slate-800 sm:pb-6 transition-all">
      <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Brand & Desktop Tabs */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group active:scale-95 transition-transform">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-black text-lg sm:text-xl shadow-sm shadow-indigo-200 dark:shadow-none group-hover:scale-105 transition-transform shrink-0">
              📊
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  APBK Finansial
                </span>
                <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
                  Live Sync
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                Pencatatan & Analisis Keuangan Keluarga
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Tabs (Hidden on mobile, handled by BottomNav) */}
          <nav className="hidden md:inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-xs font-semibold">
            <Link
              href="/"
              prefetch={false}
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
              prefetch={false}
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
        <div className="flex items-center gap-2 sm:gap-2.5">
          <ThemeToggle />

          {onOpenGenerateModal && (
            <button
              onClick={onOpenGenerateModal}
              className="hidden sm:inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm shadow-indigo-200 dark:shadow-none"
            >
              <span>✨</span>
              <span>Generate Bulan Baru</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
