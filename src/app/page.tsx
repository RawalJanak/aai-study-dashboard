import data from "@/data.json";
import { Card, Empty, Stat, StatusPill } from "@/components/ui-kit";
import { Shell, type NavGroup } from "@/components/shell";
import {
  CumulativeSessions,
  MarksCoverage,
  MasteryRings,
  SessionsByType,
  StatusMix,
} from "@/components/study-charts";
import { LessonGraphPanel } from "@/components/lesson-graph-panel";
import { ConceptRow } from "@/components/concept-lesson";
import { MockTest } from "@/components/mock-test";
import { QuestionBank } from "@/components/question-bank";
import { LESSON_GRAPHS, LESSON_DIAGRAMS } from "@/lib/lesson-graphs";
import {
  ChainRuleRecipe,
  NestedVsProduct,
} from "@/components/lesson-diagrams";

const OPEN = ["Weak", "Learning"];

export default function Page() {
  const t = data.totals;
  const queue = data.concepts.filter((c) => OPEN.includes(c.status));

  const groups: NavGroup[] = [
    {
      heading: "Overview",
      items: [
        { id: "overview", label: "Everything" },
        { id: "coverage", label: "Syllabus coverage" },
      ],
    },
    {
      heading: "AAI exam",
      items: [
        ...data.subjects.map((s) => ({
          id: `subject-${s.key}`,
          label: s.name,
          pill: s.logged,
        })),
        {
          id: "errors",
          label: "Error book",
          pill: t.errorsOpen || t.errors,
          warn: t.errorsOpen > 0,
        },
        { id: "sessions", label: "Sessions and mocks", pill: t.sessions },
        {
          id: "questions",
          label: "Question bank",
          pill: data.questionStats.total,
        },
        {
          id: "mock",
          label: "Mock test",
          pill: data.questions.length,
        },
      ],
    },
    {
      heading: "Lesson graphs",
      items: [
        ...LESSON_GRAPHS.map((g) => ({
          id: `graph-${g.id}`,
          label: g.title,
          pill: g.plots.length,
        })),
        ...LESSON_DIAGRAMS.map((d) => ({
          id: `graph-${d.id}`,
          label: d.title,
        })),
      ],
    },
    {
      heading: "TOMORROW",
      items: [
        { id: "markets", label: "Markets", pill: data.markets.daysDone },
        { id: "consulting", label: "AI consulting", pill: data.consulting.resources },
      ],
    },
  ];

  /* --------------------------------------------------------------- panels */

  const overview = (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="days to registration close"
          value={data.daysToClose}
          note={new Date(data.regClose).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            timeZone: "UTC",
          })}
        />
        <Stat
          label="concepts solid or better"
          value={t.solid}
          of={t.concepts}
          note={`${Math.round((100 * t.solid) / (t.concepts || 1))}% of what is logged`}
        />
        <Stat
          label="open Weak flags"
          value={t.weak}
          tone={t.weak ? "alarm" : "default"}
          note={t.weak ? "clear these before new material" : "nothing flagged"}
        />
        <Stat
          label="lessons written up"
          value={t.lessons}
          note={`${t.graphs} graphs, now live`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid min-w-0 gap-4">
          <Card
            title="Sessions logged, running total"
            sub="Every session in the log, accumulated. The curve only ever goes up."
          >
            <CumulativeSessions />
          </Card>
          <Card
            title="Study activity"
            sub="Sessions per day from the log, stacked by session type."
          >
            <SessionsByType />
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            <Card
              title="Mastery by subject"
              sub="Concepts solid or better, out of concepts logged."
            >
              <MasteryRings />
            </Card>
            <Card
              title="Concept status mix"
              sub="Every logged concept by its current status."
            >
              <StatusMix />
            </Card>
          </div>
        </div>

        <div className="grid min-w-0 gap-4 self-start">
          <Card
            title="Study queue"
            sub={`${t.weak} weak, ${t.learning} still learning`}
            className={t.weak ? "border-[var(--critical)]/45" : undefined}
          >
            {queue.length ? (
              <ul className="grid gap-2">
                {queue.slice(0, 9).map((c) => (
                  <li
                    key={c.concept}
                    className="flex items-start justify-between gap-3 rounded-xl bg-muted/50 px-3.5 py-2.5"
                  >
                    <span className="text-[13px] leading-snug">{c.concept}</span>
                    <StatusPill status={c.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <Empty
                msg="Nothing outstanding."
                hint="Every logged concept is solid or better."
              />
            )}
          </Card>

          <Card title="Next actions">
            {data.nextActions.length ? (
              <ol className="grid list-decimal gap-2.5 pl-4 text-[13px] leading-relaxed marker:text-muted-foreground">
                {data.nextActions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ol>
            ) : (
              <Empty msg="No next actions logged." />
            )}
          </Card>

          <Card title="TOMORROW tracks">
            <dl className="grid gap-2.5 text-[13px]">
              {[
                {
                  k: "Markets days done",
                  v: `${data.markets.daysDone} / ${data.markets.daysTotal}`,
                },
                { k: "Markets resources", v: data.markets.resources },
                { k: "Paper trades", v: data.markets.trades },
                { k: "AI consulting resources", v: data.consulting.resources },
              ].map((r) => (
                <div key={r.k} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{r.k}</dt>
                  <dd className="font-medium tabular-nums">{r.v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );

  const coverage = (
    <div className="grid gap-4">
      <Card
        title="Where the marks are"
        sub="Each Part-A/Part-B block by its mark weight, split by how far the syllabus is covered."
      >
        <MarksCoverage />
      </Card>
      <Card
        title="Blocks in full"
        sub="The table view — every number in the chart above is readable here."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2.5 pr-4 font-medium">Block</th>
                <th className="py-2.5 pr-4 text-right font-medium">Marks</th>
                <th className="py-2.5 pr-4 text-right font-medium">Solid+</th>
                <th className="py-2.5 pr-4 text-right font-medium">Learning</th>
                <th className="py-2.5 text-right font-medium">Not started</th>
              </tr>
            </thead>
            <tbody>
              {data.coverage.map((b) => (
                <tr key={b.block} className="border-b border-border/60">
                  <td className="py-2.5 pr-4">{b.block}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">{b.marks}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">{b.covered}</td>
                  <td className="py-2.5 pr-4 text-right tabular-nums">
                    {b.inProgress}
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                    {b.notStarted}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

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

  const errors = (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Stat label="mistakes logged" value={t.errors} />
        <Stat
          label="still open"
          value={t.errorsOpen}
          tone={t.errorsOpen ? "alarm" : "default"}
          note={t.errorsOpen ? "retry these" : "all retried and cleared"}
        />
      </div>
      <Card title="Error book" sub="Newest first. Cleared entries stay for spacing.">
        {data.errors.length ? (
          <ul className="grid gap-3">
            {[...data.errors].reverse().map((e, i) => (
              <li
                key={`${e.question}-${i}`}
                className={`rounded-xl border p-4 ${
                  e.open
                    ? "border-[var(--critical)]/45 bg-[var(--critical)]/5"
                    : "border-border bg-muted/40"
                }`}
              >
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {e.date}
                  </span>
                  <span className="text-[13px] font-semibold">{e.area}</span>
                  <StatusPill status={e.open ? "Weak" : "Fixed"} />
                </div>
                <p className="font-mono text-[13px]">{e.question}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                  {e.misconception}
                </p>
                {e.retry ? (
                  <p className="mt-1.5 text-xs text-muted-foreground/80">
                    Retry: {e.retry}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <Empty msg="No mistakes logged yet." />
        )}
      </Card>
    </div>
  );

  const sessions = (
    <div className="grid gap-4">
      <Card
        title="Sessions logged, running total"
        sub="Every session in the log, accumulated."
      >
        <CumulativeSessions />
      </Card>
      <Card
        title="Study activity"
        sub="Sessions per day from the log, stacked by session type."
      >
        <SessionsByType />
      </Card>
      <Card title="The log" sub={`${t.sessions} sessions, ${t.mocks} mocks`}>
        {data.sessions.length ? (
          <ul className="grid gap-3">
            {[...data.sessions].reverse().map((s, i) => (
              <li
                key={`${s.date}-${i}`}
                className="grid gap-1 rounded-xl bg-muted/40 p-3.5 text-[13px]"
              >
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <span>{s.date}</span>
                  <span className="font-semibold">{s.type}</span>
                </div>
                <div className="leading-snug">{s.covered}</div>
                {s.outcome ? (
                  <div className="text-xs text-muted-foreground">{s.outcome}</div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <Empty msg="No sessions logged yet." />
        )}
      </Card>
    </div>
  );

  const questions = <QuestionBank />;

  const graphSections = Object.fromEntries([
    // Only the id crosses the boundary - the specs hold functions.
    ...LESSON_GRAPHS.map((g) => [
      `graph-${g.id}`,
      <LessonGraphPanel key={g.id} id={g.id} />,
    ]),
    ...LESSON_DIAGRAMS.map((d) => [
      `graph-${d.id}`,
      // The title is already the page <h1>; a card repeating it is noise.
      <div key={d.id} className="grid gap-4">
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          {d.summary}{" "}
          <span className="text-muted-foreground/70">
            This figure is a diagram, not a plot — rebuilt as themed HTML.
            Replaces{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
              {d.replaces}
            </code>
          </span>
        </p>
        <Card>
          {d.kind === "routes" ? <NestedVsProduct /> : <ChainRuleRecipe />}
        </Card>
      </div>,
    ]),
  ]);

  const markets = (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="days completed"
          value={data.markets.daysDone}
          of={data.markets.daysTotal}
        />
        <Stat label="resources in the stack" value={data.markets.resources} />
        <Stat label="paper trades" value={data.markets.trades} />
        <Stat label="AI consulting resources" value={data.consulting.resources} />
      </div>
      <Card title="Markets track">
        <Empty
          msg="Detail lives in the markdown."
          hint="markets/README.md, day-*.md and paper-trades.md. Only the counts are mirrored here."
        />
      </Card>
    </div>
  );

  const mock = <MockTest />;

  const consulting = (
    <div className="grid gap-4">
      <Stat label="resources in the stack" value={data.consulting.resources} />
      <Card title="AI consulting stack">
        <Empty
          msg="Detail lives in the source files."
          hint="Only the resource count is mirrored into data.json today. Say the word and I will pull the full list through."
        />
      </Card>
    </div>
  );

  return (
    <Shell
      built={data.builtAt}
      groups={groups}
      sections={{
        overview,
        coverage,
        ...subjectSections,
        errors,
        sessions,
        questions,
        mock,
        ...graphSections,
        markets,
        consulting,
      }}
    />
  );
}
