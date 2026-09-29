'use client';

import React, { useState, useMemo } from 'react';
import { ExpenseItem } from '@/lib/types';
import { formatRupiah } from '@/lib/format';
import { EditItemModal } from '@/components/EditItemModal';

interface ExpenseTableProps {
  items: ExpenseItem[];
  sheetName: string;
  onUpdate: () => void;
  onOpenAddModal?: () => void;
}

export function ExpenseTable({
  items,
  sheetName,
  onUpdate,
  onOpenAddModal,
}: ExpenseTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosisi, setSelectedPosisi] = useState('ALL');
  const [filterChecklist, setFilterChecklist] = useState<'ALL' | 'UNCHECKED' | 'CHECKED'>('ALL');

  const [localItems, setLocalItems] = useState<ExpenseItem[]>(items);

  // Synchronize local items when parent items change
  React.useEffect(() => {
    setLocalItems(items);
  }, [items]);

  // Edit Modal State
  const [activeEditItem, setActiveEditItem] = useState<{
    item: ExpenseItem;
    rowIndex: number;
  } | null>(null);

  // Extract unique positions for filter pills
  const positions = useMemo(() => {
    const list = Array.from(new Set(localItems.map((i) => i.posisi).filter(Boolean)));
    return list.sort();
  }, [localItems]);

  const totalMonthBudget = useMemo(() => {
    return localItems.reduce((sum, i) => sum + (i.budget || 0), 0);
  }, [localItems]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return localItems.filter((item) => {
      const matchSearch =
        item.pengeluaran.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.keterangan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.posisi.toLowerCase().includes(searchQuery.toLowerCase());

      const matchPosisi = selectedPosisi === 'ALL' || item.posisi === selectedPosisi;

      const matchChecklist =
        filterChecklist === 'ALL'
          ? true
          : filterChecklist === 'CHECKED'
          ? item.checklist
          : !item.checklist;

      return matchSearch && matchPosisi && matchChecklist;
    });
  }, [localItems, searchQuery, selectedPosisi, filterChecklist]);

  const handleUpdate = async (
    item: ExpenseItem,
    newAktual?: number | null,
    newChecklist?: boolean
  ) => {
    // 1. Optimistic Update immediately in local state (0ms latency for user)
    const targetAktual = newAktual !== undefined ? newAktual : item.aktual;
    const targetSelisih = targetAktual !== null ? item.budget - targetAktual : item.budget;

    // Auto-checklist rule:
    // When selisih reaches 0 (or targetAktual >= budget), mark checklist as true automatically
    let targetChecklist: boolean;
    if (newChecklist !== undefined) {
      targetChecklist = newChecklist;
    } else if (newAktual !== undefined) {
      if (targetAktual !== null && targetSelisih <= 0) {
        targetChecklist = true;
      } else {
        targetChecklist = item.checklist;
      }
    } else {
      targetChecklist = item.checklist;
    }

    setLocalItems((prev) =>
      prev.map((i) =>
        i.no === item.no
          ? {
              ...i,
              aktual: targetAktual,
              selisih: targetSelisih,
              checklist: targetChecklist,
            }
          : i
      )
    );

    setUpdatingId(item.no);
    setEditingId(null);

    try {
      const rowIndex = items.findIndex((i) => i.no === item.no);
      const payload: Record<string, any> = { rowIndex };
      if (newAktual !== undefined) {
        payload.aktual = newAktual;
      }
      if (newChecklist !== undefined) {
        payload.checklist = newChecklist;
      }

      const res = await fetch(`/api/sheets/${encodeURIComponent(sheetName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onUpdate();
      } else {
        // Rollback on server error
        setLocalItems(items);
      }
    } catch (e) {
      console.error('Update failed', e);
      // Rollback on network failure
      setLocalItems(items);
    } finally {
      setUpdatingId(null);
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

  const openEditModal = (item: ExpenseItem) => {
    const rowIndex = items.findIndex((i) => i.no === item.no);
    setActiveEditItem({ item, rowIndex });
  };

  const getPosisiColor = (pos: string) => {
    const p = (pos || '').toLowerCase();
    if (p.includes('cash') || p.includes('tunai')) {
      return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800';
    }
    if (p.includes('blu')) {
      return 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200/60 dark:border-sky-800';
    }
    if (p.includes('seabank')) {
      return 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200/60 dark:border-orange-800';
    }
    if (p.includes('jago')) {
      return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800';
    }
    if (p.includes('bca') || p.includes('mandiri') || p.includes('bri') || p.includes('bni')) {
      return 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800';
    }
    return 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-700';
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-1">
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
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills & Add Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Posisi Dropdown */}
          <select
            value={selectedPosisi}
            onChange={(e) => setSelectedPosisi(e.target.value)}
            className="text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">Semua Rekening ({items.length})</option>
            {positions.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>

          {/* Checklist Toggle Buttons */}
          <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700/60 text-xs font-medium">
            <button
              onClick={() => setFilterChecklist('ALL')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterChecklist === 'ALL'
                  ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterChecklist('UNCHECKED')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterChecklist === 'UNCHECKED'
                  ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 shadow-sm font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Belum
            </button>
            <button
              onClick={() => setFilterChecklist('CHECKED')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterChecklist === 'CHECKED'
                  ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-sm font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Selesai
            </button>
          </div>

          {/* Add Item Button */}
          {onOpenAddModal && (
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white transition-all shadow-sm shadow-indigo-200 dark:shadow-none"
            >
              <span>➕</span>
              <span>Tambah Item</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden border border-slate-200/80 dark:border-slate-700/80 rounded-2xl bg-white dark:bg-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-700/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
                <th className="py-3.5 px-4 text-center w-12">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <p className="text-base font-medium text-slate-600 dark:text-slate-300">
                      Tidak ada pengeluaran yang cocok
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      Coba sesuaikan filter pencarian atau tambahkan item baru
                    </p>
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
                          ? 'bg-slate-50/60 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                          : 'hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20'
                      }`}
                    >
                      {/* No */}
                      <td className="py-3.5 px-4 text-center text-xs font-mono text-slate-400 dark:text-slate-500">
                        {item.no}
                      </td>

                      {/* Item Name (clickable to edit) */}
                      <td className="py-3.5 px-4">
                        <span
                          onClick={() => openEditModal(item)}
                          className={`font-medium cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${
                            isChecked
                              ? 'text-slate-400 dark:text-slate-500 line-through'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                          title="Klik untuk mengedit item ini"
                        >
                          {item.pengeluaran}
                        </span>
                      </td>

                      {/* Budget (clickable to edit) */}
                      <td
                        onClick={() => openEditModal(item)}
                        className="py-3.5 px-4 text-right tabular-nums cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        title="Klik untuk mengedit anggaran"
                      >
                        <div className="font-medium text-slate-700 dark:text-slate-200">
                          {formatRupiah(item.budget)}
                        </div>
                        {totalMonthBudget > 0 && item.budget > 0 && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                            {((item.budget / totalMonthBudget) * 100).toFixed(1)}% total
                          </div>
                        )}
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
                              className="w-28 text-right font-semibold text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-900 border-2 border-indigo-500 rounded-lg px-2 py-1 text-sm outline-none shadow-sm"
                            />
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-700/60 transition-colors group-hover:ring-1 group-hover:ring-slate-200 dark:group-hover:ring-slate-700">
                            <span
                              className={`font-semibold tabular-nums ${
                                item.aktual !== null && item.aktual !== undefined
                                  ? 'text-slate-900 dark:text-white'
                                  : 'text-slate-300 dark:text-slate-600 italic text-xs'
                              }`}
                            >
                              {item.aktual !== null && item.aktual !== undefined
                                ? formatRupiah(item.aktual)
                                : 'Belum diisi'}
                            </span>
                            <span className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 text-xs transition-colors">
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
                              ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-semibold'
                              : selisih === 0
                              ? 'text-slate-500 dark:text-slate-400'
                              : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold'
                          }`}
                        >
                          {formatRupiah(selisih)}
                        </span>
                      </td>

                      {/* Posisi Badge */}
                      <td className="py-3.5 px-4">
                        {item.posisi ? (
                          <button
                            onClick={() => openEditModal(item)}
                            className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg border hover:opacity-80 transition-opacity ${getPosisiColor(
                              item.posisi
                            )}`}
                            title="Klik untuk ubah rekening"
                          >
                            {item.posisi}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-300 dark:text-slate-600">-</span>
                        )}
                      </td>

                      {/* Keterangan */}
                      <td
                        onClick={() => openEditModal(item)}
                        className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate cursor-pointer hover:text-slate-700 dark:hover:text-slate-200"
                        title={item.keterangan || 'Klik untuk tambah catatan'}
                      >
                        {item.keterangan || (
                          <span className="text-slate-300 dark:text-slate-600 italic">tambah catatan</span>
                        )}
                      </td>

                      {/* Checklist */}
                      <td className="py-3.5 px-4 text-center">
                        <label className="relative inline-flex items-center justify-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.checklist}
                            onChange={() => toggleChecklist(item)}
                            disabled={isBeingUpdated}
                            className="w-5 h-5 rounded-lg border-2 border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500/20 focus:ring-offset-0 transition-all cursor-pointer accent-indigo-600 disabled:opacity-50"
                          />
                        </label>
                      </td>

                      {/* Edit Button */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => openEditModal(item)}
                          className="w-8 h-8 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 dark:hover:text-indigo-400 flex items-center justify-center transition-colors text-sm"
                          title="Edit Pengeluaran"
                        >
                          ✏️
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer info */}
        <div className="bg-slate-50/80 dark:bg-slate-900/40 px-4 py-3 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Menampilkan{' '}
            <strong className="text-slate-700 dark:text-slate-200">
              {filteredItems.length}
            </strong>{' '}
            dari{' '}
            <strong className="text-slate-700 dark:text-slate-200">
              {items.length}
            </strong>{' '}
            pengeluaran
          </span>
          <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">
            💡 Tips: Klik teks pengeluaran atau tombol ✏️ untuk mengedit anggaran & rekening
          </span>
        </div>
      </div>

      {/* Edit Item Modal */}
      {activeEditItem && (
        <EditItemModal
          item={activeEditItem.item}
          rowIndex={activeEditItem.rowIndex}
          sheetName={sheetName}
          existingPositions={positions}
          onClose={() => setActiveEditItem(null)}
          onSuccess={onUpdate}
        />
      )}
    </div>
  );
}
