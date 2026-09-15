# Sourcemap-style AAI Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the AAI dashboard's landing experience with a Sourcemap-style day-by-day
program (Today/Roadmap/Review/Progress), built by sequencing Janak's existing 75 logged
concepts and 22 sessions into ~65 fixed-shape teaching days, while keeping every existing tab
(subjects, error book, question bank, GK, mock test, lesson graphs, markets, consulting)
exactly as it is.

**Architecture:** A new day-sequencing pass in `build.py` reads `STUDY_PROGRESS.md`'s existing
concept tables plus two new small tables (`Day mastery`, `Review queue`), and emits a `days`
array and `reviewQueue` array into `data.json`. Four new React components render them
(`DayBar` in the sidebar, `PentagonWall`, a `Today` hero, and `Roadmap`/`Review` list pages),
wired into the existing `NavGroup`/`sections` system in `page.tsx` — no change to how `Shell`
itself works. `globals.css` gets one global accent-color change (red → coral) plus five new
phase-spectrum tokens.

**Tech Stack:** Python 3 (`build.py`, no external deps beyond stdlib), Next.js 16 / React 19 /
TypeScript (`dashboard-next`), Tailwind v4 CSS custom properties, static export to GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-15-sourcemap-style-aai-dashboard-design.md`

## Global Constraints

- Exam date is a single value, `EXAM_DATE = date(2026, 11, 19)` — Janak's explicit assumption,
  not an official AAI date. Must live in exactly one place in `build.py` so re-anchoring later
  is a one-line edit.
- Day 1 must show genuinely zero progress the first time `build.py` runs after this plan lands
  (no `Day mastery` rows exist yet in `STUDY_PROGRESS.md` until Task 13 adds the empty
  section) — never seed fake "done" days.
- ATC reference material (`QUESTION_BANK.md` Q248-843) is excluded from the day sequence —
  `build_days()` only reads `aai["concepts"]`, which comes from `STUDY_PROGRESS.md`'s concept
  tables and never touches `QUESTION_BANK.md` directly.
- `--brand` (and everything that currently mirrors it — `--primary`, `--ring`,
  `--sidebar-primary`) changes globally from red to coral `#ff6a4d` (Janak's explicit choice,
  15 Sep). `--critical` stays its own red — semantic "wrong/critical" color, decoupled from the
  brand accent, since they no longer need to match.
