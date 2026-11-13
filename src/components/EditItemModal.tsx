'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader2, Pencil, Save, Trash2, X } from 'lucide-react';
import { ExpenseItem } from '@/lib/types';
import { formatRupiah, parseRupiah } from '@/lib/format';
import { useLanguage } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

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
  const { showToast } = useToast();
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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, isDeleting, onClose]);

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
          sheetRow: item.sheetRow,
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

      showToast({
        type: 'success',
        message:
          language === 'id'
            ? `"${pengeluaran.trim()}" diperbarui`
            : `"${pengeluaran.trim()}" updated`,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    const deletedSnapshot = {
      pengeluaran: item.pengeluaran,
      budget: item.budget,
      aktual: item.aktual,
      posisi: item.posisi || 'Cash',
      keterangan: item.keterangan || '',
    };

    try {
      const res = await fetch(`/api/sheets/${encodeURIComponent(sheetName)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIndex, sheetRow: item.sheetRow }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.details || (language === 'id' ? 'Gagal menghapus item.' : 'Failed to delete item.'));
      }

      showToast({
        type: 'info',
        message:
          language === 'id'
            ? `"${deletedSnapshot.pengeluaran}" dihapus`
            : `"${deletedSnapshot.pengeluaran}" deleted`,
        actionLabel: language === 'id' ? 'Urungkan' : 'Undo',
        onAction: async () => {
          try {
            const restoreRes = await fetch(`/api/sheets/${encodeURIComponent(sheetName)}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(deletedSnapshot),
            });
            if (!restoreRes.ok) {
              throw new Error('Failed to restore');
            }
            showToast({
              type: 'success',
              message:
                language === 'id'
                  ? `"${deletedSnapshot.pengeluaran}" dikembalikan`
                  : `"${deletedSnapshot.pengeluaran}" restored`,
            });
            onSuccess();
          } catch {
            showToast({
              type: 'error',
              message:
                language === 'id'
                  ? 'Gagal mengembalikan item.'
                  : 'Failed to restore item.',
            });
          }
        },
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading && !isDeleting) onClose();
      }}
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-fadeIn"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-item-modal-title"
        className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-xl border border-slate-200 dark:border-slate-800 max-h-[92vh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))] animate-slideUp sm:animate-fadeIn"
      >
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden" />
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/60 flex items-center justify-center shrink-0">
              <Pencil className="w-4 h-4" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h2 id="edit-item-modal-title" className="text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
                {t('editItemTitle')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Item No. {item.no} — {formatSheetMonth(sheetName)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading || isDeleting}
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

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            {confirmDelete ? (
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60">
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 truncate">
                  {language === 'id' ? 'Hapus item ini?' : 'Delete this item?'}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    disabled={isDeleting}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white inline-flex items-center gap-1.5 disabled:opacity-60 transition-colors"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                    )}
                    <span>{isDeleting ? t('deleting') : t('delete')}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  disabled={loading || isDeleting}
                  className="px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors font-semibold text-xs inline-flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                  <span>{t('delete')}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors font-semibold text-xs"
                    disabled={loading || isDeleting}
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={loading || isDeleting}
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
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
