# Study dashboard (React)

The TOMORROW study dashboard, rendered with real [bklit UI](https://ui.bklit.com)
chart components.

The markdown and xlsx files under `../` are still the only source of truth.
This app never parses them: `../dashboard/build.py` does, and writes
`src/data.json`, which is imported at build time and baked into the output.

## Refresh after studying

```bash
npm run refresh      # regenerate data.json, then rebuild out/
```

Or the two halves separately:

```bash
npm run data         # python ../dashboard/build.py --json
npm run dev          # live at localhost:3000
npm run build        # static export to out/
```

`../dashboard/build.py` with no flags writes **both** the old single-file
`index.html` and this app's `data.json`, so the two dashboards never drift.

## Viewing the build

`next.config.ts` sets `output: "export"`, so `npm run build` produces plain
files in `out/`. They need to be *served*, not opened off the filesystem — the
asset paths are absolute:

```bash
npx serve out          # or: python -m http.server -d out 8000
```

To deploy, upload `out/` to any static host (Netlify, GitHub Pages, Vercel).

## Charts

| Card | Component | Why that form |
|---|---|---|
| Sessions logged, running total | bklit `AreaChart` | trend over time, one series |
| Where the marks are | bklit `BarChart` stacked | part-to-whole per block, **ordinal** ramp |
| Study activity | bklit `BarChart` stacked | distinct series per day, **categorical** |
| Mastery by subject | bklit `RingChart` | ratio against a limit (a meter) |
| Concept status mix | bklit `PieChart` | part-to-whole at a glance, ≤ 6 slices |

Colors come from CSS tokens in `src/app/globals.css`, not from hardcoded hex in
components. They are the [dataviz skill](https://ui.bklit.com)'s validated
categorical order (`--chart-1..5`) plus an ordinal blue ramp
(`--ord-lo/mid/hi`), both re-run through `validate_palette.js` against this
app's actual light (`#ffffff`) and dark (`#171717`) card surfaces.

**Do not re-order `--chart-1..5` or add a sixth.** The slot ordering is what
makes adjacent series distinguishable under colour-vision deficiency; a
generated sixth hue fails every check. A sixth series folds into "Other" or
the chart facets into small multiples.

## Two things that will bite you

1. **The bklit registry ships a broken import.** Re-adding any chart with
   `shadcn add -o` rewrites `src/components/charts/chart-loading-label.tsx`
   with `import ... from "../components/shimmering-text"`, which resolves to
   `src/components/components/…` and does not exist. Change it back to
   `@/components/shimmering-text`.

2. **`BarYAxis` is not the value axis.** It renders the *band* scale — it is
   the category axis for `orientation="horizontal"`. Vertical columns read
   their values off plain `YAxis`.
