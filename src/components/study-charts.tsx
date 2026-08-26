"use client";

/**
 * The study dashboard's charts, built on real bklit components.
 *
 * Colors come from the CSS tokens in globals.css - the dataviz skill's
 * validated categorical order (--chart-1..5) and its ordinal blue ramp
 * (--ord-lo/mid/hi). Never hardcode a hex here: the tokens are what got
 * validated, and they swap for dark mode.
 */

import { AreaChart } from "@/components/charts/area-chart";
import { Area } from "@/components/charts/area";
import { BarChart } from "@/components/charts/bar-chart";
import { Bar } from "@/components/charts/bar";
import { BarXAxis } from "@/components/charts/bar-x-axis";
import { Grid } from "@/components/charts/grid";
import { XAxis } from "@/components/charts/x-axis";
import { YAxis } from "@/components/charts/y-axis";
import { ChartTooltip } from "@/components/charts/tooltip";

import { Empty, Legend } from "@/components/ui-kit";
export { MasteryRings, StatusMix } from "@/components/dial-charts";
import data from "@/data.json";

type DayRow = (typeof data.sessionsByDay)[number];

/* The categorical slots, in the fixed order the validator signed off on. */
const SERIES: Record<string, string> = {
  teach: "var(--chart-1)",
  revise: "var(--chart-2)",
  drill: "var(--chart-3)",
  mock: "var(--chart-4)",
  other: "var(--chart-other)",
};

/* Study days are logged as "17 Aug" with no year. The charts need real Dates,
   so anchor them to the year the registration deadline falls in. Rolling the
   year back on a December->January wrap keeps the series monotone instead of
   throwing the last few days a year into the future. */
const YEAR = new Date(data.regClose).getUTCFullYear();

function parseDay(label: string, index: number, all: string[]): Date {
  const d = new Date(`${label} ${YEAR} UTC`);
  if (Number.isNaN(d.getTime())) {
    // Unparseable label: fall back to index order so the chart still draws in
    // the right sequence rather than collapsing to Invalid Date.
    return new Date(Date.UTC(YEAR, 0, index + 1));
  }
  const first = new Date(`${all[0]} ${YEAR} UTC`);
  if (!Number.isNaN(first.getTime()) && d < first) {
    d.setUTCFullYear(YEAR + 1);
  }
  return d;
}

/* ------------------------------------------------- cumulative sessions area */

export function CumulativeSessions() {
  const rows: DayRow[] = data.sessionsByDay;

  // Two points is a line segment, not a trend. Drawing one would overstate
  // what the log knows, so below the gate the card shows the count instead.
  if (rows.length < data.minTrendDays) {
    return (
      <Empty
        msg={`${data.totals.sessions} session${
          data.totals.sessions === 1 ? "" : "s"
        } across ${rows.length} day${rows.length === 1 ? "" : "s"}.`}
        hint={`The curve starts drawing at ${data.minTrendDays} separate study days — two points is a line segment, not a trend.`}
      />
    );
  }

  const labels = rows.map((r) => r.date);
  const series = rows.map((r, i) => ({
    date: parseDay(r.date, i, labels),
    sessions: r.cumulative,
  }));

  return (
    <AreaChart data={series} xDataKey="date" aspectRatio="3 / 1">
      <Grid horizontal strokeDasharray="0" />
      <Area dataKey="sessions" fill="var(--chart-1)" />
      <YAxis numTicks={4} />
      <XAxis />
      <ChartTooltip />
    </AreaChart>
  );
}

/* --------------------------------------------- sessions per day, by type */

export function SessionsByType() {
  const rows: DayRow[] = data.sessionsByDay;
  if (!rows.length) {
    return <Empty msg="No sessions logged yet." />;
  }

  // Only plot types that actually occur - an all-zero series would seat a hue
  // and a legend row for nothing.
  const used = data.sessionTypes.filter((t) =>
    rows.some((r) => (r[t.key as keyof DayRow] as number) > 0)
  );

  return (
    <>
      <BarChart
        data={rows}
        xDataKey="date"
        stacked
        stackGap={2}
        barWidth={24}
        aspectRatio="3 / 1"
      >
        <Grid horizontal strokeDasharray="0" />
        {used.map((t) => (
          <Bar key={t.key} dataKey={t.key} fill={SERIES[t.key]} lineCap="round" />
        ))}
        <YAxis numTicks={4} />
        <BarXAxis />
        <ChartTooltip />
      </BarChart>
      <Legend
        items={used.map((t) => ({
          color: SERIES[t.key],
          label: t.label,
          value: rows.reduce(
            (n, r) => n + (r[t.key as keyof DayRow] as number),
            0
          ),
        }))}
      />
    </>
  );
}

/* ------------------------------------------------ marks coverage by block */

export function MarksCoverage() {
  const rows = data.coverage;
  if (!rows.length) {
    return <Empty msg="No mark map parsed." />;
  }

  /* One ordered scale (not started -> learning -> solid) gets ONE hue in three
     steps, not three hues. Segments are stacked with a 2px gap in the surface
     colour doing the separating. */
  const STEPS = [
    { key: "covered", label: "Solid or better", color: "var(--ord-hi)" },
    { key: "inProgress", label: "Learning or weak", color: "var(--ord-mid)" },
    { key: "notStarted", label: "Not started", color: "var(--ord-lo)" },
  ] as const;

  return (
    <>
      <BarChart
        data={rows}
        xDataKey="block"
        stacked
        stackGap={2}
        barWidth={24}
        aspectRatio="5 / 2"
      >
        <Grid horizontal strokeDasharray="0" />
        {STEPS.map((s) => (
          <Bar key={s.key} dataKey={s.key} fill={s.color} lineCap="round" />
        ))}
        <YAxis numTicks={4} />
        <BarXAxis />
        <ChartTooltip />
      </BarChart>
      <Legend
        items={STEPS.map((s) => ({
          color: s.color,
          label: s.label,
          value: rows.reduce(
            (n, r) => n + (r[s.key as keyof typeof r] as number),
            0
          ),
        }))}
      />
    </>
  );
}