- No test framework exists in this repo (`package.json` has no `test` script). Verification
  follows the project's existing convention: Python changes are checked by extending the
  assert-based `check()`/`build()` self-checks already in `build.py`; frontend changes are
  verified by `npm run build` succeeding (Next.js's own type-checking) plus one visual read of
  the built output. Do not introduce a new test framework.
- Existing pages (subject lesson pages, error book, question bank, GK, mock test, lesson
  graphs, markets, consulting) get zero styling changes in this plan beyond the global
  accent-color swap — no unrelated refactors.

---

### Task 1: Day-sequencing config constants

**Files:**
- Modify: `TOMORROW/dashboard/build.py:32` (import), `build.py:45` (near `REG_CLOSE`)

**Interfaces:**
- Produces: `EXAM_DATE: date`, `PHASE_MAP: dict[str, str]`, `PHASE_ORDER: list[str]`,
  `MOCK_DAYS: int`, `REVISION_BATCH: int` — module-level constants every later task in this
  file reads.

- [ ] **Step 1: Add `timedelta` to the existing datetime import**

Find line 32:
```python
from datetime import date, datetime
```
Replace with:
```python
from datetime import date, datetime, timedelta
```

- [ ] **Step 2: Add the day-sequencing constants next to `REG_CLOSE`**

Find (around line 45):
```python
REG_CLOSE = date(2026, 9, 7)
```
Add immediately after it:
```python
REG_CLOSE = date(2026, 9, 7)

# Sourcemap-style day sequence. EXAM_DATE is Janak's own assumption (chosen
# 15 Sep 2026) - AAI has not officially announced Advt 12/2026's exam date.
# Single value: re-anchor here the moment AAI publishes the real one.
EXAM_DATE = date(2026, 11, 19)

# The 8 SUBJECTS keys collapse into the 5 syllabus phases from the official
# mark-map, plus a 6th generated phase (Consolidation/Mock) with no concept
# data of its own.
PHASE_MAP = {
    "quant": "Part-A General",
    "reasoning": "Part-A General",
    "english": "Part-A General",
    "gk": "Part-A General",
    "physics": "Physics",
    "mathematics": "Maths",
    "aviation": "Aviation",
    "business": "Business Mgmt",
}
PHASE_ORDER = ["Part-A General", "Physics", "Maths", "Aviation", "Business Mgmt",
               "Consolidation/Mock"]
MOCK_DAYS = 15
REVISION_BATCH = 4  # concepts folded into one shared revision day
```

- [ ] **Step 3: Verify the file still parses**

Run: `python -c "import ast; ast.parse(open(r'C:\Users\jmraw\OneDrive\Desktop\TOMORROW\dashboard\build.py', encoding='utf-8').read())"`
Expected: no output, exit code 0 (a syntax error would raise and print a traceback)

- [ ] **Step 4: Commit**

```bash
cd "C:\Users\jmraw\OneDrive\Desktop\TOMORROW\dashboard-next"
git add ../dashboard/build.py
git commit -m "feat: add day-sequencing config constants"
```

---

### Task 2: Parse the two new STUDY_PROGRESS.md tables

**Files:**
- Modify: `TOMORROW/dashboard/build.py` (new functions, placed just before `def load_aai():`
  at line 331)

**Interfaces:**
- Consumes: `psec` (the `{heading: body}` dict `sections(prog)` already produces inside
  `load_aai()`), `table_with`, `tables`, `dicts`, `strip_md` (all already defined above in the
  file).
- Produces: `load_day_mastery(psec) -> dict[str, dict[str, str]]`,
  `load_review_queue(psec) -> list[dict]` — both called from `load_aai()` in Task 4.

- [ ] **Step 1: Add both parser functions**

Insert immediately before `def load_aai():` (line 331):

```python
def load_day_mastery(psec):
    """'## Day mastery' table -> {day title: {explain, recall, apply, spot_trap, speed}}.

    Keyed by title, not day number: day numbers are recomputed every build
    (concepts move between Solid/Learning as teaching progresses, which can
    shift which day a concept lands on), but a taught day's title is stable.
    """
    out = {}
    for r in dicts(table_with(psec.get("Day mastery", ""), "day title", "explain")):
        title = strip_md(r.get("day title", ""))
        if not title:
            continue
        out[title] = {
            "explain": (r.get("explain", "") or "unrated").strip().lower() or "unrated",
            "recall": (r.get("recall", "") or "unrated").strip().lower() or "unrated",
            "apply": (r.get("apply", "") or "unrated").strip().lower() or "unrated",
            "spot_trap": (r.get("spot-trap", "") or "unrated").strip().lower() or "unrated",
            "speed": (r.get("speed", "") or "unrated").strip().lower() or "unrated",
        }
    return out


def load_review_queue(psec):
    """'## Review queue' table -> due-today spaced-repetition items, capped at 10.

    Rung/due-date advancement is done by hand (Claude edits the table after a
    live re-check) - this function only parses and filters, it does no rung
    math itself.
    """
    rows = []
    for r in dicts(table_with(psec.get("Review queue", ""), "item", "rung", "due")):
        item = strip_md(r.get("item", ""))
        if not item:
            continue
        try:
            rung = int(re.sub(r"[^\d]", "", r.get("rung", "") or "1") or "1")
        except ValueError:
            rung = 1
        rows.append({
            "item": item,
            "rung": rung,
            "due": strip_md(r.get("due", "")),
            "note": strip_md(r.get("note", "")),
        })
    today = date.today().isoformat()
    due = [r for r in rows if r["due"] and r["due"] <= today]
    return due[:10]
```

- [ ] **Step 2: Verify with a standalone smoke test**

Run this to confirm both functions parse a sample table correctly (no pytest — matches the
file's existing `assert`-based convention):

```bash
python -c "
import sys
sys.path.insert(0, r'C:\Users\jmraw\OneDrive\Desktop\TOMORROW\dashboard')
from build import load_day_mastery, load_review_queue

sample_psec = {
    'Day mastery': '''
| Day title | Explain | Recall | Apply | Spot-trap | Speed |
|---|---|---|---|---|---|
| Classification, series & blood relations | pass | pass | pass | pass | pass |
| Multi-phase motion | pass | unrated | unrated | unrated | unrated |
''',
    'Review queue': '''
| Item | Rung | Due | Note |
|---|---|---|---|
| QNH vs QFE | 3 | 2020-01-01 | old, should show as due |
| Future item | 1 | 2099-01-01 | should NOT show |
''',
}
m = load_day_mastery(sample_psec)
assert m['Classification, series & blood relations']['explain'] == 'pass', m
assert m['Multi-phase motion']['recall'] == 'unrated', m
q = load_review_queue(sample_psec)
assert len(q) == 1 and q[0]['item'] == 'QNH vs QFE', q
print('OK')
"
```
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
cd "C:\Users\jmraw\OneDrive\Desktop\TOMORROW\dashboard-next"
git add ../dashboard/build.py
git commit -m "feat: parse Day mastery and Review queue tables from STUDY_PROGRESS.md"
```

---

### Task 3: The day-sequencing algorithm

**Files:**
- Modify: `TOMORROW/dashboard/build.py` (new function, placed right after
  `load_review_queue` from Task 2)

**Interfaces:**
- Consumes: `concepts` (the list `load_aai()` already builds — each item has `group`,
  `concept`, `status`, `evidence`, `key`, `subject`), `mastery_by_title` (Task 2's
  `load_day_mastery()` output), `COVERED` (existing module constant,
  `("Solid", "Mastered", "Fixed")`), `PHASE_MAP`/`PHASE_ORDER`/`MOCK_DAYS`/`REVISION_BATCH`
  (Task 1), `EXAM_DATE` (Task 1), `strip_md`.
- Produces: `build_days(concepts, mastery_by_title) -> list[dict]` — each dict has keys
  `number`, `phase`, `title`, `objective`, `mastery`, `status`, `scheduledDate`. Called from
  `load_aai()` in Task 4.

- [ ] **Step 1: Add `build_days()`**

Insert immediately after `load_review_queue` (from Task 2):

```python
def build_days(concepts, mastery_by_title):
    """Sequence every concept into fixed-shape day objects.

    Learning/Weak/Not-started concepts each get a full day, in the order
    they already appear in STUDY_PROGRESS.md (which is roughly teaching
    order - concept tables are appended to as topics are taught). Solid/
    Mastered concepts are folded into shared revision days, REVISION_BATCH
    at a time, appended after the fresh days within each phase. The final
    MOCK_DAYS days are a generated Consolidation/Mock phase with no concept
    data of their own.
    """
    by_phase = {p: [] for p in PHASE_ORDER}
    for c in concepts:
        phase = PHASE_MAP.get(c["subject"], "Part-A General")
        by_phase[phase].append(c)

    planned = []
    for phase in PHASE_ORDER[:-1]:
        fresh = [c for c in by_phase[phase] if c["status"] not in COVERED]
        solid = [c for c in by_phase[phase] if c["status"] in COVERED]

        for c in fresh:
            title = strip_md(c["concept"])
            planned.append({
                "phase": phase,
                "title": title,
                "objective": strip_md(c["evidence"]) or f"Master {title}.",
            })

        for i in range(0, len(solid), REVISION_BATCH):
            batch = solid[i:i + REVISION_BATCH]
            names = ", ".join(strip_md(c["concept"]) for c in batch)
            planned.append({
                "phase": phase,
                "title": f"Revision \u2014 {names}",
                "objective": f"Fast spaced recap of {len(batch)} already-solid "
                             f"concepts: {names}.",
            })

    for i in range(1, MOCK_DAYS + 1):
        last = i == MOCK_DAYS
        planned.append({
            "phase": "Consolidation/Mock",
            "title": "Full mock \u2014 120Q/120min" if last else f"Consolidation {i}",
            "objective": ("Full 120-question, 120-minute mock under real exam "
                          "conditions." if last else
                          "Timed sectional test, section-wise accuracy and speed "
                          "report."),
        })

    total = len(planned)
    start = EXAM_DATE - timedelta(days=total)

    days = []
    for i, p in enumerate(planned):
        m = mastery_by_title.get(p["title"], {})
        mastery = {k: m.get(k, "unrated")
                   for k in ("explain", "recall", "apply", "spot_trap", "speed")}
        rated = [v for v in mastery.values() if v != "unrated"]
        if all(v == "pass" for v in mastery.values()):
            status = "done"
        elif rated:
            status = "in_progress"
        else:
            status = "not_started"
        days.append({
            "number": i + 1,
            "phase": p["phase"],
            "title": p["title"],
            "objective": p["objective"],
            "mastery": mastery,
            "status": status,
            "scheduledDate": (start + timedelta(days=i)).isoformat(),
        })
    return days
```

- [ ] **Step 2: Verify with a standalone smoke test**

```bash
python -c "
import sys
sys.path.insert(0, r'C:\Users\jmraw\OneDrive\Desktop\TOMORROW\dashboard')
from build import build_days

concepts = [
    {'group': 'g', 'concept': 'Classification', 'status': 'Solid', 'evidence': 'e',
     'key': 'k1', 'subject': 'reasoning'},
    {'group': 'g', 'concept': 'A new topic', 'status': 'Learning', 'evidence': 'e2',
     'key': 'k2', 'subject': 'reasoning'},
]
days = build_days(concepts, {})
# Day 1 must be the fresh (Learning) concept, not the Solid one - fresh
# concepts come before revision days within a phase.
assert days[0]['title'] == 'A new topic', days[0]
assert days[0]['status'] == 'not_started', days[0]
assert days[0]['mastery'] == {'explain': 'unrated', 'recall': 'unrated',
                               'apply': 'unrated', 'spot_trap': 'unrated',
                               'speed': 'unrated'}, days[0]
assert days[-1]['title'] == 'Full mock \u2014 120Q/120min', days[-1]
assert days[-1]['phase'] == 'Consolidation/Mock', days[-1]
# scheduledDate must land exactly on EXAM_DATE - 1 day for the last day.
from datetime import date, timedelta
assert days[-1]['scheduledDate'] == (date(2026, 11, 19) - timedelta(days=1)).isoformat(), days[-1]
print('OK', len(days), 'days')
"
```
Expected: `OK 17 days` (2 concept-derived days + 15 mock days)

- [ ] **Step 3: Commit**

```bash
cd "C:\Users\jmraw\OneDrive\Desktop\TOMORROW\dashboard-next"
git add ../dashboard/build.py
git commit -m "feat: add build_days() day-sequencing algorithm"
```

---

### Task 4: Wire days + reviewQueue into load_aai() and json_payload()

**Files:**
- Modify: `TOMORROW/dashboard/build.py:409-425` (`load_aai()`'s return dict),
  `build.py:2518-2585` (`json_payload()`'s return dict), `build.py:2156` (`build()`'s
  self-check block)

**Interfaces:**
- Consumes: `build_days`, `load_day_mastery`, `load_review_queue` (Tasks 2-3),
  `aai["concepts"]`, `psec` (already in scope inside `load_aai()`).
- Produces: `data.json` gains top-level `days: [...]` and `reviewQueue: [...]` keys.

- [ ] **Step 1: Call the new parsers inside `load_aai()` and add to its return dict**

Find the return statement (line ~409):
```python
    return {
        "lessons": load_lessons(),
        "mark_map": mark_map,
```
Add two lines right before `"mark_map"` (and compute the values just above the `return`):

```python
    day_mastery = load_day_mastery(psec)
    days = build_days(concepts, day_mastery)
    review_queue = load_review_queue(psec)

    return {
        "lessons": load_lessons(),
        "days": days,
        "reviewQueue": review_queue,
        "mark_map": mark_map,
```

- [ ] **Step 2: Add `days` and `reviewQueue` to `json_payload()`'s return dict**

Find (around line 2563):
```python
        "nextActions": [strip_md(a) for a in aai["next_actions"]],
        "wins": [strip_md(w) for w in aai["wins"]],
```
Add immediately after `"wins"`:
```python
        "nextActions": [strip_md(a) for a in aai["next_actions"]],
        "wins": [strip_md(w) for w in aai["wins"]],
        "days": aai["days"],
        "reviewQueue": aai["reviewQueue"],
        "examDate": EXAM_DATE.isoformat(),
```

- [ ] **Step 3: Extend `build()`'s self-check block**

Find (around line 2175):
```python
    _p = json_payload(collect(), "test")
    for _b in _p["coverage"]:
```
Add two assertions right before that line:
```python
    # days: sequential numbering, every day has all 5 mastery criteria, and
    # the schedule always ends the day before EXAM_DATE.
    _pay = json_payload(collect(), "test")
    _days = _pay["days"]
    assert _days, "build_days produced zero days"
    assert [d["number"] for d in _days] == list(range(1, len(_days) + 1)), \
        "day numbers must be sequential starting at 1"
    assert all(set(d["mastery"]) == {"explain", "recall", "apply", "spot_trap", "speed"}
               for d in _days), "every day must carry all 5 mastery criteria"
    assert _days[-1]["scheduledDate"] < _pay["examDate"], \
        "the last scheduled day must fall before the exam date"

    _p = json_payload(collect(), "test")
    for _b in _p["coverage"]:
```

(This duplicates the `json_payload(collect(), "test")` call the file already makes right
after — harmless, `collect()` re-reads the same files each time and the existing code already
calls it fresh at that point too; not worth restructuring an unrelated working block for this
plan.)

- [ ] **Step 4: Run the full build and check it passes**

Run: `cd "C:\Users\jmraw\OneDrive\Desktop\TOMORROW\dashboard" && python build.py --check` if a
`--check`-only mode exists, otherwise `python build.py --json` (check `build.py`'s `if
__name__ ==` block / `json_only()` function at line 2632 for the exact flag it supports).
Expected: exits 0, no assertion errors. If it fails on `Day mastery`/`Review queue` sections
being absent from the real `STUDY_PROGRESS.md` (Task 13 hasn't run yet), that's expected at
this point — `table_with()` returns `{"head": [], "rows": []}` for a missing section, which
`dicts()` turns into `[]`, so both parsers degrade to empty output gracefully. The build should
still succeed with `days` computed from concepts alone and `reviewQueue: []`.

- [ ] **Step 5: Commit**

```bash
cd "C:\Users\jmraw\OneDrive\Desktop\TOMORROW\dashboard-next"
git add ../dashboard/build.py
git commit -m "feat: wire days and reviewQueue into data.json"
```

---

### Task 5: TypeScript types for the new data

**Files:**
- Create: `dashboard-next/src/lib/day-types.ts`

**Interfaces:**
- Produces: `type MasteryState`, `type DayMastery`, `type Day`, `type ReviewItem` — imported by
  every component in Tasks 6-10.

- [ ] **Step 1: Write the type file**

```typescript
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
```

- [ ] **Step 2: Verify it compiles standalone**

Run: `cd "C:\Users\jmraw\OneDrive\Desktop\TOMORROW\dashboard-next" && npx tsc --noEmit src/lib/day-types.ts --strict --target es2022 --module esnext --moduleResolution bundler`
Expected: no output, exit code 0

- [ ] **Step 3: Commit**

```bash
git add src/lib/day-types.ts
git commit -m "feat: add TypeScript types for day-sequencing data"
```

---

### Task 6: DayBar component (sidebar gradient bar)

**Files:**
- Create: `dashboard-next/src/components/day-bar.tsx`

**Interfaces:**
- Consumes: `Day[]` (Task 5's type), phase → color mapping (defined inline here, matching the
  5 CSS tokens Task 12 adds: `--phase-general`, `--phase-physics`, `--phase-maths`,
  `--phase-aviation`, `--phase-mgmt`, `--phase-mock`).
- Produces: `export function DayBar({ days }: { days: Day[] })` — used by Task 11's `page.tsx`.

- [ ] **Step 1: Write the component**

```typescript
// src/components/day-bar.tsx
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
```

- [ ] **Step 2: Verify it type-checks in the project context**

This can't be verified standalone (it imports `@/lib/day-types`, a path alias only resolved by
the project's own `tsconfig.json`) — verification happens in Task 11's full `npm run build`.
Confirm the file has no obvious syntax errors by reading it back once.

- [ ] **Step 3: Commit**

```bash
git add src/components/day-bar.tsx
git commit -m "feat: add DayBar sidebar component"
```

---

### Task 7: PentagonWall component

**Files:**
- Create: `dashboard-next/src/components/pentagon-wall.tsx`

**Interfaces:**
- Consumes: `Day[]`, `passCount` (Task 5).
- Produces: `export function PentagonWall({ days }: { days: Day[] })` — used by the Progress
  section in Task 11's `page.tsx`.

- [ ] **Step 1: Write the component**

```typescript
// src/components/pentagon-wall.tsx
import type { Day } from "@/lib/day-types";
import { passCount } from "@/lib/day-types";

function Pentagon({ fillFraction, title }: { fillFraction: number; title: string }) {
  const clipY = 100 - fillFraction * 100;
  const clipId = `pentagon-clip-${title.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg viewBox="0 0 100 100" className="aspect-square w-full" role="img" aria-label={title}>
      <title>{title}</title>
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y={clipY} width="100" height={fillFraction * 100} />
        </clipPath>
      </defs>
      <polygon
        points="50,4 95,38 78,96 22,96 5,38"
        fill="none"
        stroke="var(--border)"
        strokeWidth="6"
      />
      <polygon
        points="50,4 95,38 78,96 22,96 5,38"
        fill="var(--brand)"
        clipPath={`url(#${clipId})`}
      />
    </svg>
  );
}

export function PentagonWall({ days }: { days: Day[] }) {
  const markedCount = days.filter((d) => d.status === "done").length;
  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Your wall
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {markedCount} of {days.length} marked
        </span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(34px,1fr))] gap-2.5">
        {days.map((d) => (
          <Pentagon
            key={d.number}
            fillFraction={passCount(d.mastery) / 5}
            title={`Day ${d.number}: ${d.title}`}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/pentagon-wall.tsx
git commit -m "feat: add PentagonWall progress component"
```

---

### Task 8: Today hero component

**Files:**
- Create: `dashboard-next/src/components/today-hero.tsx`

**Interfaces:**
- Consumes: `Day[]`.
- Produces: `export function TodayHero({ days }: { days: Day[] })`.

- [ ] **Step 1: Write the component**

```typescript
// src/components/today-hero.tsx
import type { Day } from "@/lib/day-types";
import { passCount } from "@/lib/day-types";

export function TodayHero({ days }: { days: Day[] }) {
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
            className="rounded-full bg-[#f5f5f6] px-6.5 py-3 text-[14.5px] font-semibold text-[#141416]"
          >
            Continue Day {today.number}
          </button>
          {tomorrow ? (
            <p className="max-w-[200px] font-mono text-[11px] leading-relaxed text-[#a7a7ad]">
              Tomorrow: {tomorrow.title}
            </p>
          ) : null}
        </div>
      </div>
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/today-hero.tsx
git commit -m "feat: add TodayHero component"
```

---

### Task 9: Roadmap page component

**Files:**
- Create: `dashboard-next/src/components/roadmap.tsx`

**Interfaces:**
- Consumes: `Day[]`, `PHASE_ORDER`-equivalent ordering (derive from data, don't hardcode a
  second copy — see Step 1).
- Produces: `export function Roadmap({ days }: { days: Day[] })`.

- [ ] **Step 1: Write the component**

```typescript
// src/components/roadmap.tsx
import type { Day } from "@/lib/day-types";
import { MASTERY_KEYS, passCount } from "@/lib/day-types";
import { StatusPill } from "@/components/ui-kit";

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
              {phaseDays.map((d) => (
                <div
                  key={d.number}
                  className="flex items-center gap-3.5 rounded-xl border border-border bg-card px-4 py-3"
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
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Check `StatusPill` accepts these three label strings**

Run: `grep -n "STATUS_TONE" "C:\Users\jmraw\OneDrive\Desktop\TOMORROW\dashboard-next\src\components\ui-kit.tsx"`
Confirm "Not started" / "In progress" / "Done" each have (or gracefully fall back via the
`?? "border-border text-muted-foreground"` default already in `StatusPill`) a defined tone —
if `STATUS_TONE` doesn't have these exact keys yet, add them in this same file matching its
existing entries' pattern (e.g. `"Done": "border-[var(--good)]/40 text-[var(--good)]"`) rather
than leaving Roadmap's pills unstyled.

- [ ] **Step 3: Commit**

```bash
git add src/components/roadmap.tsx src/components/ui-kit.tsx
git commit -m "feat: add Roadmap page component"
```

---

### Task 10: Review page component

**Files:**
- Create: `dashboard-next/src/components/review-queue.tsx`

**Interfaces:**
- Consumes: `ReviewItem[]` (Task 5), `Empty` (existing `ui-kit.tsx` component).
- Produces: `export function ReviewQueue({ items }: { items: ReviewItem[] })`.

- [ ] **Step 1: Write the component**

```typescript
// src/components/review-queue.tsx
import type { ReviewItem } from "@/lib/day-types";
import { Empty } from "@/components/ui-kit";

export function ReviewQueue({ items }: { items: ReviewItem[] }) {
  return (
    <div>
      <p className="mb-5 font-mono text-[11.5px] uppercase tracking-wide text-muted-foreground">
        {items.length} review{items.length === 1 ? "" : "s"} due today · capped at 10/day
      </p>
      {items.length ? (
        <div className="grid gap-1.5">
          {items.map((r) => (
            <div
              key={r.item}
              className="flex items-center gap-3.5 rounded-xl border border-border bg-card px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold">{r.item}</div>
                <div className="mt-0.5 text-xs leading-snug text-muted-foreground">
                  {r.note}
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-[var(--brand)] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-[var(--brand-ink,#1a0a06)]">
                Rung {r.rung}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <Empty
          msg="Nothing due today."
          hint="Items appear here after a live-taught concept is rated and later needs a spaced recheck."
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/review-queue.tsx
git commit -m "feat: add ReviewQueue page component"
```

---

### Task 11: Wire the 4 new pages into page.tsx, set Today as the default landing

**Files:**
- Modify: `dashboard-next/src/app/page.tsx`

**Interfaces:**
- Consumes: `data.days`, `data.reviewQueue` (Task 4's `data.json` additions), `DayBar` (6),
  `PentagonWall` (7), `TodayHero` (8), `Roadmap` (9), `ReviewQueue` (10).
- Produces: the running app's new default section and nav group.

- [ ] **Step 1: Import the new pieces**

Add near the top of `page.tsx`, with the other component imports:
```typescript
import { DayBar } from "@/components/day-bar";
import { PentagonWall } from "@/components/pentagon-wall";
import { TodayHero } from "@/components/today-hero";
import { Roadmap } from "@/components/roadmap";
import { ReviewQueue } from "@/components/review-queue";
import type { Day, ReviewItem } from "@/lib/day-types";
```

- [ ] **Step 2: Cast the new data.json fields and build the 4 new sections**

Find where `const t = data.totals;` is declared near the top of `Page()`, and add right after
it:
```typescript
  const days = data.days as Day[];
  const reviewQueue = data.reviewQueue as ReviewItem[];
```

Find the `overview` panel definition (`const overview = (...)`) and add these 4 new panel
consts right before it:
```typescript
  const today = <TodayHero days={days} />;
  const roadmap = <Roadmap days={days} />;
  const review = <ReviewQueue items={reviewQueue} />;
  const progress = (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="days to registration close" value={data.daysToClose} />
        <Stat label="concepts solid or better" value={t.solid} of={t.concepts} />
        <Stat label="open Weak flags" value={t.weak} tone={t.weak ? "alarm" : "default"} />
        <Stat label="lessons written up" value={t.lessons} />
      </div>
      <PentagonWall days={days} />
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Mastery by subject" sub="Concepts solid or better, out of concepts logged.">
          <MasteryRings />
        </Card>
        <Card title="Concept status mix" sub="Every logged concept by its current status.">
          <StatusMix />
        </Card>
      </div>
      <Card title="Sessions logged, running total" sub="Every session in the log, accumulated.">
        <CumulativeSessions />
      </Card>
    </div>
  );
```

- [ ] **Step 3: Add the new pinned nav group and default landing tab**

Find the `groups: NavGroup[]` array's first entry:
```typescript
  const groups: NavGroup[] = [
    {
      heading: "Overview",
      items: [
        { id: "mindmap", label: "Mind Map" },
        { id: "overview", label: "Everything" },
        { id: "coverage", label: "Syllabus coverage" },
      ],
    },
```
Insert a brand-new unlabeled pinned group directly before it (a `NavGroup` with `heading: ""`
renders without a heading label, matching `Shell`'s existing rendering — `{g.heading}` inside a
`<p>` just prints empty for an empty string, no change needed to `shell.tsx`):
```typescript
  const groups: NavGroup[] = [
    {
      heading: "",
      items: [
        { id: "today", label: "Today" },
        { id: "roadmap", label: "Roadmap" },
        { id: "review", label: "Review", pill: reviewQueue.length, warn: reviewQueue.length > 0 },
        { id: "progress", label: "Progress" },
      ],
    },
    {
      heading: "Overview",
      items: [
        { id: "mindmap", label: "Mind Map" },
        { id: "overview", label: "Everything" },
        { id: "coverage", label: "Syllabus coverage" },
      ],
    },
```

- [ ] **Step 4: Register the 4 new sections and make Today the default**

Find the final `return`:
```typescript
  return (
    <Shell
      built={data.builtAt}
      regClose={data.regClose}
      groups={groups}
      sections={{
        mindmap,
        overview,
```
Add the 4 new keys as the FIRST entries in `sections` (object key order doesn't affect
`Shell`'s behavior — `first` is derived from `groups[0].items[0].id`, which Step 3 already
made `"today"` — but listing them first here keeps the file's reading order matching the nav
order):
```typescript
      sections={{
        today,
        roadmap,
        review,
        progress,
        mindmap,
        overview,
```

- [ ] **Step 5: Add the sidebar DayBar between the primary nav and the secondary groups**

This requires one small `Shell` prop addition — `shell.tsx` doesn't currently accept extra
sidebar content. Add an optional `sidebarExtra` prop:

In `shell.tsx`, find the `Shell` function's destructured props:
```typescript
export function Shell({
  groups,
  sections,
  built,
  regClose,
}: {
  groups: NavGroup[];
  sections: Record<string, ReactNode>;
  built: string;
  regClose: string;
}) {
```
Replace with:
```typescript
export function Shell({
  groups,
  sections,
  built,
  regClose,
  sidebarExtra,
}: {
  groups: NavGroup[];
  sections: Record<string, ReactNode>;
  built: string;
  regClose: string;
  sidebarExtra?: ReactNode;
}) {
```

Find the `<nav className="grid gap-5">...</nav>` block's closing `</nav>` inside `<aside>`, and
insert right after it:
```typescript
        </nav>

        {sidebarExtra}
      </aside>
```
(replacing the existing `</nav>\n      </aside>`)

Back in `page.tsx`, pass it:
```typescript
  return (
    <Shell
      built={data.builtAt}
      regClose={data.regClose}
      groups={groups}
      sidebarExtra={<DayBar days={days} />}
      sections={{
```

- [ ] **Step 6: Run the full build**

```bash
cd "C:\Users\jmraw\OneDrive\Desktop\TOMORROW\dashboard-next"
npm run data
npm run build
```
Expected: both succeed with exit code 0. `npm run build` is this project's type-check + static
export in one step — a TypeScript error in any of the new components surfaces here.

- [ ] **Step 7: Commit**

```bash
git add src/app/page.tsx src/components/shell.tsx
git commit -m "feat: wire Today/Roadmap/Review/Progress into the dashboard shell"
```

---

### Task 12: Global accent-color revision (red → coral) and phase-spectrum tokens

**Files:**
- Modify: `dashboard-next/src/app/globals.css`

**Interfaces:**
- Produces: `--brand`, `--primary`, `--ring`, `--sidebar-primary` become coral in both the
  `:root` (light) and `.dark` blocks; `--critical` stays red, decoupled; 6 new
  `--phase-*` tokens added to both blocks.

- [ ] **Step 1: Change the light-mode (`:root`) block**

Find (around line 88-99, 121-131):
```css
  --primary: #d6000a;
  --primary-foreground: #ffffff;
```
Replace with:
```css
  --primary: #ff6a4d;
  --primary-foreground: #1a0a06;
```

Find:
```css
  --ring: #d6000a;
```
Replace with:
```css
  --ring: #ff6a4d;
```

Find (the `--critical`/`--brand` block, keep `--critical` as-is, only change `--brand`):
```css
  --critical: #d6000a;
  --radius: 0.625rem;
  /* Brand accent = the same Coca-Cola red as --critical, by explicit
     request ("the red that pops out first"). This deliberately gives up
     the earlier hue-separation between "clickable/active" and "wrong" -
     accepted tradeoff, not an oversight. */
  --brand: #d6000a;
```
Replace with:
```css
  --critical: #d6000a;
  --radius: 0.625rem;
  /* Brand accent revised 15 Sep 2026: Janak asked to match Sourcemap's
     coral theme. This RE-SEPARATES brand from --critical (they used to
     intentionally match, "the red that pops out first") - critical/wrong
     stays red, brand/active becomes coral, on purpose. */
  --brand: #ff6a4d;
  --brand-ink: #1a0a06;
  /* Phase-spectrum tokens: each of the 6 day phases (5 syllabus phases +
     Consolidation/Mock) gets its own hue, sweeping the spectrum in
     syllabus order, so the Roadmap/DayBar gradient IS the phase legend. */
  --phase-general: #ff6a4d;
  --phase-physics: #f2a93c;
  --phase-maths: #4fb768;
  --phase-aviation: #2fa3a8;
  --phase-mgmt: #5b8de8;
  --phase-mock: #9d6de0;
```

Find:
```css
  --sidebar-primary: #d6000a;
  --sidebar-primary-foreground: #ffffff;
```
Replace with:
```css
  --sidebar-primary: #ff6a4d;
  --sidebar-primary-foreground: #1a0a06;
```

- [ ] **Step 2: Change the dark-mode (`.dark`) block, same substitutions**

Find:
```css
  --primary: #f40009;
  --primary-foreground: #ffffff;
```
Replace with:
```css
  --primary: #ff6a4d;
  --primary-foreground: #1a0a06;
```

Find:
```css
  --ring: #f40009;
```
Replace with:
```css
  --ring: #ff6a4d;
```

Find:
```css
  --critical: #f40009;
  --brand: #f40009;
```
Replace with:
```css
  --critical: #f40009;
  --brand: #ff6a4d;
  --brand-ink: #1a0a06;
  --phase-general: #ff6a4d;
  --phase-physics: #f2a93c;
  --phase-maths: #4fb768;
  --phase-aviation: #2fa3a8;
  --phase-mgmt: #5b8de8;
  --phase-mock: #9d6de0;
```

Find:
```css
  --sidebar-primary: #f40009;
  --sidebar-primary-foreground: #ffffff;
```
Replace with:
```css
  --sidebar-primary: #ff6a4d;
  --sidebar-primary-foreground: #1a0a06;
```

- [ ] **Step 3: Register the new tokens with Tailwind's `@theme inline` block**

Find the `@theme inline { ... }` block near the top of the file (where `--color-brand` or
similar mappings live — search `grep -n "color-brand\|@theme inline"
src/app/globals.css`). Add:
```css
  --color-phase-general: var(--phase-general);
  --color-phase-physics: var(--phase-physics);
  --color-phase-maths: var(--phase-maths);
  --color-phase-aviation: var(--phase-aviation);
  --color-phase-mgmt: var(--phase-mgmt);
  --color-phase-mock: var(--phase-mock);
```
inside that same block, next to wherever `--color-critical`/`--color-brand`-equivalent lines
already are (match the file's existing naming pattern exactly — read the 15-20 lines around
the existing color mappings before inserting, since Task 12 must not duplicate a name that's
already there).

- [ ] **Step 4: Run the palette validator if one exists**

Run: `node "C:\Users\jmraw\OneDrive\Desktop\TOMORROW\dashboard-next\scripts\validate_palette.js"`
(referenced in an existing code comment — confirm the file exists first with `ls`; if it
doesn't exist, skip this step, it's not part of this plan to create one).
Expected: passes, or the script doesn't exist and this step is skipped.

- [ ] **Step 5: Full build to confirm no CSS errors**

```bash
cd "C:\Users\jmraw\OneDrive\Desktop\TOMORROW\dashboard-next"
npm run build
```
Expected: exit code 0.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: revise accent to coral, add phase-spectrum color tokens"
```

---

### Task 13: Seed STUDY_PROGRESS.md with the two new sections

**Files:**
- Modify: `AAI/STUDY_PROGRESS.md`

**Interfaces:**
- Produces: a `## Day mastery` section (empty table, headers only — Day 1 must start at
  genuinely zero, this plan's Global Constraint) and a `## Review queue` section (populated
  with the 3 real items already known from this session's history: QNH vs QFE, the
  blood-relations same-generation trap, and the standard-integrals spacing check).

- [ ] **Step 1: Read the current file's section ordering**

Run: `grep -n "^## " "C:\Users\jmraw\OneDrive\Desktop\TOMORROW\..\AAI\STUDY_PROGRESS.md"` — no,
correct path: `grep -n "^## " "C:\Users\jmraw\OneDrive\Desktop\AAI\STUDY_PROGRESS.md"`
Note where `## Next actions` and `## Session log` currently sit, so the two new sections get
inserted in a sensible place (immediately after `## Next actions` reads naturally, since both
are "what to do next" content).

- [ ] **Step 2: Insert both sections**

Using the Edit tool, insert immediately after the `## Next actions` section's content (before
the next `##` heading):

```markdown
## Day mastery

| Day title | Explain | Recall | Apply | Spot-trap | Speed |
|---|---|---|---|---|---|

## Review queue

| Item | Rung | Due | Note |
|---|---|---|---|
| QNH vs QFE | 3 | 2026-09-16 | Repeat-miss history (26 Aug, 1 Sep) - due again after the last correct retry with the Field/Height mnemonic |
| Blood relations - same-generation "only son" trap | 2 | 2026-09-16 | Cleared once on a fresh variant, watch for it resurfacing in new phrasing |
| Standard integrals table - spacing check | 1 | 2026-09-16 | Cleared 7 Sep, this is the first spaced re-check |
```

(The `Day mastery` table is deliberately header-only, no rows — this is what makes Day 1 start
at genuinely zero progress the first time this plan's `build.py` changes run for real, per this
plan's Global Constraints.)

- [ ] **Step 3: Rebuild and confirm the real day-count and review queue**

```bash
cd "C:\Users\jmraw\OneDrive\Desktop\TOMORROW\dashboard"
python build.py
```
Expected: succeeds. Note the printed concept/day counts — this is the first time the *real*
day-sequencing numbers exist (not the mockup's illustrative ones). Read
`dashboard-next/src/data.json`'s `days` array length and `days[0]` to see the genuine Day 1
title the algorithm actually produced from Janak's real `STUDY_PROGRESS.md`.

- [ ] **Step 4: Commit both files together (they're one logical change)**

```bash
cd "C:\Users\jmraw\OneDrive\Desktop\TOMORROW\dashboard-next"
git add ../../AAI/STUDY_PROGRESS.md src/data.json
git commit -m "feat: seed Day mastery and Review queue sections, first real day-sequence build"
```

---

### Task 14: Final end-to-end verification and deploy

**Files:** none (verification + deploy only)

- [ ] **Step 1: Full refresh**

```bash
cd "C:\Users\jmraw\OneDrive\Desktop\TOMORROW\dashboard-next"
npm run refresh
```
Expected: `npm run data` (build.py --json) then `npm run build` (next build) both succeed.

- [ ] **Step 2: Visual check**

Run: `npx next start` (or reuse `npm run dev` briefly), open the app, confirm: Today loads by
default and shows Day 1 with a real title pulled from `STUDY_PROGRESS.md` (not "Classification,
series & blood relations" unless that genuinely is the first Learning/Weak/Not-started Part-A
General concept in the real file); Roadmap shows every day as "Not started"; Progress's wall is
fully empty outlines; Review shows the 3 seeded items; light/dark toggle shows coral in both
themes; every old tab (Physics, Error book, Question bank, GK, Mock test, etc.) still works
unchanged. Stop the dev/start server after checking.

- [ ] **Step 3: Push**

```bash
git push
```
Expected: GitHub Actions picks it up, live at rawaljanak.github.io/aai-study-dashboard in
1-2 minutes.

- [ ] **Step 4: Report back to Janak**

State the REAL Day 1 title, the real total day count, and the real phase breakdown the
algorithm produced from his actual 75 concepts and 22 sessions — not the mockup's illustrative
numbers. This is the number he explicitly asked to see instead of an invented one.
