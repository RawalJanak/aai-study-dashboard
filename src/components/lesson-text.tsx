"use client";

/**
 * Renders one lesson section's plain-markdown text: **bold**, line breaks,
 * bullet lines, and inline/block LaTeX shown as raw source in a math-styled
 * span (not KaTeX-rendered - the lesson content is prose-first and a reader
 * with a PCM/engineering background reads \frac{d}{dx}(...) fine as text;
 * pulling in katex+remark for occasional formula lines is not worth the new
 * dependency here). Revisit if formula-heavy sections need true rendering.
 */

import { Fragment } from "react";

function renderInline(text: string, keyPrefix: string) {
  // Split on **bold** and $...$ / $$...$$ math spans, keep everything else as text.
  const parts = text.split(/(\*\*.+?\*\*|\${1,2}[^$]+?\${1,2})/g);
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("$")) {
      const isBlock = part.startsWith("$$");
      const math = part.replace(/^\${1,2}|\${1,2}$/g, "");
      return (
        <code
          key={key}
          className={
            isBlock
              ? "my-1.5 block rounded-lg bg-muted px-3 py-2 font-mono text-[13px] leading-relaxed"
              : "rounded bg-muted px-1 py-0.5 font-mono text-[0.92em]"
          }
        >
          {math.trim()}
        </code>
      );
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

export function LessonText({ text }: { text: string }) {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const bulletMode = lines.every((l) => /^\s*-\s+/.test(l));

  if (bulletMode) {
    return (
      <ul className="ml-4 list-disc space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
        {lines.map((l, i) => (
          <li key={i}>{renderInline(l.replace(/^\s*-\s+/, ""), `l${i}`)}</li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-2 text-[13.5px] leading-relaxed text-foreground/90">
      {lines.map((l, i) =>
        /^\s*-\s+/.test(l) ? (
          <p key={i} className="ml-4">
            {"• "}
            {renderInline(l.replace(/^\s*-\s+/, ""), `p${i}`)}
          </p>
        ) : (
          <p key={i}>{renderInline(l, `p${i}`)}</p>
        )
      )}
    </div>
  );
}
