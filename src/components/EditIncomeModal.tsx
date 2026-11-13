'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AlertCircle, Lightbulb, Loader2, Save, Wallet, X } from 'lucide-react';
import { formatRupiah, evaluateArithmeticExpression } from '@/lib/format';
import { useLanguage } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

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
  const { t, language, formatSheetMonth } = useLanguage();
  const { showToast } = useToast();
  const [formula, setFormula] = useState('');
  const [account, setAccount] = useState('Blu BCA Saving');
  const [keterangan, setKeterangan] = useState('Pocket Tabungan & Investasi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormula(currentIncomeFormula || (currentIncome ? String(currentIncome) : '19340000'));
      setAccount(currentAccount || 'Blu BCA Saving');
      setKeterangan(currentKeterangan || 'Pocket Tabungan & Investasi');
      setError(null);
    }
  }, [isOpen, currentIncomeFormula, currentIncome, currentAccount, currentKeterangan]);

  // Real-time evaluation of the income formula
  const calculatedIncome = useMemo(() => {
    const val = evaluateArithmeticExpression(formula);
    return val !== null ? val : 0;
  }, [formula]);

  const estimatedSavings = calculatedIncome - totalBudget;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

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

      showToast({
        type: 'success',
        message:
          language === 'id'
            ? 'Pendapatan bulanan diperbarui'
            : 'Monthly income updated',
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-income-modal-title"
        className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-5 animate-slideUp sm:animate-fadeIn max-h-[92vh] overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        {/* Mobile Drag Handle */}
        <div className="sm:hidden flex justify-center -mt-1 -mb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h3 id="edit-income-modal-title" className="text-lg font-bold text-slate-900 dark:text-white truncate">
                {t('editIncomeTitle')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {language === 'id' ? 'Lembar: ' : 'Sheet: '}<span className="font-semibold text-slate-700 dark:text-slate-300">{formatSheetMonth(sheetName)}</span>
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
          <div role="alert" className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Formula / Rincian Pendapatan */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>{t('incomeFormula')}</span>
              <span className="text-[11px] text-slate-400 font-normal">{t('formulaHint')}</span>
            </label>
            <input
              type="text"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="Contoh: 11500000 + 3650000 + 4190000"
              className="w-full px-4 py-2.5 rounded-xl font-mono text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <p className="text-[11px] text-slate-400 inline-flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" strokeWidth={2} />
              <span>{t('formulaExpl')}</span>
            </p>
          </div>

          {/* Live Preview Box */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/60 border border-indigo-100 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">{t('calculatedTotal')}:</span>
              <span className="font-bold text-slate-900 dark:text-white tabular-nums text-sm">
                {formatRupiah(calculatedIncome)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">{t('totalBudgeted')}:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                - {formatRupiah(totalBudget)}
              </span>
            </div>
            <div className="pt-2 border-t border-indigo-100 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                {t('autoSavings')}:
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
                {t('targetAccount')}
              </label>
              <input
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="Contoh: Blu BCA Saving"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t('pocketNote')}
              </label>
              <input
                type="text"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Contoh: Pocket Tabungan & Investasi"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || calculatedIncome <= 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-50 transition-all"
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
