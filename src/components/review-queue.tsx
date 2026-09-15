import type { ReviewItem } from "@/lib/day-types";
import { Empty } from "@/components/ui-kit";

export function ReviewQueue({ items }: { items: ReviewItem[] }) {
  return (
    <div>
      <p className="mb-5 font-mono text-[11.5px] uppercase tracking-wide text-muted-foreground">
        {items.length} review{items.length === 1 ? "" : "s"} due today · capped at 10/day
      </p>
      {items.length ? (
        <div className="grid gap-1.5">
          {items.map((r) => (
            <div
              key={r.item}
              className="flex items-center gap-3.5 rounded-xl border border-border bg-card px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold">{r.item}</div>
                <div className="mt-0.5 text-xs leading-snug text-muted-foreground">
                  {r.note}
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-[var(--brand)] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-[var(--brand-ink,#1a0a06)]">
                Rung {r.rung}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <Empty
          msg="Nothing due today."
          hint="Items appear here after a live-taught concept is rated and later needs a spaced recheck."
        />
      )}
    </div>
  );
}
