'use client';

import React, { useEffect, useRef, useState } from 'react';
import { formatRupiah } from '@/lib/format';

interface AnimatedNumberProps {
  value: number;
  formatter?: (val: number) => string;
  durationMs?: number;
  className?: string;
}

export function AnimatedNumber({
  value,
  formatter = formatRupiah,
  durationMs = 480,
  className,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const prevValueRef = useRef<number>(0);
  const hasMountedRef = useRef<boolean>(false);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      prevValueRef.current = value;
      setDisplayValue(value);
      return;
    }

    const startValue = hasMountedRef.current ? prevValueRef.current : 0;
    hasMountedRef.current = true;
    const endValue = value;

    if (startValue === endValue) {
      setDisplayValue(endValue);
      return;
    }

    let rafId = 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (endValue - startValue) * eased);
      setDisplayValue(current);

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        prevValueRef.current = endValue;
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      prevValueRef.current = endValue;
    };
  }, [value, durationMs]);

  return <span className={className}>{formatter(displayValue)}</span>;
}
