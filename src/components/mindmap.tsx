"use client";

/**
 * Study mind map.
 *
 * Hub-and-spoke view of the AAI syllabus, mirroring the structure of the
 * hand-built Obsidian canvas (AAI/wiki/canvases/main.canvas) so the two read
 * as the same map. Every percentage here is computed fresh in build.py from
 * the same source markdown the rest of the dashboard reads - never hand-typed
 * - so it moves the moment STUDY_PROGRESS.md / GK_CURRICULUM.md / the error
 * book change, no separate maintenance step.
 *
 * Connector lines are measured DOM positions (hub center -> each branch top),
 * redrawn on resize/content-change so the layout stays a plain responsive
 * card grid - no manual x/y coordinates to keep in sync.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Empty } from "@/components/ui-kit";
import data from "@/data.json";

type Mindmap = typeof data.mindmap;
type Branch = Mindmap["branches"][number] | Mindmap["errorBranch"];
type Child = Branch["children"][number];

const BRANCH_COLOR: Record<string, string> = {
  general: "var(--chart-3)",
  maths: "var(--chart-1)",
  physics: "var(--chart-4)",
  aviation: "var(--chart-2)",
  business: "var(--chart-5)",
  errors: "var(--critical)",
};

function statusWord(pct: number | null) {
  if (pct === null) return "";
  if (pct >= 80) return "Solid";
  if (pct >= 60) return "Learning";
  if (pct > 0) return "Weak";
  return "Not started";
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

function ChildRow({ c }: { c: Child }) {
  const pct = c.pct ?? 0;
  return (
    <li className="grid gap-1 rounded-lg bg-muted/40 px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[12.5px] font-medium leading-snug">{c.label}</span>
        {c.pct !== null ? (
          <span className="shrink-0 tabular-nums text-[11px] font-semibold text-muted-foreground">
            {pct}%
          </span>
        ) : null}
      </div>
      {c.sub ? (
        <p className="text-[11.5px] leading-snug text-muted-foreground/85">{c.sub}</p>
      ) : null}
      {c.pct !== null ? (
        <>
          <ProgressBar pct={pct} color="var(--foreground)" />
          <span className="text-[10.5px] font-medium text-muted-foreground/70">
            {c.status || statusWord(c.pct)}
          </span>
        </>
      ) : null}
    </li>
  );
}

function BranchCard({
  branch,
  innerRef,
}: {
  branch: Branch;
  innerRef: (el: HTMLDivElement | null) => void;
}) {
  const color = BRANCH_COLOR[branch.color] ?? "var(--chart-1)";
  const [expanded, setExpanded] = useState(false);
  const gk = branch.children.find(
    (c): c is Child & { detail: string[] } => "detail" in c && Array.isArray((c as { detail?: unknown }).detail)
  );

  return (
    <div
      ref={innerRef}
      className="relative min-w-0 rounded-2xl border border-border bg-card p-4"
      style={{ borderTopColor: color, borderTopWidth: 3 }}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-[14px] font-semibold" style={{ color }}>
            {branch.label}
          </h3>
          <p className="text-[11.5px] text-muted-foreground">{branch.sub}</p>
        </div>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-[12px] font-bold tabular-nums"
          style={{ background: `color-mix(in srgb, ${color} 18%, transparent)`, color }}
        >
          {branch.pct}%
        </span>
      </div>
      <ProgressBar pct={branch.pct} color={color} />
      <ul className="mt-3 grid gap-1.5">
        {branch.children.map((c, i) => (
          <ChildRow key={c.label + i} c={c} />
        ))}
      </ul>
      {gk ? (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            {expanded ? "Hide GK categories" : "Show all GK categories"}
          </button>
          {expanded ? (
            <ul className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
              {gk.detail.map((d) => (
                <li
                  key={d}
                  className="truncate rounded-md bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground"
                  title={d}
                >
                  {d}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function Mindmap() {
  const mm = data.mindmap;
  const containerRef = useRef<HTMLDivElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);
  const branchRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [paths, setPaths] = useState<string[]>([]);

  const allBranches: Branch[] = mm ? [...mm.branches, mm.errorBranch] : [];

  const recompute = () => {
    const container = containerRef.current;
    const hub = hubRef.current;
    if (!container || !hub) return;
    const cRect = container.getBoundingClientRect();
    const hRect = hub.getBoundingClientRect();
    const hx = hRect.left + hRect.width / 2 - cRect.left;
    const hy = hRect.bottom - cRect.top;
    const next: string[] = [];
    for (const el of branchRefs.current) {
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const bx = r.left + r.width / 2 - cRect.left;
      const by = r.top - cRect.top;
      const midY = (hy + by) / 2;
      next.push(`M ${hx} ${hy} C ${hx} ${midY}, ${bx} ${midY}, ${bx} ${by}`);
    }
    setPaths(next);
  };

  useLayoutEffect(() => {
    recompute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mm]);

  useEffect(() => {
    const onResize = () => recompute();
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => {
      window.removeEventListener("resize", onResize);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mm) {
    return (
      <Empty
        msg="No mind map data yet."
        hint="Run python build.py after AAI/STUDY_PROGRESS.md or GK_CURRICULUM.md changes."
      />
    );
  }

  return (
    <div className="grid gap-4">
      <div ref={containerRef} className="relative">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden
        >
          {paths.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke="var(--border)"
              strokeWidth={1.5}
            />
          ))}
        </svg>

        <div ref={hubRef} className="relative z-10 mx-auto mb-8 max-w-md">
          <div className="rounded-2xl border-2 border-foreground/70 bg-card p-5 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {mm.hub.subtitle}
            </p>
            <h2 className="text-xl font-bold tracking-tight">{mm.hub.title}</h2>
            <div className="mx-auto mt-3 w-40">
              <div className="mb-1 text-2xl font-bold tabular-nums">
                {mm.hub.overallPct}%
              </div>
              <ProgressBar pct={mm.hub.overallPct} color="var(--foreground)" />
            </div>
            <ul className="mt-4 grid gap-1 text-left text-[12px] leading-relaxed text-muted-foreground">
              {mm.hub.stats.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allBranches.map((b, i) => (
            <BranchCard
              key={b.id}
              branch={b}
              innerRef={(el) => {
                branchRefs.current[i] = el;
              }}
            />
          ))}
        </div>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground/70">
        Computed from{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
          STUDY_PROGRESS.md
        </code>
        ,{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
          GK_CURRICULUM.md
        </code>{" "}
        and{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
          ERROR_BOOK.md
        </code>{" "}
        every time{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
          python build.py
        </code>{" "}
        runs — nothing here is hand-typed.
      </p>
    </div>
  );
}
