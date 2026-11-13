'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, CreditCard, Loader2, X } from 'lucide-react';
import { ExpenseItem, PositionSummary } from '@/lib/types';
import { formatRupiah } from '@/lib/format';
import { useLanguage } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

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
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [selectedOldPos, setSelectedOldPos] = useState(summaries[0]?.posisi || '');
  const [newPosName, setNewPosName] = useState('');
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
      const res = await fetch(`/api/sheets/${encodeURIComponent(sheetName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulkRenamePosition',
          oldPosisi: selectedOldPos,
          newPosisi: newPosName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.details || 'Gagal mengubah rekening.');
      }

      showToast({
        type: 'success',
        message:
          language === 'id'
            ? `Rekening "${selectedOldPos}" diubah ke "${newPosName.trim()}"`
            : `Account "${selectedOldPos}" renamed to "${newPosName.trim()}"`,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah rekening.');
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
        aria-labelledby="manage-positions-modal-title"
        className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 max-w-lg w-full shadow-xl border border-slate-200 dark:border-slate-800 animate-slideUp sm:animate-fadeIn max-h-[92vh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        {/* Mobile Drag Handle */}
        <div className="sm:hidden flex justify-center -mt-1 mb-3">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h2 id="manage-positions-modal-title" className="text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
                {t('managePositionsTitle')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {t('managePositionsDesc')}
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

        {/* Existing Accounts Overview */}
        <div className="mb-5 space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t('existingAccounts')}
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
                      ({count} {language === 'id' ? 'item' : count > 1 ? 'items' : 'item'})
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
              {t('bulkRename')}
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
                placeholder={t('renameToPlaceholder')}
                className="text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              {language === 'id'
                ? `Akan mengubah ${affectedItems.length} item pengeluaran yang menggunakan rekening "${selectedOldPos}".`
                : `Will update ${affectedItems.length} expense item(s) using account "${selectedOldPos}".`}
            </p>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2">
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
              disabled={loading || !newPosName.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-xl transition-all font-semibold text-xs inline-flex items-center gap-1.5 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
                  <span>{language === 'id' ? 'Mengubah...' : 'Updating...'}</span>
                </>
              ) : (
                <span>{t('applyRename')}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
