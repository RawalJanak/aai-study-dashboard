/**
 * The two lesson figures that are diagrams rather than plots, rebuilt as
 * themed HTML. Crisp at any zoom, responsive, and they follow the theme -
 * none of which the PNGs did.
 */

import {
  CHAIN_STEPS,
  CHAIN_WORKED,
  WHICH_RULE,
  SCALAR_VECTOR_ROWS,
} from "@/lib/lesson-graphs";
import { cn } from "@/lib/utils";

function Box({
  children,
  tone = "blue",
}: {
  children: React.ReactNode;
  tone?: "blue" | "green" | "plain";
}) {
  const ring =
    tone === "blue"
      ? "border-[var(--chart-1)] bg-[var(--chart-1)]/8"
      : tone === "green"
        ? "border-[var(--chart-3)] bg-[var(--chart-3)]/8"
        : "border-border bg-muted/60";
  return (
    <div
      className={`grid min-h-16 flex-1 place-items-center rounded-xl border-2 px-4 py-3 text-center text-sm font-semibold ${ring}`}
    >
      {children}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border-2 border-[var(--chart-2)] bg-[var(--chart-2)]/8 px-4 py-3 text-center text-[13px] font-medium leading-relaxed">
      {children}
    </p>
  );
}

function Arrow({ label }: { label: string }) {
  return (
    <div className="flex min-w-20 flex-col items-center justify-center gap-1 px-1">
      <span className="text-[11px] font-semibold text-muted-foreground">
        {label}
      </span>
      <svg viewBox="0 0 48 10" className="w-12" aria-hidden>
        <line
          x1="0"
          y1="5"
          x2="38"
          y2="5"
          className="stroke-[var(--chart-3)]"
          strokeWidth="2"
        />
        <path d="M38,1 L47,5 L38,9 Z" className="fill-[var(--chart-3)]" />
      </svg>
    </div>
  );
}

export function NestedVsProduct() {
  return (
    <div className="grid gap-8">
      <div>
        <h3 className="mb-1 text-sm font-semibold text-[var(--chart-1)]">
          Chain rule — y = sin(3x)
        </h3>
        <p className="mb-4 text-[13px] text-muted-foreground">
          3x sits <strong>inside</strong> sin. Dependent — one route.
        </p>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <Box>x</Box>
          <Arrow label="× 3" />
          <Box tone="green">u = 3x</Box>
          <Arrow label="sin( )" />
          <Box>y = sin u</Box>
        </div>
        <div className="mt-2 flex justify-between px-2 text-[11px] font-semibold text-muted-foreground">
          <span>rate = 3</span>
          <span>rate = cos u</span>
        </div>
        <div className="mt-4">
          <Note>
            The output of the first box is the input of the second → rates
            MULTIPLY: 3 × cos(3x) = 3cos(3x)
          </Note>
        </div>
      </div>

      <div>
        <h3 className="mb-1 text-sm font-semibold text-[var(--chart-3)]">
          Product rule — y = x² · sin x
        </h3>
        <p className="mb-4 text-[13px] text-muted-foreground">
          Two functions <strong>side by side</strong>. Separate — two routes.
        </p>
        <div className="mx-auto grid max-w-lg gap-3">
          <div className="mx-auto w-40">
            <Box tone="plain">x</Box>
          </div>
          <svg viewBox="0 0 320 40" className="w-full" aria-hidden>
            <line
              x1="160"
              y1="0"
              x2="60"
              y2="38"
              className="stroke-[var(--chart-1)]"
              strokeWidth="2"
            />
            <line
              x1="160"
              y1="0"
              x2="260"
              y2="38"
              className="stroke-[var(--chart-3)]"
              strokeWidth="2"
            />
          </svg>
          <div className="flex gap-4">
            <div className="flex-1">
              <Box>x²</Box>
              <p className="mt-2 text-center text-[11px] font-semibold text-muted-foreground">
                rate = 2x
              </p>
            </div>
            <div className="flex-1">
              <Box tone="green">sin x</Box>
              <p className="mt-2 text-center text-[11px] font-semibold text-muted-foreground">
                rate = cos x
              </p>
            </div>
          </div>
          <Note>
            Neither feeds the other → different rule: 2x·sin x + x²·cos x
          </Note>
        </div>
      </div>
    </div>
  );
}

