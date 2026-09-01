"use client";

import { useEffect, useState, type ReactNode } from "react";
import NumberFlow from "@number-flow/react";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------- surfaces */

export function Card({
  title,
  sub,
  children,
  className,
  actions,
}: {
  title?: string;
  sub?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgb(0_0_0_/_0.04),0_8px_24px_-12px_rgb(0_0_0_/_0.18)] sm:p-6 dark:shadow-[0_1px_2px_rgb(0_0_0_/_0.2),0_12px_28px_-14px_rgb(0_0_0_/_0.5)]",
        className
      )}
    >
      {title ? (
        <header className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight">{title}</h2>
            {sub ? (
              <p className="mt-1 text-[13px] leading-snug text-muted-foreground">
                {sub}
              </p>
            ) : null}
          </div>
          {actions}
        </header>
      ) : null}
      {children}
    </section>
  );
}

/* Stat tile: label / value / optional note. Proportional figures - tabular-nums
   makes a large standalone number look loose (dataviz marks-and-anatomy). */
export function Stat({
  label,
  value,
  of,
  note,
  tone = "default",
}: {
  label: string;
  value: number | string;
  of?: number | string;
  note?: string;
  tone?: "default" | "alarm";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-5 shadow-[0_1px_2px_rgb(0_0_0_/_0.04),0_8px_24px_-12px_rgb(0_0_0_/_0.18)] transition-shadow dark:shadow-[0_1px_2px_rgb(0_0_0_/_0.2),0_12px_28px_-14px_rgb(0_0_0_/_0.5)]",
        tone === "alarm"
          ? "border-[var(--critical)]/45"
          : "border-border"
      )}
    >
      <div
        className={cn(
          "text-[42px] font-semibold leading-none tracking-[-0.03em]",
          tone === "alarm" && "text-[var(--critical)]"
        )}
      >
        {/* NumberFlow only knows how to tween a number - a string value
            (e.g. "108-112") renders as plain text instead. */}
        {typeof value === "number" ? (
          <NumberFlow value={value} />
        ) : (
          value
        )}
        {of !== undefined ? (
          <span className="text-xl font-medium text-muted-foreground">
            {" / "}
            {of}
          </span>
        ) : null}
      </div>
      <div className="mt-2.5 text-[13px] text-muted-foreground">{label}</div>
      {note ? (
        <div className="mt-1 text-xs text-muted-foreground/70">{note}</div>
      ) : null}
    </div>
  );
}

/* Empty state. Charts that cannot honestly be drawn render this instead. */
export function Empty({ msg, hint }: { msg: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-muted/50 px-6 py-10 text-center">
      <p className="text-sm text-muted-foreground">{msg}</p>
      {hint ? (
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground/70">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ legend */

/* A legend is always present for >= 2 series - the dependable identity
   channel. Text wears text tokens; the swatch beside it carries the color. */
export function Legend({
  items,
}: {
  items: { color: string; label: string; value?: number | string }[];
}) {
  return (
    <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-2">
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-[3px]"
            style={{ background: it.color }}
          />
          <span>{it.label}</span>
          {it.value !== undefined ? (
            <span className="tabular-nums text-foreground/70">{it.value}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/* Status pill. A status color never carries meaning alone - it ships with the
   label (dataviz: status palette is reserved and always icon/label-paired). */
const STATUS_TONE: Record<string, string> = {
  Mastered: "bg-[var(--good)]/12 text-[var(--good)] border-[var(--good)]/35",
  Solid: "bg-[var(--good)]/12 text-[var(--good)] border-[var(--good)]/35",
  Fixed: "bg-[var(--good)]/12 text-[var(--good)] border-[var(--good)]/35",
  Learning:
    "bg-[var(--warning)]/14 text-[var(--warning)] border-[var(--warning)]/40",
  Weak: "bg-[var(--critical)]/14 text-[var(--critical)] border-[var(--critical)]/40",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-block shrink-0 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide",
        STATUS_TONE[status] ?? "border-border text-muted-foreground"
      )}
    >
      {status}
    </span>
  );
}

/* ------------------------------------------------------------ theme toggle */

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  // Read what the page is ACTUALLY showing, not just the class. With no saved
  // choice the root carries no class at all and the prefers-color-scheme block
  // is what painted it - checking only for ".dark" would label a dark page
  // "Light" and make the first click a no-op.
  useEffect(() => {
    const root = document.documentElement.classList;
    setDark(
      root.contains("dark") ||
        (!root.contains("light") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    // Stamp BOTH classes explicitly. Removing "dark" alone is not enough: with
    // an OS set to dark, a bare root falls back to the prefers-color-scheme
    // block, so "light" has to be asserted for the choice to stick.
    const root = document.documentElement.classList;
    root.toggle("dark", next);
    root.toggle("light", !next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Private mode / blocked site data. The toggle still works for this
      // page view; it just will not be remembered.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      className="rounded-full border border-border px-3.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
    >
      {dark ? "Dark" : "Light"}
    </button>
  );
}
