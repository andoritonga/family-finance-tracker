'use client';

import React, { useState } from 'react';
import { ExpenseItem, PositionSummary } from '@/lib/types';
import { formatRupiah } from '@/lib/format';

interface ManagePositionsModalProps {
  sheetName: string;
  items: ExpenseItem[];
  summaries: PositionSummary[];
  onClose: () => void;
  onSuccess: () => void;
}

export function ManagePositionsModal({
  sheetName,
  items,
  summaries,
  onClose,
  onSuccess,
}: ManagePositionsModalProps) {
  const [selectedOldPos, setSelectedOldPos] = useState(summaries[0]?.posisi || '');
  const [newPosName, setNewPosName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const affectedItems = items.filter((i) => i.posisi === selectedOldPos);

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPosName.trim()) {
      setError('Masukkan nama rekening baru.');
      return;
    }
    if (newPosName.trim() === selectedOldPos) {
      setError('Nama rekening baru sama dengan rekening lama.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Update each item having this position
      const updatePromises = affectedItems.map((item) => {
        const rowIndex = items.findIndex((i) => i.no === item.no);
        return fetch(`/api/sheets/${encodeURIComponent(sheetName)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rowIndex,
            posisi: newPosName.trim(),
          }),
        });
      });

      await Promise.all(updatePromises);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah rekening.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-700/80">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
              💳
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Kelola Rekening / Posisi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ubah nama rekening secara massal untuk semua item terkait
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold p-1"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-medium flex items-start gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Existing Accounts Overview */}
        <div className="mb-5 space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Daftar Rekening Bulan Ini
          </label>
          <div className="max-h-44 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60 border border-slate-200 dark:border-slate-700 rounded-2xl">
            {summaries.map((pos) => {
              const count = items.filter((i) => i.posisi === pos.posisi).length;
              return (
                <div
                  key={pos.posisi}
                  className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
                >
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {pos.posisi}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 ml-2">
                      ({count} item)
                    </span>
                  </div>
                  <div className="text-right tabular-nums">
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      {formatRupiah(pos.budget)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bulk Rename Tool */}
        <form onSubmit={handleRename} className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-700">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Ganti Nama Rekening Massal
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <select
                value={selectedOldPos}
                onChange={(e) => setSelectedOldPos(e.target.value)}
                className="text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2.5 text-slate-900 dark:text-white outline-none cursor-pointer"
              >
                {summaries.map((pos) => (
                  <option key={pos.posisi} value={pos.posisi}>
                    {pos.posisi}
                  </option>
                ))}
              </select>

              <input
                type="text"
                required
                value={newPosName}
                onChange={(e) => setNewPosName(e.target.value)}
                placeholder="Nama baru..."
                className="text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Akan mengubah {affectedItems.length} item pengeluaran yang menggunakan rekening &quot;{selectedOldPos}&quot;.
            </p>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors font-semibold text-xs"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !newPosName.trim()}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl transition-all font-semibold text-xs flex items-center gap-1.5 shadow-sm shadow-indigo-200 dark:shadow-none disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="animate-spin text-sm">🔄</span>
                  <span>Mengubah...</span>
                </>
              ) : (
                <>
                  <span>Ubah Semua Item</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
