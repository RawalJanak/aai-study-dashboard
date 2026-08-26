"use client";

/**
 * Ring and pie dials.
 *
 * Split out of study-charts and mounted client-only: their centers render a
 * <number-flow-react> custom element, and its server markup never matches
 * what the client produces, so SSR-ing them throws a hydration mismatch and
 * React discards the whole subtree. Rendering after mount is the fix; these
 * two panels are the only charts that need it.
 */

import { useEffect, useState } from "react";
import { RingChart } from "@/components/charts/ring-chart";
import { Ring } from "@/components/charts/ring";
import { RingCenter } from "@/components/charts/ring-center";
import { PieChart } from "@/components/charts/pie-chart";
import { PieSlice } from "@/components/charts/pie-slice";
import { PieCenter } from "@/components/charts/pie-center";
import { Empty, Legend } from "@/components/ui-kit";
import data from "@/data.json";

/** Reserves the dial's box so mounting does not shift the card. */
function DialSlot({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="grid size-[220px] place-items-center">
        {mounted ? children : null}
      </div>
    </div>
  );
}

/* --------------------------------------------------- mastery rings + pie */

export function MasteryRings() {
  const subjects = data.subjects;
  if (!subjects.length) {
    return <Empty msg="No concepts logged against a subject yet." />;
  }
  const rings = subjects.slice(0, 4).map((s, i) => ({
    label: s.name,
    value: s.solid,
    maxValue: s.logged,
    color: `var(--chart-${i + 1})`,
  }));

  return (
    <>
      <DialSlot>
      <RingChart
        data={rings}
        size={220}
        strokeWidth={14}
        ringGap={8}
      >
        {rings.map((_, i) => (
          <Ring key={i} index={i} />
        ))}
        <RingCenter defaultLabel="solid" />
      </RingChart>
      </DialSlot>
      <Legend
        items={rings.map((r) => ({
          color: r.color,
          label: r.label,
          value: `${r.value}/${r.maxValue}`,
        }))}
      />
    </>
  );
}

export function StatusMix() {
  /* Part-to-whole at a glance, <= 6 segments. Zero-count buckets are dropped -
     a slice with no area still eats a legend row and a hue. */
  const slices = data.statusBreakdown.filter((s) => s.n > 0);
  if (!slices.length) {
    return <Empty msg="No concepts logged yet." />;
  }

  // Worst -> best, so the ramp reads in the same direction as the scale.
  const COLORS = [
    "var(--ord-lo)",
    "var(--critical)",
    "var(--warning)",
    "var(--ord-mid)",
    "var(--ord-hi)",
  ];
  const order = data.statusBreakdown.map((s) => s.status);

  const withColor = slices.map((s) => ({
    label: s.status,
    value: s.n,
    color: COLORS[order.indexOf(s.status)] ?? "var(--chart-other)",
  }));

  return (
    <>
      <DialSlot>
      <PieChart
        data={withColor}
        size={220}
        innerRadius={58}
        padAngle={0.03}
        cornerRadius={3}
      >
        {withColor.map((_, i) => (
          <PieSlice key={i} index={i} />
        ))}
        <PieCenter defaultLabel="concepts" />
      </PieChart>
      </DialSlot>
      <Legend items={withColor.map((s) => ({ ...s, value: s.value }))} />
    </>
  );
}
