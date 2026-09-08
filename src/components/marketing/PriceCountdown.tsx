'use client';

import React, { useEffect, useState } from 'react';

function msUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

function splitTime(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  return {
    h: Math.floor(totalSec / 3600),
    m: Math.floor((totalSec % 3600) / 60),
    s: totalSec % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

interface PriceCountdownProps {
  variant?: 'banner' | 'compact';
}

export function PriceCountdown({ variant = 'banner' }: PriceCountdownProps) {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    setRemainingMs(msUntilMidnight());
    const id = setInterval(() => setRemainingMs(msUntilMidnight()), 1000);
    return () => clearInterval(id);
  }, []);

  // Avoid SSR/client markup mismatch — render nothing until mounted client-side.
  if (remainingMs === null) return null;

  const { h, m, s } = splitTime(remainingMs);
  const clock = `${pad(h)}:${pad(m)}:${pad(s)}`;

  if (variant === 'compact') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#B45309]">
        <span>⏳</span>
        <span>Bulk price reviewed in</span>
        <span className="mono tracking-wider">{clock}</span>
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mb-6 px-4 py-2.5 rounded-full bg-[#FFF8E8] border border-[#F5A524]/40 text-[#B45309] text-xs font-bold">
      <span>⏳</span>
      <span>Bulk pricing is reviewed daily — may change in</span>
      <span className="mono text-sm tracking-wider">{clock}</span>
    </div>
  );
}
