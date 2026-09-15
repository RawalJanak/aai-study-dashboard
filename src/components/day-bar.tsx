"use client";

import type { Day } from "@/lib/day-types";

const PHASE_VAR: Record<string, string> = {
  "Part-A General": "--phase-general",
  Physics: "--phase-physics",
  Maths: "--phase-maths",
  Aviation: "--phase-aviation",
  "Business Mgmt": "--phase-mgmt",
  "Consolidation/Mock": "--phase-mock",
};

export function DayBar({ days }: { days: Day[] }) {
  const total = days.length;
  const current = days.find((d) => d.status !== "done")?.number ?? total;
  const doneCount = days.filter((d) => d.status === "done").length;

  return (
    <div className="mt-1">
      <div className="mb-2 flex justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>Day {current}</span>
        <span>of {total}</span>
      </div>
      <div className="relative flex h-[300px] flex-col-reverse gap-[2px]">
        {days.map((d) => (
          <i
            key={d.number}
            className="flex-1 rounded-sm"
            style={{
              background: `var(${PHASE_VAR[d.phase] ?? "--brand"})`,
              opacity: d.status === "done" ? 1 : 0.3,
              outline:
                d.number === current ? "2px solid var(--foreground)" : "none",
              outlineOffset: 1,
            }}
            title={`Day ${d.number}: ${d.title}`}
          />
        ))}
        <span
          className="pointer-events-none absolute left-full ml-1.5 -rotate-3 whitespace-nowrap font-mono text-[10px] text-[var(--brand)]"
          style={{ bottom: `${(100 * (total - current)) / total}%` }}
        >
          ← you are here
        </span>
      </div>
      <p className="mt-2 font-mono text-[10px] text-muted-foreground">
        {doneCount} of {total} done
      </p>
    </div>
  );
}
