"use client";

/**
 * Timed mock run through the question bank. One mode only: shuffled order,
 * 2:00 per question, auto-advance-as-skip on timeout (never auto-submits a
 * fabricated answer - a skipped question is honest signal, a forced wrong
 * guess is not). State persists to localStorage after every change, so a
 * refresh or a sleeping laptop mid-run does not erase the attempt.
 *
 * Scope decision (5-persona board, 24 Aug 2026): one honest mode sized to
 * the actual 53-question bank, not a mode-picker for a "full 120-question"
 * scope that doesn't exist yet. Topic-filtered partial mocks are a real
 * future want, not a launch requirement - add when the question bank grows.
 *
 * Marking: 1 mark per correct answer, 0 for wrong or skipped/timed-out - the
 * no-negative-marking baseline documented in past_papers/README.md. This is
 * an assumption stated to the user, not a verified 2026 CBT rule.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Card, Stat } from "@/components/ui-kit";
import data from "@/data.json";

type Q = (typeof data.questions)[number];

const SECONDS_PER_Q = 120;
const STORAGE_KEY = "aai-mock-attempt-v1";

type Phase = "idle" | "running" | "finished";

interface StoredAttempt {
  order: string[];
  index: number;
  answers: Record<string, number | null>;
  elapsedMs: Record<string, number>;
  remainingSeconds: number;
  qStartedAt: number;
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function loadAttempt(): StoredAttempt | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAttempt) : null;
  } catch {
    return null;
  }
}

function saveAttempt(a: StoredAttempt) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(a));
  } catch {
    /* storage unavailable (private mode, quota) - attempt just won't resume */
  }
}

function clearAttempt() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing to clean up if storage was never written */
  }
}

export function MockTest() {
  const byId = useMemo(() => {
    const m = new Map<string, Q>();
    for (const q of data.questions) m.set(q.id, q);
    return m;
  }, []);

  const [phase, setPhase] = useState<Phase>("idle");
  const [attempt, setAttempt] = useState<StoredAttempt | null>(null);
  const [resumeAvailable, setResumeAvailable] = useState<StoredAttempt | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const existing = loadAttempt();
    if (existing && existing.index < existing.order.length) {
      setResumeAvailable(existing);
    }
  }, []);

  function begin(from?: StoredAttempt) {
    const start: StoredAttempt =
      from ?? {
        order: shuffled(data.questions.map((q) => q.id)),
        index: 0,
        answers: {},
        elapsedMs: {},
        remainingSeconds: SECONDS_PER_Q,
        qStartedAt: Date.now(),
      };
    setAttempt(start);
    saveAttempt(start);
    setPhase("running");
    setResumeAvailable(null);
  }

  function advance(prev: StoredAttempt, chosen: number | null) {
    const took = Date.now() - prev.qStartedAt;
    const qid = prev.order[prev.index];
    const next: StoredAttempt = {
      ...prev,
      answers: { ...prev.answers, [qid]: chosen },
      elapsedMs: { ...prev.elapsedMs, [qid]: took },
      index: prev.index + 1,
      remainingSeconds: SECONDS_PER_Q,
      qStartedAt: Date.now(),
    };
    setAttempt(next);
    saveAttempt(next);
    if (next.index >= next.order.length) {
      setPhase("finished");
      clearAttempt();
    }
  }

  // Countdown - one interval per question, cleaned up on every index change.
  useEffect(() => {
    if (phase !== "running" || !attempt) return;
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setAttempt((cur) => {
        if (!cur) return cur;
        if (cur.remainingSeconds <= 1) {
          if (tickRef.current) clearInterval(tickRef.current);
          advance(cur, null); // timeout - skip, never fabricate an answer
          return cur;
        }
        const next = { ...cur, remainingSeconds: cur.remainingSeconds - 1 };
        saveAttempt(next);
        return next;
      });
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, attempt?.index]);

  if (phase === "idle") {
    return (
      <div className="grid gap-4">
        <Card title="Mock test" sub="Timed run through the question bank">
          <div className="grid gap-4">
            <p className="text-[13.5px] leading-relaxed text-muted-foreground">
              {data.questions.length} questions, shuffled, 2:00 each. If time
              runs out on a question it is marked unattempted and the run
              moves on. No answer is ever guessed for you. Refreshing or
              closing the tab mid-run does not lose your place.
            </p>
            {resumeAvailable ? (
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => begin(resumeAvailable)}
                  className="rounded-lg bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-opacity hover:opacity-90"
                >
                  Resume attempt ({resumeAvailable.index}/
                  {resumeAvailable.order.length} done)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearAttempt();
                    setResumeAvailable(null);
                    begin();
                  }}
                  className="rounded-lg border border-border px-4 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted"
                >
                  Discard and start fresh
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => begin()}
                className="w-fit rounded-lg bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-opacity hover:opacity-90"
              >
                Start mock
              </button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  if (phase === "running" && attempt) {
    const qid = attempt.order[attempt.index];
    const q = byId.get(qid);
    if (!q) return null;
    const pct = (attempt.remainingSeconds / SECONDS_PER_Q) * 100;
    const urgent = attempt.remainingSeconds <= 20;

    return (
      <div className="grid gap-4">
        <Card>
          <div className="mb-4 flex items-center justify-between gap-4">
            <span className="text-[12px] font-medium text-muted-foreground">
              Question {attempt.index + 1} of {attempt.order.length}
            </span>
            <span
              className={cn(
                "tabular-nums text-[15px] font-semibold",
                urgent ? "text-[var(--critical)]" : "text-foreground"
              )}
            >
              {String(Math.floor(attempt.remainingSeconds / 60)).padStart(2, "0")}:
              {String(attempt.remainingSeconds % 60).padStart(2, "0")}
            </span>
          </div>
          <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full transition-[width] duration-1000 ease-linear",
                urgent ? "bg-[var(--critical)]" : "bg-foreground"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>

          <p className="mb-4 text-[13px] leading-relaxed">{q.question}</p>

          <ol className="grid gap-1.5">
            {q.options.map((o, i) => (
              <li key={o}>
                <button
                  type="button"
                  onClick={() => advance(attempt, i + 1)}
                  className="flex w-full items-start gap-2 rounded-lg border border-transparent bg-muted/50 px-3 py-2 text-left text-[13px] text-foreground transition-colors hover:border-border hover:bg-muted"
                >
                  <span className="tabular-nums opacity-60">{i + 1}.</span>
                  <span className="min-w-0">{o}</span>
                </button>
              </li>
            ))}
          </ol>

          <button
            type="button"
            onClick={() => advance(attempt, null)}
            className="mt-3 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Skip this one
          </button>
        </Card>
      </div>
    );
  }

  if (phase === "finished" && attempt) {
    return <MockReport attempt={attempt} byId={byId} onRestart={() => setPhase("idle")} />;
  }

  return null;
}

