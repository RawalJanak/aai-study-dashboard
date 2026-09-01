"use client";

/**
 * GK bank.
 *
 * Same question data as the main Question Bank, scoped to section === "GK"
 * and filterable by GK subcategory (Polity, History, Geography, Science,
 * Economy/Banking, Awards, Sports, Books & Authors, Arts & culture, Static
 * facts, Current affairs, Aviation). Split out because GK breadth is the
 * actual weak point - burying it inside the all-subjects bank made it
 * impossible to see coverage by category at a glance.
 */

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { Card, Empty, Stat } from "@/components/ui-kit";
import data from "@/data.json";

type Q = (typeof data.questions)[number];

function Options({
  options,
  answer,
  reveal,
}: {
  options: string[];
  answer: number;
  reveal: boolean;
}) {
  return (
    <ol className="grid gap-1.5">
      {options.map((o, i) => {
        const right = i + 1 === answer;
        return (
          <li
            key={o}
            className={cn(
              "flex items-start gap-2 rounded-lg border px-3 py-2 text-[13px]",
              reveal && right
                ? "border-[var(--good)]/50 bg-[var(--good)]/10 font-medium text-[var(--good)]"
                : "border-transparent bg-muted/50 text-muted-foreground"
            )}
          >
            <span className="tabular-nums opacity-60">{i + 1}.</span>
            <span className="min-w-0">{o}</span>
            {reveal && right ? <span aria-hidden className="ml-auto">✓</span> : null}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Practice options, answer-first.
 *
 * Unlike the dissected question above (verified answer shown immediately,
 * this page doubles as a revision sheet), the practice question is meant to
 * be attempted: pick an option, THEN see right/wrong, like a live MCQ.
 */
function PracticeQuiz({ options, answer }: { options: string[]; answer: number }) {
  const [picked, setPicked] = useState<number | null>(null);
  const revealed = picked !== null;
  const reduceMotion = useReducedMotion();
  const pop = reduceMotion
    ? {}
    : {
        initial: { scale: 0 },
        animate: { scale: 1 },
        transition: { type: "spring" as const, stiffness: 500, damping: 20 },
      };

  return (
    <div className="grid gap-1.5">
      <ol className="grid gap-1.5">
        {options.map((o, i) => {
          const n = i + 1;
          const isAnswer = n === answer;
          const isPicked = n === picked;
          return (
            <li key={o}>
              <motion.button
                type="button"
                disabled={revealed}
                onClick={() => setPicked(n)}
                whileTap={revealed || reduceMotion ? undefined : { scale: 0.97 }}
                className={cn(
                  "flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left text-[13px] transition-colors",
                  !revealed &&
                    "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted",
                  revealed && isAnswer &&
                    "border-[var(--good)]/50 bg-[var(--good)]/10 font-medium text-[var(--good)]",
                  revealed && isPicked && !isAnswer &&
                    "border-[var(--critical)]/50 bg-[var(--critical)]/10 font-medium text-[var(--critical)]",
                  revealed && !isAnswer && !isPicked &&
                    "border-transparent bg-muted/30 text-muted-foreground/50"
                )}
              >
                <span className="tabular-nums opacity-60">{n}.</span>
                <span className="min-w-0">{o}</span>
                {revealed && isAnswer ? (
                  <motion.span aria-hidden className="ml-auto" {...pop}>✓</motion.span>
                ) : null}
                {revealed && isPicked && !isAnswer ? (
                  <motion.span aria-hidden className="ml-auto" {...pop}>✗</motion.span>
                ) : null}
              </motion.button>
            </li>
          );
        })}
      </ol>
      {revealed ? (
        <div className="mt-1 flex items-center gap-3">
          <span
            className={cn(
              "text-xs font-semibold",
              picked === answer ? "text-[var(--good)]" : "text-[var(--critical)]"
            )}
          >
            {picked === answer ? "Correct." : "Not quite."}
          </span>
          <button
            type="button"
            onClick={() => setPicked(null)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            Try again
          </button>
        </div>
      ) : null}
    </div>
  );
}

function QuestionCard({ q }: { q: Q }) {
  const attemptTone = q.correct
    ? "border-[var(--good)]/40 text-[var(--good)]"
    : q.done
      ? "border-[var(--critical)]/40 text-[var(--critical)]"
      : "border-border text-muted-foreground";

  return (
    <article className="rounded-xl border border-border p-4 sm:p-5">
      <header className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-[13px] font-semibold">{q.id}</span>
        <span className="rounded-full border border-border px-2.5 py-0.5 text-[10.5px] font-semibold text-muted-foreground">
          {q.topic}
        </span>
        <span className="mr-auto text-[11px] text-muted-foreground">
          {q.source}
        </span>
        {q.stale ? (
          <span className="rounded-full border border-[var(--warning)]/50 bg-[var(--warning)]/12 px-2.5 py-0.5 text-[10.5px] font-semibold text-[var(--warning)]">
            {q.status}
          </span>
        ) : null}
        <span
          className={cn(
            "rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold",
            attemptTone
          )}
        >
          {q.attempted}
        </span>
      </header>

      <p className="mb-3 text-sm leading-relaxed">{q.question}</p>
      <Options options={q.options} answer={q.answer} reveal />

      <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
        {q.why}
      </p>

      {q.practice && q.practiceAnswer !== null && (
      <div className="mt-4 border-t border-dashed border-border pt-4">
        <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Practice
        </p>
        <p className="mb-3 text-sm leading-relaxed">{q.practice}</p>
        <PracticeQuiz options={q.practiceOptions} answer={q.practiceAnswer} />
      </div>
      )}
    </article>
  );
}

export function GkBank() {
  const all: Q[] = data.questions;
  const gkQs = useMemo(() => all.filter((q) => q.section === "GK"), [all]);
  const [topic, setTopic] = useState<string>("All");

  const byTopic = useMemo(() => {
    const m = new Map<string, number>();
    for (const q of gkQs) m.set(q.topic, (m.get(q.topic) ?? 0) + 1);
    return [...m.entries()]
      .map(([t, n]) => ({ topic: t, n }))
      .sort((a, b) => b.n - a.n);
  }, [gkQs]);

  const topics = useMemo(() => ["All", ...byTopic.map((t) => t.topic)], [byTopic]);
  const shown = topic === "All" ? gkQs : gkQs.filter((q) => q.topic === topic);

  const stale = gkQs.filter((q) => q.stale).length;
  const attempted = gkQs.filter((q) => q.done).length;
  const correct = gkQs.filter((q) => q.correct).length;

  if (!gkQs.length) {
    return (
      <Empty
        msg="No GK questions logged yet."
        hint="Add `### Qn · GK · <category>` blocks to AAI/QUESTION_BANK.md, then run python build.py."
      />
    );
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="GK questions dissected" value={gkQs.length} />
        <Stat label="categories covered" value={byTopic.length} of={11} />
        <Stat
          label="accuracy on attempts"
          value={attempted ? `${Math.round((100 * correct) / attempted)}%` : "—"}
          note={attempted ? `${correct} of ${attempted}` : "nothing attempted yet"}
        />
        <Stat
          label="facts now out of date"
          value={stale}
          tone={stale ? "alarm" : "default"}
          note={stale ? "answer changed since the paper" : "all current"}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {topics.map((t) => {
          const n = t === "All" ? gkQs.length : byTopic.find((x) => x.topic === t)?.n ?? 0;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTopic(t)}
              aria-pressed={topic === t}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                topic === t
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {t}
              <span className="ml-1.5 tabular-nums opacity-60">{n}</span>
            </button>
          );
        })}
      </div>

      <Card
        title={topic === "All" ? "All GK questions" : topic}
        sub="Verified answer shown. The practice answer is hidden until you ask for it."
      >
        <div className="grid gap-3">
          {shown.map((q) => (
            <QuestionCard key={q.id} q={q} />
          ))}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground/70">
          Source of truth is{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
            AAI/QUESTION_BANK.md
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
