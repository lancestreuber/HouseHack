# Stack setup runbook (Groundwork PGH)

Checked against the repo on `vid-branch` and against current docs/packages on 2026-09-26: bun 1.3.12, oRPC 1.15.4, `@anthropic-ai/sdk` 0.128.0, varlock 1.18, nitro 3.0.260903-beta, Vercel docs. Lines marked **VERIFY** are inferred and still need a live check.

---

## 1. Day-0 setup (macOS, each teammate)

```bash
# 1. bun (pinned to the repo's packageManager)
curl -fsSL https://bun.com/install | bash -s "bun-v1.3.12"
exec $SHELL -l && bun --version            # -> 1.3.12  (or: brew install oven-sh/bun/bun)

# 2. clone
git clone git@github.com:<org>/HouseHack.git && cd HouseHack && git switch main

# 3. env file (create it BEFORE bun install, because postinstall runs `varlock codegen`)
cat > apps/web/.env <<EOF
BETTER_AUTH_SECRET=$(openssl rand -base64 32)
BETTER_AUTH_URL=http://localhost:3001
DATABASE_URL=postgresql://nodb:nodb@nodb.invalid/nodb
# ANTHROPIC_API_KEY=sk-ant-...      # optional, needed only by whoever works on the AI brief
EOF

# 4. install + run
bun install                  # postinstall generates apps/web/src/env.ts (gitignored)
bun run dev                  # turbo -> vite dev in apps/web -> http://localhost:3001
```

### Why a fake DATABASE_URL is safe (checked in the source)
- `apps/web/.env.schema` requires `DATABASE_URL` (string) and `BETTER_AUTH_SECRET` (string, 32+ chars). `BETTER_AUTH_URL` defaults to `$VERCEL_ORIGIN`, which is empty locally, so **you must set `BETTER_AUTH_URL` locally** or varlock fails validation.
- `packages/db/src/index.ts` calls `neon(url)`. That call only *parses* the URL and throws if it is not `postgres(ql)://user:pass@host/db`. It does not open a connection.
- `apps/web/src/context.ts` and the evlog plugin `server/plugins/evlog-auth.ts` call `auth.api.getSession()` on every request. In better-auth 1.7.5, `getSession` returns `null` **before touching the DB** when there is no session cookie (`dist/api/routes/session.mjs`). Nobody logs in, so no cookie, so no DB query.
- Only the todo router actually queries the DB. Section 5 removes it, along with the login UI (sign-in would need a DB).

**Recommendation:** skip Neon entirely. To save teammates a step, make one schema change: give the placeholder as the schema default, so `.env` only needs the secret and the URL:

```ini
# apps/web/.env.schema: replace the DATABASE_URL block
# No DB at runtime (static data). neon() only parses this URL, and nothing queries it.
# @sensitive=false
DATABASE_URL=postgresql://nodb:nodb@nodb.invalid/nodb
```
If we ever need persistence, create a free project at console.neon.tech and paste the pooled connection string into `DATABASE_URL`. Nothing else changes.

### Common errors
| Symptom | Fix |
|---|---|
| `bun: command not found` | `exec $SHELL -l`, or make sure `~/.bun/bin` is on your PATH |
| varlock: `BETTER_AUTH_URL` invalid/empty | add `BETTER_AUTH_URL=http://localhost:3001` |
| varlock: `BETTER_AUTH_SECRET` minLength | regenerate with `openssl rand -base64 32` |
| `Database connection string format for neon() should be…` | the URL must include user, host and db name (use the placeholder above) |
| `Cannot find module './env'` / missing `ENV` types | `bun run env:generate` (also rerun it after editing `.env.schema`) |
| `routeTree.gen.ts` missing / route type errors | start `bun run dev` once; the TanStack plugin generates it |
| `EADDRINUSE :3001` | `lsof -ti:3001 \| xargs kill` |
| `bun.lock` merge conflict | `git checkout --theirs bun.lock && bun install`, then commit the result |

Note: `bunfig.toml` sets `env = false`, so bun **does not** auto-load `.env`. varlock is the only loader. For any script that needs secrets, run it as `bunx varlock run --path apps/web/ -- bun <script>`.

---

## 2. New package `packages/scoring`

Existing names are `@HouseHack/{api,auth,db,ui,config}`, each exporting TS source directly (no build step for consumers).

