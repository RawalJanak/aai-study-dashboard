"use client";

/**
 * Numeric-axis function plotter.
 *
 * bklit's line and area charts all route through time-series-chart-shell,
 * which builds its x-scale with scaleTime and calls .getTime() on the x
 * accessor. There is no numeric-x mode. Plotting y = f(x) over x in [-3, 5]
 * through it would mean encoding x as fake dates and then fighting the date
 * axis and the date tooltip to hide them - a maths axis reading "Jan 1970".
 *
 * So this draws its own axes, and matches bklit's LOOK instead: 2px round-cap
 * curve, ~10-16% gradient wash under the fill, r=4 markers with a 2px surface
 * ring, hairline solid grid, crosshair readout on hover. Colors are the same
 * validated CSS tokens the rest of the dashboard uses.
 */

import { useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type Fn = (x: number) => number;

export interface Curve {
  fn: Fn;
  label: string;
  /** CSS color token. Defaults to the categorical slot for its index. */
  color?: string;
  dashed?: boolean;
}

export interface Band {
  fn: Fn;
  from: number;
  to: number;
  /** Sign of the region - drives the fill, so it can never contradict itself. */
  tone: "positive" | "negative" | "neutral";
  label?: string;
}

export interface Marker {
  x: number;
  y: number;
  label?: string;
  color?: string;
  /** Where the label sits relative to the dot. */
  place?: "above" | "below" | "left" | "right";
}

/** Riemann rectangles - the "slice the area into strips" picture. */
export interface Rects {
  fn: Fn;
  from: number;
  to: number;
  count: number;
  color?: string;
  label?: string;
}

export interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  dashed?: boolean;
}

export interface PlotSpec {
  id: string;
  title: string;
  caption?: string;
  xDomain: [number, number];
  yDomain?: [number, number];
  curves: Curve[];
  bands?: Band[];
  rects?: Rects[];
  markers?: Marker[];
  segments?: Segment[];
  /** Vertical rules, e.g. integration limits. */
  vLines?: { x: number; label?: string; color?: string }[];
  xLabel?: string;
  yLabel?: string;
}

const SLOT = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];
const TONE: Record<Band["tone"], string> = {
  positive: "var(--good)",
  negative: "var(--critical)",
  neutral: "var(--chart-1)",
};

const W = 720;
const H = 392;
const PAD = { top: 18, right: 22, bottom: 54, left: 52 };
const IW = W - PAD.left - PAD.right;
const IH = H - PAD.top - PAD.bottom;
const SAMPLES = 320;

function fmt(v: number) {
  const s = Math.abs(v) < 1e-9 ? "0" : v.toFixed(2);
  return s.replace(/\.?0+$/, "") || "0";
}

/** Clean axis ticks - never raw scale values like 3.7142857. */
function ticks([lo, hi]: [number, number], want = 6): number[] {
  const span = hi - lo;
  if (span <= 0) return [lo];
  const raw = span / want;
  const mag = 10 ** Math.floor(Math.log10(raw));
  let step = mag;
  for (const m of [1, 2, 2.5, 5, 10]) {
    step = mag * m;
    if (step >= raw) break;
  }
  const out: number[] = [];
  for (let t = Math.ceil(lo / step) * step; t <= hi + 1e-9; t += step) {
    out.push(Math.abs(t) < step / 1e6 ? 0 : t);
  }
  return out;
}

/** Samples f across the domain, splitting the path at any non-finite value so
 *  an asymptote never draws a vertical line joining +inf to -inf. */
function samplePath(
  fn: Fn,
  [lo, hi]: [number, number],
  sx: (x: number) => number,
  sy: (y: number) => number,
  yDomain: [number, number]
): string {
  const step = (hi - lo) / SAMPLES;
  let d = "";
  let open = false;
  for (let i = 0; i <= SAMPLES; i++) {
    const x = lo + i * step;
    const y = fn(x);
    // Clamp generously rather than dropping: a curve that leaves the frame
    // should exit through the edge, not vanish a few pixels early.
    const inFrame =
      Number.isFinite(y) &&
      y > yDomain[0] - (yDomain[1] - yDomain[0]) &&
      y < yDomain[1] + (yDomain[1] - yDomain[0]);
    if (!inFrame) {
      open = false;
      continue;
    }
    d += `${open ? "L" : "M"}${sx(x).toFixed(2)},${sy(y).toFixed(2)}`;
    open = true;
  }
  return d;
}

