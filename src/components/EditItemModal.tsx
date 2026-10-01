'use client';

import React, { useState } from 'react';
import { ExpenseItem } from '@/lib/types';
import { formatRupiah, parseRupiah } from '@/lib/format';
import { useLanguage } from '@/lib/i18n';

interface EditItemModalProps {
  item: ExpenseItem;
  rowIndex: number;
  sheetName: string;
  existingPositions: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export function EditItemModal({
  item,
  rowIndex,
  sheetName,
  existingPositions,
  onClose,
  onSuccess,
}: EditItemModalProps) {
  const { t, language, formatSheetMonth } = useLanguage();
  const [pengeluaran, setPengeluaran] = useState(item.pengeluaran);
  const [budgetDisplay, setBudgetDisplay] = useState(formatRupiah(item.budget));
  const [aktualDisplay, setAktualDisplay] = useState(
    item.aktual !== null && item.aktual !== undefined ? formatRupiah(item.aktual) : ''
  );
  const [posisi, setPosisi] = useState(item.posisi || 'Cash');
  const [isCustomPosisi, setIsCustomPosisi] = useState(
    !existingPositions.includes(item.posisi) && Boolean(item.posisi)
  );
  const [customPosisi, setCustomPosisi] = useState(item.posisi || '');
  const [keterangan, setKeterangan] = useState(item.keterangan || '');
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const handleAktualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    if (!raw) {
      setAktualDisplay('');
      return;
    }
    const num = parseInt(raw, 10);
    setAktualDisplay(formatRupiah(num));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pengeluaran.trim()) {
      setError('Nama pengeluaran tidak boleh kosong.');
      return;
    }

    const budgetNum = parseRupiah(budgetDisplay);
    const aktualNum = aktualDisplay ? parseRupiah(aktualDisplay) : null;
    const finalPosisi = isCustomPosisi ? customPosisi.trim() : posisi.trim();

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/sheets/${encodeURIComponent(sheetName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rowIndex,
          pengeluaran: pengeluaran.trim(),
          budget: budgetNum,
          aktual: aktualNum,
          posisi: finalPosisi,
          keterangan: keterangan.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.details || 'Gagal memperbarui item.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(language === 'id' ? `Yakin ingin menghapus item "${item.pengeluaran}"?` : `Are you sure you want to delete "${item.pengeluaran}"?`)) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/sheets/${encodeURIComponent(sheetName)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIndex }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.details || (language === 'id' ? 'Gagal menghapus item.' : 'Failed to delete item.'));
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-t-[2rem] sm:rounded-3xl p-5 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-700/80 max-h-[92vh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))] animate-slideUp sm:animate-fadeIn">
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mb-4 sm:hidden" />
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg">
              ✏️
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {t('editItemTitle')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Item No. {item.no} — {formatSheetMonth(sheetName)}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nama Pengeluaran */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              {t('expenseName')} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={pengeluaran}
              onChange={(e) => setPengeluaran(e.target.value)}
              placeholder={t('expenseNamePlaceholder')}
              className="w-full text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          {/* Grid: Anggaran & Aktual */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                {t('colBudget')} <span className="text-rose-500">*</span>
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

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                {t('colActual')}
              </label>
              <input
                type="text"
                value={aktualDisplay}
                onChange={handleAktualChange}
                placeholder={language === 'id' ? 'Rp 0 (opsional)' : 'Rp 0 (optional)'}
                className="w-full text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none tabular-nums transition-all"
              />
            </div>
          </div>

          {/* Posisi / Rekening */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t('accountPosition')}
              </label>
              <button
                type="button"
                onClick={() => setIsCustomPosisi(!isCustomPosisi)}
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {isCustomPosisi ? (language === 'id' ? 'Pilih Rekening Ada' : 'Choose Existing') : t('newAccountOption')}
              </button>
            </div>

            {isCustomPosisi ? (
              <input
                type="text"
                value={customPosisi}
                onChange={(e) => setCustomPosisi(e.target.value)}
                placeholder={t('newAccountPlaceholder')}
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
                {!existingPositions.includes(posisi) && Boolean(posisi) && (
                  <option value={posisi}>{posisi}</option>
                )}
              </select>
            )}
          </div>

          {/* Catatan / Keterangan */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              {t('notes')}
            </label>
            <input
              type="text"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder={t('notesPlaceholder')}
              className="w-full text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading || isDeleting}
              className="px-3.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors font-semibold text-xs flex items-center gap-1.5"
            >
              <span>🗑️</span>
              <span>{isDeleting ? t('deleting') : t('delete')}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors font-semibold text-xs"
                disabled={loading || isDeleting}
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={loading || isDeleting}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl transition-all font-semibold text-xs flex items-center gap-1.5 shadow-sm shadow-indigo-200 dark:shadow-none disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="animate-spin text-sm">🔄</span>
                    <span>{t('saving')}</span>
                  </>
                ) : (
                  <>
                    <span>💾</span>
                    <span>{t('save')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
