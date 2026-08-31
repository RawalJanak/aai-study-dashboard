"use client";

/**
 * Question bank.
 *
 * Every past-paper question we have dissected, its verified answer, why that
 * answer is right, and the practice question modelled on it.
 *
 * Answers are shown, not hidden behind a reveal: this page doubles as the
 * revision sheet, and a page you have to click 30 times to read does not get
 * read. The practice answer IS collapsed, because that one is meant to be
 * attempted first.
 */

import { useMemo, useState } from "react";
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

  return (
    <div className="grid gap-1.5">
      <ol className="grid gap-1.5">
        {options.map((o, i) => {
          const n = i + 1;
          const isAnswer = n === answer;
          const isPicked = n === picked;
          return (
            <li key={o}>
              <button
                type="button"
                disabled={revealed}
                onClick={() => setPicked(n)}
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
                  <span aria-hidden className="ml-auto">✓</span>
                ) : null}
                {revealed && isPicked && !isAnswer ? (
                  <span aria-hidden className="ml-auto">✗</span>
                ) : null}
              </button>
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

export function QuestionBank() {
  const qs: Q[] = data.questions;
  const s = data.questionStats;
  const [topic, setTopic] = useState<string>("All");

  const topics = useMemo(
    () => ["All", ...s.byTopic.map((t) => t.topic)],
    [s.byTopic]
  );
  const shown = topic === "All" ? qs : qs.filter((q) => q.topic === topic);

  if (!qs.length) {
    return (
      <Empty
        msg="No questions logged yet."
        hint="Add blocks to AAI/QUESTION_BANK.md, then run python build.py."
      />
    );
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="questions dissected" value={s.total} />
        <Stat
          label="practice questions attempted"
          value={s.attempted}
          of={s.total}
        />
        <Stat
          label="accuracy on attempts"
          value={
            s.attempted ? `${Math.round((100 * s.correct) / s.attempted)}%` : "—"
          }
          note={s.attempted ? `${s.correct} of ${s.attempted}` : "nothing attempted yet"}
        />
        <Stat
          label="facts now out of date"
          value={s.stale}
          tone={s.stale ? "alarm" : "default"}
          note={s.stale ? "answer changed since the paper" : "all current"}
        />
      </div>

      {/* One filter row above everything it scopes - never inside a card. */}
      <div className="flex flex-wrap gap-2">
        {topics.map((t) => {
          const n =
            t === "All" ? s.total : s.byTopic.find((x) => x.topic === t)?.n ?? 0;
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
        title={topic === "All" ? "All questions" : topic}
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
