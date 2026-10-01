'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n';

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="relative h-9 px-2.5 flex items-center justify-center gap-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 active:scale-95 transition-all shadow-xs text-xs font-bold select-none"
      title={language === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
      aria-label="Toggle language"
    >
      <span className="text-sm leading-none">{language === 'id' ? '🇮🇩' : '🇬🇧'}</span>
      <span className="text-[11px] font-bold tracking-wider">{language === 'id' ? 'ID' : 'EN'}</span>
    </button>
  );
}
