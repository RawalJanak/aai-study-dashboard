// src/lib/day-types.ts
//
// Mirrors the shape build.py's build_days()/load_review_queue() write into
// data.json (see TOMORROW/dashboard/build.py and the design spec at
// docs/superpowers/specs/2026-09-15-sourcemap-style-aai-dashboard-design.md).

export type MasteryState = "unrated" | "pass" | "fail";

export interface DayMastery {
  explain: MasteryState;
  recall: MasteryState;
  apply: MasteryState;
  spot_trap: MasteryState;
  speed: MasteryState;
}

export type DayStatus = "not_started" | "in_progress" | "done";

export interface Day {
  number: number;
  phase: string;
  title: string;
  objective: string;
  mastery: DayMastery;
  status: DayStatus;
  scheduledDate: string;
}

export interface ReviewItem {
  item: string;
  rung: number;
  due: string;
  note: string;
}

export const MASTERY_KEYS: (keyof DayMastery)[] = [
  "explain",
  "recall",
  "apply",
  "spot_trap",
  "speed",
];

export const MASTERY_LABEL: Record<keyof DayMastery, string> = {
  explain: "Explain",
  recall: "Recall",
  apply: "Apply",
  spot_trap: "Spot-the-trap",
  speed: "Speed",
};

/** How many of a day's 5 criteria are rated `pass`. */
export function passCount(m: DayMastery): number {
  return MASTERY_KEYS.filter((k) => m[k] === "pass").length;
}