```bash
mkdir -p packages/scoring/src
```
`packages/scoring/package.json`
```json
{
  "name": "@HouseHack/scoring",
  "type": "module",
  "exports": { ".": "./src/index.ts", "./*": "./src/*.ts" },
  "scripts": { "build": "tsc -b", "check-types": "tsc -b", "test": "bun test" },
  "dependencies": { "zod": "catalog:" },
  "devDependencies": {
    "@HouseHack/config": "workspace:*",
    "@types/bun": "^1.3.0",
    "typescript": "catalog:"
  }
}
```
`packages/scoring/tsconfig.json` (copies `packages/db/tsconfig.json`; api/web need `composite`)
```json
{
  "extends": "@HouseHack/config/tsconfig.base.json",
  "compilerOptions": {
    "composite": true, "declaration": true, "declarationMap": true,
    "emitDeclarationOnly": true, "outDir": "dist", "types": ["bun"]
  },
  "include": ["src/**/*.ts"],
  "references": []
}
```
`packages/scoring/src/ease.test.ts`
```ts
import { describe, expect, test } from "bun:test";
import { developmentEase } from "./ease";
describe("developmentEase", () => {
  test("steep R1D-L hillside scores low", () => {
    expect(developmentEase({ zoning: "R1D-L", slope25: true /* … */ }).score).toBeLessThan(40);
  });
});
```
Wire it up:
- Add `"@HouseHack/scoring": "workspace:*"` to `apps/web`, `packages/api` and `scripts/data` in their `package.json`, then run `bun install`.
- In `packages/api/tsconfig.json`, add `{ "path": "../scoring" }` to `references`. The web build runs `tsc -b ../../packages/api`, so scoring gets built transitively.
- In `turbo.json` `tasks`, add `"test": { "outputs": [] }`. In the root `package.json` scripts, add `"test": "turbo run test"`.
- Run the tests with `cd packages/scoring && bun test --watch`, or `bun run test` from the root.
- Keep the package pure: no `node:*`, no `Bun.*`, no DOM. It runs in the browser, on Vercel's Node runtime, and in scripts.

---

## 3. `scripts/data` pipeline

bun 1.3 with `configVersion: 1` in `bun.lock` uses **isolated installs**. A root-level script therefore can't import deps it doesn't declare. Make the pipeline its own workspace:

Root `package.json`:
```jsonc
"workspaces": { "packages": ["apps/*", "packages/*", "scripts/data"], ... },
"scripts": { "data:refresh": "bun run --cwd scripts/data refresh", ... }
```
`scripts/data/package.json`
```json
{
  "name": "@HouseHack/data",
  "private": true,
  "type": "module",
  "scripts": {
    "fetch": "bun run src/fetch.ts",
    "build": "bun run src/build.ts",
    "simplify": "mapshaper -i .cache/zoning.geojson -filter-fields zon_new -simplify 10% keep-shapes -o format=geojson precision=0.00001 ../../apps/web/public/data/zoning.json",
    "refresh": "bun run fetch && bun run build && bun run simplify"
  },
  "dependencies": {
    "@HouseHack/scoring": "workspace:*",
    "@turf/turf": "^7.4.0", "flatbush": "^4.6.2",
    "geotiff": "^3.0.5", "proj4": "^2.22.0",
    "papaparse": "^5.7.0", "fflate": "^0.8.3", "mapshaper": "^0.7.68"
  },
  "devDependencies": { "@types/papaparse": "^5.5.2", "@types/bun": "^1.3.0" }
}
```
Notes:
- **Run TS directly** with `bun src/x.ts`; there is no build step. Put raw downloads in `scripts/data/.cache/`, which the root `.gitignore` already ignores. Write outputs to `apps/web/public/data/` and commit them. The spec budget is under ~8 MB total.
- **turf v7** uses named ESM imports (`import { booleanPointInPolygon, point } from "@turf/turf"`). With 140k parcels × 1,069 zoning polygons, pre-index the polygon bboxes in **flatbush** and only run `booleanPointInPolygon` on the candidates.
- **geotiff v3**: `const tiff = await fromFile(p); const img = await tiff.getImage();` then compute pixels from `img.getOrigin()` and `img.getResolution()`, and call `img.readRasters({ window: [x, y, x + 1, y + 1] })`. Call `tiff.close()` when done. NLCD is in EPSG:5070, so project lon/lat with `proj4` first. v3 breaking change: `fileDirectory` tags now need `.getValue("…")`.
- **CSV**: bun has no built-in CSV parser. Use `Papa.parse(await Bun.file(p).text(), { header: true, skipEmptyLines: true })`.
- **GTFS**: skip the `gtfs` npm package (it imports into SQLite through a native dependency, which is overkill). Instead, `unzipSync` the PRT zip with fflate, parse `stop_times.txt` and `trips.txt`/`calendar.txt` with papaparse, and count weekday departures per stop per hour.
- **mapshaper** runs as a CLI from package scripts (`node_modules/.bin` is on PATH).
- Env: if a step needs a key, run `bunx varlock run --path ../../apps/web/ -- bun src/x.ts`.

