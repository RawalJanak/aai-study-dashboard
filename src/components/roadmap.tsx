"use client";

import { useState } from "react";
import type { Day } from "@/lib/day-types";
import { MASTERY_KEYS, MASTERY_LABEL, passCount } from "@/lib/day-types";
import { StatusPill } from "@/components/ui-kit";
import { cn } from "@/lib/utils";

const PHASE_VAR: Record<string, string> = {
  "Part-A General": "--phase-general",
  Physics: "--phase-physics",
  Maths: "--phase-maths",
  Aviation: "--phase-aviation",
  "Business Mgmt": "--phase-mgmt",
  "Consolidation/Mock": "--phase-mock",
};

const STATUS_LABEL: Record<Day["status"], string> = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Done",
};

export function Roadmap({ days }: { days: Day[] }) {
  // Phase order comes from first appearance in the data, not a hardcoded
  // second copy of PHASE_ORDER - if build.py's ordering ever changes, this
  // follows it instead of silently drifting out of sync.
  const phases: string[] = [];
  for (const d of days) if (!phases.includes(d.phase)) phases.push(d.phase);
  const [openDay, setOpenDay] = useState<number | null>(null);

  return (
    <div className="grid gap-7">
      {phases.map((phase) => {
        const phaseDays = days.filter((d) => d.phase === phase);
        return (
          <div key={phase}>
            <div className="mb-3 flex items-baseline gap-3 pl-1">
              <span
                className="size-2.5 shrink-0 rounded-[3px]"
                style={{ background: `var(${PHASE_VAR[phase] ?? "--brand"})` }}
              />
              <span className="text-xl font-bold tracking-tight">{phase}</span>
              <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                {phaseDays.length} days
              </span>
            </div>
            <div className="grid gap-1.5">
              {phaseDays.map((d) => {
                const open = openDay === d.number;
                return (
                  <div
                    key={d.number}
                    className="rounded-xl border border-border bg-card"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenDay(open ? null : d.number)}
                      aria-expanded={open}
                      className="flex w-full items-center gap-3.5 px-4 py-3 text-left"
                    >
                      <span className="w-6.5 shrink-0 font-mono text-xs text-muted-foreground">
                        {String(d.number).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13.5px] font-semibold">{d.title}</div>
                        <div className="mt-0.5 text-xs leading-snug text-muted-foreground">
                          {d.objective}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-[3px]">
                        {MASTERY_KEYS.map((k) => (
                          <i
                            key={k}
                            className="size-1.5 rounded-full"
                            style={{
                              background:
                                d.mastery[k] === "pass" ? "var(--brand)" : "var(--border)",
                            }}
                          />
                        ))}
                      </div>
                      <StatusPill status={STATUS_LABEL[d.status]} />
                    </button>
                    {open ? (
                      <div className="grid gap-3 border-t border-border px-4 py-3.5 sm:grid-cols-5">
                        {MASTERY_KEYS.map((k) => {
                          const state = d.mastery[k];
                          return (
                            <div
                              key={k}
                              className={cn(
                                "rounded-lg border px-3 py-2",
                                state === "pass"
                                  ? "border-[var(--brand)]/40 bg-[var(--brand)]/10"
                                  : "border-border bg-muted/40"
                              )}
                            >
                              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                                {MASTERY_LABEL[k]}
                              </p>
                              <p
                                className={cn(
                                  "mt-0.5 text-[12.5px] font-semibold",
                                  state === "pass" ? "text-[var(--brand)]" : "text-muted-foreground"
                                )}
                              >
                                {state === "pass" ? "Passed" : state === "fail" ? "Not yet" : "Unrated"}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
