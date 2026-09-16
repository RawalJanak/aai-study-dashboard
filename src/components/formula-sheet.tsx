"use client";

/**
 * Formula Sheet.
 *
 * A single tabulated reference across every subject - Physics/Maths formulas,
 * Quant/Reasoning shortcuts, English grammar rules, Business Management
 * definitions, aviation-fact distinctions. Source is AAI/FORMULA_SHEET.md,
 * grouped by its own '##' headings (not the concept-mastery pipeline - this
 * sheet has no status, it's a flat lookup table meant to be skimmed before an
 * exam, not tracked for progress).
 */

import { useMemo, useState } from "react";
import { Card, Empty, Stat } from "@/components/ui-kit";
import { cn } from "@/lib/utils";
import data from "@/data.json";

type Formula = (typeof data.formulas)[number];

export function FormulaSheet() {
  const all: Formula[] = data.formulas;
  const [group, setGroup] = useState<string>("All");

  const byGroup = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of all) m.set(f.group, (m.get(f.group) ?? 0) + 1);
    return [...m.entries()].map(([g, n]) => ({ g, n }));
  }, [all]);

  const groups = useMemo(() => ["All", ...byGroup.map((x) => x.g)], [byGroup]);
  const shown = group === "All" ? all : all.filter((f) => f.group === group);

  if (!all.length) {
    return (
      <Empty
        msg="No formulas logged yet."
        hint="Add tables to AAI/FORMULA_SHEET.md, then run python build.py."
      />
    );
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="formulas & rules logged" value={all.length} />
        <Stat label="subject groups" value={byGroup.length} />
      </div>

      <div className="flex flex-wrap gap-2">
        {groups.map((g) => {
          const n = g === "All" ? all.length : byGroup.find((x) => x.g === g)?.n ?? 0;
          return (
            <button
              key={g}
              type="button"
              onClick={() => setGroup(g)}
              aria-pressed={group === g}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                group === g
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {g}
              <span className="ml-1.5 tabular-nums opacity-60">{n}</span>
            </button>
          );
        })}
      </div>

      <Card
        title={group === "All" ? "All formulas & rules" : group}
        sub="Formula/rule on the left, what each symbol means in the middle, the trap or exception on the right."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-border text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                <th className="py-2 pr-4 align-bottom">Formula / Rule</th>
                <th className="py-2 pr-4 align-bottom">Meaning</th>
                <th className="py-2 pr-4 align-bottom">Trap / Notes</th>
                {group === "All" ? (
                  <th className="py-2 align-bottom">Topic</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {shown.map((f, i) => (
                <tr
                  key={`${f.group}-${i}`}
                  className="border-b border-border/60 align-top last:border-0"
                >
                  <td className="py-2.5 pr-4 font-mono text-[12.5px] font-medium">
                    {f.formula}
                  </td>
                  <td className="py-2.5 pr-4 text-muted-foreground">
                    {f.meaning || <span className="opacity-40">—</span>}
                  </td>
                  <td className="py-2.5 pr-4 text-muted-foreground">
                    {f.notes || <span className="opacity-40">—</span>}
                  </td>
                  {group === "All" ? (
                    <td className="py-2.5 whitespace-nowrap text-[11px] text-muted-foreground/70">
                      {f.group}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground/70">
          Source of truth is{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
            AAI/FORMULA_SHEET.md
          </code>
          . Edit there, then run{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
            python build.py
          </code>
          .
        </p>
      </Card>
    </div>
  );
}