**Serving from `public/`:**
- Vercel serves `public/` from the CDN and caches it for the deployment's lifetime.
- Vercel compresses on the fly with **brotli/gzip for `application/json` and `geo+json`**, so don't pre-gzip. Name files `.json`, minify them, and round coordinates to 5 decimals.
- Hobby caps CLI uploads at **100 MB of source** (Pro: 1 GB) and **15,000 files**. Neighborhood shards (~90 × ~100 KB) are fine.
- Optional longer browser caching: in `apps/web/nitro.config.ts` add `routeRules: { "/data/**": { headers: { "cache-control": "public, max-age=300, stale-while-revalidate=86400" } } }`. **VERIFY** with `curl -sI https://<preview>/data/x.json`.
- **PMTiles** are only worth it if we want every parcel polygon drawn:
  - Build with `brew install tippecanoe && tippecanoe -o apps/web/public/data/parcels.pmtiles -zg --drop-densest-as-needed parcels.geojson`.
  - On the client, `maplibregl.addProtocol("pmtiles", new Protocol().tile)` (npm `pmtiles`).
  - Needs HTTP Range support. **VERIFY:** `curl -sI -r 0-99 https://<preview>/data/parcels.pmtiles` must return `206`. Otherwise host the file on Vercel Blob or R2.
  - The spec's plan (sharded centroids JSON + fetching the clicked polygon on demand) avoids all of this.

---

## 4. Claude brief inside oRPC (streaming + citations + cache)

Facts to know first:
- oRPC **1.15** (v1) exports `eventIterator` from `@orpc/server`, and a handler can be an `async function*`. It receives `signal`.
- The TanStack util in v1 is **`experimental_streamedOptions`** with `queryFnOptions: { refetchMode, maxChunks }`. The unprefixed `streamedOptions` / `asyncIteratorObject` names are v2 beta, so don't use them.
- SDK: `client.messages.stream(params, { signal })`. With `output_config.format: zodOutputFormat(schema)`, `await stream.finalMessage()` returns `parsed_output`. `claude-sonnet-5` is a valid id. It runs adaptive thinking by default, and `effort` goes in `output_config`.
- Prompt caching needs a system prefix of **at least 1,024 tokens** on Sonnet 5. A shorter prompt silently won't cache, so make the system prompt the long, stable part: rules, the tag definitions, 2–3 worked examples. Verify with `usage.cache_read_input_tokens > 0`.

**Env:** append to `apps/web/.env.schema`, then run `bun run env:generate`:
```ini
# Claude API key for AI site briefs. Optional: without it the UI shows "brief unavailable".
# @required=false @sensitive @type=string(startsWith=sk-ant-)
ANTHROPIC_API_KEY=
```
Also add `"ANTHROPIC_API_KEY"` to `turbo.json` `globalEnv`. turbo's strict env mode drops unlisted vars.

**Deps:** `cd packages/api && bun add @anthropic-ai/sdk && cd ../../apps/web && bun add @anthropic-ai/sdk`

**Context wiring** (the api package never reads env; the web app injects it, the same way it does for `db`):
```ts
// packages/api/src/context.ts
import type Anthropic from "@anthropic-ai/sdk";
export type Context = { session: Session | null; db: Database; anthropic: Anthropic | null };

// apps/web/src/services.ts  (add)
import Anthropic from "@anthropic-ai/sdk";
export const anthropic = ENV.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: ENV.ANTHROPIC_API_KEY, maxRetries: 1, timeout: 60_000 })
  : null;

// apps/web/src/context.ts  -> return { db, session, anthropic };
```

