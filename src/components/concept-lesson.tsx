"use client";

/**
 * One concept row that expands in place to show the full taught lesson
 * (Simple / Technical / Formula / Example / Traps) instead of just a status
 * badge and a one-line evidence string. Concepts with no lesson file yet
 * fall back to the evidence line only - written up as one is added.
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/ui-kit";
import { LessonText } from "@/components/lesson-text";
import data from "@/data.json";

type Concept = (typeof data.concepts)[number];

export function ConceptRow({ c }: { c: Concept }) {
  const [open, setOpen] = useState(false);
  const hasLesson = !!c.lesson;

  return (
    <div className="border-b border-border/60 last:border-b-0">
      <button
        type="button"
        onClick={() => hasLesson && setOpen((v) => !v)}
        className={cn(
          "flex w-full items-start gap-3 py-2.5 text-left",
          hasLesson && "cursor-pointer"
        )}
        aria-expanded={open}
      >
        <span
          className={cn(
            "mt-0.5 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-90",
            !hasLesson && "opacity-0"
          )}
        >
          &rsaquo;
        </span>
        <span className="min-w-0 flex-1 text-[13px]">{c.concept}</span>
        <span className="hidden shrink-0 text-[12px] text-muted-foreground sm:block">
          {c.group}
        </span>
        <StatusPill status={c.status} />
      </button>

      {hasLesson ? (
        <div
          className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
          style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div className="ml-6 grid gap-3 border-l border-dashed border-border pb-4 pl-4 pt-1">
              {c.lesson!.sections.map((s) => (
                <div key={s.key}>
                  <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    {s.label}
                  </p>
                  <LessonText text={s.text} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="ml-6 pb-2.5 text-[12px] leading-relaxed text-muted-foreground">
          {c.evidence || "No lesson written up yet."}
        </p>
      )}
    </div>
  );
}
