'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader2, Plus, Save, X } from 'lucide-react';
import { formatRupiah, parseRupiah } from '@/lib/format';
import { useLanguage } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

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
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [pengeluaran, setPengeluaran] = useState('');
  const [budgetDisplay, setBudgetDisplay] = useState('');
  const [posisi, setPosisi] = useState(existingPositions[0] || 'Cash');
  const [isCustomPosisi, setIsCustomPosisi] = useState(false);
  const [customPosisi, setCustomPosisi] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, onClose]);

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

      showToast({
        type: 'success',
        message:
          language === 'id'
            ? `"${pengeluaran.trim()}" ditambahkan`
            : `"${pengeluaran.trim()}" added`,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-fadeIn"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-item-modal-title"
        className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-xl border border-slate-200 dark:border-slate-800 max-h-[92vh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))] animate-slideUp sm:animate-fadeIn"
      >
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden" />
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center shrink-0">
              <Plus className="w-5 h-5" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h2 id="add-item-modal-title" className="text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
                {t('addItemTitle')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {t('addItemDesc')} {sheetName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label={t('cancel')}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        {error && (
          <div role="alert" className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-medium flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
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
              autoFocus
              value={pengeluaran}
              onChange={(e) => setPengeluaran(e.target.value)}
              placeholder={t('expenseNamePlaceholder')}
              className="w-full text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          {/* Anggaran */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              {t('budgetAmount')} <span className="text-rose-500">*</span>
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
                {existingPositions.length === 0 && <option value="Cash">Cash</option>}
              </select>
            )}
          </div>

          {/* Catatan / Keterangan */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              {t('notes')} <span className="text-slate-400 font-normal">({language === 'id' ? 'opsional' : 'optional'})</span>
            </label>
            <input
              type="text"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder={t('notesPlaceholder')}
              className="w-full text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors font-semibold text-xs"
              disabled={loading}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-xl transition-all font-semibold text-xs inline-flex items-center gap-1.5 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
                  <span>{t('saving')}</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" strokeWidth={2} />
                  <span>{t('save')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
