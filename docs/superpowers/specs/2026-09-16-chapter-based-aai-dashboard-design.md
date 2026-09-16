# Chapter-based AAI dashboard restructure — design

## Why

Janak said the flat per-subject concept list (Physics: 6 concepts in one undifferentiated
list; Mathematics: 45 concepts, several visibly mistagged) doesn't work as a quick-revision
reference. He wants an NCERT-style structure: Subject → Chapter → a chapter page bundling
that chapter's concepts, teaching content, worked examples, graphs, formulas, and diagrams
together, the way a real textbook chapter reads.

He also asked me to watch "How I Use AI to Learn Things" (youtu.be/kzcI5F4tGiU) and fold its
teaching philosophy into the restructure, not just the page layout.

## Video principles adopted

From the transcript (Pi Agent harness demo, differential-forms teaching session):

1. **One trusted interface aggregating many sources** — validates the existing
   one-canonical-dashboard decision (24 Aug). No change needed here.
2. **Optimized teaching**: teach at the exact edge of current understanding.
3. **Optimized allocation of mental resources**: all struggle goes into the material itself;
   logistics (sourcing, planning, fact-checking) is absorbed by the system. Already true here
   (NCERT sourcing, live fact-checking via agent-reach, question banking) — no change needed.
4. **Probe → Plan → Teach.** Probe: graded MCQs, broad then binary-searching the edge of
   understanding. Plan: reason out a concept-dependency graph, show it to the learner as a
   diagram before teaching (also forces the AI to commit to a real plan, not wing it live).
   Teach: walk the dependency graph one node at a time, one check-question per step before
   advancing.
5. **Feedback per step**, for three reasons: prevents self-gaslighting about understanding,
   keeps the system calibrated, and practice itself helps the material lock in.

### Explicit decision, made with Janak in this session

Principle 4's "Probe" step **reverses** the AAI CLAUDE.md rule set 17 Aug ("Teaching-first —
non-negotiable... Default mode is Teach From Scratch, not diagnostic testing"), which existed
because Janak disliked being quizzed cold. He was asked directly and chose to **switch** to a
probe-first model. `AAI/CLAUDE.md` gets rewritten as part of this change (see below) —
this is a deliberate, explicit reversal, not an oversight.

Principles 1, 2, 3, and 5 are already true of the existing setup and need no process change —
only the dashboard's information architecture (this spec) and the probe step (the CLAUDE.md
edit) are new.

## Scope

In scope:
- New `Chapter` field on every concept, backfilled for all existing concepts.
- Subject pages restructured: chapter cards (primary) + a demoted searchable "all concepts"
  fallback (decided over full removal — quick lookup by name across chapters has real value
  for a revision tool, and reuses the existing flat list at near-zero cost).
- New chapter detail page: mini dependency diagram, concepts in teaching order (existing
  lesson-expand UI, just re-scoped), chapter-matched formulas, chapter-matched practice
  questions, chapter-matched graphs.
- `AAI/CLAUDE.md` rewritten: Teach-From-Scratch default → Probe-first default per chapter.

Out of scope (this pass):
- Retroactively probing chapters already taught (Motion in a Straight Line, Projectile
  Motion, Differentiation, Integration, etc.) — probe-first applies going forward only.
- Full chapter taxonomy for Reasoning/GK/English/Business Management beyond a first
  reasonable pass at backfill time (these aren't NCERT subjects, so "chapter" means
  "exam-syllabus topic cluster" — e.g. Reasoning's "General Intelligence" grab-bag becomes
  real clusters like Classification & Analogy, Coding-Decoding, Blood Relations, Series &
  Patterns, Visual Reasoning).
- Migrating historical session-log/error-book entries to carry a Chapter tag retroactively.
- Any change to the Today/Roadmap/Pentagon-wall day-plan feature (separate system, already
  fixed this session).

## Data model

### `STUDY_PROGRESS.md`

Add a `Chapter` column to every concept table, next to `Concept`:

```markdown
| Concept | Chapter | Status | Evidence |
|---|---|---|---|
| Displacement vs distance | Motion in a Straight Line | Solid | ... |
```

Backfill (one-time, done as part of implementation, not enumerated fully here — the method):
- Physics: split the single "Physics" group into "Motion in a Straight Line" (kinematics: 5
  concepts) and "Motion in a Plane" (vectors + projectile motion: 4 concepts).
- Mathematics: "Differentiation" (13) and "Integration" (7) chapters already have clean
  natural boundaries — just formalize as the Chapter value. The 22 concepts currently
  mistagged `subject: mathematics, group: "General Intelligence"` get corrected to
  `subject: reasoning` and split into real Reasoning chapters.
- Quantitative Aptitude: split the 24 lumped concepts into real chapters (Averages,
  Percentages, Profit & Loss, Simple/Compound Interest, Time & Work, Time & Distance /
  Boats & Streams, Ratio & Proportion / Partnership, Number System / LCM-HCF, Mensuration,
  Ages, Alligation, Heights & Distances, Quadratic Equations).
