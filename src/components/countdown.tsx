"use client";

/**
 * Live countdown to registration close.
 *
 * Ticks every second client-side (setInterval, cleared on unmount). The
 * exam date itself isn't published yet (per AAI/CLAUDE.md) - registration
 * close is the one hard, known deadline, so that's what this counts down
 * to. Server-rendered output is intentionally blank (no Date.now() at
 * build time) to avoid a hydration mismatch; it fills in on mount.
 */

import { useEffect, useState } from "react";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function Countdown({ target }: { target: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (now === null) {
    return (
      <span className="hidden text-xs text-muted-foreground sm:inline">
        Registration closes 7 Sep
      </span>
    );
  }

  const diff = Math.max(0, new Date(target).getTime() - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  const closed = diff <= 0;

  return (
    <div
      className="flex items-center gap-1.5 rounded-full border border-[var(--brand)]/40 bg-[var(--brand)]/10 px-3 py-1.5"
      title="Countdown to AAI registration close"
    >
      <span className="hidden text-[10.5px] font-semibold uppercase tracking-wide text-[var(--brand)] sm:inline">
        {closed ? "Reg closed" : "Reg closes in"}
      </span>
      {!closed ? (
        <span className="font-mono text-[13px] font-bold tabular-nums text-[var(--brand)]">
          {days}d {pad(hours)}:{pad(mins)}:{pad(secs)}
        </span>
      ) : null}
    </div>
  );
}
