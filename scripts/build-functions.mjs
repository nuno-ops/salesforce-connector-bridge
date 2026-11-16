// Bundles src/background/* into Netlify functions. Our server modules import "server-only", which throws outside
// React Server Components; the "react-server" condition resolves it to its empty build, as Next does on the server.
import { build } from "esbuild";

await build({
  entryPoints: {
    "scan-background": "src/background/scan-background.ts",
    daily: "src/background/daily.ts",
    "deploy-succeeded": "src/background/deploy-succeeded.ts",
  },
  outdir: "netlify/functions",
  outExtension: { ".js": ".mjs" },
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  conditions: ["react-server"],
  // Some bundled CommonJS dependencies call require() for Node built-ins.
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
  logLevel: "warning",
});
