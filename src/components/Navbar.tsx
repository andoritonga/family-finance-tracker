'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet, LayoutGrid, TrendingUp, Plus, RotateCcw } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/lib/i18n';

interface NavbarProps {
  onOpenGenerateModal?: () => void;
}

export function Navbar({ onOpenGenerateModal }: NavbarProps) {
  const pathname = usePathname();
  const { t, language } = useLanguage();
  const isAnalytics = pathname === '/analytics';
  const isDashboard = pathname === '/' || pathname.startsWith('/bulan');
  const [resetting, setResetting] = React.useState(false);

  const handleResetDemo = async () => {
    if (resetting) return;
    const msg =
      language === 'id'
        ? 'Reset data demo ke kondisi awal (6 bulan simulasi)?'
        : 'Reset demo data to initial default state (6 simulated months)?';
    if (!window.confirm(msg)) return;
    setResetting(true);
    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      if (res.ok) {
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setResetting(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 -mx-3.5 px-3.5 py-3 mb-2 bg-[#F8FAFC]/85 dark:bg-[#0B0F17]/85 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800/80 sm:relative sm:top-auto sm:mx-0 sm:px-0 sm:py-0 sm:bg-transparent sm:dark:bg-transparent sm:backdrop-blur-none sm:border-b sm:border-slate-200/70 sm:dark:border-slate-800/80 sm:pb-5 transition-all">
      <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Brand & Desktop Tabs */}
        <div className="flex items-center gap-5 sm:gap-7">
          <Link href="/" className="flex items-center gap-2.5 group active:scale-95 transition-transform">
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4" strokeWidth={1.9} />
            </div>
            <div>
              <span className="text-base sm:text-lg font-semibold tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors block leading-tight">
                {t('appTitle')}
              </span>
              <p className="hidden sm:block text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1">
                {t('appSubtitle')}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Tabs (Hidden on mobile, handled by BottomNav) */}
          <nav className="hidden md:inline-flex rounded-xl p-1 bg-slate-100/90 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-xs font-medium">
            <Link
              href="/"
              prefetch={false}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                isDashboard
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>{t('monthlyBudget')}</span>
            </Link>
            <Link
              href="/analytics"
              prefetch={false}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                isAnalytics
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>{t('trendAnalytics')}</span>
            </Link>
          </nav>
        </div>

        {/* Action Buttons, Language & Theme */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={handleResetDemo}
            disabled={resetting}
            title={
              language === 'id'
                ? 'Reset Data Demo ke Awal (Cloudflare D1 Sandbox)'
                : 'Reset Demo Data to Default (Cloudflare D1 Sandbox)'
            }
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/70 hover:bg-amber-100 dark:hover:bg-amber-900/50 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} strokeWidth={1.75} />
            <span className="hidden lg:inline">
              {resetting
                ? language === 'id'
                  ? 'Mereset...'
                  : 'Resetting...'
                : 'Reset Demo'}
            </span>
          </button>

          <LanguageToggle />
          <ThemeToggle />

          {onOpenGenerateModal && (
            <button
              onClick={onOpenGenerateModal}
              className="hidden sm:inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl font-medium text-xs text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} />
              <span>{t('generateNewMonth')}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
