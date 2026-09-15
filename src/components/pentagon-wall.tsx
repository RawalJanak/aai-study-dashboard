import type { Day } from "@/lib/day-types";
import { passCount } from "@/lib/day-types";

function Pentagon({ fillFraction, title }: { fillFraction: number; title: string }) {
  const clipY = 100 - fillFraction * 100;
  const clipId = `pentagon-clip-${title.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg viewBox="0 0 100 100" className="aspect-square w-full" role="img" aria-label={title}>
      <title>{title}</title>
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y={clipY} width="100" height={fillFraction * 100} />
        </clipPath>
      </defs>
      <polygon
        points="50,4 95,38 78,96 22,96 5,38"
        fill="none"
        stroke="var(--border)"
        strokeWidth="6"
      />
      <polygon
        points="50,4 95,38 78,96 22,96 5,38"
        fill="var(--brand)"
        clipPath={`url(#${clipId})`}
      />
    </svg>
  );
}

export function PentagonWall({ days }: { days: Day[] }) {
  const markedCount = days.filter((d) => d.status === "done").length;
  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Your wall
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {markedCount} of {days.length} marked
        </span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(34px,1fr))] gap-2.5">
        {days.map((d) => (
          <Pentagon
            key={d.number}
            fillFraction={passCount(d.mastery) / 5}
            title={`Day ${d.number}: ${d.title}`}
          />
        ))}
      </div>
    </div>
  );
}
