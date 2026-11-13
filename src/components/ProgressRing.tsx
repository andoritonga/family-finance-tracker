'use client';

import React, { useEffect, useState } from 'react';

interface ProgressRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  colorClassName?: string;
  trackClassName?: string;
  label?: string;
}

export function ProgressRing({
  percent,
  size = 44,
  strokeWidth = 4,
  colorClassName = 'text-indigo-600 dark:text-indigo-400',
  trackClassName = 'text-slate-100 dark:text-slate-800',
  label,
}: ProgressRingProps) {
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const clamped = Math.min(100, Math.max(0, percent));

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setAnimatedPercent(clamped);
    });
    return () => cancelAnimationFrame(raf);
  }, [clamped]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPercent / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={trackClassName}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${colorClassName} transition-[stroke-dashoffset] duration-700 ease-out`}
        />
      </svg>
      {label !== undefined && (
        <span className="absolute text-[10px] font-bold tabular-nums text-slate-700 dark:text-slate-200">
          {label}
        </span>
      )}
    </div>
  );
}
