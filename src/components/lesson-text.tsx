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

function isTableRule(line: string) {
  return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);
}

function parseTableRow(line: string) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
}

function Table({ lines, keyPrefix }: { lines: string[]; keyPrefix: string }) {
  const head = parseTableRow(lines[0]);
  const rows = lines.slice(2).map(parseTableRow);
  return (
    <div className="overflow-x-auto rounded-lg border border-border/60">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="bg-muted/60">
            {head.map((h, i) => (
              <th key={`${keyPrefix}-h${i}`} className="border-b border-border/60 px-3 py-1.5 text-left font-semibold">
                {renderInline(h, `${keyPrefix}-h${i}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={`${keyPrefix}-r${ri}`} className={ri % 2 ? "bg-muted/20" : ""}>
              {row.map((cell, ci) => (
                <td key={`${keyPrefix}-r${ri}-c${ci}`} className="border-b border-border/30 px-3 py-1.5 align-top">
                  {renderInline(cell, `${keyPrefix}-r${ri}-c${ci}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Groups lines into runs of plain text/bullets and pipe-table blocks, so a
// table can be rendered as a real <table> instead of raw "| a | b |" text.
function splitBlocks(lines: string[]) {
  const blocks: { type: "table" | "text"; lines: string[] }[] = [];
  let i = 0;
  while (i < lines.length) {
    const isTableStart =
      lines[i].trim().startsWith("|") && i + 1 < lines.length && isTableRule(lines[i + 1]);
    if (isTableStart) {
      const tableLines = [lines[i], lines[i + 1]];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: "table", lines: tableLines });
    } else {
      const textLines = [lines[i]];
      i++;
      while (
        i < lines.length &&
        !(lines[i].trim().startsWith("|") && i + 1 < lines.length && isTableRule(lines[i + 1]))
      ) {
        textLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: "text", lines: textLines });
    }
  }
  return blocks;
}

function TextBlock({ lines, keyPrefix }: { lines: string[]; keyPrefix: string }) {
  const bulletMode = lines.every((l) => /^\s*-\s+/.test(l));

  if (bulletMode) {
    return (
      <ul className="ml-4 list-disc space-y-1.5 text-[13.5px] leading-relaxed text-foreground/90">
        {lines.map((l, i) => (
          <li key={`${keyPrefix}-l${i}`}>{renderInline(l.replace(/^\s*-\s+/, ""), `${keyPrefix}-l${i}`)}</li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-2 text-[13.5px] leading-relaxed text-foreground/90">
      {lines.map((l, i) =>
        /^\s*-\s+/.test(l) ? (
          <p key={`${keyPrefix}-p${i}`} className="ml-4">
            {"• "}
            {renderInline(l.replace(/^\s*-\s+/, ""), `${keyPrefix}-p${i}`)}
          </p>
        ) : (
          <p key={`${keyPrefix}-p${i}`}>{renderInline(l, `${keyPrefix}-p${i}`)}</p>
        )
      )}
    </div>
  );
}

export function LessonText({ text }: { text: string }) {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const blocks = splitBlocks(lines);

  return (
    <div className="space-y-3">
      {blocks.map((b, i) =>
        b.type === "table" ? (
          <Table key={`b${i}`} lines={b.lines} keyPrefix={`b${i}`} />
        ) : (
          <TextBlock key={`b${i}`} lines={b.lines} keyPrefix={`b${i}`} />
        )
      )}
    </div>
  );
}