**`packages/api/src/routers/ai.ts`** (full file):
```ts
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { eventIterator } from "@orpc/server";
import { createHash } from "node:crypto";
import { z } from "zod";

import { publicProcedure } from "../index";

const MODEL = "claude-sonnet-5";
const PROMPT_VERSION = "brief-v1"; // bump to invalidate cached briefs

// Swap for the Fact type from @HouseHack/scoring once the contract lands.
const Fact = z.object({
  id: z.string(), label: z.string(), value: z.union([z.string(), z.number()]),
  source: z.string(), asOf: z.string(),
});
const BriefInput = z.object({
  siteId: z.string(),
  scenario: z.string().default("current"),
  weights: z.record(z.string(), z.number()).default({}),
  facts: z.array(Fact).min(1).max(80),
});

// Keep `sentences` FIRST: the stream parser below relies on key order.
const Sentence = z.object({
  text: z.string(),
  factIds: z.array(z.string()),
  tag: z.enum(["Evidence", "Assumption", "Value"]),
});
const Brief = z.object({ sentences: z.array(Sentence), cannotTell: z.array(z.string()) });
type Brief = z.infer<typeof Brief>;

const BriefEvent = z.discriminatedUnion("type", [
  z.object({ type: z.literal("sentence"), sentence: Sentence }),
  z.object({ type: z.literal("done"), brief: Brief, cached: z.boolean() }),
  z.object({ type: z.literal("unavailable"), reason: z.string() }),
]);

// Must be at least 1,024 tokens to be cached on Sonnet 5; add rules and examples until it is.
const SYSTEM_PROMPT = `You write plain-language site briefs for Pittsburgh housing development.
Use ONLY the facts provided in the user message. Every sentence must cite at least one fact id
from that list in factIds. Tag each sentence:
- Evidence: restates or combines cited facts.
- Assumption: an inference beyond the facts (say so in the sentence).
- Value: depends on the user's priorities/weights, not on facts alone.
Never invent numbers, addresses, owners or people. 5-9 sentences. Then list in cannotTell what
this data cannot tell the reader (e.g. title issues, soil, community sentiment).`;

// Per-instance memory cache (a warm Vercel instance keeps it). Precompute demo sites to public/data too.
const cache = new Map<string, Brief>();
const CACHE_MAX = 500;
const keyOf = (i: z.infer<typeof BriefInput>) =>
  createHash("sha256")
    .update(JSON.stringify({
      v: PROMPT_VERSION, m: MODEL, s: i.siteId, sc: i.scenario,
      w: Object.entries(i.weights).sort(), f: [...i.facts].sort((a, b) => a.id.localeCompare(b.id)),
    }))
    .digest("hex");

/** Objects fully closed so far inside the top-level "sentences" array of partial JSON. */
function closedSentences(buf: string): unknown[] {
  const at = buf.indexOf('"sentences"');
  const open = at < 0 ? -1 : buf.indexOf("[", at);
  if (open < 0) return [];
  const out: unknown[] = [];
  let depth = 0, inStr = false, esc = false, start = -1;
  for (let i = open + 1; i < buf.length; i++) {
    const c = buf[i];
    if (inStr) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === "{") { if (depth++ === 0) start = i; }
    else if (c === "}") { if (--depth === 0) out.push(JSON.parse(buf.slice(start, i + 1))); }
    else if (c === "]" && depth === 0) break;
  }
  return out;
}

export const aiRouter = {
  brief: publicProcedure
    .input(BriefInput)
    .output(eventIterator(BriefEvent))
    .handler(async function* ({ input, context, signal }) {
      const key = keyOf(input);
      const hit = cache.get(key);
      if (hit) {
        for (const sentence of hit.sentences) yield { type: "sentence" as const, sentence };
        yield { type: "done" as const, brief: hit, cached: true };
        return;
      }
      if (!context.anthropic) {
        yield { type: "unavailable" as const, reason: "AI brief is off (no ANTHROPIC_API_KEY)." };
        return;
      }

      const known = new Set(input.facts.map((f) => f.id));
      const valid = (s: z.infer<typeof Sentence>) =>
        s.factIds.length > 0 && s.factIds.every((id) => known.has(id));

      try {
        const stream = context.anthropic.messages.stream(
          {
            model: MODEL,
            max_tokens: 8000,
            system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
            output_config: { effort: "medium", format: zodOutputFormat(Brief) },
            messages: [{
              role: "user",
              content: `Site ${input.siteId}, scenario ${input.scenario}, weights ${JSON.stringify(input.weights)}.\nFacts:\n${JSON.stringify(input.facts)}`,
            }],
          },
          { signal },
        );

        let buf = "";
        let emitted = 0;
        for await (const ev of stream) {
          if (ev.type !== "content_block_delta" || ev.delta.type !== "text_delta") continue;
          buf += ev.delta.text;
          const done = closedSentences(buf);
          for (; emitted < done.length; emitted++) {
            const s = Sentence.safeParse(done[emitted]);
            if (s.success && valid(s.data)) yield { type: "sentence" as const, sentence: s.data };
          }
        }

        const msg = await stream.finalMessage();
        if (msg.stop_reason === "refusal" || !msg.parsed_output) {
          yield { type: "unavailable" as const, reason: "The model did not return a brief." };
          return;
        }
        const brief: Brief = { ...msg.parsed_output, sentences: msg.parsed_output.sentences.filter(valid) };
        if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!);
        cache.set(key, brief);
        yield { type: "done" as const, brief, cached: false };
      } catch (err) {
        if (signal?.aborted) return;
        const reason = err instanceof Anthropic.RateLimitError ? "AI is busy, try again shortly."
          : err instanceof Anthropic.AuthenticationError ? "AI key is invalid."
          : err instanceof Anthropic.APIError ? `AI error ${err.status}.`
          : "AI brief unavailable.";
        console.error("ai.brief failed", err);
        yield { type: "unavailable" as const, reason };
      }
    }),
};
```
Register it in `routers/index.ts` as `ai: aiRouter,` (one line; keep this file append-only).

