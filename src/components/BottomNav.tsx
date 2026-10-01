'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/lib/i18n';

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const isDashboard = pathname === '/';
  const isBulan = pathname.startsWith('/bulan');
  const isAnalytics = pathname === '/analytics';

  const handleQuickAction = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('apbk:quick-action'));
    }
  };

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-colors duration-200"
    >
      <div className="max-w-md mx-auto grid grid-cols-4 items-center justify-items-center">
        {/* Tab 1: Dashboard */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center w-full py-1.5 rounded-2xl transition-all active:scale-95 ${
            isDashboard
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <span className="text-xl mb-0.5">🏠</span>
          <span className="text-[10px] tracking-tight">{t('navSummary')}</span>
          {isDashboard && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-0.5" />
          )}
        </Link>

        {/* Tab 2: Bulan Page */}
        <Link
          href={isBulan ? pathname : '/bulan/Oktober%202026'}
          className={`flex flex-col items-center justify-center w-full py-1.5 rounded-2xl transition-all active:scale-95 ${
            isBulan
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <span className="text-xl mb-0.5">📑</span>
          <span className="text-[10px] tracking-tight">{t('navSheets')}</span>
          {isBulan && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-0.5" />
          )}
        </Link>

        {/* Action Button: Center Floating Action */}
        <div className="flex flex-col items-center justify-center w-full py-1">
          <button
            type="button"
            onClick={handleQuickAction}
            className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center text-lg font-bold shadow-md shadow-indigo-300 dark:shadow-indigo-950/60 active:scale-90 transition-transform"
            title={isBulan ? t('addExpense') : t('generateNewMonth')}
            aria-label="Quick Action"
          >
            {isBulan ? '➕' : '✨'}
          </button>
          <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
            {isBulan ? '+' : '✨'}
          </span>
        </div>

        {/* Tab 3: Analytics */}
        <Link
          href="/analytics"
          className={`flex flex-col items-center justify-center w-full py-1.5 rounded-2xl transition-all active:scale-95 ${
            isAnalytics
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <span className="text-xl mb-0.5">📈</span>
          <span className="text-[10px] tracking-tight">{t('navAnalytics')}</span>
          {isAnalytics && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-0.5" />
          )}
        </Link>
      </div>
    </nav>
  );
}