export function ChainRuleRecipe() {
  return (
    <div className="grid gap-4">
      <p className="rounded-xl bg-muted/60 px-4 py-3 text-center text-[13px] font-semibold">
        dy/dx = (derivative of OUTSIDE, inside untouched) × (derivative of
        INSIDE)
      </p>

      <ol className="grid gap-2.5">
        {CHAIN_STEPS.map((s) => (
          <li
            key={s.n}
            className="flex items-start gap-4 rounded-xl border-2 border-[var(--chart-1)]/45 bg-[var(--chart-1)]/6 px-4 py-3.5"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--chart-1)] text-sm font-bold text-white">
              {s.n}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold uppercase tracking-wide text-[var(--chart-1)]">
                {s.head}
              </span>
              <span className="mt-0.5 block text-[13px] leading-snug text-muted-foreground">
                {s.body}
              </span>
            </span>
          </li>
        ))}
      </ol>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <h4 className="mb-2 text-[13px] font-semibold">
            Worked: y = sin(3x²)
          </h4>
          <ol className="grid gap-1 text-[13px] tabular-nums text-muted-foreground">
            {CHAIN_WORKED.map((w, i) => (
              <li
                key={w}
                className={
                  i === CHAIN_WORKED.length - 1
                    ? "font-semibold text-[var(--chart-2)]"
                    : undefined
                }
              >
                {i + 1}. {w}
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <h4 className="mb-2 text-[13px] font-semibold">
            Which rule? One question:
          </h4>
          <p className="mb-2 text-[13px] italic text-muted-foreground">
            Is one thing INSIDE the other?
          </p>
          <ul className="grid gap-1 text-[13px] text-muted-foreground">
            {WHICH_RULE.map((r) => (
              <li key={r.expr}>
                {r.expr} → {r.shape} → <strong>{r.rule}</strong>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="rounded-xl border-2 border-[var(--critical)] bg-[var(--critical)]/8 px-4 py-3 text-center text-[13px] font-semibold">
        Most common exam error: forgetting step 3. d/dx sin(3x) = 3cos(3x), NOT
        cos(3x).
      </p>
    </div>
  );
}

/* --------------------------------------------------------- scalar vs vector */

export function ScalarVsVector() {
  return (
    <div className="grid gap-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="mb-1 text-sm font-semibold text-[var(--chart-1)]">
            SCALAR — Temperature
          </h3>
          <p className="mb-3 text-[13px] text-muted-foreground">
            Magnitude only. Just a number on a scale.
          </p>
          <svg viewBox="0 0 300 90" className="w-full" aria-hidden>
            <line x1="10" y1="60" x2="290" y2="60" stroke="var(--border)" strokeWidth="2" />
            {[0, 1, 2, 3, 4].map((i) => (
              <g key={i}>
                <line
                  x1={10 + i * 70}
                  y1="52"
                  x2={10 + i * 70}
                  y2="68"
                  stroke="var(--border)"
                  strokeWidth="2"
                />
                <text
                  x={10 + i * 70}
                  y="84"
                  textAnchor="middle"
                  className="fill-muted-foreground text-[10px]"
                >
                  {i * 10}°C
                </text>
              </g>
            ))}
            <circle cx="178" cy="60" r="7" fill="var(--critical)" />
            <text x="178" y="38" textAnchor="middle" className="fill-[var(--critical)] text-[11px] font-bold">
              24°C
            </text>
          </svg>
        </div>

        <div>
          <h3 className="mb-1 text-sm font-semibold text-[var(--chart-3)]">
            VECTOR — Displacement
          </h3>
          <p className="mb-3 text-[13px] text-muted-foreground">
            Magnitude AND direction. An arrow, not a point.
          </p>
          <svg viewBox="0 0 300 110" className="w-full" aria-hidden>
            <defs>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="4"
                orient="auto"
              >
                <path d="M0,0 L8,4 L0,8 Z" fill="var(--chart-3)" />
              </marker>
            </defs>
            <line
              x1="30"
              y1="95"
              x2="220"
              y2="20"
              stroke="var(--chart-3)"
              strokeWidth="3"
              markerEnd="url(#arrowhead)"
            />
            <circle cx="30" cy="95" r="5" fill="var(--foreground)" />
            <circle cx="220" cy="20" r="5" fill="var(--foreground)" />
            <text x="18" y="108" className="fill-foreground text-[11px]">P (start)</text>
            <text x="228" y="18" className="fill-foreground text-[11px]">Q (end)</text>
            <text x="90" y="50" className="fill-[var(--chart-3)] text-[11px] font-bold">
              5 m, P→Q
            </text>
          </svg>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-4 font-medium">Quantity</th>
              <th className="py-2 pr-4 font-medium">Type</th>
              <th className="py-2 pr-4 font-medium">SI unit</th>
              <th className="py-2 font-medium">Equation</th>
            </tr>
          </thead>
          <tbody>
            {SCALAR_VECTOR_ROWS.map((r) => (
              <tr key={r.q} className="border-b border-border/60">
                <td className="py-2 pr-4">
                  {r.q}
                  {r.trap ? (
                    <span className="ml-1.5 rounded-full bg-[var(--warning)]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--warning)]">
                      trap
                    </span>
                  ) : null}
                </td>
                <td
                  className={cn(
                    "py-2 pr-4 font-medium",
                    r.type === "Vector" ? "text-[var(--chart-3)]" : "text-[var(--chart-1)]"
                  )}
                >
                  {r.type}
                </td>
                <td className="py-2 pr-4 tabular-nums text-muted-foreground">{r.unit}</td>
                <td className="py-2 font-mono text-[12px] text-muted-foreground">{r.eq}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="rounded-xl border-2 border-[var(--warning)] bg-[var(--warning)]/8 px-4 py-3 text-center text-[13px] font-semibold">
        Pressure and Electric current LOOK direction-related but are scalars —
        they don&apos;t obey the triangle law of vector addition.
      </p>
    </div>
  );
}
