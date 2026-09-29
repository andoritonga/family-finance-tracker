'use client';

import React, { useState, useMemo } from 'react';
import { ExpenseItem } from '@/lib/types';
import { formatRupiah } from '@/lib/format';

interface ExpenseTableProps {
  items: ExpenseItem[];
  sheetName: string;
  onUpdate: () => void;
}

export function ExpenseTable({ items, sheetName, onUpdate }: ExpenseTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosisi, setSelectedPosisi] = useState('ALL');
  const [filterChecklist, setFilterChecklist] = useState<'ALL' | 'UNCHECKED' | 'CHECKED'>('ALL');

  // Extract unique positions for filter pills
  const positions = useMemo(() => {
    const list = Array.from(new Set(items.map((i) => i.posisi).filter(Boolean)));
    return list.sort();
  }, [items]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search
      const matchSearch =
        item.pengeluaran.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.keterangan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.posisi.toLowerCase().includes(searchQuery.toLowerCase());

      // Posisi
      const matchPosisi = selectedPosisi === 'ALL' || item.posisi === selectedPosisi;

      // Checklist
      const matchChecklist =
        filterChecklist === 'ALL'
          ? true
          : filterChecklist === 'CHECKED'
          ? item.checklist
          : !item.checklist;

      return matchSearch && matchPosisi && matchChecklist;
    });
  }, [items, searchQuery, selectedPosisi, filterChecklist]);

  const handleUpdate = async (
    item: ExpenseItem,
    newAktual?: number | null,
    newChecklist?: boolean
  ) => {
    setUpdatingId(item.no);
    try {
      const rowIndex = items.findIndex((i) => i.no === item.no);
      const res = await fetch(`/api/sheets/${encodeURIComponent(sheetName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rowIndex,
          aktual: newAktual !== undefined ? newAktual : item.aktual,
          checklist: newChecklist !== undefined ? newChecklist : item.checklist,
        }),
      });
      if (res.ok) {
        onUpdate();
      }
    } catch (e) {
      console.error('Update failed', e);
    } finally {
      setUpdatingId(null);
      setEditingId(null);
    }
  };

  const handleAktualClick = (item: ExpenseItem) => {
    setEditingId(item.no);
    setEditValue(item.aktual !== null && item.aktual !== undefined ? item.aktual.toString() : '');
  };

  const handleAktualBlur = (item: ExpenseItem) => {
    const cleanNum = editValue.replace(/[^0-9-]/g, '');
    const val = cleanNum !== '' ? parseInt(cleanNum, 10) : null;
    if (val !== item.aktual) {
      handleUpdate(item, val, undefined);
    } else {
      setEditingId(null);
    }
  };

  const handleAktualKeyDown = (e: React.KeyboardEvent, item: ExpenseItem) => {
    if (e.key === 'Enter') {
      handleAktualBlur(item);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  const toggleChecklist = (item: ExpenseItem) => {
    handleUpdate(item, undefined, !item.checklist);
  };

  const getPosisiColor = (pos: string) => {
    const p = (pos || '').toLowerCase();
    if (p.includes('cash') || p.includes('tunai')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
    }
    if (p.includes('blu')) {
      return 'bg-sky-50 text-sky-700 border-sky-200/60';
    }
    if (p.includes('seabank')) {
      return 'bg-orange-50 text-orange-700 border-orange-200/60';
    }
    if (p.includes('jago')) {
      return 'bg-amber-50 text-amber-700 border-amber-200/60';
    }
    if (p.includes('bca') || p.includes('mandiri') || p.includes('bri') || p.includes('bni')) {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200/60';
    }
    return 'bg-slate-50 text-slate-700 border-slate-200/60';
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama pengeluaran, rekening..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Posisi Dropdown */}
          <select
            value={selectedPosisi}
            onChange={(e) => setSelectedPosisi(e.target.value)}
            className="text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="ALL">Semua Rekening ({items.length})</option>
            {positions.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>

          {/* Checklist Toggle Buttons */}
          <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200/60 text-xs font-medium">
            <button
              onClick={() => setFilterChecklist('ALL')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterChecklist === 'ALL'
                  ? 'bg-white text-slate-800 shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterChecklist('UNCHECKED')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterChecklist === 'UNCHECKED'
                  ? 'bg-white text-amber-700 shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Belum
            </button>
            <button
              onClick={() => setFilterChecklist('CHECKED')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterChecklist === 'CHECKED'
                  ? 'bg-white text-emerald-700 shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Selesai
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden border border-slate-200/80 rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Item Pengeluaran</th>
                <th className="py-3.5 px-4 text-right">Anggaran</th>
                <th className="py-3.5 px-4 text-right">
                  <span className="inline-flex items-center gap-1">
                    Aktual <span className="text-[10px] text-slate-400 font-normal">(klik)</span>
                  </span>
                </th>
                <th className="py-3.5 px-4 text-right">Selisih</th>
                <th className="py-3.5 px-4">Rekening / Posisi</th>
                <th className="py-3.5 px-4">Catatan</th>
                <th className="py-3.5 px-4 text-center w-16">Bayar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="text-base font-medium text-slate-600">Tidak ada pengeluaran yang cocok</p>
                    <p className="text-xs text-slate-400 mt-1">Coba sesuaikan filter pencarian Anda</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isChecked = item.checklist;
                  const isBeingEdited = editingId === item.no;
                  const isBeingUpdated = updatingId === item.no;
                  const selisih = item.selisih || 0;
                  const isOverBudget = selisih < 0;

                  return (
                    <tr
                      key={item.no}
                      className={`group transition-colors ${
                        isChecked
                          ? 'bg-slate-50/60 hover:bg-slate-50'
                          : 'hover:bg-indigo-50/30'
                      }`}
                    >
                      {/* No */}
                      <td className="py-3.5 px-4 text-center text-xs font-mono text-slate-400">
                        {item.no}
                      </td>

                      {/* Item Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-medium ${
                              isChecked
                                ? 'text-slate-400 line-through'
                                : 'text-slate-800'
                            }`}
                          >
                            {item.pengeluaran}
                          </span>
                        </div>
                      </td>

                      {/* Budget */}
                      <td className="py-3.5 px-4 text-right font-medium text-slate-600 tabular-nums">
                        {formatRupiah(item.budget)}
                      </td>

                      {/* Aktual (Inline Edit) */}
                      <td
                        className="py-3.5 px-4 text-right cursor-pointer"
                        onClick={() => !isBeingEdited && handleAktualClick(item)}
                      >
                        {isBeingEdited ? (
                          <div className="flex items-center justify-end">
                            <input
                              type="text"
                              autoFocus
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => handleAktualBlur(item)}
                              onKeyDown={(e) => handleAktualKeyDown(e, item)}
                              disabled={isBeingUpdated}
                              placeholder="0"
                              className="w-28 text-right font-semibold text-indigo-700 bg-white border-2 border-indigo-500 rounded-lg px-2 py-1 text-sm outline-none shadow-sm"
                            />
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-100/80 transition-colors group-hover:ring-1 group-hover:ring-slate-200">
                            <span
                              className={`font-semibold tabular-nums ${
                                item.aktual !== null && item.aktual !== undefined
                                  ? 'text-slate-900'
                                  : 'text-slate-300 italic text-xs'
                              }`}
                            >
                              {item.aktual !== null && item.aktual !== undefined
                                ? formatRupiah(item.aktual)
                                : 'Belum diisi'}
                            </span>
                            <span className="text-slate-300 group-hover:text-indigo-500 text-xs transition-colors">
                              ✎
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Selisih */}
                      <td className="py-3.5 px-4 text-right font-medium tabular-nums text-xs">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full ${
                            isOverBudget
                              ? 'bg-rose-50 text-rose-700 font-semibold'
                              : selisih === 0
                              ? 'text-slate-500'
                              : 'bg-emerald-50 text-emerald-700 font-semibold'
                          }`}
                        >
                          {formatRupiah(selisih)}
                        </span>
                      </td>

                      {/* Posisi Badge */}
                      <td className="py-3.5 px-4">
                        {item.posisi ? (
                          <span
                            className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg border ${getPosisiColor(
                              item.posisi
                            )}`}
                          >
                            {item.posisi}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">-</span>
                        )}
                      </td>

                      {/* Keterangan */}
                      <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs truncate">
                        {item.keterangan || <span className="text-slate-300">-</span>}
                      </td>

                      {/* Checklist */}
                      <td className="py-3.5 px-4 text-center">
                        <label className="relative inline-flex items-center justify-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.checklist}
                            onChange={() => toggleChecklist(item)}
                            disabled={isBeingUpdated}
                            className="w-5 h-5 rounded-lg border-2 border-slate-300 text-indigo-600 focus:ring-indigo-500/20 focus:ring-offset-0 transition-all cursor-pointer accent-indigo-600 disabled:opacity-50"
                          />
                        </label>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer info */}
        <div className="bg-slate-50/80 px-4 py-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <span>
            Menampilkan <strong className="text-slate-700">{filteredItems.length}</strong> dari{' '}
            <strong className="text-slate-700">{items.length}</strong> pengeluaran
          </span>
          <span className="text-slate-400 hidden sm:inline">
            💡 Tips: Tekan pada kolom Aktual untuk mengedit nilai
          </span>
        </div>
      </div>
    </div>
  );
}
