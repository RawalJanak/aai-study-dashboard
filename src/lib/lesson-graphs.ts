/**
 * The lesson graphs, as live plots.
 *
 * These replace the matplotlib PNGs in ../dashboard/assets/graphs. The maths
 * is transcribed from those figures - same functions, same domains, same
 * marked points - so the two never disagree while both exist.
 *
 * Functions cannot live in data.json, so these stay in code. They are lesson
 * content, not study data: they change when a lesson is rewritten, not when
 * Janak studies.
 */

import type { PlotSpec } from "@/components/function-plot";

export interface GraphSet {
  id: string;
  /** The PNG this replaces, for cross-checking against the old dashboard. */
  replaces: string;
  title: string;
  summary: string;
  tags: string[];
  plots: PlotSpec[];
}

const PI = Math.PI;

export const LESSON_GRAPHS: GraphSet[] = [
  /* ------------------------------------------------------------ chain rule */
  {
    id: "chain-rule",
    replaces: "06_chain_rule.png",
    title: "Chain rule",
    summary:
      "The inside function squeezes the wave, and that squeeze becomes a multiplier.",
    tags: ["chain"],
    plots: [
      {
        id: "chain-fns",
        title: "The functions",
        caption:
          "Same height, but three times as many waves. At x = 0 both start at 0 — sin 3x just climbs three times faster.",
        xDomain: [0, 2 * PI],
        yDomain: [-1.5, 1.6],
        xLabel: "x  (0 to 2π)",
        curves: [
          { fn: (x) => Math.sin(x), label: "y = sin x  (one wave)" },
          {
            fn: (x) => Math.sin(3 * x),
            label: "y = sin 3x  (three waves)",
            color: "var(--chart-3)",
          },
        ],
        markers: [{ x: 0, y: 0, label: "both start at 0", place: "right" }],
      },
      {
        id: "chain-derivs",
        title: "Their derivatives",
        caption:
          "The green curve is three times taller. That 3 IS the derivative of the inside function 3x.",
        xDomain: [0, 2 * PI],
        yDomain: [-3.6, 3.6],
        xLabel: "x  (0 to 2π)",
        yLabel: "dy/dx",
        curves: [
          { fn: (x) => Math.cos(x), label: "dy/dx = cos x  (height 1)" },
          {
            fn: (x) => 3 * Math.cos(3 * x),
            label: "dy/dx = 3 cos 3x  (height 3)",
            color: "var(--chart-3)",
          },
        ],
        segments: [
          { x1: 0, y1: 1, x2: 2 * PI, y2: 1, color: "var(--chart-1)", dashed: true },
          { x1: 0, y1: 3, x2: 2 * PI, y2: 3, color: "var(--chart-3)", dashed: true },
        ],
      },
    ],
  },

  /* -------------------------------------------------------- maxima/minima */
  {
    id: "maxima-minima",
    replaces: "09_maxima_minima.png",
    title: "Maxima and minima, f and f′",
    summary:
      "f(x) = x³ − 3x² − 9x + 5. The turning points of f are exactly the roots of f′.",
    tags: ["maxima", "minima"],
    plots: [
      {
        id: "mm-f",
        title: "The function — where does it turn?",
        caption:
          "Flat tangent lines are drawn in at both turning points. Local maximum at x = −1, local minimum at x = 3.",
        xDomain: [-3, 5.2],
        yDomain: [-40, 34],
        yLabel: "f(x)",
        curves: [
          {
            fn: (x) => x ** 3 - 3 * x ** 2 - 9 * x + 5,
            label: "f(x) = x³ − 3x² − 9x + 5",
          },
        ],
        segments: [
          { x1: -2.1, y1: 10, x2: 0.1, y2: 10, color: "var(--critical)" },
          { x1: 1.9, y1: -22, x2: 4.1, y2: -22, color: "var(--good)" },
        ],
        markers: [
          {
            x: -1,
            y: 10,
            label: "MAX  x = −1, f = 10",
            color: "var(--critical)",
            place: "above",
          },
          {
            x: 3,
            y: -22,
            label: "MIN  x = 3, f = −22",
            color: "var(--good)",
            place: "below",
          },
        ],
      },
      {
        id: "mm-fprime",
        title: "Its derivative — the turning points are exactly its roots",
        caption:
          "Solve 3x² − 6x − 9 = 0 → x = −1 and x = 3. Where f′ crosses + → −, f had a maximum; − → + is a minimum.",
        xDomain: [-3, 5.2],
        yDomain: [-22, 44],
        yLabel: "f′(x)",
        curves: [
          {
            fn: (x) => 3 * x ** 2 - 6 * x - 9,
            label: "f′(x) = 3x² − 6x − 9",
            color: "var(--chart-2)",
          },
        ],
        bands: [
          {
            fn: (x) => 3 * x ** 2 - 6 * x - 9,
            from: -1,
            to: 3,
            tone: "negative",
            label: "f′ < 0 → f is falling",
          },
        ],
        markers: [
          { x: -1, y: 0, label: "+ → −", color: "var(--critical)", place: "below" },
          { x: 3, y: 0, label: "− → +", color: "var(--good)", place: "below" },
        ],
      },
    ],
  },

  /* --------------------------------------------- maxima/minima, worked ex */
  {
    id: "maxima-minima-worked",
    replaces: "10_maxima_minima_v2.png",
    title: "Maxima and minima, worked example",
    summary:
      "A real optimisation problem, plus the shape test for classifying any turning point.",
    tags: ["maxima", "minima"],
    plots: [
      {
        id: "rev-r",
        title: "The real question: what price maximises revenue?",
        caption:
          "R(x) = 40000 + 2000x − 200x², where x is the number of ₹10 price increases. The tangent is flat at the top.",
        xDomain: [-1, 11],
        yDomain: [28000, 48000],
        xLabel: "x  =  number of ₹10 price increases",
        yLabel: "Revenue (₹)",
        curves: [
          {
            fn: (x) => 40000 + 2000 * x - 200 * x ** 2,
            label: "R(x) = 40000 + 2000x − 200x²",
          },
        ],
        segments: [
          { x1: 3, y1: 45000, x2: 7, y2: 45000, color: "var(--chart-2)" },
        ],
        markers: [
          {
            x: 5,
            y: 45000,
            label: "max: x = 5 → ₹45,000",
            color: "var(--chart-2)",
            place: "above",
          },
          {
            x: 0,
            y: 40000,
            label: "start ₹40,000",
            color: "var(--muted-foreground)",
            place: "below",
          },
        ],
      },
      {
        id: "rev-rprime",
        title: "Its derivative — the answer is where this crosses zero",
        caption:
          "R′(x) = 2000 − 400x. Positive means revenue is still rising; negative means it is now falling. Zero at x = 5.",
        xDomain: [-1, 11],
        yDomain: [-2600, 2600],
        xLabel: "x  =  number of ₹10 price increases",
        yLabel: "R′(x)",
        curves: [
          {
            fn: (x) => 2000 - 400 * x,
            label: "R′(x) = 2000 − 400x",
            color: "var(--chart-2)",
          },
        ],
        bands: [
          {
            fn: (x) => 2000 - 400 * x,
            from: -1,
            to: 5,
            tone: "positive",
            label: "R′ > 0 → revenue still rising",
          },
          {
            fn: (x) => 2000 - 400 * x,
            from: 5,
            to: 11,
            tone: "negative",
            label: "R′ < 0 → revenue now falling",
          },
        ],
        markers: [{ x: 5, y: 0, label: "R′ = 0 at x = 5", place: "above" }],
      },
      {
        id: "shape-max",
        title: "How to recognise a MAXIMUM",
        caption: "f″ < 0 → the curve frowns ∩ → the turning point is a maximum.",
        xDomain: [-2.6, 2.6],
        yDomain: [-1.2, 8.6],
        yLabel: "f(x)",
        curves: [
          { fn: (x) => 6 - x ** 2, label: "shape of a maximum  ∩ (frowning)" },
        ],
        segments: [{ x1: -1.4, y1: 6, x2: 1.4, y2: 6, color: "var(--critical)" }],
        markers: [
          {
            x: 0,
            y: 6,
            label: "f′ = 0",
            color: "var(--critical)",
            place: "above",
          },
        ],
      },
      {
        id: "shape-min",
        title: "How to recognise a MINIMUM",
        caption: "f″ > 0 → the curve smiles ∪ → the turning point is a minimum.",
        xDomain: [-2.6, 2.6],
        yDomain: [-5.4, 3.4],
        yLabel: "f(x)",
        curves: [
          {
            fn: (x) => x ** 2 - 4,
            label: "shape of a minimum  ∪ (smiling)",
          },
        ],
        segments: [{ x1: -1.4, y1: -4, x2: 1.4, y2: -4, color: "var(--good)" }],
        markers: [
          { x: 0, y: -4, label: "f′ = 0", color: "var(--good)", place: "below" },
        ],
      },
    ],
  },

  /* ------------------------------------------------------ integration 101 */
  {
    id: "integration-intro",
    replaces: "11_integration_intro.png",
    title: "What integration is",
    summary:
      "An integral is an area; strips explain why; and differentiation is the same staircase walked backwards.",
    tags: ["integration"],
    plots: [
      {
        id: "int-area",
        title: "1. An integral IS an area — and here you can check it",
        caption:
          "∫₀⁴ x dx = [x²/2]₀⁴ = 8. It is a triangle: ½ × 4 × 4 = 8. No calculus needed to verify.",
        xDomain: [-0.6, 5.2],
        yDomain: [-0.8, 5.6],
        curves: [{ fn: (x) => x, label: "y = x" }],
        bands: [
          {
            fn: (x) => x,
            from: 0,
            to: 4,
            tone: "neutral",
            label: "area from x = 0 to x = 4  →  8",
          },
        ],
        vLines: [{ x: 4, label: "x = 4" }],
      },
      {
        id: "int-strips",
        title: "2. Why it works: slice the area into rectangles",
        caption:
          "Make the strips infinitely thin and the error vanishes. That limit is the integral. Hover a strip for its height.",
        xDomain: [0, 4],
        yDomain: [0, 6.4],
        curves: [
          {
            fn: (x) => 0.5 + 0.25 * x ** 2,
            label: "a curve you cannot do with geometry",
          },
        ],
        rects: [
          {
            fn: (x) => 0.5 + 0.25 * x ** 2,
            from: 0,
            to: 4,
            count: 4,
            color: "var(--chart-2)",
            label: "4 fat rectangles — rough",
          },
          {
            fn: (x) => 0.5 + 0.25 * x ** 2,
            from: 0,
            to: 4,
            count: 16,
            color: "var(--chart-3)",
            label: "16 thin rectangles — closer",
          },
        ],
      },
      {
        id: "int-undoes",
        title: "3. Integration undoes differentiation",
        caption:
          "Differentiation and integration are the same staircase, walked in opposite directions.",
        xDomain: [-0.2, 2.6],
        yDomain: [-0.6, 18.6],
        yLabel: "value",
        curves: [
          { fn: (x) => x ** 3, label: "F(x) = x³   the ANTIDERIVATIVE" },
          {
            fn: (x) => 3 * x ** 2,
            label: "f(x) = 3x²   its DERIVATIVE",
            color: "var(--chart-2)",
            dashed: true,
          },
        ],
      },
      {
        id: "int-plus-c",
        title: "4. Why every answer needs + C",
        caption:
          "All four curves have the SAME slope at x = 1.3 — the tangents are parallel. Differentiating kills the constant, and integrating cannot recover it.",
        xDomain: [-2.5, 2.5],
        yDomain: [-3.6, 12.6],
        curves: [
          { fn: (x) => x ** 2 + 6, label: "x² + 6", color: "var(--ord-lo)" },
          { fn: (x) => x ** 2 + 3, label: "x² + 3", color: "var(--ord-mid)" },
          { fn: (x) => x ** 2, label: "x² + 0", color: "var(--chart-1)" },
          { fn: (x) => x ** 2 - 3, label: "x² − 3", color: "var(--ord-hi)" },
        ],
        // Slope at x = 1.3 is 2(1.3) = 2.6 on every curve - the point of the
        // figure, so the tangents are computed from that, never eyeballed.
        segments: [6, 3, 0, -3].map((c) => ({
          x1: 0.75,
          y1: 1.69 + c + 2.6 * (0.75 - 1.3),
          x2: 1.85,
          y2: 1.69 + c + 2.6 * (1.85 - 1.3),
          color: "var(--chart-2)",
        })),
        markers: [6, 3, 0, -3].map((c) => ({
          x: 1.3,
          y: 1.69 + c,
          color: "var(--chart-2)",
        })),
      },
    ],
  },

  /* ---------------------------------------------------- definite integral */
  {
    id: "definite-integral",
    replaces: "12_definite_integral.png",
    title: "Definite integrals and signed area",
    summary:
      "The limits are just where you cut the strip — and area under the axis counts as negative.",
    tags: ["integration", "definite"],
    plots: [
      {
        id: "def-strip",
        title: "The limits are just where you cut the strip",
        caption:
          "∫₁³ (2x + 1) dx = [x² + x]₁³ = 12 − 2 = 10. Trapezium check: average height 5 × width 2 = 10.",
        xDomain: [-0.4, 4.2],
        yDomain: [-2, 10.4],
        curves: [{ fn: (x) => 2 * x + 1, label: "y = 2x + 1" }],
        bands: [
          {
            fn: (x) => 2 * x + 1,
            from: 1,
            to: 3,
            tone: "neutral",
            label: "the strip from x = 1 to x = 3  →  area 10",
          },
        ],
        vLines: [
          { x: 1, label: "lower limit  x = 1" },
          { x: 3, label: "upper limit  x = 3" },
        ],
        markers: [
          { x: 1, y: 3, color: "var(--chart-2)" },
          { x: 3, y: 7, color: "var(--chart-2)" },
        ],
      },
      {
        id: "def-signed",
        title: "Area under the axis is NEGATIVE",
        caption:
          "∫₀³ gives +4/3 − 4/3 = 0, but the true AREA is 8/3. If the question says AREA, split at every root and add the sizes. If it says INTEGRATE, leave the sign in.",
        xDomain: [-0.5, 3.6],
        yDomain: [-1.6, 4.6],
        curves: [{ fn: (x) => x ** 2 - 4 * x + 3, label: "y = x² − 4x + 3" }],
        bands: [
          {
            fn: (x) => x ** 2 - 4 * x + 3,
            from: 0,
            to: 1,
            tone: "positive",
            label: "ABOVE the axis → counts as +4/3",
          },
          {
            fn: (x) => x ** 2 - 4 * x + 3,
            from: 1,
            to: 3,
            tone: "negative",
            label: "BELOW the axis → counts as −4/3",
          },
        ],
        markers: [
          { x: 1, y: 0, label: "root", place: "above" },
          { x: 3, y: 0, label: "root", place: "above" },
        ],
      },
    ],
  },

  /* ---------------------------------------------- physics: vector addition */
  {
    id: "vector-triangle-law",
    replaces: "phy_03_triangle_law_3_4.png",
    title: "Vector addition — triangle law",
    summary: "Walk 3 km East then 4 km North: the resultant is NOT 7 km.",
    tags: ["physics", "vectors", "ncert-xi-ch3"],
    plots: [
      {
        id: "triangle-3-4",
        title: "3 km East, then 4 km North",
        caption:
          "Head-to-tail placement. The resultant (dashed) is the single arrow from start to end — 5 km by Pythagoras, not 3+4=7.",
        xDomain: [-1, 5],
        yDomain: [-1, 5.5],
        xLabel: "km (East)",
        yLabel: "km (North)",
        curves: [],
        segments: [
          { x1: 0, y1: 0, x2: 3, y2: 0, color: "var(--chart-1)" },
          { x1: 3, y1: 0, x2: 3, y2: 4, color: "var(--chart-3)" },
          { x1: 0, y1: 0, x2: 3, y2: 4, color: "var(--critical)", dashed: true },
        ],
        markers: [
          { x: 0, y: 0, label: "START", place: "left" },
          { x: 3, y: 4, label: "END, resultant = 5 km", place: "above" },
        ],
      },
    ],
  },

  /* ---------------------------------------------- physics: motion in a line */
  {
    id: "kinematics-projectile",
    replaces: "phy_01_projectile_height_time.png",
    title: "Kinematics — vertical throw",
    summary:
      "v = 0 at the top does not mean a = 0 — gravity never stops pulling.",
    tags: ["physics", "kinematics", "ncert-xi-ch2"],
    plots: [
      {
        id: "kinematics-height-time",
        title: "Ball thrown up at 20 m/s from a 25 m building (g = 10 m/s²)",
        caption:
          "Peaks at 45 m after 2 s (v = 0 there, but a is still −10 m/s² the whole time), lands at t = 5 s.",
        xDomain: [0, 5],
        yDomain: [-5, 55],
        xLabel: "time (s)",
        yLabel: "height above ground (m)",
        curves: [
          {
            fn: (t) => 25 + 20 * t - 5 * t * t,
            label: "y = 25 + 20t − 5t²",
          },
        ],
        markers: [
          { x: 0, y: 25, label: "thrown, t=0", place: "left" },
          { x: 2, y: 45, label: "peak, v=0 (a still −10)", place: "above" },
          { x: 5, y: 0, label: "lands, t=5s", place: "right" },
        ],
      },
    ],
  },
];