export function FunctionPlot({ spec }: { spec: PlotSpec }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);

  const yDomain = useMemo<[number, number]>(() => {
    if (spec.yDomain) return spec.yDomain;
    // Derive from the curves, then pad by 8% so nothing touches the frame.
    let lo = Infinity;
    let hi = -Infinity;
    const [a, b] = spec.xDomain;
    for (let i = 0; i <= SAMPLES; i++) {
      const x = a + ((b - a) * i) / SAMPLES;
      for (const c of spec.curves) {
        const y = c.fn(x);
        if (Number.isFinite(y)) {
          lo = Math.min(lo, y);
          hi = Math.max(hi, y);
        }
      }
    }
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [-1, 1];
    const pad = (hi - lo) * 0.08 || 1;
    return [lo - pad, hi + pad];
  }, [spec]);

  const sx = (x: number) =>
    PAD.left + ((x - spec.xDomain[0]) / (spec.xDomain[1] - spec.xDomain[0])) * IW;
  const sy = (y: number) =>
    PAD.top + IH - ((y - yDomain[0]) / (yDomain[1] - yDomain[0])) * IH;

  const xTicks = ticks(spec.xDomain);
  const yTicks = ticks(yDomain, 5);
  const zeroY = yDomain[0] < 0 && yDomain[1] > 0 ? sy(0) : null;
  const zeroX = spec.xDomain[0] < 0 && spec.xDomain[1] > 0 ? sx(0) : null;

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    // The SVG scales to its container, so map through the viewBox width.
    const px = ((e.clientX - r.left) / r.width) * W;
    if (px < PAD.left || px > PAD.left + IW) {
      setHoverX(null);
      return;
    }
    setHoverX(
      spec.xDomain[0] +
        ((px - PAD.left) / IW) * (spec.xDomain[1] - spec.xDomain[0])
    );
  }

  return (
    <figure className="m-0">
      <figcaption className="mb-1 text-sm font-semibold tracking-tight">
        {spec.title}
      </figcaption>
      {spec.caption ? (
        <p className="mb-3 text-[13px] leading-snug text-muted-foreground">
          {spec.caption}
        </p>
      ) : null}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full"
        role="img"
        aria-label={`${spec.title}. ${spec.curves.map((c) => c.label).join(", ")}`}
        onMouseMove={onMove}
        onMouseLeave={() => setHoverX(null)}
      >
        <defs>
          {spec.bands?.map((b, i) => (
            <linearGradient
              key={i}
              id={`${uid}-band-${i}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0" stopColor={TONE[b.tone]} stopOpacity={0.26} />
              <stop offset="1" stopColor={TONE[b.tone]} stopOpacity={0.06} />
            </linearGradient>
          ))}
        </defs>

        {/* grid: hairline, solid, recessive */}
        {yTicks.map((t) => (
          <line
            key={`y${t}`}
            x1={PAD.left}
            y1={sy(t)}
            x2={PAD.left + IW}
            y2={sy(t)}
            className="stroke-border"
            strokeWidth={1}
          />
        ))}
        {xTicks.map((t) => (
          <line
            key={`x${t}`}
            x1={sx(t)}
            y1={PAD.top}
            x2={sx(t)}
            y2={PAD.top + IH}
            className="stroke-border"
            strokeWidth={1}
            opacity={0.5}
          />
        ))}

        {/* the two axes of the plane, drawn stronger than the grid */}
        {zeroY !== null ? (
          <line
            x1={PAD.left}
            y1={zeroY}
            x2={PAD.left + IW}
            y2={zeroY}
            className="stroke-muted-foreground"
            strokeWidth={1.25}
          />
        ) : null}
        {zeroX !== null ? (
          <line
            x1={zeroX}
            y1={PAD.top}
            x2={zeroX}
            y2={PAD.top + IH}
            className="stroke-muted-foreground"
            strokeWidth={1.25}
          />
        ) : null}

        {/* shaded regions, under the curves so the stroke stays crisp */}
        {spec.bands?.map((b, i) => {
          const n = 160;
          const base = zeroY ?? sy(yDomain[0]);
          let d = `M${sx(b.from)},${base}`;
          for (let k = 0; k <= n; k++) {
            const x = b.from + ((b.to - b.from) * k) / n;
            const y = b.fn(x);
            if (Number.isFinite(y)) d += `L${sx(x)},${sy(y)}`;
          }
          d += `L${sx(b.to)},${base}Z`;
          return (
            <path key={i} d={d} fill={`url(#${uid}-band-${i})`}>
              {b.label ? <title>{b.label}</title> : null}
            </path>
          );
        })}

        {/* Riemann strips. Left-endpoint heights, and a 1px gap between
            neighbours so the strip count stays countable at a glance. */}
        {spec.rects?.map((r, ri) => {
          const w = (r.to - r.from) / r.count;
          const base = zeroY ?? sy(yDomain[0]);
          return (
            <g key={ri}>
              {Array.from({ length: r.count }, (_, k) => {
                const x0 = r.from + k * w;
                const h = r.fn(x0);
                if (!Number.isFinite(h)) return null;
                const top = sy(h);
                return (
                  <rect
                    key={k}
                    x={sx(x0) + 0.5}
                    y={Math.min(top, base)}
                    width={Math.max(0, sx(x0 + w) - sx(x0) - 1)}
                    height={Math.abs(base - top)}
                    fill={r.color ?? "var(--chart-3)"}
                    fillOpacity={0.2}
                    stroke={r.color ?? "var(--chart-3)"}
                    strokeOpacity={0.75}
                    strokeWidth={1}
                  >
                    <title>{`${r.label ?? "strip"} ${k + 1}: height ${fmt(h)}`}</title>
                  </rect>
                );
              })}
            </g>
          );
        })}

        {/* helper segments (tangent lines, limit rules) */}
        {spec.segments?.map((s, i) => (
          <line
            key={i}
            x1={sx(s.x1)}
            y1={sy(s.y1)}
            x2={sx(s.x2)}
            y2={sy(s.y2)}
            stroke={s.color ?? "var(--chart-2)"}
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray={s.dashed ? "5 5" : undefined}
          />
        ))}
        {spec.vLines?.map((v, i) => (
          <g key={i}>
            <line
              x1={sx(v.x)}
              y1={PAD.top}
              x2={sx(v.x)}
              y2={PAD.top + IH}
              stroke={v.color ?? "var(--chart-2)"}
              strokeWidth={1.5}
              strokeDasharray="5 5"
            />
            {v.label ? (
              <text
                x={sx(v.x)}
                y={PAD.top + IH + 33}
                textAnchor="middle"
                className="fill-muted-foreground text-[11px] font-semibold"
              >
                {v.label}
              </text>
            ) : null}
          </g>
        ))}

        {/* the curves */}
        {spec.curves.map((c, i) => (
          <path
            key={i}
            d={samplePath(c.fn, spec.xDomain, sx, sy, yDomain)}
            fill="none"
            stroke={c.color ?? SLOT[i % SLOT.length]}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={c.dashed ? "6 5" : undefined}
          />
        ))}

        {/* crosshair readout - enhances, never the only way to read a value */}
        {hoverX !== null ? (
          <g pointerEvents="none">
            <line
              x1={sx(hoverX)}
              y1={PAD.top}
              x2={sx(hoverX)}
              y2={PAD.top + IH}
              className="stroke-muted-foreground"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            {spec.curves.map((c, i) => {
              const y = c.fn(hoverX);
              if (!Number.isFinite(y) || y < yDomain[0] || y > yDomain[1]) {
                return null;
              }
              return (
                <circle
                  key={i}
                  cx={sx(hoverX)}
                  cy={sy(y)}
                  r={4}
                  fill={c.color ?? SLOT[i % SLOT.length]}
                  className="stroke-card"
                  strokeWidth={2}
                />
              );
            })}
          </g>
        ) : null}

        {/* labelled points of interest */}
        {spec.markers?.map((m, i) => {
          const place = m.place ?? "above";
          const dx = place === "left" ? -10 : place === "right" ? 10 : 0;
          const dy = place === "above" ? -12 : place === "below" ? 20 : 4;
          const anchor =
            place === "left" ? "end" : place === "right" ? "start" : "middle";
          return (
            <g key={i}>
              <circle
                cx={sx(m.x)}
                cy={sy(m.y)}
                r={5}
                fill={m.color ?? "var(--chart-1)"}
                className="stroke-card"
                strokeWidth={2}
              />
              {m.label ? (
                <text
                  x={sx(m.x) + dx}
                  y={sy(m.y) + dy}
                  textAnchor={anchor}
                  className="fill-foreground text-[11.5px] font-semibold"
                  style={{ paintOrder: "stroke" }}
                  stroke="var(--card)"
                  strokeWidth={3.5}
                >
                  {m.label}
                </text>
              ) : null}
            </g>
          );
        })}

        {/* axis ticks */}
        {xTicks.map((t) => (
          <text
            key={`xt${t}`}
            x={sx(t)}
            y={PAD.top + IH + 17}
            textAnchor="middle"
            className="fill-muted-foreground text-[11px] tabular-nums"
          >
            {fmt(t)}
          </text>
        ))}
        {yTicks.map((t) => (
          <text
            key={`yt${t}`}
            x={PAD.left - 9}
            y={sy(t) + 4}
            textAnchor="end"
            className="fill-muted-foreground text-[11px] tabular-nums"
          >
            {fmt(t)}
          </text>
        ))}
        <text
          x={PAD.left + IW / 2}
          y={H - 4}
          textAnchor="middle"
          className="fill-muted-foreground text-[11px]"
        >
          {spec.xLabel ?? "x"}
        </text>
        <text
          x={12}
          y={PAD.top + IH / 2}
          textAnchor="middle"
          transform={`rotate(-90 12 ${PAD.top + IH / 2})`}
          className="fill-muted-foreground text-[11px]"
        >
          {spec.yLabel ?? "y"}
        </text>
      </svg>

      {/* legend: always present for >= 2 series, and for bands that carry sign */}
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        {spec.curves.map((c, i) => (
          <li key={c.label} className="flex items-center gap-2">
            <span
              aria-hidden
              className={cn("h-0.5 w-4 shrink-0 rounded-full")}
              style={{ background: c.color ?? SLOT[i % SLOT.length] }}
            />
            {c.label}
          </li>
        ))}
        {spec.rects
          ?.filter((r) => r.label)
          .map((r, i) => (
            <li key={`r${i}`} className="flex items-center gap-2">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-[3px]"
                style={{ background: r.color ?? "var(--chart-3)", opacity: 0.5 }}
              />
              {r.label}
            </li>
          ))}
        {spec.bands
          ?.filter((b) => b.label)
          .map((b, i) => (
            <li key={`b${i}`} className="flex items-center gap-2">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-[3px]"
                style={{ background: TONE[b.tone], opacity: 0.45 }}
              />
              {b.label}
            </li>
          ))}
      </ul>

      {/* Hover is an enhancement; the readout is also printed as text. */}
      <p className="mt-2 h-4 text-xs tabular-nums text-muted-foreground">
        {hoverX !== null
          ? `x = ${fmt(hoverX)}   ` +
            spec.curves
              .map((c) => `${c.label} = ${fmt(c.fn(hoverX))}`)
              .join("   ")
          : ""}
      </p>
    </figure>
  );
}
