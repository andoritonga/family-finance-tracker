'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export function GenerateModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [targetMonth, setTargetMonth] = useState<number>(new Date().getMonth() + 2 > 12 ? 1 : new Date().getMonth() + 2);
  const [targetYear, setTargetYear] = useState<number>(new Date().getMonth() + 2 > 12 ? new Date().getFullYear() + 1 : new Date().getFullYear());

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          targetMonth,
          targetYear
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate month');
      }
      
      router.push(`/bulan/${encodeURIComponent(data.sheet.name)}`);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Generate Bulan Baru</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Bulan Target</label>
            <div className="flex gap-2">
              <select 
                className="flex-1 rounded-lg border border-slate-300 p-2 text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                value={targetMonth}
                onChange={(e) => setTargetMonth(Number(e.target.value))}
              >
                {months.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <select
                className="w-24 rounded-lg border border-slate-300 p-2 text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                value={targetYear}
                onChange={(e) => setTargetYear(Number(e.target.value))}
              >
                {[...Array(5)].map((_, i) => {
                  const y = new Date().getFullYear() - 1 + i;
                  return <option key={y} value={y}>{y}</option>;
                })}
              </select>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
            disabled={loading}
          >
            Batal
          </button>
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-70"
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
}