/* ---------------------------------------------------------------- diagrams */

/**
 * Two of the seven figures are not plots at all - they are boxes-and-arrows
 * and step cards. Forcing them through a function plotter would be nonsense,
 * so they are rebuilt as themed HTML instead (which also makes them crisp,
 * responsive and dark-mode aware, which the PNGs never were).
 */
export interface DiagramSet {
  id: string;
  replaces: string;
  title: string;
  summary: string;
  tags: string[];
  kind: "routes" | "steps" | "compare";
}

export const LESSON_DIAGRAMS: DiagramSet[] = [
  {
    id: "nested-vs-product",
    replaces: "07_nested_vs_product.png",
    title: "Nested vs side-by-side",
    summary: "This is what decides which rule you use.",
    tags: ["chain", "product"],
    kind: "routes",
  },
  {
    id: "chain-rule-recipe",
    replaces: "08_chain_rule_recipe.png",
    title: "Chain rule — the 4 steps",
    summary:
      "dy/dx = (derivative of OUTSIDE, inside untouched) × (derivative of INSIDE)",
    tags: ["chain"],
    kind: "steps",
  },
  {
    id: "scalar-vs-vector",
    replaces: "phy_02_scalar_vs_vector.png",
    title: "Scalar vs vector",
    summary: "A number alone vs a number with a direction attached.",
    tags: ["physics", "vectors", "ncert-xi-ch3"],
    kind: "compare",
  },
];

