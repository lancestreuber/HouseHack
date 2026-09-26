# Architecture options

**Type:** build
**One line:** Three ways to put parcel geometry, scores and explanations onto the team's scaffolded stack (TanStack Start, oRPC, Drizzle on Neon, Better-Auth, Vercel), with the risks of each.
**Why we care:** The architecture decides how fast the map shows real parcels, what breaks under judge traffic, and whether the human-in-the-loop story is shared or per-browser.
**Last checked:** 2026-09-26

## What the scaffold contains

Read from the repository root and confirmed by the [build sweep](../../sweeps/r4-build-feasibility-on-team-stack.md):

- **Framework:** TanStack Start and Router, Vite 8, nitro, bun (`packageManager: bun@1.3.12`), Turborepo. Scaffolded with Better-T-Stack.
- **API:** oRPC with `publicProcedure` and `protectedProcedure` (the latter throws `UNAUTHORIZED` without a session) in `packages/api/src/index.ts`.
- **Database:** Drizzle `1.0.0-rc.4` on `drizzle-orm/neon-http`; schema files for auth and a demo todo table.
- **Auth:** Better-Auth 1.7.5. `/_auth/*` routes redirect to `/login`. `routes/todos.tsx` is demo cruft.
- **Env:** `apps/web/.env.schema` (Varlock) makes `DATABASE_URL` and `BETTER_AUTH_SECRET` (min length 32) required; `BETTER_AUTH_URL` derives from the Vercel origin. **The app won't boot without a database URL, even if auth is unused.**
- **Deploy:** `vercel.json` uses a `services` config with one `web` service (framework `tanstack-start`) and a catch-all rewrite.
- **Tooling:** `.mcp.json` includes Neon, context7, shadcn, Better-T-Stack and Better-Auth MCP servers.
- The sweep found no `node_modules`, so **whether `bun install` and a build pass was not verified.**

## The three options