**Client** (browser only; `useQuery` doesn't fetch during SSR):
```tsx
const brief = useQuery(orpc.ai.brief.experimental_streamedOptions({
  input: { siteId, scenario, weights, facts },
  enabled: showBrief,
  queryFnOptions: { refetchMode: "reset" },
  staleTime: Infinity,
  retry: false,
}));
const events = brief.data ?? [];              // BriefEvent[] (accumulates as chunks arrive)
const sentences = events.flatMap((e) => (e.type === "sentence" ? [e.sentence] : []));
const unavailable = events.find((e) => e.type === "unavailable");
```
Durable caching: nitro's storage is `import { useStorage } from "nitro/storage"`, but on Vercel it defaults to in-memory, so it's no better than the Map. For "the demo never waits", precompute briefs for the demo sites with a `scripts/data` step (run under `varlock run`) into `public/data/briefs/<hash>.json`. The client checks there first.

---

## 5. Removing scaffold cruft (safe order)

1. **Todos:**
   - delete `apps/web/src/routes/todos.tsx`, `packages/api/src/routers/todo.ts`, `packages/db/src/schema/todo.ts`
   - remove `export * from "./todo";` from `packages/db/src/schema/index.ts`
   - in `routers/index.ts`, remove the `todo` import and key
2. **Dashboard/login UI:**
   - delete `apps/web/src/routes/_auth/` (dashboard + layout), `routes/login.tsx`, `components/sign-in-form.tsx`, `sign-up-form.tsx`, `user-menu.tsx`. The forms navigate to the typed route `/dashboard`, so deleting only the dashboard breaks `check-types`.
   - remove `privateData` and the `protectedProcedure` import from `routers/index.ts`
   - **keep** `packages/auth`, `routes/api/auth/$.ts`, `middleware/auth.ts`, `functions/get-user.ts`: the evlog plugin and the context import `auth`
3. **Header** (`components/header.tsx`): links become `/`, `/explore`, `/compare`, `/methodology`; drop `<UserMenu />`.
4. **`__root.tsx`:**
   - title becomes `"Groundwork PGH"`
   - `<html lang="en" className="dark">` becomes `<html lang="en">`
   - `<Toaster richColors theme="light" />` (sonner otherwise follows the OS theme through `next-themes`)
5. **Devtools:** both devtools packages already render nothing in production builds. To be explicit, wrap them in `{import.meta.env.DEV && (<>…</>)}`.
6. **`routes/index.tsx`:** delete the ASCII `TITLE_TEXT`. Keep the healthCheck dot until the landing page replaces it.
7. Check: `bun run check-types && bun run build`.

---

## 6. Git workflow (4 people, 36 h)

- **Branches:** `<lane>/<name>-<topic>` (for example `data/vid-gtfs`, `map/sam-layers`). Keep them short-lived: open a PR into `main` at least every ~3 h.
- **Merge method:** "Create a merge commit" (or rebase-merge), **not squash**, so each person's commits from kickoff stay in the public history. `git config pull.rebase true`.
- **Ownership by directory** (only the owner edits; everyone else goes through a PR or pairs):
  - A: `scripts/data/**`, `apps/web/public/data/**`
  - B: `packages/scoring/**`, `packages/api/src/routers/ai.ts`
  - C: `apps/web/src/routes/explore*`, `src/components/map/**`
  - D: `routes/site.*`, `compare*`, `methodology*`, `src/components/report/**`, `__root.tsx`, `header.tsx`
- **Shared hot files:**
  - `packages/scoring/src/types.ts`: the contract. B merges changes; announce them in chat.
  - `routers/index.ts`: append one line only.
  - `bun.lock`: regenerate, don't hand-merge.
  - shadcn adds go to `packages/ui`: one person runs them.
- **Secrets:** `.env` / `.env*` are already gitignored at root and in `apps/web`. Before making the repo public:
  ```bash
  git ls-files | grep -E '(^|/)\.env' | grep -v '\.env\.schema$'   # must print nothing
  brew install gitleaks && gitleaks git .                          # scans full history
  ```
- **Labels and milestones** (dates in ET, sent as UTC):
  ```bash
  for l in "lane:data:1f77b4" "lane:scoring-ai:9467bd" "lane:map:2ca02c" "lane:report:F2C230" "blocker:d62728"; do
    gh label create "${l%:*}" --color "${l##*:}" --force; done
  gh api repos/{owner}/{repo}/milestones -f title="Sat 7pm checkpoint" -f due_on=2026-09-26T23:00:00Z
  gh api repos/{owner}/{repo}/milestones -f title="Sun 2pm freeze"     -f due_on=2026-09-27T18:00:00Z
  gh api repos/{owner}/{repo}/milestones -f title="Submit"             -f due_on=2026-09-28T01:00:00Z
  gh issue create -t "GTFS trips/hr per stop" -l lane:data -m "Sat 7pm checkpoint" -b "Output: public/data/transit.json"
  ```
  (`gh` has no milestone subcommand, hence `gh api`; `{owner}/{repo}` is filled in automatically.)

---

## 7. Vercel deploy

```bash
bunx vercel login
bun run deploy:setup                 # = vercel link, at the REPO ROOT (vercel.json "services" roots apps/web)
bunx vercel git connect              # or connect the repo in the dashboard -> preview per push/PR
bun run env:preview                  # scripts/sync-vercel-env.ts: pushes apps/web/.env keys (skips BETTER_AUTH_URL, NODE_ENV)
bun run env:production
bun run deploy                       # manual preview; deploy:prod for production
```
Gotchas:
- **Env is baked in at build time.** `varlockVitePlugin({ ssrInjectMode: "resolved-env" })` resolves and validates env during `vite build`, so:
  - a missing or invalid var fails the *build*
  - changing a var on Vercel needs a **redeploy**
  - set vars for both Preview and Production
- **`BETTER_AUTH_URL`** comes from `VERCEL_URL` / `VERCEL_PROJECT_PRODUCTION_URL`. Keep "Automatically expose System Environment Variables" on (the default). The sync script deliberately skips it.
- **bun is only the installer** (`installCommand: cd ../.. && bun install`). Functions run on Vercel's **Node** runtime, so don't use `Bun.*` or `bun:*` in server code (scripts only). nitro can target `bun1.x` through `vercel.functions.runtime`, but there's no reason to.
- **`ssr.noExternal: true` bundles every dependency**, including the Anthropic SDK, into the function. That's fine, but keep heavy pipeline libs (turf, geotiff, mapshaper) out of `apps/web` server imports.
- **Hobby plan can't connect a repo owned by a GitHub org.** Use a personal repo or a Pro trial.
- Preview deployments have **Vercel Authentication** on by default. Turn it off (Settings → Deployment Protection), or demo from production, so judges and teammates can open links.
- Streaming (`ai.brief`) works on Vercel Functions. Keep each brief well under the function's max duration. Mind the 100 MB Hobby CLI upload cap for `public/data`.
- Each deploy ends with a `turbo`-less `vite build` in `apps/web` (`tsc -b ../../packages/api && vite build`). A type error in `packages/api` or `packages/scoring` breaks the deploy, so run `bun run check-types` before pushing.
