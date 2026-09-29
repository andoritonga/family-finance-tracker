'use client';

import React, { useState } from 'react';
import { formatRupiah, parseRupiah } from '@/lib/format';

interface AddItemModalProps {
  sheetName: string;
  existingPositions: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export function AddItemModal({
  sheetName,
  existingPositions,
  onClose,
  onSuccess,
}: AddItemModalProps) {
  const [pengeluaran, setPengeluaran] = useState('');
  const [budgetDisplay, setBudgetDisplay] = useState('');
  const [posisi, setPosisi] = useState(existingPositions[0] || 'Cash');
  const [isCustomPosisi, setIsCustomPosisi] = useState(false);
  const [customPosisi, setCustomPosisi] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    if (!raw) {
      setBudgetDisplay('');
      return;
    }
    const num = parseInt(raw, 10);
    setBudgetDisplay(formatRupiah(num));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pengeluaran.trim()) {
      setError('Nama pengeluaran tidak boleh kosong.');
      return;
    }

    const budgetNum = parseRupiah(budgetDisplay);
    if (budgetNum <= 0) {
      setError('Masukkan nominal anggaran yang valid.');
      return;
    }

    const finalPosisi = isCustomPosisi ? customPosisi.trim() : posisi.trim();

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/sheets/${encodeURIComponent(sheetName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pengeluaran: pengeluaran.trim(),
          budget: budgetNum,
          posisi: finalPosisi,
          keterangan: keterangan.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.details || 'Gagal menambahkan pos pengeluaran.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-700/80">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
            ➕
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Tambah Pengeluaran
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Menambahkan baris anggaran baru ke lembar {sheetName}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-medium flex items-start gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nama Pengeluaran */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Nama Pengeluaran <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={pengeluaran}
              onChange={(e) => setPengeluaran(e.target.value)}
              placeholder="Contoh: Belanja Pasar, Token Listrik, Service Mobil..."
              className="w-full text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          {/* Anggaran */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Target Anggaran (Budget) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={budgetDisplay}
              onChange={handleBudgetChange}
              placeholder="Rp 0"
              className="w-full text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none tabular-nums transition-all"
            />
          </div>

          {/* Posisi / Rekening */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Posisi Rekening / Dompet
              </label>
              <button
                type="button"
                onClick={() => setIsCustomPosisi(!isCustomPosisi)}
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {isCustomPosisi ? 'Pilih dari Rekening Ada' : '+ Rekening Baru'}
              </button>
            </div>

            {isCustomPosisi ? (
              <input
                type="text"
                value={customPosisi}
                onChange={(e) => setCustomPosisi(e.target.value)}
                placeholder="Nama rekening baru (contoh: Bank Jago, OVO...)"
                className="w-full text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            ) : (
              <select
                value={posisi}
                onChange={(e) => setPosisi(e.target.value)}
                className="w-full text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer transition-all"
              >
                {existingPositions.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
                {existingPositions.length === 0 && <option value="Cash">Cash</option>}
              </select>
            )}
          </div>

          {/* Catatan / Keterangan */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Catatan / Keterangan <span className="text-slate-400 font-normal">(opsional)</span>
            </label>
            <input
              type="text"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Catatan tambahan..."
              className="w-full text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors font-semibold text-xs"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl transition-all font-semibold text-xs flex items-center gap-2 shadow-sm shadow-indigo-200 dark:shadow-none disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="animate-spin text-sm">🔄</span>
                  <span>Menyimpan ke Sheet...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Simpan Pengeluaran</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
