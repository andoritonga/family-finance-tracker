'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export function GenerateModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentMonthIdx = new Date().getMonth(); // 0-based
  const [targetMonth, setTargetMonth] = useState<number>(
    currentMonthIdx + 2 > 12 ? 1 : currentMonthIdx + 2
  );
  const [targetYear, setTargetYear] = useState<number>(
    currentMonthIdx + 2 > 12 ? new Date().getFullYear() + 1 : new Date().getFullYear()
  );

  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetMonth,
          targetYear,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.details || 'Gagal membuat lembar baru');
      }

      router.push(`/bulan/${encodeURIComponent(data.sheet.name)}`);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
            ✨
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Generate Bulan Baru
            </h2>
            <p className="text-xs text-slate-500">
              Salin pos anggaran dari bulan sebelumnya otomatis
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200/80 text-rose-700 rounded-2xl text-xs font-medium flex items-start gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 space-y-3 mb-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Pilih Periode Target
            </label>
            <div className="grid grid-cols-3 gap-2">
              <select
                className="col-span-2 text-sm font-semibold rounded-xl border border-slate-200 bg-white p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer"
                value={targetMonth}
                onChange={(e) => setTargetMonth(Number(e.target.value))}
              >
                {months.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                className="col-span-1 text-sm font-semibold rounded-xl border border-slate-200 bg-white p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer"
                value={targetYear}
                onChange={(e) => setTargetYear(Number(e.target.value))}
              >
                {[...Array(5)].map((_, i) => {
                  const y = new Date().getFullYear() - 1 + i;
                  return (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 space-y-1">
            <p className="flex items-center gap-1.5">
              <span className="text-emerald-500">✓</span> Menghasilkan tab baru di Google Sheets
            </p>
            <p className="flex items-center gap-1.5">
              <span className="text-emerald-500">✓</span> Nilai Aktual dikosongkan & checklist direset
            </p>
            <p className="flex items-center gap-1.5">
              <span className="text-emerald-500">✓</span> Formula Selisih & Rekening otomatis terpasang
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-semibold text-xs"
            disabled={loading}
          >
            Batal
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl transition-all font-semibold text-xs flex items-center gap-2 shadow-sm shadow-indigo-200 disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="animate-spin text-sm">🔄</span>
                <span>Membuat Lembar...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>Generate Sekarang</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
