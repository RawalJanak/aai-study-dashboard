"use client";

import { useState } from "react";
import type { Day } from "@/lib/day-types";
import { MASTERY_KEYS, MASTERY_LABEL, passCount } from "@/lib/day-types";
import { cn } from "@/lib/utils";

export function TodayHero({ days }: { days: Day[] }) {
  const [expanded, setExpanded] = useState(false);
  const today = days.find((d) => d.status !== "done") ?? days[days.length - 1];
  const tomorrow = days.find((d) => d.number === today.number + 1);
  const phaseDays = days.filter((d) => d.phase === today.phase);
  const phaseIndex = phaseDays.findIndex((d) => d.number === today.number) + 1;
  const rated = passCount(today.mastery);

  return (
    <div className="relative overflow-hidden rounded-[20px] bg-[#141416] p-10 text-[#f5f5f6]">
      <div className="absolute inset-x-0 top-0 flex h-1 gap-px">
        {days.map((d) => (
          <i
            key={d.number}
            className="flex-1"
            style={{
              background: "var(--brand)",
              opacity: d.number <= today.number ? 1 : 0.35,
            }}
          />
        ))}
      </div>
      <div className="grid gap-7 sm:grid-cols-[1fr_250px] sm:items-start">
        <div>
          <div className="mb-4.5 flex items-center gap-2.5 font-mono text-[11.5px] uppercase tracking-wider text-[#a7a7ad]">
            <span className="font-semibold text-[var(--brand)]">
              Day {today.number} of {days.length}
            </span>
            <span>
              {today.phase} · {phaseIndex} of {phaseDays.length}
            </span>
          </div>
          <h1 className="mb-4 max-w-[620px] text-balance text-[34px] font-extrabold leading-[1.05] tracking-tight sm:text-[40px]">
            {today.title}
          </h1>
          <p className="mb-6 max-w-[560px] text-[15px] leading-relaxed text-[#a7a7ad]">
            {today.objective}
          </p>
          <div className="flex flex-wrap gap-7">
            <Stat label="Learn it" time="15 min" />
            <Stat label="Practice it" time="20 min" />
            <Stat label="Recall and rate" time={`10 min · ${rated} of 5 rated`} />
          </div>
        </div>
        <div className="flex flex-col items-start gap-2.5 sm:items-end sm:text-right">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="rounded-full bg-[#f5f5f6] px-6.5 py-3 text-[14.5px] font-semibold text-[#141416] transition-transform active:scale-[0.97]"
          >
            {expanded ? "Hide detail" : `Continue Day ${today.number}`}
          </button>
          {tomorrow ? (
            <p className="max-w-[200px] font-mono text-[11px] leading-relaxed text-[#a7a7ad]">
              Tomorrow: {tomorrow.title}
            </p>
          ) : null}
        </div>
      </div>

      {expanded ? (
        <div className="mt-7 grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-5">
          {MASTERY_KEYS.map((k) => {
            const state = today.mastery[k];
            return (
              <div
                key={k}
                className={cn(
                  "rounded-xl border px-3.5 py-3",
                  state === "pass"
                    ? "border-[var(--brand)]/50 bg-[var(--brand)]/12"
                    : "border-white/10 bg-white/[0.03]"
                )}
              >
                <p className="font-mono text-[10px] uppercase tracking-wider text-[#a7a7ad]">
                  {MASTERY_LABEL[k]}
                </p>
                <p
                  className={cn(
                    "mt-1 text-[13px] font-semibold",
                    state === "pass" ? "text-[var(--brand)]" : "text-[#a7a7ad]"
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
}

function Stat({ label, time }: { label: string; time: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[13.5px] font-semibold text-[#f5f5f6]">
        <span className="size-1.5 rounded-full bg-[var(--brand)]" />
        {label}
      </div>
      <div className="mt-0.5 font-mono text-[10.5px] uppercase tracking-wider text-[#a7a7ad]">
        {time}
      </div>
    </div>
  );
}
