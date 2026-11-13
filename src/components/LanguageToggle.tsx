'use client';

import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="relative h-9 px-2.5 flex items-center justify-center gap-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all text-xs font-semibold select-none"
      title={language === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
      aria-label="Toggle language"
    >
      <Globe className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" strokeWidth={1.75} />
      <span className="text-[11px] font-semibold tracking-wider">{language === 'id' ? 'ID' : 'EN'}</span>
    </button>
  );
}
