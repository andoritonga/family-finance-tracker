'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { formatRupiah } from '@/lib/format';

interface EditIncomeModalProps {
  isOpen: boolean;
  sheetName: string;
  currentIncomeFormula?: string;
  currentIncome?: number;
  currentAccount?: string;
  currentKeterangan?: string;
  totalBudget: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditIncomeModal({
  isOpen,
  sheetName,
  currentIncomeFormula,
  currentIncome,
  currentAccount,
  currentKeterangan,
  totalBudget,
  onClose,
  onSuccess,
}: EditIncomeModalProps) {
  const [formula, setFormula] = useState('');
  const [account, setAccount] = useState('Blu Saving Fani');
  const [keterangan, setKeterangan] = useState('Pocket Harta');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormula(currentIncomeFormula || (currentIncome ? String(currentIncome) : '19340000'));
      setAccount(currentAccount || 'Blu Saving Fani');
      setKeterangan(currentKeterangan || 'Pocket Harta');
      setError(null);
    }
  }, [isOpen, currentIncomeFormula, currentIncome, currentAccount, currentKeterangan]);

  // Real-time evaluation of the income formula
  const calculatedIncome = useMemo(() => {
    if (!formula.trim()) return 0;
    const clean = formula.replace(/[^0-9+\-*/.\s]/g, '').trim();
    if (!clean) return 0;
    try {
      // Safe arithmetic evaluator
      // eslint-disable-next-line no-eval
      const res = Function(`'use strict'; return (${clean})`)();
      if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
        return Math.round(res);
      }
    } catch {
      return 0;
    }
    return 0;
  }, [formula]);

  const estimatedSavings = calculatedIncome - totalBudget;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formula.trim()) {
      setError('Formula atau nominal pendapatan tidak boleh kosong');
      return;
    }

    if (calculatedIncome <= 0) {
      setError('Formula pendapatan tidak valid atau menghasilkan 0');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cleanExpr = formula.replace(/[^0-9+\-*/.\s]/g, '').trim();
      const res = await fetch(`/api/sheets/${encodeURIComponent(sheetName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateIncome',
          incomeFormula: cleanExpr,
          income: calculatedIncome,
          targetAccount: account.trim(),
          keterangan: keterangan.trim(),
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Gagal menyimpan perubahan pendapatan');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-slideUp max-h-[92vh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {/* Mobile Drag Handle */}
        <div className="sm:hidden flex justify-center -mt-2 -mb-1">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>💰</span> Atur Pendapatan & Alokasi Tabungan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Lembar: <span className="font-semibold text-slate-700 dark:text-slate-300">{sheetName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Formula / Rincian Pendapatan */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Rincian / Formula Pendapatan Bersama</span>
              <span className="text-[11px] text-slate-400 font-normal">Mendukung penjumlahan (+)</span>
            </label>
            <input
              type="text"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="Contoh: 11500000 + 3650000 + 4190000"
              className="w-full px-4 py-2.5 rounded-xl font-mono text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <p className="text-[11px] text-slate-400">
              💡 Masukkan angka langsung (misal: <code>20000000</code>) atau rincian sumber pendapatan (misal: <code>11500000+3650000+4190000</code>).
            </p>
          </div>

          {/* Live Preview Box */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/60 border border-indigo-100 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">Total Pendapatan Terhitung:</span>
              <span className="font-bold text-slate-900 dark:text-white tabular-nums text-sm">
                {formatRupiah(calculatedIncome)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">Total Anggaran Pengeluaran:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                - {formatRupiah(totalBudget)}
              </span>
            </div>
            <div className="pt-2 border-t border-indigo-100 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                Sisa Otomatis Masuk Tabungan:
              </span>
              <span className={`font-black text-sm tabular-nums ${
                estimatedSavings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {formatRupiah(estimatedSavings)}
              </span>
            </div>
          </div>

          {/* Rekening Tujuan Tabungan & Keterangan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Rekening Tujuan Tabungan
              </label>
              <input
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="Contoh: Blu Saving Fani"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Catatan / Pocket
              </label>
              <input
                type="text"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Contoh: Pocket Harta"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || calculatedIncome <= 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 transition-all shadow-sm shadow-indigo-200 dark:shadow-none"
            >
              {loading ? (
                <>
                  <span className="animate-spin">🔄</span>
                  <span>Menyimpan ke Sheets...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
