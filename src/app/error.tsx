'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error Boundary caught an error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-8 text-center shadow-lg space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center text-2xl font-bold">
          ⚠️
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Terjadi Kesalahan
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {error.message || 'Halaman mengalami kendala saat memuat data.'}
        </p>
        {error.digest && (
          <p className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-900 py-1 px-2 rounded-lg">
            Digest: {error.digest}
          </p>
        )}
        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Coba Lagi
          </button>
          <Link
            href="/"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