function MockReport({
  attempt,
  byId,
  onRestart,
}: {
  attempt: StoredAttempt;
  byId: Map<string, Q>;
  onRestart: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const rows = attempt.order.map((qid) => {
    const q = byId.get(qid)!;
    const chosen = attempt.answers[qid] ?? null;
    const attempted = chosen !== null;
    const correct = attempted && chosen === q.answer;
    return { q, chosen, attempted, correct, ms: attempt.elapsedMs[qid] ?? 0 };
  });

  const attemptedCount = rows.filter((r) => r.attempted).length;
  const correctCount = rows.filter((r) => r.correct).length;
  const accuracy = attemptedCount ? Math.round((100 * correctCount) / attemptedCount) : 0;
  const avgMs =
    rows.reduce((s, r) => s + r.ms, 0) / Math.max(1, rows.length);

  const byTopic = new Map<string, { correct: number; attempted: number }>();
  for (const r of rows) {
    const cur = byTopic.get(r.q.topic) ?? { correct: 0, attempted: 0 };
    if (r.attempted) cur.attempted += 1;
    if (r.correct) cur.correct += 1;
    byTopic.set(r.q.topic, cur);
  }
  let weakest = "-";
  let weakestRate = 2;
  for (const [topic, s] of byTopic) {
    if (s.attempted === 0) continue;
    const rate = s.correct / s.attempted;
    if (rate < weakestRate) {
      weakestRate = rate;
      weakest = topic;
    }
  }

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
  const avgSec = Math.round(avgMs / 1000);
  const logRow = `| ${today} | Mock | ${correctCount}/${rows.length} | ${accuracy}% | ${avgSec}s | ${weakest} | Revisit ${weakest} before the next mock |`;

  return (
    <div className="grid gap-4">
      <Card title="Mock finished" sub={`${today} · ${rows.length} questions`}>
        <div className="grid gap-4 sm:grid-cols-4">
          <Stat label="score" value={`${correctCount}/${rows.length}`} />
          <Stat label="accuracy" value={`${accuracy}%`} note="of attempted" />
          <Stat label="avg time / question" value={`${avgSec}s`} />
          <Stat
            label="unattempted"
            value={rows.length - attemptedCount}
            note="skipped or timed out"
          />
        </div>
      </Card>

      <Card title="Log this to MOCK_RESULTS.md" sub="One paste, formatted to match the existing table">
        <div className="grid gap-3">
          <code className="block overflow-x-auto rounded-lg bg-muted px-3 py-2 font-mono text-[12px]">
            {logRow}
          </code>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(logRow);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch {
                /* clipboard blocked - the row above is still selectable/copyable by hand */
              }
            }}
            className="w-fit rounded-lg border border-border px-4 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            {copied ? "Copied" : "Copy row"}
          </button>
        </div>
      </Card>

      <Card title="Weakest area">
        <p className="text-[13px] text-muted-foreground">
          {weakest === "-"
            ? "Not enough attempted questions to tell."
            : `${weakest} - lowest accuracy this run, ${Math.round(weakestRate * 100)}%.`}
        </p>
      </Card>

      <button
        type="button"
        onClick={onRestart}
        className="w-fit rounded-lg bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-opacity hover:opacity-90"
      >
        Run another mock
      </button>
    </div>
  );
}
