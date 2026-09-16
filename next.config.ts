import { withReticle } from '@reticlehq/next';
import type { NextConfig } from "next";

// GitHub Pages serves a project repo at /<repo-name>/, not the domain root, so
// every asset URL needs that prefix baked in. Only applied when the build sets
// GITHUB_PAGES=1 (the Actions workflow does this) - local `npm run dev`/`build`
// stay at the root so nothing breaks day-to-day.
const basePath = process.env.GITHUB_PAGES ? "/aai-study-dashboard" : "";

const nextConfig: NextConfig = {
  // Static export: `npm run build` writes plain HTML/CSS/JS to out/, so the
  // dashboard can be served or deployed anywhere without a Node server. The
  // data is baked in at build time from src/data.json - nothing is fetched.
  output: "export",
  basePath,
  assetPrefix: basePath,

  // The repo root sits above this folder and there is a package-lock.json in
  // the user's home directory; without this, Turbopack picks that as the root
  // and warns on every build.
  turbopack: { root: __dirname },
};

export default withReticle(nextConfig);
