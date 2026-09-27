import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { varlockVitePlugin } from "@varlock/vite-integration";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, type Plugin } from "vite";

const require = createRequire(import.meta.url);

// `@tanstack/start-storage-context` imports `node:async_hooks` and runs
// `new AsyncLocalStorage()` at module load. On the server that is correct, but
// TanStack Start's client bundle also pulls that server-only module, and Vite
// externalizes `node:async_hooks` to a throwing browser stub, so every client
// import chain through it crashes. Point the client environment at a working
// browser stand-in. The `ssr` environment keeps the real Node builtin.
function shimAsyncHooksForClient(): Plugin {
  const virtualId = "\0async-hooks-browser";
  return {
    name: "shim-async-hooks-for-client",
    enforce: "pre",
    resolveId(source) {
      if (source === "node:async_hooks" && this.environment.name === "client") {
        return virtualId;
      }
    },
    load(id) {
      if (id === virtualId) {
        return `export { AsyncLocalStorage } from "/src/lib/async-hooks-browser.ts";`;
      }
    },
  };
}

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
    // esbuild's dep optimizer does not run our `shimAsyncHooksForClient`
    // resolveId hook, so any pre-bundled TanStack Start module would keep its
    // throwing `browser-external:node:async_hooks` stub. Serve the leak chain
    // as source instead, where the shim applies.
    exclude: [
      "maplibre-gl",
      "@tanstack/react-start",
      "@tanstack/react-start/client",
      "@tanstack/start-client-core",
      "@tanstack/start-storage-context",
    ],
    include: ["@tanstack/react-router"],
  },
  plugins: [
    shimAsyncHooksForClient(),
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
