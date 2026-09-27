import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { varlockVitePlugin } from "@varlock/vite-integration";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, type Plugin } from "vite";

const require = createRequire(import.meta.url);

// MapLibre's worker does a plain relative `import "./maplibre-gl-shared.mjs"`.
// Importing the worker via `?url` emits the worker as an asset but leaves that
// specifier untouched, so the shared chunk is never emitted and the worker
// fails to load in production. Emit it alongside, under the name it expects.
function maplibreSharedChunk(): Plugin {
  let assetsDir = "assets";
  return {
    name: "maplibre-shared-chunk",
    apply: "build",
    configResolved(config) {
      assetsDir = config.build.assetsDir;
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: `${assetsDir}/maplibre-gl-shared.mjs`,
        source: readFileSync(
          require.resolve("maplibre-gl/dist/maplibre-gl-shared.mjs"),
          "utf8"
        ),
      });
    },
  };
}

export default defineConfig({
  server: {
    port: 3001,
  },
  resolve: {
    tsconfigPaths: true,
  },
  optimizeDeps: {
    // MapLibre v6 spawns dist/maplibre-gl-worker.mjs to parse vector tiles off
    // the main thread. Dep pre-bundling only emits maplibre-gl.js, so the
    // worker 404s, tile parsing never runs, and the map renders as a gray box.
    exclude: ["maplibre-gl"],
  },
  plugins: [
    varlockVitePlugin({ ssrInjectMode: "resolved-env" }),
    tailwindcss(),
    tanstackStart(),
    nitro(),
    viteReact(),
    maplibreSharedChunk(),
  ],
  // Bundle all SSR deps: Vercel functions have no node_modules at runtime.
  // Production only -- in dev, noExternal makes Vite inline CJS deps (react)
  // as ESM, which throws "module is not defined" and 500s every SSR request.
  ssr: process.env.NODE_ENV === "production" ? { noExternal: true } : undefined,
});
