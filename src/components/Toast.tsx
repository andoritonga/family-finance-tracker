'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, RotateCcw, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastOptions {
  message: string;
  type?: ToastType;
  actionLabel?: string;
  onAction?: () => void | Promise<void>;
  durationMs?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
  dismissToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(1);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: number) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (options: ToastOptions) => {
      const id = nextIdRef.current++;
      const duration = options.durationMs ?? (options.onAction ? 5000 : 3200);
      const item: ToastItem = {
        ...options,
        id,
        type: options.type ?? 'info',
      };

      setToasts((prev) => [...prev.slice(-2), item]);

      if (duration > 0) {
        const timer = setTimeout(() => {
          dismissToast(id);
        }, duration);
        timersRef.current.set(id, timer);
      }
    },
    [dismissToast]
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          aria-atomic="true"
          className="fixed bottom-20 sm:bottom-6 right-3.5 left-3.5 sm:left-auto sm:w-full sm:max-w-sm z-[60] flex flex-col gap-2 pointer-events-none"
        >
          {toasts.map((toast) => {
            const Icon =
              toast.type === 'success'
                ? CheckCircle2
                : toast.type === 'error'
                ? AlertCircle
                : Info;
            const iconColor =
              toast.type === 'success'
                ? 'text-emerald-600 dark:text-emerald-400'
                : toast.type === 'error'
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-indigo-600 dark:text-indigo-400';

            return (
              <div
                key={toast.id}
                role="status"
                className="pointer-events-auto flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 animate-slideUp"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} strokeWidth={2} />
                  <span className="truncate">{toast.message}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {toast.onAction && toast.actionLabel && (
                    <button
                      type="button"
                      onClick={() => {
                        const action = toast.onAction;
                        dismissToast(toast.id);
                        action?.();
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-semibold transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" strokeWidth={2} />
                      <span>{toast.actionLabel}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => dismissToast(toast.id)}
                    aria-label="Dismiss notification"
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
