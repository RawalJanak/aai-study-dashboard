"use client";

/**
 * Renders one lesson graph set by id.
 *
 * Takes an id string, not the spec: a PlotSpec holds real functions, and
 * functions cannot be serialised across the server/client boundary. Passing
 * the spec down from the server page fails the build with "Functions cannot be
 * passed directly to Client Components". So the client looks the set up
 * itself.
 */

import { Card } from "@/components/ui-kit";
import { FunctionPlot } from "@/components/function-plot";
import { LESSON_GRAPHS } from "@/lib/lesson-graphs";

export function LessonGraphPanel({ id }: { id: string }) {
  const set = LESSON_GRAPHS.find((g) => g.id === id);
  if (!set) return null;

  return (
    <div className="grid gap-4">
      <p className="text-[13px] leading-relaxed text-muted-foreground">
        {set.summary}{" "}
        <span className="text-muted-foreground/70">
          Hover any curve to read values off it. Replaces the static{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            {set.replaces}
          </code>
        </span>
      </p>
      {set.plots.map((p) => (
        <Card key={p.id}>
          <FunctionPlot spec={p} />
        </Card>
      ))}
    </div>
  );
}