export const SCALAR_VECTOR_ROWS = [
  { q: "Distance", type: "Scalar" as const, unit: "m", eq: "total path length" },
  { q: "Displacement", type: "Vector" as const, unit: "m", eq: "Δx = x_final − x_initial" },
  { q: "Speed", type: "Scalar" as const, unit: "m/s", eq: "speed = distance / time" },
  { q: "Velocity", type: "Vector" as const, unit: "m/s", eq: "v = Δx / Δt" },
  { q: "Mass", type: "Scalar" as const, unit: "kg", eq: "fundamental — no defining equation" },
  { q: "Force / Weight", type: "Vector" as const, unit: "N", eq: "F = m × a" },
  { q: "Acceleration", type: "Vector" as const, unit: "m/s²", eq: "a = Δv / Δt" },
  { q: "Work / Energy", type: "Scalar" as const, unit: "J", eq: "W = F × d × cos θ" },
  { q: "Power", type: "Scalar" as const, unit: "W", eq: "P = W / t" },
  { q: "Momentum", type: "Vector" as const, unit: "kg·m/s", eq: "p = m × v" },
  { q: "Pressure", type: "Scalar" as const, unit: "Pa", eq: "P = F / A", trap: true },
  { q: "Electric current", type: "Scalar" as const, unit: "A", eq: "I = q / t", trap: true },
  { q: "Torque", type: "Vector" as const, unit: "N·m", eq: "τ = r × F × sin θ" },
];

export const CHAIN_STEPS = [
  {
    n: 1,
    head: "Spot the layers",
    body: "What sits inside the bracket? That is the inner function.",
  },
  {
    n: 2,
    head: "Outside only",
    body: "Differentiate the outer function. Leave the inside completely alone.",
  },
  {
    n: 3,
    head: "Inside only",
    body: "Now differentiate the inner function on its own.",
  },
  { n: 4, head: "Multiply", body: "Multiply the two results together. Done." },
];

export const CHAIN_WORKED = [
  "inner = 3x²",
  "outside → cos(3x²)",
  "inside → 6x",
  "answer → 6x · cos(3x²)",
];

export const WHICH_RULE = [
  { expr: "sin(3x)", shape: "nested", rule: "CHAIN" },
  { expr: "x²·sin x", shape: "separate", rule: "PRODUCT" },
  { expr: "sin²(3x)", shape: "nested twice", rule: "CHAIN ×2" },
];