- Aviation/English/GK/Business Management: assign first-pass reasonable chapter clusters at
  backfill time.

### `build.py`

- Parse the new `Chapter` column into each concept dict (`c["chapter"]`).
- New `load_chapters(concepts)`: group concepts by `(subject, chapter)`, producing:
  ```python
  {"subject": "physics", "chapter": "Motion in a Straight Line", "slug": "...",
   "concepts": [...], "solid": n, "total": n, "pct": ...}
  ```
- `json_payload()`: add top-level `"chapters": [...]`.
- Formula matching: `FORMULA_SHEET.md`'s existing `##` group headings get renamed to match
  chapter names exactly where they overlap (e.g. "Physics — Kinematics" → "Motion in a
  Straight Line") so a chapter page can filter `data.formulas` by `f.group === chapter.name`
  with no new column needed there.
- Question matching: chapter page filters `data.questions` by fuzzy concept-name match
  against the chapter's concept list, reusing the existing `norm_concept()`/stem-matching
  approach already used for error-book theme attribution.
- Graphs: already tied to concepts via `subject`; extend to filter by the concept keys in a
  given chapter.

### `lib/day-types.ts`-equivalent

New `Chapter` TS interface mirroring the JSON shape above, in a new or existing lib file.

## Pages / components

- **Subject page** (`page.tsx` subjectSections): replace the flat `cs.map(ConceptRow)` body
  with a grid of chapter cards (name, concept count, % solid, marks-weight badge). Each card
  is a `<button>` setting `window.location.hash = "#chapter-<slug>"`, following the exact
  pattern `Shell` already uses for `subject-*`/`graph-*` ids — no new routing mechanism.
  Below the grid: a collapsed "Search all concepts" affordance wrapping the existing
  `ConceptRow` list, filtered by a text input.
- **New `chapter-detail.tsx` component**: header (chapter name, subject, stats) then:
  - Mini dependency diagram — extends the existing `Mindmap` component with a `scope` prop
    (chapter's concept keys) rather than building new visualization code.
  - Concept list using the existing `ConceptRow`/`LessonText` lesson-expand UI, unchanged,
    just fed the chapter-scoped concept array.
  - "Formulas in this chapter" — small table, same rendering as `formula-sheet.tsx`,
    filtered to `f.group === chapter.name`.
  - "Practice questions" — reuses `QuestionCard`/`PracticeQuiz` from `question-bank.tsx`/
    `gk-bank.tsx`, filtered to the fuzzy-matched question set.
  - Graphs section reusing `LessonGraphPanel`, filtered to the chapter's concepts.
- `page.tsx`: generate one nav item + one section per chapter, same `Object.fromEntries`
  pattern already used for `subjectSections`/`graphSections`.

No new UI paradigm is introduced anywhere — every piece of a chapter page reuses an existing
component, re-scoped. The only genuinely new component is the thin `chapter-detail.tsx`
composition and the chapter-card grid inside the subject page.

## `AAI/CLAUDE.md` changes

- Replace the "Teaching-first rule — non-negotiable" section with a **Probe-first** rule:
  before teaching a new chapter, run a short graded-MCQ probe (broad first, then narrowing
  toward Janak's actual edge of understanding on each concept the chapter will need), then
  teach from exactly that edge — not from absolute scratch, and not skipping straight to
  hard content either.
- Add "assign/confirm this session's concepts' `Chapter` value in STUDY_PROGRESS.md" to the
  end-of-session checklist, alongside the existing Formula Sheet and Day-mastery rules.
- Note explicitly that this reverses the 17 Aug decision, and why (Janak's explicit call,
  16 Sep, informed by the "How I Use AI to Learn Things" video).

## Migration / risk

- Backfilling `Chapter` for 76 existing concepts is mechanical but must preserve every
  existing `Status`/`Evidence` cell exactly — table edits, not rewrites, to avoid silently
  losing session history.
- `build.py`'s existing `subject_of()` keyword router mis-sorted 22 Reasoning concepts into
  Mathematics; the Chapter backfill is also the moment to fix their `subject` field, verified
  by checking `data.json` concept counts per subject before/after (already done once this
  session for the Physics stale-status fix — same verification pattern applies).
- Every rendering change gets verified live via Reticle (dev server + browser lease) before
  push, same as this session's Formula Sheet and Day-mastery fixes — not just `tsc --noEmit`.

## Testing / verification plan

- `python build.py` succeeds, `data.json` gains `chapters` array with sane counts per subject.
- `npx tsc --noEmit` clean.
- Reticle-driven check: open a subject page, confirm chapter cards render with correct
  counts; click into a chapter, confirm the mini dependency diagram, concept list, formula
  table, and question list all show content scoped correctly (not full-subject content
  leaking in); confirm the "search all concepts" fallback still finds a concept by name.
- Spot-check the Reasoning-subject-reassignment: the 22 previously-mistagged concepts should
  now show under `Reasoning`, not `Mathematics`, and Mathematics's concept count should drop
  accordingly.
