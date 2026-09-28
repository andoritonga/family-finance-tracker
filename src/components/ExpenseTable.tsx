'use client';

import React, { useState } from 'react';
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
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async (item: ExpenseItem, newAktual?: number | null, newChecklist?: boolean) => {
    setUpdating(true);
    try {
      // rowIndex is 0-based index of the item in the list
      const rowIndex = items.findIndex(i => i.no === item.no);
      const res = await fetch(`/api/sheets/${encodeURIComponent(sheetName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          rowIndex,
          aktual: newAktual !== undefined ? newAktual : item.aktual,
          checklist: newChecklist !== undefined ? newChecklist : item.checklist
        })
      });
      if (res.ok) {
        onUpdate();
      }
    } catch (e) {
      console.error('Update failed', e);
    } finally {
      setUpdating(false);
      setEditingId(null);
    }
  };

  const handleAktualClick = (item: ExpenseItem) => {
    setEditingId(item.no);
    setEditValue(item.aktual ? item.aktual.toString() : '0');
  };

  const handleAktualBlur = (item: ExpenseItem) => {
    const val = parseInt(editValue.replace(/[^0-9-]/g, ''), 10) || 0;
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

  return (
    <div className="overflow-x-auto rounded-xl shadow-sm border border-slate-200 bg-white">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs">
          <tr>
            <th className="px-4 py-3">No</th>
            <th className="px-4 py-3">Pengeluaran</th>
            <th className="px-4 py-3 text-right">Budget</th>
            <th className="px-4 py-3 text-right">Aktual</th>
            <th className="px-4 py-3 text-right">Selisih</th>
            <th className="px-4 py-3">Posisi</th>
            <th className="px-4 py-3">Keterangan</th>
            <th className="px-4 py-3 text-center">Check</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => (
            <tr 
              key={item.no} 
              className={`hover:bg-slate-50 transition-colors ${item.checklist ? 'bg-emerald-50' : 'bg-white'}`}
            >
              <td className="px-4 py-3 text-slate-500">{item.no}</td>
              <td className="px-4 py-3 font-medium text-slate-800">{item.pengeluaran}</td>
              <td className="px-4 py-3 text-right text-slate-600">{formatRupiah(item.budget)}</td>
              
              <td className="px-4 py-3 text-right cursor-pointer group" onClick={() => editingId !== item.no && handleAktualClick(item)}>
                {editingId === item.no ? (
                  <input
                    type="text"
                    autoFocus
                    className="w-24 px-2 py-1 text-right border-2 border-indigo-400 rounded outline-none"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleAktualBlur(item)}
                    onKeyDown={(e) => handleAktualKeyDown(e, item)}
                    disabled={updating}
                  />
                ) : (
                  <div className="flex justify-end items-center gap-2">
                    <span className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">✎</span>
                    <span className="font-medium text-indigo-700">{formatRupiah(item.aktual || 0)}</span>
                  </div>
                )}
              </td>
              
              <td className={`px-4 py-3 text-right font-medium ${(item.selisih || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatRupiah(item.selisih || 0)}
              </td>
              <td className="px-4 py-3 text-slate-600">
                <span className="bg-slate-100 px-2 py-1 rounded text-xs">{item.posisi}</span>
              </td>
              <td className="px-4 py-3 text-slate-600">{item.keterangan}</td>
              <td className="px-4 py-3 text-center">
                <input
                  type="checkbox"
                  checked={item.checklist}
                  onChange={() => toggleChecklist(item)}
                  disabled={updating}
                  className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