| | **A. Static-first hybrid** | **B. PostGIS-backed** | **C. Fully static** |
|---|---|---|---|
| Geometry | PMTiles in `public/` (or Blob) | Neon PostGIS; oRPC does live spatial lookups | PMTiles |
| Per-parcel facts | JSON sharded by parcel ID prefix, or a Neon attribute table (no geometry) loaded with `COPY` | Neon tables | JSON |
| Scoring engine | TypeScript, client-side, so weight sliders update instantly | Server or client | Client-side |
| Server role | oRPC `explain` (LLM) and `overrides` only | All lookups | One server function for the LLM |
| Overrides / audit trail | Neon append-only table (shared) | Neon | localStorage (per browser) |
| Time to working demo (sweep estimate) | Low: ~3–6h for the pipeline to put real parcels on the map | Medium: ~6–10h (loading ~140k polygons plus Drizzle custom types) | Lowest |
| Risk | Low: no database on the hot path; traffic hits the CDN | Medium: cold starts, query tuning, Neon free-tier storage (unverified) | Low technical risk; weakest audit story |
| When it fits | Default if the pipeline runs offline | Only if someone is already fluent in PostGIS (sweep's view) | Fallback if Neon or env setup eats time |

All timings above are the build sweep's **estimates**, not measurements. The sweep recommends A; that is one sweep's view.

## Supporting facts for each option

**Neon PostGIS support.** `CREATE EXTENSION IF NOT EXISTS postgis;` works on Neon per its docs ([Neon PostGIS docs](https://neon.com/docs/extensions/postgis)).

**Drizzle geometry limits.** Drizzle has a built-in `geometry('geo', {type:'point', mode:'xy', srid})` column and `index().using('gist', …)`, but **only Point is predefined** ([Drizzle pg extensions docs](https://orm.drizzle.team/docs/extensions/pg)). Polygons would need a custom type plus raw `sql` with `ST_AsGeoJSON` and `ST_Intersects`. The sweep estimates 2–4 hours of integration, and notes drizzle-kit is still a release candidate.

**PMTiles on Vercel.** The Vercel CDN returned `206 Partial Content` to HTTP Range requests on two Vercel-hosted sites (curl, per the build sweep). That is what PMTiles needs. **How large a single file in `public/` can be on a Vercel deploy is unverified.** Test by deploying a real `.pmtiles` early; fallbacks are Vercel Blob or GitHub Pages.

**Map route rendering.** Put the map in a route with `ssr: 'data-only'` or `ssr: false`, TanStack Start's per-route selective SSR switch ([TanStack selective SSR docs](https://tanstack.com/start/latest/docs/framework/react/guide/selective-ssr), verified by the build sweep). MapLibre v6 needs its worker configured under a bundler, per the react-map-gl docs as reported in the sweep; `maplibre-gl@5` is the fallback.

**Override table sketch** (from the sweep): an append-only Neon table `override_events(id, parcel_id, field, old, new, reason, author_name text, created_at)` pushed with `db:push`.

## The auth wall risk

- A login wall is a real demo risk: judges bounce, and a mis-set `BETTER_AUTH_URL` breaks the preview URL ([build sweep](../../sweeps/r4-build-feasibility-on-team-stack.md)).
- Options:
  1. Keep Better-Auth installed but put nothing behind `/_auth`, and make all procedures `publicProcedure` (the sweep's suggestion).
  2. Remove auth from the app entirely. Note that `BETTER_AUTH_SECRET` is still required by the env schema unless the schema is changed.
  3. Keep auth only for an editor role on overrides, with read-only public access.
- Rate-limit or cap the LLM endpoint instead of authenticating it.
- localStorage overrides are per-browser, so judges would not see the team's edits.

## Open questions
- Whether `bun install` and `bun run build` pass on the scaffold as committed.
- Maximum file size for a static `.pmtiles` on a Vercel deploy.
- Neon free-tier storage limits for ~140k polygons (option B).
- Whether MapLibre v6's worker configures cleanly under Vite 8 with TanStack Start.
- How `vercel.json` `services` interacts with large static assets.

## Connects to
- [Data pipeline](data-pipeline.md): produces the PMTiles and JSON option A serves
- [Timeline and workstreams](timeline-and-workstreams.md): the H0–4 spike tests this node's open questions
- [UX patterns](ux-patterns.md): the map stack running on top
- [LLM role](../methods/llm-role.md): the `explain` procedure
- [Uncertainty and explainability](../methods/uncertainty-and-explainability.md): overrides and audit trail
- [Rules and deliverables](../challenge/rules-and-deliverables.md): what must be publicly reachable

## Sources
- Team scaffold: [README.md](../../../README.md), [package.json](../../../package.json), [vercel.json](../../../vercel.json), [apps/web/.env.schema](../../../apps/web/.env.schema), [packages/api/src/index.ts](../../../packages/api/src/index.ts), [.mcp.json](../../../.mcp.json) `[read]` *(accessed 2026-09-26)*: stack and env requirements
- [Neon PostGIS extension docs](https://neon.com/docs/extensions/postgis) `[skimmed]` *(accessed 2026-09-26)*: cited by the build sweep without an explicit verification mark
- [Drizzle PostgreSQL extensions docs](https://orm.drizzle.team/docs/extensions/pg) `[skimmed]` *(accessed 2026-09-26)*: Point-only geometry; cited by the build sweep without an explicit verification mark
- [TanStack Start selective SSR](https://tanstack.com/start/latest/docs/framework/react/guide/selective-ssr) `[read]` *(accessed 2026-09-26)*: marked verified in the build sweep
- [Protomaps PMTiles with MapLibre](https://docs.protomaps.com/pmtiles/maplibre) `[skimmed]` *(accessed 2026-09-26)*: protocol setup; cited by the build sweep
- Sweep: [../../sweeps/r4-build-feasibility-on-team-stack.md](../../sweeps/r4-build-feasibility-on-team-stack.md) `[read]` *(accessed 2026-09-26)*: options A/B/C, estimates, auth risk, Vercel range-request test
