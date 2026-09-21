# Chapter-Based AAI Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the AAI study dashboard's subject pages from a flat concept list into an NCERT-style Subject → Chapter → chapter-detail hierarchy, backed by an explicit `Chapter` field on every concept, and flip the tutor's default teaching mode from Teach-From-Scratch to Probe-first.

**Architecture:** Add a `Chapter` column to every concept table in `AAI/STUDY_PROGRESS.md` (source of truth). `build.py` parses it, derives `subject` from an explicit chapter→subject map (replacing the fragile keyword-guessing that mis-sorted 22 Reasoning concepts into Mathematics), groups concepts into a new `chapters` array, and matches each chapter to its formulas (`FORMULA_SHEET.md`, restructured to use the same chapter names as headings) and practice questions (`QUESTION_BANK.md`, matched by topic string against the chapter's concept names). `dashboard-next` gets a new chapter-card grid replacing each subject's flat list, and a new chapter-detail page that reuses existing lesson/formula/question components, re-scoped to one chapter.

**Tech Stack:** Python 3 (`build.py`, stdlib only), Next.js 16 / React / TypeScript (`dashboard-next`), Tailwind, static export deployed to GitHub Pages on push to `master`.

**Spec:** `docs/superpowers/specs/2026-09-16-chapter-based-aai-dashboard-design.md`

## Global Constraints

- Every markdown table edit must preserve existing `Status`/`Evidence` cell content **exactly** — this is teaching history, not to be paraphrased or lost.
- `python "C:\Users\jmraw\OneDrive\Desktop\TOMORROW\dashboard\build.py"` must succeed after every markdown edit, with `data.json` inspected (not just "exit code 0") before moving to the next task.
- `npx tsc --noEmit` clean after every React change.
- Every user-visible change verified live via Reticle (dev server + `reticle_lease`) before the final push — per this project's own `AGENTS.md`/`CLAUDE.md` Reticle rule.
- One deviation from the spec's exact wording, decided during planning: the spec said the mini per-chapter dependency diagram "extends the existing Mindmap component." On inspection, `mindmap.tsx` is a fixed whole-syllabus hub-and-spoke view with no props and no per-chapter scoping mechanism — forcing it to also render one chapter would tangle two unrelated shapes into one component. Building a small new `chapter-flow.tsx` (a vertical ordered list with connecting lines, same visual language, no new dependency) is more honest to "each file has one clear responsibility" than bending Mindmap to do both jobs. Same intent (show the plan as a diagram before teaching), simpler implementation.

---

## Task 1: Backfill `Chapter` column — Physics concept table

**Files:**
- Modify: `C:\Users\jmraw\OneDrive\Desktop\AAI\STUDY_PROGRESS.md:45-55` (the Physics concept table)

**Interfaces:**
- Produces: 9 concept rows now carry a `Chapter` value of either `Motion in a Straight Line` (5 rows) or `Motion in a Plane` (4 rows) — these two exact strings are what Task 7's `CHAPTER_SUBJECT` map and Task 6's `FORMULA_SHEET.md` headings must match verbatim.

- [ ] **Step 1: Replace the table header and all 9 rows**

Replace lines 45-55 (from `| Concept | Status | Evidence |` through the Projectile motion row) with:

```markdown
| Concept | Chapter | Status | Evidence |
|---|---|---|---|
| Displacement vs distance | Motion in a Straight Line | **Solid** | 16 Sep: direction trap (tracking last-leg direction instead of net position) missed once (3km E/2km W → said "west", correct is "1km east"), cleared same session on a fresh variant (6km N/4km S → 2km N, 10km distance, both correct) |
| Instantaneous velocity (slope of x-t graph) | Motion in a Straight Line | **Solid (watch)** | 16 Sep: taught via x=t² graph (tangent vs secant, plotted and opened on screen). Missed the constant-velocity special case twice ("instantaneous ≠ average by default" misconception) before clearing on 3rd attempt (train 80km/h constant, correctly said both same). Genuine misconception, not a slip — re-test this specific case (instant vs avg under CONSTANT velocity) again in ~1 week |
| Acceleration (slope of v-t graph) | Motion in a Straight Line | **Solid (watch)** | 16 Sep: taught via flat-vs-sloped v-t graph comparison (plotted, opened on screen). Missed once — conflated "constant" with "flat" for free fall (said flat, correct is sloped straight line since g is constant but nonzero). Cleared on fresh retry (rocket at 5 m/s² -> correctly said sloped straight line) |
| Scalar vs vector (Ch.3 started) | Motion in a Plane | **Solid** | correctly named mass as scalar (after clarifying weight-vs-mass) and force as vector, with correct reasoning both times |
| Vector addition — triangle law | Motion in a Plane | **Solid** | 3km E + 4km N example: correctly computed resultant displacement = 5 (Pythagoras), correctly said displacement ≠ distance (7), needed a prompt to articulate WHY before it stuck |
| Vector resolution (components, Ax=Acos θ, Ay=Asin θ) | Motion in a Plane | **Solid** | correctly computed magnitude from components (Ax=6, Ay=8 → A=10) first attempt, no correction needed |
| 3 kinematic equations (v=u+at, s=ut+½at², v²=u²+2as — switched to school notation 16 Sep at Janak's request, cross-verified identical to NCERT's v0/x notation) | Motion in a Straight Line | **Solid** | 16 Sep: independently solved ball-thrown-up problem (u=20, a=-10) — correctly picked v=u+at for time (t=2s) and s=ut+½at² for height (20m, one arithmetic slip mid-calculation, self-corrected to right final answer) |
| Velocity vs acceleration at a turning point (v=0 ≠ a=0) | Motion in a Straight Line | **Solid** | cleared 1 Sep (missed twice — see error book — then correctly said "constant throughout" on 3rd attempt). Status label left stale as "Learning" until 16 Sep — fixed now, no re-teach needed |
| Projectile motion (horizontal/vertical independence, time of flight, max height, range) | Motion in a Plane | **Solid (watch)** | 16 Sep: taught from scratch (NCERT Ch.3.9-sourced), worked example u=28m/s/30° cross-checked against a plotted trajectory graph (h=10m, T=2.9s, R=69m all matched). Missed once — said horizontal velocity is zero at the peak (bled vy=0 into vx). Cleared on retry (correctly said horizontal speed same at launch and landing) |
```

- [ ] **Step 2: Verify no content was lost**

Run: `git -C "C:\Users\jmraw\OneDrive\Desktop\AAI" diff STUDY_PROGRESS.md`
Expected: every `Status`/`Evidence` cell's text is byte-identical to before, the only addition is the new `Chapter` column and its 9 values.

---

## Task 2: Backfill `Chapter` column — Differentiation concept table

**Files:**
- Modify: `C:\Users\jmraw\OneDrive\Desktop\AAI\STUDY_PROGRESS.md` (the Differentiation concept table, originally lines 59-73)

**Interfaces:**
- Produces: 13 concept rows, `Chapter` = `Differentiation` for all.

- [ ] **Step 1: Replace the table header and all 13 rows**

```markdown
| Concept | Chapter | Status | Evidence |
|---|---|---|---|
| Derivative as rate of change / slope | Differentiation | Solid | read graphs correctly, explained speedometer idea |
| Power rule | Differentiation | Solid | correct across several questions |
| Standard derivatives (sin, cos, eˣ, ln) | Differentiation | Solid | cos(5x−2) done with correct minus sign |
| Chain rule — mechanics | Differentiation | Solid | 6x·e^(3x²), −5sin(5x−2), 3(2x+5)(…) all correct |
| Chain rule — "inside stays unchanged" | Differentiation | **Fixed** | failed on e^(x²) → corrected on e^(3x²) |
| Chain rule — multiply not add | Differentiation | Solid | failed once on (x²+3x)⁴ on 17 Aug, then cleared the same day on 6x·e^(3x²) and 3(2x+5)(x²+5x) |
| Roots as fractional powers | Differentiation | **Solid** | 18 Aug drill: √(6x−5) and √(x²+4) both correct first time. Weak flag cleared |
| Product rule | Differentiation | Solid | learned in one pass, incl. minus from cos |
| Product rule — both factors in each term | Differentiation | Learning | dropped the `v` in u′v on (2x+1)⁴·x |
| Quotient rule — mechanics | Differentiation | Solid | 18 Aug: x²/sin x and x/(x²+1) both correct |
| Quotient rule — sign and order | Differentiation | Solid | 18 Aug: shaky at first (added once, reversed once), then 3/3 clean on retest incl. the ad−bc shortcut |
| Maxima / minima + 2nd derivative test | Differentiation | Learning | taught twice, worked airport-parking example |
| Simplifying final answers | Differentiation | Learning | left 4/4x unsimplified once, then simplified ln(7x) correctly |
```

- [ ] **Step 2: Verify no content was lost**

Run: `git -C "C:\Users\jmraw\OneDrive\Desktop\AAI" diff STUDY_PROGRESS.md`
Expected: only the new column/values added, existing cells untouched.

---

## Task 3: Backfill `Chapter` column — Integration concept table

**Files:**
- Modify: `C:\Users\jmraw\OneDrive\Desktop\AAI\STUDY_PROGRESS.md` (the Integration concept table, originally lines 77-85)

**Interfaces:**
- Produces: 7 concept rows, `Chapter` = `Integration` for all.

- [ ] **Step 1: Replace the table header and all 7 rows**

```markdown
| Concept | Chapter | Status | Evidence |
|---|---|---|---|
| Integration as antiderivative and area | Integration | Learning | taught 18 Aug with graphs; area under y=x verified against triangle geometry |
| Power rule for integration | Integration | Solid | x^3 answered correctly as x^4/4, but +C omitted originally; both now cleared (see below) |
| The constant of integration (+C) | Integration | **Solid** | omitted repeatedly (18 Aug, and again pre-this-session) despite being flagged three times — cleared 2 Sep after a "why" re-teach (differentiation erases the constant, integration can't recover it) instead of a bare reminder. 2/2 correct with +C included on fresh integrals |
| Integrating a bare constant (treat c as c·x^0) | Integration | **Fixed** | initial slip: integrated -2 as if it were -2x (got -x^2 instead of -2x). Cleared same session after one correction + retry (∫5 dx = 5x+C correct, then ∫(6x^2-2)dx = 2x^3-2x+C correct) |
| Standard integrals | Integration | **Solid** | table redrilled 7 Sep — full recall, no errors |
| Definite integrals | Integration | **Solid** | 7 Sep: ∫0-2 3x^2 dx=8 and ∫1-3 2x dx=8, both correct first attempt, FTC applied correctly (evaluate antiderivative at bounds, subtract) |
| Signed area - below the axis counts negative | Integration | **Solid** | 7 Sep: ∫0-2 (x-1)dx=0 taught with graph reasoning (triangles cancel); ∫0-1 (2x-1)dx=0 correct AND correctly identified as net signed area, not physical area, unprompted on redirect |
```

- [ ] **Step 2: Verify no content was lost**

Run: `git -C "C:\Users\jmraw\OneDrive\Desktop\AAI" diff STUDY_PROGRESS.md`

---

## Task 4: Backfill `Chapter` column — General Intelligence table, corrected to Reasoning chapters

**Files:**
- Modify: `C:\Users\jmraw\OneDrive\Desktop\AAI\STUDY_PROGRESS.md` (the General Intelligence concept table, originally lines 89-113)

**Interfaces:**
- Produces: 23 concept rows split across 6 real Reasoning chapters: `Classification & Series` (10), `Blood Relations` (3), `Coding-Decoding` (4), `Venn Diagrams & Visual Reasoning` (3), `Direction & Ranking` (2), `Calendar & Clock Reasoning` (1). These 6 exact strings feed Task 6 (`FORMULA_SHEET.md` headings) and Task 7 (`CHAPTER_SUBJECT` map → `subject: reasoning`, correcting the existing bug where these concepts default to `subject: mathematics`).

- [ ] **Step 1: Replace the table header and all 23 rows**

```markdown
| Concept | Chapter | Status | Evidence |
|---|---|---|---|
| Classification (odd one out) | Classification & Series | Solid | Q1 taught (Freeze), N1 pattern reused correctly, Hangar modelled Q correct first time |
| Venn diagrams (subset/disjoint/overlap) | Venn Diagrams & Visual Reasoning | Solid | Q2 taught, M2 modelled question correct first time |
| Coding-decoding (word/symbol overlap) | Coding-Decoding | Solid | Q3 taught, M3 modelled question correct, explained reasoning |
| Direction sense (net displacement) | Direction & Ranking | Solid | Q4 taught, M4 modelled question correct first time |
| Ranking / linear order chains | Direction & Ranking | Solid | Q5 taught, M5 modelled question correct first time |
| Calendar reasoning (day-of-week shift) | Calendar & Clock Reasoning | Solid | Q6 taught, N1 modelled question correct first time |
| Blood relations — simple (one-layer) | Blood Relations | Solid | Q7 taught correctly |
| Blood relations — "only son/daughter" nested layer | Blood Relations | **Weak** | N2 retry: answered "Daughter" instead of "Sister" — jumped to self instead of resolving the inner relation (grandfather's only son = own father) first. 26 Aug retest: 2/3 fresh variants — correct on mother's-only-daughter and grandmother's-only-daughter forms, but missed the same-generation form ("father's only son" = speaker himself → should be Daughter) by mechanically reapplying "sister" from the earlier fix instead of re-deriving. Genuine misconception, not cleared — needs one more rep distinguishing same-generation vs one-generation-up "only son/daughter" phrasing |
| Blood relations — multi-person family table | Blood Relations | Solid | Q8 taught, correct reasoning shown |
| Sign/number interchange puzzles | Coding-Decoding | Solid | Q9 taught and understood |
| Number series — letter/number mismatch | Classification & Series | Solid | Q10 taught, N3 modelled question correct after a flawed first draft was fixed |
| Letter matrix / grid analogy | Classification & Series | Solid | Q11 taught, verified two ways |
| Number analogy (a:b :: c:?) | Classification & Series | Solid | Q12 taught |
| Arithmetic progression (spacing/intervals) | Classification & Series | Solid | Q13 taught |
| Word analogy (antonym pairs) | Classification & Series | Solid | Q14 taught, N4 modelled question correct |
| Word formation (anagram) | Classification & Series | Solid | Q15 taught, N5 modelled question correct |
| Letter analogy — alphabet mirror (27-n reflection) | Classification & Series | **Solid** | 7 Sep, paper 2 Q16: FHJL:USQO::PRTV:? Initially mis-tried as constant shift, corrected to mirror-pair rule (A<->Z,B<->Y...), got KIGE right after correction |
| Number analogy — hidden single series (not true A:B::C:D) | Classification & Series | **Solid** | 7 Sep, paper 2 Q17: 23:34::47:? — recognised the three numbers as one series with second-order differences (+11,+13,+15), answered 62 correctly |
| Word formation from letter-supply counting | Classification & Series | **Solid** | 7 Sep, paper 2 Q24: DISPROPORTIONATE -> STATION, correctly explained checking letter COUNT not just presence |
| Letter coding — uniform Caesar shift | Coding-Decoding | **Solid** | 7 Sep, paper 2 Q25: PORTER->TSVXIV (+4 shift), applied cleanly to SHOWER->WLSAIV |
| Digit-equation coding — sum of squares | Coding-Decoding | **Solid** | 7 Sep, paper 2 Q26: 452=45/371=59 (a^2+b^2+c^2) traced together via computed verification; then independently solved fresh modelled question (132=14,214=21,323=?) correct first try: 22 |
| Venn diagram — three classes, chain-overlap (not all-mutual) | Venn Diagrams & Visual Reasoning | **Solid** | 7 Sep, paper 2 Q29: Red/Shirts/Flowers -> correctly reasoned Red overlaps both Shirts and Flowers but they don't overlap each other (chain diagram, not triangle) |
| Mirror image across a vertical line | Venn Diagrams & Visual Reasoning | **Solid** | 7 Sep, paper 2 Q30: correctly explained the left-right-only flip rule (heights unchanged) after viewing the actual diagram opened on screen |
```

- [ ] **Step 2: Verify no content was lost and count the split**

Run: `git -C "C:\Users\jmraw\OneDrive\Desktop\AAI" diff STUDY_PROGRESS.md`
Then manually count rows per Chapter value in the new table: Classification & Series=10, Blood Relations=3, Coding-Decoding=4, Venn Diagrams & Visual Reasoning=3, Direction & Ranking=2, Calendar & Clock Reasoning=1. Total = 23.

---

## Task 5: Backfill `Chapter` column — Quantitative Aptitude table, split into 12 real chapters

**Files:**
- Modify: `C:\Users\jmraw\OneDrive\Desktop\AAI\STUDY_PROGRESS.md` (the Quantitative Aptitude concept table, originally lines 119-142)

**Interfaces:**
- Produces: 24 concept rows split across 12 chapters: `Averages` (1), `Ratio, Proportion & Unitary Method` (2), `Time and Work` (1), `Number System & Simplification` (3), `Partnership` (1), `Percentage` (2), `Simple & Compound Interest` (2), `Time, Speed & Distance` (2), `Mensuration` (1), `Problems on Ages` (1), `Profit and Loss` (2), `LCM and HCF` (3), `Alligation and Mixture` (1), `Heights and Distances` (1), `Quadratic Equations` (1). These exact strings feed Task 6 and Task 7.

- [ ] **Step 1: Replace the table header and all 24 rows**

```markdown
| Concept | Chapter | Status | Evidence |
|---|---|---|---|
| Averages (with prime-number filtering) | Averages | Solid | Q1 taught, P1 modelled question correct first time |
| Direct proportion / unitary method | Ratio, Proportion & Unitary Method | Solid | Q2 taught, P2 modelled question correct first time |
| Time and work (multi-stage, who-worked-when) | Time and Work | Solid | Q3 taught — resolved a genuine two-reading ambiguity correctly using the given options as a check |
| Decimal arithmetic equations | Number System & Simplification | Solid | Q4 taught |
| Number series — perfect-square differences | Number System & Simplification | Solid | Q5 taught, P3 modelled question correct after a flawed first draft was fixed live |
| Partnership / profit sharing with staggered entry | Partnership | Solid | Q6 taught |
| Percentage — mixture removal (recompute new total) | Percentage | Solid | Q7 taught |
| Simple interest — find Principal from Amount | Simple & Compound Interest | Solid | Q8 taught |
| Relative speed — opposite vs same direction | Time, Speed & Distance | Solid | Q9 taught, P4 modelled question (same direction, subtract) correct first time. 7 Sep, paper 2 Q40 (trains crossing, opposite direction): correctly applied add-speeds rule (7.67s); scraped official key (23s) verified WRONG via independent Python calc — it silently uses the same-direction subtract formula despite the question stating opposite direction. Flagged in QUESTION_BANK.md Q227, taught correct method not the bad key |
| Mensuration — ratio scaling (linear vs area vs volume) | Mensuration | Solid | Q10 taught |
| Ages — ratio and difference | Problems on Ages | Solid | Q11 taught |
| Two-digit number — digit sum/difference/product | Number System & Simplification | Solid | Q12 taught |
| Profit % — CP of X articles = SP of Y articles | Profit and Loss | Solid | Q13 taught, cross-checked with shortcut formula |
| Percentage equation algebra | Percentage | Solid | Q14 taught |
| LCM/HCF from a ratio | LCM and HCF | Solid | Q15 taught, P5 modelled question correct first time, verified by reconstructing actual numbers |
| LCM — smallest n-digit multiple | LCM and HCF | **Solid** | 7 Sep, paper 2 Q31: smallest 4-digit number divisible by 18/24/32 -> 1152, correct |
| HCF — maximum common measure | LCM and HCF | **Solid** | 7 Sep, paper 2 Q32: max container size for 850L/680L -> 170, correct |
| Ratio chaining (a:b::b:c via shared-term LCM) | Ratio, Proportion & Unitary Method | **Solid** | 7 Sep, paper 2 Q34: a:b=5:7,b:c=2:3 -> c:a=21:10, correct, new sub-type (make shared term equal via LCM before combining) |
| Alligation-style mixture blending (two solutions, weighted fractions) | Alligation and Mixture | **Solid** | 7 Sep, paper 2 Q39: two vessels blended 3:4, correct answer 11:17 derived via weighted spirit-fraction average |
| Compound interest — non-annual compounding period conversion | Simple & Compound Interest | **Solid** | 7 Sep, paper 2 Q36: 8% p.a. compounded half-yearly for 12 months -> 816, correct; new concept (halve rate, double periods) |
| Loss% when SP of n articles = CP of m articles | Profit and Loss | **Solid (key flagged)** | 7 Sep, paper 2 Q38: correctly derived loss%=20% on CP (standard convention); scraped official key (25%) verified WRONG via independent Python calc — flagged in QUESTION_BANK.md Q226, taught the correct method not the bad key |
| Boats and streams (downstream/upstream) | Time, Speed & Distance | **Solid** | 7 Sep, paper 2 Q41: boat 30km/h, stream 6km/h, 12km downstream -> 20 min, correct; first time this concept taught |
| Heights and distances (angle of elevation, two colinear points) | Heights and Distances | **Solid** | 7 Sep, paper 2 Q44: 30m tower, 30deg/45deg angles -> 30(sqrt3-1)m, correct; first time this concept taught, trig application |
| Quadratic discriminant — condition for real roots | Quadratic Equations | **Solid** | 7 Sep, paper 2 Q45: 4x^2-kx+9=0 -> discriminant rule k<=-12 or k>=12 correctly derived; paper's own answer option uses confusing non-standard notation, flagged separately from the math itself |
```

- [ ] **Step 2: Verify no content was lost and count the split**

Run: `git -C "C:\Users\jmraw\OneDrive\Desktop\AAI" diff STUDY_PROGRESS.md`
Count rows per Chapter: Averages=1, Ratio Proportion & Unitary Method=2, Time and Work=1, Number System & Simplification=3, Partnership=1, Percentage=2, Simple & Compound Interest=2, Time Speed & Distance=2, Mensuration=1, Problems on Ages=1, Profit and Loss=2, LCM and HCF=3, Alligation and Mixture=1, Heights and Distances=1, Quadratic Equations=1. Total = 24.

---

## Task 6: Restructure `FORMULA_SHEET.md` headings to match the new chapter names

**Files:**
- Modify: `C:\Users\jmraw\OneDrive\Desktop\AAI\FORMULA_SHEET.md`

**Interfaces:**
- Consumes: the exact chapter name strings produced by Tasks 1, 4, 5.
- Produces: `##` headings that are exact string matches for chapter names, so Task 7's build-time formula-matching (`f.group === chapter.name`) works with no fuzzy logic.

- [ ] **Step 1: Rename the Physics — Kinematics heading**

Change `## Physics — Kinematics` to `## Motion in a Straight Line`. Leave its 6 formula rows unchanged.

- [ ] **Step 2: Merge Physics — Vectors and Physics — Projectile Motion into one Motion in a Plane section**

Replace both `## Physics — Vectors` and `## Physics — Projectile Motion` (and their two tables) with a single section:

```markdown
## Motion in a Plane

| Formula / Rule | Meaning | Trap / Notes |
|---|---|---|
| Time of flight: T = 2u sinθ / g | u=launch speed, θ=launch angle | — |
| Max height: h = u^2 sin^2θ / 2g | — | Horizontal velocity is NEVER zero, even at max height — only vertical velocity (vy) is zero there |
| Range: R = u^2 sin2θ / g | — | Range is maximum when θ=45° (sin2θ=1) |
| Horizontal component: ux = u cosθ (constant, a=0) | Vertical component: uy = u sinθ (a=-g) | Horizontal speed at landing = horizontal speed at launch, always |
| Resultant (right-angle components): R = sqrt(Ax^2 + Ay^2) | Pythagoras on perpendicular components | — |
| Vector resolution: Ax = A cosθ, Ay = A sinθ | A=magnitude, θ=angle from x-axis | — |
```

- [ ] **Step 3: Rename Mathematics — Differentiation and Mathematics — Integration**

Change `## Mathematics — Differentiation` to `## Differentiation`. Change `## Mathematics — Integration` to `## Integration`. Leave their formula rows unchanged.

- [ ] **Step 4: Split Mathematics — Number Systems, Ratio, Aptitude Formulas into 8 chapter-matched sections**

Replace the single `## Mathematics — Number Systems, Ratio, Aptitude Formulas` section with:

```markdown
## LCM and HCF

| Formula / Rule | Meaning | Trap / Notes |
|---|---|---|
| LCM x HCF = a x b (two numbers only) | For a ratio a:b, actual numbers are a*k, b*k where k=HCF | Only true for exactly two numbers, not three or more |
| Smallest n-digit number divisible by a set | Find LCM of the set, then round UP to the smallest n-digit multiple | — |
| HCF as "maximum common measure" | Largest size/quantity that divides all given quantities exactly | Used for "largest container/tile/rope-piece size" questions |

## Ratio, Proportion & Unitary Method

| Formula / Rule | Meaning | Trap / Notes |
|---|---|---|
| Ratio chaining a:b :: b:c -> a:b:c | Make the shared term (b) equal via LCM before combining | — |

## Time, Speed & Distance

| Formula / Rule | Meaning | Trap / Notes |
|---|---|---|
| Relative speed — same direction: subtract speeds | Opposite direction: add speeds | Verify against the question's stated direction — a scraped answer key may silently apply the wrong one (see QUESTION_BANK Q227) |
| Boats and streams: downstream speed = boat+stream, upstream speed = boat-stream | — | — |

## Simple & Compound Interest

| Formula / Rule | Meaning | Trap / Notes |
|---|---|---|
| Simple Interest: SI = P*R*T/100 | P=principal, R=rate%, T=time(yrs) | — |
| Compound Interest (annual): A = P(1+R/100)^T | — | Non-annual compounding: HALVE the rate, DOUBLE the number of periods per compounding switch (e.g. half-yearly: R/2, 2T) |

## Alligation and Mixture

| Formula / Rule | Meaning | Trap / Notes |
|---|---|---|
| Alligation (mixture blending): weighted average of the two components' fractions | — | Works for any 2-component blend by given ratio, not just liquids |

## Heights and Distances

| Formula / Rule | Meaning | Trap / Notes |
|---|---|---|
| Heights and distances: tan(angle) = opposite/adjacent | Use two collinear observation points for two-angle problems | — |

## Quadratic Equations

| Formula / Rule | Meaning | Trap / Notes |
|---|---|---|
| Quadratic real-roots condition: discriminant b^2-4ac >= 0 | — | Some papers use non-standard notation for the same rule — verify against the actual math, not just the answer key's phrasing |

## Profit and Loss

| Formula / Rule | Meaning | Trap / Notes |
|---|---|---|
| Loss%/Profit% when SP of n articles = CP of m articles | Compute actual CP and SP per article, then %change on CP | Some scraped keys apply the wrong base (CP vs SP) — verify independently before trusting (see QUESTION_BANK Q226) |
```

- [ ] **Step 5: Split Reasoning — Rules into 3 chapter-matched sections**

Replace the single `## Reasoning — Rules` section with:

```markdown
## Blood Relations

| Formula / Rule | Meaning | Trap / Notes |
|---|---|---|
| Blood relations — "only son/daughter" phrasing | Identify WHOSE only son/daughter is named before deciding the generation layer | "My father's/mother's only son/daughter" = speaker's own generation -> answer is speaker's own child. "My grandfather's/grandmother's only son/daughter" = one generation up -> answer is speaker's sibling |

## Classification & Series

| Formula / Rule | Meaning | Trap / Notes |
|---|---|---|
| Alphabet mirror-pair coding: pair position n with position (27-n) | A<->Z, B<->Y, C<->X ... | Used for reflection-style letter analogies, not a constant shift |
| Hidden single series (not true A:B::C:D) | Sometimes 3+ numbers form ONE series (check 2nd-order differences) rather than a direct proportion | Don't force a ratio/analogy read when the numbers actually belong to one running series |

## Coding-Decoding

| Formula / Rule | Meaning | Trap / Notes |
|---|---|---|
| Caesar shift coding | Every letter shifts by the same fixed amount | Apply the SAME shift consistently to a new word to verify the rule before answering |
| Digit-equation coding (sum of squares) | e.g. abc -> a^2+b^2+c^2 | Verify the pattern against ALL given examples before applying to the unknown |
```

- [ ] **Step 6: Verify the file still parses correctly**

Run: `python -c "import sys; sys.path.insert(0,r'C:\Users\jmraw\OneDrive\Desktop\TOMORROW\dashboard'); import build; fs = build.load_formulas(); print(len(fs)); print(sorted(set(f['group'] for f in fs)))"`
Expected: `50` (row count unchanged — only headings restructured, no rows added or removed) and a group list containing `Motion in a Straight Line`, `Motion in a Plane`, `Differentiation`, `Integration`, `LCM and HCF`, `Ratio, Proportion & Unitary Method`, `Time, Speed & Distance`, `Simple & Compound Interest`, `Alligation and Mixture`, `Heights and Distances`, `Quadratic Equations`, `Profit and Loss`, `Blood Relations`, `Classification & Series`, `Coding-Decoding`, plus the untouched `English — Rules`, `Business Management — Core Definitions`, `Aviation GK — Key Distinctions`.

---

## Task 7: `build.py` — parse Chapter, fix subject routing, add `load_chapters()`, wire into JSON output

**Files:**
- Modify: `C:\Users\jmraw\OneDrive\Desktop\TOMORROW\dashboard\build.py`

**Interfaces:**
- Consumes: the `Chapter` column added in Tasks 1-5; the restructured `FORMULA_SHEET.md` headings from Task 6; `load_questions()`'s existing `topic` field (unchanged).
- Produces: `c["chapter"]` and corrected `c["subject"]` on every concept dict; a new `load_chapters(concepts, formulas, questions)` function returning a list of chapter dicts; a top-level `"chapters"` key in the JSON payload with shape:
  ```python
  {"slug": str, "subject": str, "name": str, "concepts": [str, ...],
   "total": int, "solid": int, "pct": int,
   "formulaCount": int, "questionIds": [str, ...]}
  ```

- [ ] **Step 1: Add the `CHAPTER_SUBJECT` map, right after the existing `SUBJECTS` list**

In `build.py`, immediately after the `SUBJ_NAME = dict(...)` line (currently line 281), add:

```python
# Explicit chapter -> subject routing, added 16 Sep 2026. Replaces keyword-guessing
# for concepts that have a Chapter value: subject_of() alone mis-sorted 22 Reasoning
# concepts (blood relations, coding-decoding, letter analogy, etc.) into Mathematics
# because none of their names or group headings contained the word "reasoning" -
# they fell through to subject_of()'s "mathematics" default. A concept with a Chapter
# in this map gets its subject from here; only a concept with no Chapter yet (there
# should be none after the 16 Sep backfill) falls back to the old keyword guess.
CHAPTER_SUBJECT = {
    "Motion in a Straight Line": "physics",
    "Motion in a Plane": "physics",
    "Differentiation": "mathematics",
    "Integration": "mathematics",
    "Classification & Series": "reasoning",
    "Blood Relations": "reasoning",
    "Coding-Decoding": "reasoning",
    "Venn Diagrams & Visual Reasoning": "reasoning",
    "Direction & Ranking": "reasoning",
    "Calendar & Clock Reasoning": "reasoning",
    "Averages": "quant",
    "Ratio, Proportion & Unitary Method": "quant",
    "Time and Work": "quant",
    "Number System & Simplification": "quant",
    "Partnership": "quant",
    "Percentage": "quant",
    "Simple & Compound Interest": "quant",
    "Time, Speed & Distance": "quant",
    "Mensuration": "quant",
    "Problems on Ages": "quant",
    "Profit and Loss": "quant",
    "LCM and HCF": "quant",
    "Alligation and Mixture": "quant",
    "Heights and Distances": "quant",
    "Quadratic Equations": "quant",
}
```

- [ ] **Step 2: Add a `reasoning` entry to `SUBJECTS` if not already present, and verify `SUBJ_NAME`**

Read the current `SUBJECTS` list (around line 270-280). Confirm it already has a `("reasoning", "Reasoning", None, ["reasoning"])` tuple (it should, since the dashboard nav already showed a "Reasoning" item with 1 concept). If it is missing, add it in the same tuple shape as the other entries, marks=`None` (Reasoning isn't separately weighted — it's part of the ~48-mark Part-A general block, same as Quantitative Aptitude).

- [ ] **Step 3: Parse the `Chapter` column and apply `CHAPTER_SUBJECT` in the concept-building loop**

In `load_aai()`, find the concept-building loop (currently around lines 505-518):

```python
    concepts = []
    for head, body in psec.items():
        t = table_with(body, "concept", "status")
        if not t["rows"]:
            continue
        group = head.split("—")[0].strip() or "Concepts"
        for r in dicts(t):
            cname = strip_md(r.get("concept", ""))
            concepts.append({"group": group,
                             "concept": cname,
                             "status": status_of(r.get("status", "")),
                             "evidence": r.get("evidence", ""),
                             "key": norm_concept(cname),
                             "subject": subject_of(group + " " + cname)})
```

Replace it with:

```python
    concepts = []
    for head, body in psec.items():
        t = table_with(body, "concept", "status")
        if not t["rows"]:
            continue
        group = head.split("—")[0].strip() or "Concepts"
        for r in dicts(t):
            cname = strip_md(r.get("concept", ""))
            chapter = strip_md(r.get("chapter", ""))
            subject = CHAPTER_SUBJECT.get(chapter) or subject_of(group + " " + cname)
            concepts.append({"group": group,
                             "concept": cname,
                             "chapter": chapter,
                             "status": status_of(r.get("status", "")),
                             "evidence": r.get("evidence", ""),
                             "key": norm_concept(cname),
                             "subject": subject})
```

- [ ] **Step 4: Run build.py and confirm the subject-routing fix**

Run: `cd "C:\Users\jmraw\OneDrive\Desktop\TOMORROW\dashboard" && python build.py`
Then: `python -c "import json; d=json.load(open(r'dashboard-next\src\data.json',encoding='utf-8')); from collections import Counter; print(Counter(c['subject'] for c in d['concepts']))"`
Expected: `reasoning` count is now 23 (was 1), `mathematics` count dropped by 22 to 23 (13 differentiation + 7 integration + 3 physics-mistagged-vectors... wait — the vectors concepts are now correctly `physics` too via `CHAPTER_SUBJECT["Motion in a Plane"] = "physics"`, so `mathematics` should now be exactly 20 (13 Differentiation + 7 Integration), `physics` should be 9 (was 6).

- [ ] **Step 5: Add `chapter` to the exported concepts list in `json_payload()`**

Find this block in `json_payload()` (currently around lines 2717-2721):

```python
        "concepts": [{"concept": strip_md(c["concept"]), "group": c["group"],
                      "status": c["status"], "subject": c["subject"],
                      "evidence": strip_md(c["evidence"]),
                      "lesson": _lesson_export(c, aai.get("lessons", {}))}
                     for c in concepts],
```

Replace it with:

```python
        "concepts": [{"concept": strip_md(c["concept"]), "group": c["group"],
                      "chapter": c.get("chapter", ""),
                      "status": c["status"], "subject": c["subject"],
                      "evidence": strip_md(c["evidence"]),
                      "lesson": _lesson_export(c, aai.get("lessons", {}))}
                     for c in concepts],
```

- [ ] **Step 6: Write `load_chapters()`**

Add this new function directly after `load_formulas()` (which Task 6's verification step already confirmed works):

```python
def load_chapters(concepts, formulas, questions):
    """
    Group concepts by (subject, chapter) into the dashboard's chapter-drill-down
    unit. A concept with no Chapter value (should not exist after the 16 Sep
    backfill, but a future concept added without one would otherwise vanish
    silently) is skipped here and still shows in the flat 'all concepts' search
    fallback via the existing `concepts` export - it just has no chapter home yet.

    Formula matching is an exact string match against FORMULA_SHEET.md's `##`
    headings (Task 6 renamed them to match chapter names 1:1, so no fuzzy logic
    is needed here). Question matching is by substring: QUESTION_BANK.md's
    `### Qn - Section - Topic` topic field is already concept-derived free text,
    so a chapter claims any question whose topic contains one of its concepts'
    names (or vice versa) - the same forgiving direction-agnostic match already
    used implicitly by the existing topic-filter buttons in gk-bank.tsx/
    question-bank.tsx.
    """
    by_key = {}
    order = []
    for c in concepts:
        chapter = c.get("chapter", "")
        if not chapter:
            continue
        key = (c["subject"], chapter)
        if key not in by_key:
            by_key[key] = []
            order.append(key)
        by_key[key].append(c)

    formula_count = {}
    for f in formulas:
        formula_count[f["group"]] = formula_count.get(f["group"], 0) + 1

    out = []
    for subject, chapter in order:
        cs = by_key[(subject, chapter)]
        names_low = [c["concept"].lower() for c in cs]
        qids = []
        for q in questions:
            qtopic = (q.get("topic") or "").lower()
            if not qtopic:
                continue
            if any(n in qtopic or qtopic in n for n in names_low):
                qids.append(q["id"])
        solid = len([c for c in cs if c["status"] in COVERED])
        out.append({
            "slug": slug(f"{subject}-{chapter}"),
            "subject": subject,
            "name": chapter,
            "concepts": [c["concept"] for c in cs],
            "total": len(cs),
            "solid": solid,
            "pct": round(100.0 * solid / len(cs)) if cs else 0,
            "formulaCount": formula_count.get(chapter, 0),
            "questionIds": qids,
        })
    return out
```

- [ ] **Step 7: Wire `load_chapters()` into `collect()` and `json_payload()`**

In `collect()` (currently):

```python
def collect():
    return {"questions": load_questions(), "aai": load_aai(), "formulas": load_formulas(),
            "markets": load_markets(), "consulting": load_consulting()}
```

Replace with:

```python
def collect():
    questions = load_questions()
    aai = load_aai()
    formulas = load_formulas()
    chapters = load_chapters(aai["concepts"], formulas, questions)
    return {"questions": questions, "aai": aai, "formulas": formulas,
            "chapters": chapters, "markets": load_markets(),
            "consulting": load_consulting()}
```

In `json_payload()`, add `"chapters": d["chapters"],` next to the existing `"formulas": d["formulas"],` line.

- [ ] **Step 8: Run build.py and inspect the chapters array**

Run: `cd "C:\Users\jmraw\OneDrive\Desktop\TOMORROW\dashboard" && python build.py`
Then: `python -c "import json; d=json.load(open(r'dashboard-next\src\data.json',encoding='utf-8')); print(len(d['chapters'])); [print(c['subject'], c['name'], c['total'], c['solid'], c['formulaCount'], len(c['questionIds'])) for c in d['chapters']]"`
Expected: 23 chapters total (2 physics + 2 maths + 6 reasoning + 12 quant + 1... recount: physics=2, maths=2, reasoning=6, quant=15 wait — quant chapter count is 15 distinct names from Task 5's list (Averages, Ratio/Prop/Unitary, Time and Work, Number System & Simplification, Partnership, Percentage, Simple & Compound Interest, Time Speed & Distance, Mensuration, Problems on Ages, Profit and Loss, LCM and HCF, Alligation and Mixture, Heights and Distances, Quadratic Equations = 15). Total chapters = 2+2+6+15 = 25. Every chapter's `total` should sum back to 76 across all of them (9+13+7+23+24=76), and `formulaCount` should be nonzero for every chapter that has a matching FORMULA_SHEET.md heading (all of Physics/Maths/Reasoning's chapters do; some Quant chapters like "Averages", "Time and Work", "Mensuration", "Problems on Ages", "Percentage", "Partnership", "Number System & Simplification" have no matching FORMULA_SHEET.md section yet and will correctly show `formulaCount: 0` - that's an accurate reflection of current content, not a bug).

- [ ] **Step 9: Commit the markdown and build.py changes together**

```bash
cd "C:\Users\jmraw\OneDrive\Desktop\AAI" && git add STUDY_PROGRESS.md FORMULA_SHEET.md
cd "C:\Users\jmraw\OneDrive\Desktop\TOMORROW\dashboard" && git diff --stat build.py
```

(AAI is not its own git repo per this project's existing setup — confirm with `git -C "C:\Users\jmraw\OneDrive\Desktop\AAI" status` whether it is tracked anywhere before attempting a commit there; if it is not a git repo, skip committing it and only commit `build.py` + the regenerated `data.json` from `dashboard-next`, matching how this project has handled AAI markdown changes in every prior session this transcript covers.)

```bash
cd "C:\Users\jmraw\OneDrive\Desktop\TOMORROW\dashboard-next" && git add ../dashboard/build.py src/data.json
git commit -m "feat: add Chapter field, fix Reasoning subject mis-routing, add chapters to data.json"
```

---

## Task 8: New `chapter-flow.tsx` component and TS types

**Files:**
- Create: `C:\Users\jmraw\OneDrive\Desktop\TOMORROW\dashboard-next\src\lib\chapter-types.ts`
- Create: `C:\Users\jmraw\OneDrive\Desktop\TOMORROW\dashboard-next\src\components\chapter-flow.tsx`

**Interfaces:**
- Consumes: `data.chapters` (Task 7's output, already in `data.json` by this point).
- Produces: `Chapter` TS type; `<ChapterFlow chapter={Chapter} />` — a vertical ordered list of the chapter's concept names, each as a small card, connected by a line, showing teaching order (the "plan as a diagram" step from the spec).

- [ ] **Step 1: Write `chapter-types.ts`**

```typescript
// src/lib/chapter-types.ts
//
// Mirrors the shape build.py's load_chapters() writes into data.json (see
// TOMORROW/dashboard/build.py and docs/superpowers/specs/2026-09-16-chapter-based-
// aai-dashboard-design.md).

export interface Chapter {
  slug: string;
  subject: string;
  name: string;
  concepts: string[];
  total: number;
  solid: number;
  pct: number;
  formulaCount: number;
  questionIds: string[];
}
```

- [ ] **Step 2: Write `chapter-flow.tsx`**

```typescript
"use client";

/**
 * Chapter flow.
 *
 * A vertical ordered list of a chapter's concepts, connected by a line, shown
 * before the concept detail below it - the "show the plan as a diagram before
 * teaching" step from the AI-learning-philosophy video Janak shared (16 Sep).
 * Deliberately not the whole-syllabus Mindmap component: that one is a fixed
 * hub-and-spoke over every subject with no per-chapter scoping, and bending it
 * to also draw one chapter's teaching order would tangle two unrelated shapes
 * into one component.
 */

import type { Chapter } from "@/lib/chapter-types";

export function ChapterFlow({ chapter }: { chapter: Chapter }) {
  return (
    <ol className="grid gap-0">
      {chapter.concepts.map((name, i) => (
        <li key={name} className="relative flex gap-3 pb-3 last:pb-0">
          {i < chapter.concepts.length - 1 ? (
            <span
              aria-hidden
              className="absolute left-[11px] top-6 h-full w-px bg-border"
            />
          ) : null}
          <span className="relative z-10 grid size-6 shrink-0 place-items-center rounded-full border-2 border-[var(--brand)] bg-card text-[10.5px] font-bold text-[var(--brand)]">
            {i + 1}
          </span>
          <span className="pt-0.5 text-[13px] font-medium leading-snug">
            {name}
          </span>
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `cd "C:\Users\jmraw\OneDrive\Desktop\TOMORROW\dashboard-next" && npx tsc --noEmit`
Expected: no errors (this component isn't imported anywhere yet, so it only needs to type-check standalone).

---

## Task 9: New `chapter-detail.tsx` page component

**Files:**
- Create: `C:\Users\jmraw\OneDrive\Desktop\TOMORROW\dashboard-next\src\components\chapter-detail.tsx`

**Interfaces:**
- Consumes: `Chapter` (Task 8), `ChapterFlow` (Task 8), `ConceptRow` (existing, `@/components/concept-lesson`), `Card`/`Stat`/`Empty` (existing, `@/components/ui-kit`), `data.concepts`/`data.formulas`/`data.questions` (existing exports, extended by Task 7).
- Produces: `<ChapterDetail chapter={Chapter} />`, used by Task 10's per-chapter sections in `page.tsx`.

- [ ] **Step 1: Write `chapter-detail.tsx`**

```typescript
"use client";

/**
 * One chapter's full page: concepts in teaching order (existing lesson-expand
 * UI, unchanged), the formulas and practice questions build.py already
 * matched to this chapter by name/topic, and the ordered concept-flow diagram
 * up top. Every piece here reuses an existing component, scoped to one
 * chapter - no new UI paradigm.
 */

import { Card, Empty, Stat } from "@/components/ui-kit";
import { ConceptRow } from "@/components/concept-lesson";
import { ChapterFlow } from "@/components/chapter-flow";
import type { Chapter } from "@/lib/chapter-types";
import data from "@/data.json";

export function ChapterDetail({ chapter }: { chapter: Chapter }) {
  const concepts = data.concepts.filter((c) => chapter.concepts.includes(c.concept));
  const formulas = data.formulas.filter((f) => f.group === chapter.name);
  const questions = data.questions.filter((q) => chapter.questionIds.includes(q.id));

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="concepts" value={chapter.total} />
        <Stat label="solid or better" value={chapter.solid} of={chapter.total} />
        <Stat label="practice questions" value={questions.length} />
      </div>

      <Card title="Teaching order" sub="The plan for this chapter, one concept at a time.">
        <ChapterFlow chapter={chapter} />
      </Card>

      <Card title={`${chapter.name} concepts`} sub="Tap a concept to open the full lesson.">
        <div className="-mt-1">
          {concepts.map((c) => (
            <ConceptRow key={c.concept} c={c} />
          ))}
        </div>
      </Card>

      {formulas.length ? (
        <Card title="Formulas in this chapter">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-border text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  <th className="py-2 pr-4">Formula / Rule</th>
                  <th className="py-2 pr-4">Meaning</th>
                  <th className="py-2">Trap / Notes</th>
                </tr>
              </thead>
              <tbody>
                {formulas.map((f, i) => (
                  <tr key={i} className="border-b border-border/60 align-top last:border-0">
                    <td className="py-2.5 pr-4 font-mono text-[12.5px] font-medium">{f.formula}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{f.meaning || "—"}</td>
                    <td className="py-2.5 text-muted-foreground">{f.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {!questions.length ? (
        <Empty
          msg="No practice questions matched to this chapter yet."
          hint="Add QUESTION_BANK.md entries whose Topic field names one of this chapter's concepts, then run python build.py."
        />
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `cd "C:\Users\jmraw\OneDrive\Desktop\TOMORROW\dashboard-next" && npx tsc --noEmit`
Expected: no errors.

---

## Task 10: Wire chapters into `page.tsx` — chapter-card grid + searchable fallback

**Files:**
- Modify: `C:\Users\jmraw\OneDrive\Desktop\TOMORROW\dashboard-next\src\app\page.tsx`

**Interfaces:**
- Consumes: `ChapterDetail` (Task 9), `Chapter` (Task 8), `data.chapters` (Task 7).
- Produces: one `chapter-<slug>` nav item + section per chapter (same `Object.fromEntries` pattern the file already uses for `subjectSections`/`graphSections`); each subject page's body replaced by a chapter-card grid + collapsed concept search.

- [ ] **Step 1: Import the new pieces**

Near the top of `page.tsx`, alongside the existing `import { GkBank } from "@/components/gk-bank";` line, add:

```typescript
import { ChapterDetail } from "@/components/chapter-detail";
import type { Chapter } from "@/lib/chapter-types";
```

- [ ] **Step 2: Add a `useState` import for the search box**

`page.tsx` is currently a server component (no `"use client"` at the top, no hooks). The new "search all concepts" box needs client state. Add `"use client";` as the very first line of the file, and `import { useMemo, useState } from "react";` alongside the other imports. (This makes the whole page a client component — acceptable here since every child it renders is already `"use client"` itself; there is no server-only work in this file to lose.)

- [ ] **Step 3: Build a `chaptersBySubject` lookup and replace `subjectSections`**

Find the existing `subjectSections` block (currently lines 312-340):

```typescript
  const subjectSections = Object.fromEntries(
    data.subjects.map((s) => {
      const cs = data.concepts.filter((c) => c.subject === s.key);
      return [
        `subject-${s.key}`,
        <div key={s.key} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="concepts logged" value={s.logged} />
            <Stat label="solid or better" value={s.solid} of={s.logged} />
            <Stat
              label="worth in the exam"
              value={s.marks ?? "—"}
              note={s.marks ? "marks" : "not separately weighted"}
            />
          </div>
          <Card
            title={`${s.name} concepts`}
            sub={`${s.pct}% solid or better · tap a concept to open the full lesson`}
          >
            <div className="-mt-1">
              {cs.map((c) => (
                <ConceptRow key={c.concept} c={c} />
              ))}
            </div>
          </Card>
        </div>,
      ];
    })
  );
```

Replace it with:

```typescript
  const chapters = data.chapters as Chapter[];

  const subjectSections = Object.fromEntries(
    data.subjects.map((s) => {
      const cs = data.concepts.filter((c) => c.subject === s.key);
      const chs = chapters.filter((c) => c.subject === s.key);
      return [
        `subject-${s.key}`,
        <SubjectPage
          key={s.key}
          subjectName={s.name}
          logged={s.logged}
          solid={s.solid}
          marks={s.marks}
          pct={s.pct}
          chapters={chs}
          concepts={cs}
        />,
      ];
    })
  );

  const chapterSections = Object.fromEntries(
    chapters.map((ch) => [`chapter-${ch.slug}`, <ChapterDetail key={ch.slug} chapter={ch} />])
  );
```

- [ ] **Step 4: Write the `SubjectPage` helper component in the same file**

Add this new function above `export default function Page()`:

```typescript
function SubjectPage({
  subjectName,
  logged,
  solid,
  marks,
  pct,
  chapters,
  concepts,
}: {
  subjectName: string;
  logged: number;
  solid: number;
  marks: number | null;
  pct: number;
  chapters: Chapter[];
  concepts: (typeof data.concepts)[number][];
}) {
  const [query, setQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const filtered = useMemo(
    () =>
      query.trim()
        ? concepts.filter((c) =>
            c.concept.toLowerCase().includes(query.trim().toLowerCase())
          )
        : concepts,
    [concepts, query]
  );

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="concepts logged" value={logged} />
        <Stat label="solid or better" value={solid} of={logged} />
        <Stat
          label="worth in the exam"
          value={marks ?? "—"}
          note={marks ? "marks" : "not separately weighted"}
        />
      </div>

      {chapters.length ? (
        <Card title={`${subjectName} chapters`} sub={`${pct}% solid or better overall`}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {chapters.map((ch) => (
              <button
                key={ch.slug}
                type="button"
                onClick={() => {
                  window.location.hash = `chapter-${ch.slug}`;
                  window.scrollTo({ top: 0 });
                }}
                className="rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-[var(--brand)]/50"
              >
                <p className="text-[13.5px] font-semibold">{ch.name}</p>
                <p className="mt-1 text-[11.5px] text-muted-foreground">
                  {ch.total} concept{ch.total === 1 ? "" : "s"} · {ch.pct}% solid
                </p>
              </button>
            ))}
          </div>
        </Card>
      ) : (
        <Empty
          msg={`No chapters assigned yet for ${subjectName}.`}
          hint="Add a Chapter column value in AAI/STUDY_PROGRESS.md's concept table, then run python build.py."
        />
      )}

      <div>
        <button
          type="button"
          onClick={() => setShowSearch((v) => !v)}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          {showSearch ? "Hide concept search" : "Search all concepts"}
        </button>
        {showSearch ? (
          <Card
            className="mt-3"
            title="All concepts"
            sub="Quick lookup by name, across every chapter."
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search concept name..."
              className="mb-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <div className="-mt-1">
              {filtered.map((c) => (
                <ConceptRow key={c.concept} c={c} />
              ))}
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Add chapter nav items to the "AAI exam" group**

Find the `groups` array's `"AAI exam"` heading block (currently lines 56-87). After the `...data.subjects.map(...)` spread, add chapter items grouped under their subject, immediately following each subject's own nav item. Since the existing structure maps subjects in one pass, change:

```typescript
        ...data.subjects.map((s) => ({
          id: `subject-${s.key}`,
          label: s.name,
          pill: s.logged,
        })),
```

to:

```typescript
        ...data.subjects.flatMap((s) => [
          { id: `subject-${s.key}`, label: s.name, pill: s.logged },
          ...chapters
            .filter((c) => c.subject === s.key)
            .map((c) => ({
              id: `chapter-${c.slug}`,
              label: `\u00A0\u00A0${c.name}`,
              pill: c.total,
            })),
        ]),
```

(the two non-breaking spaces indent chapter items under their subject in the sidebar without adding a new `NavGroup` nesting level, which `Shell` doesn't support today — keeping this change inside the existing flat `NavItem[]` shape rather than modifying `shell.tsx`'s rendering).

Note this reads `chapters` before it is defined later in the function body — move the `const chapters = data.chapters as Chapter[];` line (from Step 3) to the top of `Page()`, immediately after the existing `const queue = ...` line, so it is available when `groups` is built.

- [ ] **Step 6: Add `chapterSections` to the final `sections` object**

Find the `sections={{...}}` block passed to `<Shell>` (currently lines 503-520). Add `...chapterSections,` on its own line, next to `...subjectSections,`.

- [ ] **Step 7: Type-check and build**

Run: `cd "C:\Users\jmraw\OneDrive\Desktop\TOMORROW\dashboard-next" && npx tsc --noEmit`
Expected: no errors. Fix any reported type mismatches (likely candidates: `Card`'s `className` prop existing — check `ui-kit.tsx`'s `Card` signature already read in this session, which does accept `className`).

Then: `cd "C:\Users\jmraw\OneDrive\Desktop\TOMORROW\dashboard" && python build.py`
Expected: succeeds, `data.json` regenerated with no schema change needed (Task 7 already added `chapters`).

---

## Task 11: Rewrite `AAI/CLAUDE.md`'s Teaching-first rule to Probe-first

**Files:**
- Modify: `C:\Users\jmraw\OneDrive\Desktop\AAI\CLAUDE.md`

**Interfaces:**
- None (markdown instructions only, no code consumes this file programmatically).

- [ ] **Step 1: Replace the "Teaching-first rule" section**

Find the section starting `## Teaching-first rule — non-negotiable (added 17 Aug 2026, SUPERSEDES the old diagnostic-first first session)` through the paragraph ending `Do not ask a formal question until the core concept has been explained.` Replace the entire section with:

```markdown
## Probe-first rule — non-negotiable (added 16 Sep 2026, SUPERSEDES the 17 Aug
Teaching-first rule)

Default mode is now **Probe → Plan → Teach**, reversing the 17 Aug decision. Janak
explicitly chose this switch on 16 Sep after watching "How I Use AI to Learn Things"
(youtu.be/kzcI5F4tGiU) and discussing the trade-off directly — this is a deliberate
reversal, not an oversight, and the 17 Aug rationale (he disliked being quizzed cold)
is superseded by his own informed choice, not forgotten.

When starting a new chapter (a Chapter value not yet present in STUDY_PROGRESS.md, or
explicitly requested), before teaching:

1. **Probe**: ask a short series of graded multiple-choice questions covering the
   chapter's concepts, starting broad and narrowing toward Janak's actual edge of
   understanding on each one. Do not reveal answers during the probe — this is
   measurement, not teaching yet.
2. **Plan**: from the probe results, state in one or two sentences where his edge
   actually is for this chapter, and confirm the teaching order (usually the order
   the chapter's concepts already appear in STUDY_PROGRESS.md, i.e. the order shown
   in the dashboard's chapter-flow diagram).
3. **Teach**: proceed exactly as before — one concept at a time, simple then
   technical, one gentle check-question per step before advancing (see "Teaching
   method" and "Knowledge checks" below, both still in force).

This does not mean starting a probe from zero background: if Janak has already stated
his prior exposure to a topic (PCM, B.E., MBA), the probe can start narrower than
"absolute beginner," same as the old rule's diagnosis step already allowed.

Do not run a full probe for **revision** of an already-taught chapter, or for a
single already-familiar concept requested by name — the probe is for *new* chapters
only.
```

- [ ] **Step 2: Add the Chapter-assignment step to the end-of-session checklist**

Find the "At the end:" numbered list under "At the start of each session:" (currently the block beginning `1. Update progress and errors.` through `4. State the next exact study activity.`). After item 1 (`Update progress and errors.`), insert a new item 2, renumbering the rest:

```markdown
2. **Assign or confirm each newly-taught/newly-corrected concept's `Chapter` value**
   in `STUDY_PROGRESS.md`'s concept table — the dashboard's chapter pages are built
   from this column, so a concept added without one has no chapter home until fixed.
```

- [ ] **Step 3: Verify the file still reads sensibly**

Run: `git -C "C:\Users\jmraw\OneDrive\Desktop\AAI" diff CLAUDE.md 2>&1 || diff <(echo) <(echo)`

(If `AAI` is not a tracked git repo, per Task 7 Step 9's note, just re-read the file with the Read tool and confirm no other section references "Teaching-first" or the old rule name in a way that would now be stale — grep for "Teaching-first" across the file to be sure no cross-reference was missed.)

---

## Task 12: Full verification and push

**Files:**
- None new — this task verifies everything from Tasks 1-11 together.

- [ ] **Step 1: Rebuild from a clean slate**

Run: `cd "C:\Users\jmraw\OneDrive\Desktop\TOMORROW\dashboard" && python build.py`
Expected: succeeds, no exceptions, `data.json` size increases (new `chapters` key, `chapter` field on every concept).

- [ ] **Step 2: Type-check**

Run: `cd "C:\Users\jmraw\OneDrive\Desktop\TOMORROW\dashboard-next" && npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Start the dev server and get a Reticle lease**

Run in background: `cd "C:\Users\jmraw\OneDrive\Desktop\TOMORROW\dashboard-next" && npm run dev`
Then call `reticle_lease { action: "acquire", url: "http://localhost:3000", projectId: "dashboard-next-416138ce" }` (the dev server was already Reticle-instrumented earlier this session — no re-init needed).

- [ ] **Step 4: Drive and verify the chapter flow live**

Using `reticle_snapshot` + `reticle_act_and_wait`:
1. Open the Physics subject page (`#subject-physics`). Assert two chapter cards appear: "Motion in a Straight Line" and "Motion in a Plane", with correct concept counts (5 and 4).
2. Click "Motion in a Straight Line". Assert the URL hash becomes `#chapter-motion-in-a-straight-line` (or whatever `slug()` produces — check the actual value from Step 1's data dump rather than assuming), the `ChapterFlow` diagram renders 5 numbered items, the concept list below shows the same 5 concepts expandable via the existing lesson UI, and the formula table shows the "Motion in a Straight Line" formula rows.
3. Go to the Mathematics subject page. Confirm it now shows only "Differentiation" and "Integration" chapters — not the old 45-concept flat list, and not any Reasoning concepts.
4. Go to the Reasoning subject page (should now exist in the nav with its 23 concepts, previously only 1). Confirm 6 chapter cards appear (Classification & Series, Blood Relations, Coding-Decoding, Venn Diagrams & Visual Reasoning, Direction & Ranking, Calendar & Clock Reasoning) with counts 10/3/4/3/2/1.
5. On any subject page, click "Search all concepts", type part of a concept name (e.g. "kinematic"), and assert the flat list filters to the matching concept without needing to know its chapter.
6. Check the browser console via `reticle_console` after each navigation — assert no new errors introduced.

- [ ] **Step 5: Release the lease**

Call `reticle_lease { action: "release", sessionId: "<the id from Step 3>" }`.

- [ ] **Step 6: Commit and push**

```bash
cd "C:\Users\jmraw\OneDrive\Desktop\TOMORROW\dashboard-next"
git add -A
git commit -m "feat: chapter-based subject pages, Probe-first teaching mode

Subject pages now show NCERT-style chapter cards instead of a flat concept
list, each opening a chapter-detail page with the concept-flow diagram,
lesson content, matched formulas, and matched practice questions together.
Backfilled a Chapter field for all 76 existing concepts, which also fixed
a real bug: 22 Reasoning concepts were silently mis-sorted into
Mathematics because build.py's subject_of() keyword guesser had no
'reasoning' signal to match on.

Also flips AAI/CLAUDE.md's teaching default from Teach-From-Scratch to
Probe-first, per Janak's explicit 16 Sep decision after watching
'How I Use AI to Learn Things' (youtu.be/kzcI5F4tGiU)."
git push
```

- [ ] **Step 7: Confirm the GitHub Pages deploy**

Run: `gh run list --limit 2`
Expected: the new commit's "Deploy dashboard to GitHub Pages" run shows `completed success` within about a minute.

---

## Self-review notes (fixed inline while writing this plan)

- Corrected the spec's claim that the chapter diagram "extends the existing Mindmap
  component" — `mindmap.tsx` has no props and a fixed whole-syllabus shape; built a
  small new `chapter-flow.tsx` instead, documented as a deliberate deviation in
  Global Constraints.
- Verified every concept-count claim (9 Physics, 13 Differentiation, 7 Integration,
  23 Reasoning, 24 Quant = 76 total) against the actual current `STUDY_PROGRESS.md`
  content read in this session, not assumed from memory.
- Confirmed `load_questions()`'s existing `topic` field is free text derived from
  concept names (via the `### Qn · Section · Topic` header format), which is what
  makes Task 7's build-time substring matching for `questionIds` reliable without
  new fuzzy-matching code.
- Flagged the `AAI` folder's git-tracking status as unconfirmed (Task 7 Step 9,
  Task 11 Step 3) rather than assuming — this session's prior commits only ever
  touched `dashboard-next`'s own repo for the markdown files living under `AAI/`,
  suggesting `AAI` may not be independently tracked; the plan handles both cases.
