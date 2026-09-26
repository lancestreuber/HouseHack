# Groundwork PGH — Design (Tracks 1 + 3)

## Context
AI Horizons 2026 AI for Housing Hackathon. Build window: now (Sat Sep 26, 11am ET) → **submissions close Sun Sep 27, 11:59pm ET** (~37h). Team of 4, work split not yet decided. Repo is an untouched Better-T-Stack scaffold (TanStack Start, oRPC, Drizzle/Neon, Better-Auth, shadcn/base-ui, Tailwind v4, Vercel). We're on branch `vid-branch`.

Goal: one polished, reliable, demo-first product that combines **Track 1 (Development Ease Score for parcels, plain-language barriers, multi-parcel comparison)** and **Track 3 (location → housing-typology matching, tradeoffs across demand/transit/equity/climate, adjustable value weights, evidence vs. assumptions)**, for the City of Pittsburgh. Judges score: problem value, usability, reliable demo, data/AI integrity (citations, uncertainty, no PII), actionability, continuation potential. Required: 3–5 min demo video + public repo + Google Form.

Decisions made: Claude API (key available) · no login, public app · precomputed static data files (no DB at runtime) · scope = City of Pittsburgh.

**Bar: a real tool, not a demo.** A CDC, planner, small developer or resident should be able to use it on Monday: *any* address or parcel in the city gets a real, sourced report, every number traces to a public dataset with its date, links can be shared, and the data pipeline can be re-run so the tool stays current after the hackathon. The demo video simply records the product working.

What "works for real" means concretely:
- **Full parcel coverage**, not just sample sites. All ~140k City of Pittsburgh parcels get precomputed features (zoning, hazards, lot size, transit, canopy/heat, ownership), sharded by neighborhood and loaded on demand. Any address resolves to its parcel.
- **Satellite / remote-sensing layers**: tree canopy, impervious surface and land-surface heat, per parcel and per neighborhood, which feed the climate score (heat exposure, stormwater, canopy loss if built). Candidate sources, to verify in hour 1: MRLC NLCD 2021 impervious + tree canopy (30 m, public domain), Landsat 9 summer LST (USGS / Microsoft Planetary Computer STAC, no key), and the Allegheny County / Tree Pittsburgh canopy layer on WPRDC. We sample the rasters at parcel centroids offline.
- **Sourced and dated**: every factor shows its source and "as of" date. The methodology page lists everything, and the zoning interpretation carries a "verify with Zoning Administrator" note.
- **Shareable and actionable**: the URL encodes site + weights + scenario. Reports print or save as PDF. Each report ends with "next steps": the zoning district's permitted uses, whether a variance is needed, the city/Land Bank acquisition path for city-owned lots, and contacts.
- **Refreshable**: `bun run data:refresh` rebuilds everything from the source APIs, and a README tells a partner org how to keep it running. That covers the continuation criterion.
- **Robust**: works without the AI (scores are deterministic, and the AI only explains them), without JS-heavy waits (static files on a CDN), and on phones.

## Current direction (Sep 26, ~2pm): read this first
**Track 3 only** (Housing Typology, Equity & Climate Matchmaker). Wherever the rest of this spec mentions "Tracks 1+3", it's outdated. Feasibility and the pro forma survive only as inputs to Track 3's tradeoffs and policy simulation.

- **Experience:**
  1. Pick a place, and optionally who you're planning for and where they work.
  2. Get **scenario cards**. Each card is one housing type on that place for that household, with fit, P10–P90 confidence, top tradeoffs, and who benefits and who might be harmed.
  3. Ask the **AI companion**. It's a neutral, conversational guide that uses Claude with tools and cites every fact.
- **One engine:** fit = benefits − Σ exposure × household sensitivity × (1 − typology mitigation). Six sub-scores (Feasibility, Demand, Access, Climate, Equity/Displacement, Infrastructure) sit on top of it. Details are in `docs/research/track3-methodology.md` and `docs/research/interactions.md`.
- **Equity:** affordability, access to opportunity, displacement, environmental justice, history (the 1937 redlining layer) and accessibility. Race is shown as context only and never enters a score. Crime data never enters a score.
- **Data:** every factor the team listed is sourced in `docs/research/access-amenities.md`, `environment-infrastructure.md`, `catalog-sweep.md` and `household-lens.md`.
- **Work split (5 people):** `docs/issues-draft.md` defines D1 Data: Land & Hazards, D2 Data: People & Place (incl. permits as a demand signal), E Suggestion engine + integration, F1 Map, F2 Experience. **We suggest; people decide:** a transparent algorithm ranks options with confidence ranges, and the user adjusts the weights. Claude is only the companion's voice. Nothing is trained on our data. (Jev was considered and dropped.)

## Updates after research (Sep 26, ~12:30pm)
Details and citations for each item are in `docs/research/` (`ui-map.md`, `data-sources.md`, `zoning-rules.md`, `stack-setup.md`, `pro-forma.md`). Where this section and the rest of the spec disagree, this section wins.
- **Parcels:** City ArcGIS `ParcelsPublic` has all 142,635 parcels, already tagged with zoning, neighborhood, vacancy and owner category. Build them into one `parcels.pmtiles` file and recolor on the GPU as sliders move.
- **Satellite:** tree canopy (USFS 2024), impervious surface (NLCD 2021) and summer land-surface temperature (Landsat scene `LC08_L2SP_017032_20240823`) are verified. They were sampled at 32k test points in 179 ms.
- **Demand/equity:** the 2021 Market Value Analysis (market types A–J) plus the displacement risk ratio, both on WPRDC under CC0; ACS 2024 comes from Census Reporter, since the Census API needs a key.
- **Zoning facts:**
  - No lot-area-per-unit rules since May 2025.
  - ADUs are illegal everywhere today.
  - The reform (Bill 2025-1545: ADUs by right, no parking minimums, voluntary affordable-housing bonus) is **pending**. It had its hearing Sep 23 with no vote yet, so the toggle says "pending".
- **HUD FY2026:** median family income is $110,400; for a 4-person household, 30/50/80% AMI = $33.1k / $55.2k / $88.3k.
- **Stack:**
  - No Neon DB is needed.
  - Delete the whole login UI, not just the dashboard.
  - oRPC 1.15 streaming uses `experimental_streamedOptions`.
  - Turn off Vercel preview protection so judges can open links.
  - Merge PRs with merge commits, not squash.
- **New Must features:**
  - **Pro forma lite:** Track 1 is titled "Pro Forma Navigator".
  - **Reverse Lot Finder:** pick goals, get a ranked site shortlist.
  - **Ask the map:** Claude turns plain English into editable filter chips.
- **New Should features:** 3D massing preview, a satellite lot check (heat and vacancy), a citywide reform-impact counter, and a translatable community brief.
- **UI:** full-screen map with floating panels in the style of Felt.
  - ⌘K search.
  - Left panel holds the sliders plus the legend and layers.
  - Report drawer on the right.
  - Compare tray at the bottom.
  - Bottom sheet on mobile.
  - Raleway 800 headings with DM Sans body text.
  - Yellow only for selection and focus.
- **Name** is still open. Options: Groundwork PGH, Buildable Burgh, LotLogic, SiteLine PGH, Yinz Can Build.

## The product (what the demo shows)
Primary persona: a **CDC / municipal planner** (secondary: small developer). Demo story: *"Homewood CDC wants to know which city-owned vacant lots can become housing fastest, and what kind."*

1. **Search** — address, ZIP, or neighborhood. Census geocoder (free, no key) → point; ZIP → neighborhoods it touches.
2. **Map explorer** — MapLibre 6 + OpenFreeMap Positron basemap (no key). Neighborhood choropleth (Opportunity score), toggleable layers: zoning, 25% slope, landslide-prone, undermined, FEMA flood, transit frequency, **city-owned parcels (12,477, the "where to build" layer)**, recent permits.
3. **Value sliders** (Track 3 core) — Demand · Transit · Equity · Climate · Feasibility. Scores recompute in the browser instantly; map recolors.
4. **Site report** (parcel or neighborhood):
   - **Development Ease Score 0–100** with a breakdown: zoning fit, lot size, slope/landslide/undermined/flood, city ownership, nearby permit activity (infrastructure/market proxy). Each factor has a pass/warn/block chip + source link.
   - **Typology matches**: ADU, duplex/triplex, townhomes, small multifamily (4–19), mid-rise. Each shows fit score + confidence range + status: *allowed by right / needs variance / allowed only under the pending 2026 reform*.
   - **Tradeoff table** per typology: estimated units, affordability reach (vs. Pittsburgh AMI), transit access, climate (embodied carbon/energy per unit, hazard exposure), displacement-risk flag.
   - **AI brief** (Claude): a plain-language narrative that cites only the computed facts (fact-id chips). Each claim is tagged **Evidence / Assumption / Value choice**. Includes a "What this tool can't tell you" section.
5. **Policy toggle, the showpiece**: "Apply 2026 zoning reform (ADUs by right citywide, no parking minimums, Affordable Housing Bonus)". Scores and typology statuses flip, and a delta summary appears ("+1,840 city-owned lots newly ADU-eligible").
6. **Compare**: pin up to 3 sites side by side (Track 1's comparative requirement).
7. **Export**: a printable one-page site brief. **Methodology page** listing sources, weights, known limitations and who could be harmed.

## Architecture
```
scripts/data/*.ts        (bun, run offline, own workspace @HouseHack/data) fetch → join (turf) → sample rasters (geotiff@2.1.3)
        │                 → apps/web/public/data/ (GeoJSON layers + parcels.pmtiles via tippecanoe)
packages/scoring/        pure TS: zoning→typology rules, factor normalization, weights, confidence,
        │                 policy-scenario overrides. Shared by pipeline + browser + API. bun test.
packages/api/routers/    oRPC: site.lookup (geocode → point-in-polygon vs static layers → WPRDC parcel via
        │                 datastore_search?filters/q), ai.brief (Claude streaming, facts JSON in, cited text out)
apps/web/                routes: / (landing+search), /explore (map + panel), /site/$id (report),
                          /compare, /methodology. MapLibre via @vis.gl/react-maplibre (ClientOnly + lazy).
```
- Data contract is defined in hour 1 (`packages/scoring/src/types.ts`: `NeighborhoodMetrics`, `ParcelFeatures`, `TypologyResult`, `Factor`, `Fact`). All four people build against mock JSON matching it until the real data lands.
- Reuse: the oRPC pattern in `packages/api/src/index.ts` (`publicProcedure`) and `routers/index.ts`; the client in `apps/web/src/utils/orpc.ts`; the full-height layout in `apps/web/src/routes/__root.tsx`; shadcn primitives in `packages/ui` (add: sheet, tabs, slider, badge, select, table, dialog, switch, chart, popover).
- Remove or hide the scaffold: the todos route, the `/dashboard` stub, the header links, the "My App" title, the BETTER-T ASCII art. Auth code stays but nothing links to it.
- Env: the scaffold requires DATABASE_URL and BETTER_AUTH_*. No DB needed: a placeholder DATABASE_URL works because nothing queries it without a session (see research/stack-setup.md). Add `ANTHROPIC_API_KEY` to `apps/web/.env.schema`.
- Model: `claude-sonnet-5` for briefs. Cache briefs per (site, weights-bucket, scenario) so the demo never waits.
- Visual design: light theme with Horizons-inspired branding (warm yellow accent `#F2C230`, bold geometric headings, lots of white space). This replaces the forced dark mode.

## Data sources (verified live today unless noted)
| Layer | Source |
|---|---|
| Zoning (1,069 polys, `zon_new`) | City ArcGIS `PGHWebZoning` / WPRDC zoning.geojson |
| Neighborhoods (90) | WPRDC `neighborhoods2` |
| Slope 25%, landslide-prone, undermined, FEMA flood | City ArcGIS `PGHWebSlope25`, `PGHWebLandslideProne`, `PGHWebUndermined`, `PGHWebFEMA2014` (+ FEMA NFHL live) |
| City-owned parcels (12,477, lat/lon, zoning, status) | WPRDC datastore e1dcee82-… |
| Assessments (lot area, use, value, year built) | WPRDC assessments + `datastore_search` (the SQL endpoint is blocked; use filters/q) |
| Permits (65k, lat/lon) | WPRDC PLI permits f4d1177a-… |
| Transit frequency | PRT GTFS zip → trips/hr per stop |
| Demand/equity (rent, income, cost burden, change over time) | WPRDC UCSUR neighborhood profiles 2024 (no key); HUD CHAS tract file (manual browser download) |
| AMI | FY2025 Pittsburgh HMFA, 4-person household: 30% $33.1k / 50% $55.2k / 80% $88.3k |
| Zoning→use rules | Municode Title 9 Ch. 911 use table (hand-coded lookup) |
| Needs context | 2022 Housing Needs Assessment (8,200-unit gap below 30% AMI; 40% of renters cost-burdened) |

## Work split (4 people, parallel from hour 1)
- **A: Data pipeline**: `scripts/data/*`: fetch, clip, join, simplify all layers; all-parcel features sharded by neighborhood (centroids + assessments + point-in-polygon); satellite raster sampling (canopy, impervious, heat); neighborhood metrics; GTFS frequency; `data:refresh` script. Ships mock files by 1pm and real files by 7pm.
- **B: Scoring + AI**: `packages/scoring` (zoning→typology table, Development Ease Score, Track 3 weights, confidence, policy scenario), tests; `ai.brief` endpoint and prompt (fact-id citations, Evidence/Assumption/Value tags); methodology content.
- **C: Map + explorer**: MapLibre map, layers, legend, search and geocoding, sliders, choropleth recolor, parcel click → report.
- **D: Report, compare, polish, submission**: site report UI (score gauge, factor chips, typology cards, tradeoff table, AI brief panel), compare view, policy toggle UX, landing page, export/print, demo video script and recording, Google Form.
(Vidyut picks a lane; I'll pair on whichever one.)

## Timeline (ET)
- **Sat 11am–1pm**: env + bun setup, Neon, Vercel link, contracts/types, mock data, GitHub issues, scaffold cleanup.
- **1–7pm**: parallel build of v1.
- **7pm checkpoint**: end-to-end on real data, deployed to Vercel preview.
- **Sat night**: policy toggle, compare, AI brief caching, design pass.
- **Sun 2pm feature freeze** → bug bash, copy, methodology, "what it gets wrong".
- **Sun 5–8pm**: record the 3–5 min video (opens with the hackathon name + team; says plainly what's real vs. placeholder).
- **Sun 9pm**: submit the form (a 3-hour buffer before 11:59pm). Repo public, keys stripped.

## Immediate next steps after approval
1. Write the design doc at `docs/superpowers/specs/2026-09-26-groundwork-pgh-design.md` plus a team-facing plan page to share, and commit on `vid-branch`.
2. Create GitHub issues (one per work item above, labeled A/B/C/D and with milestones for the 7pm checkpoint and the Sun 2pm freeze) via `gh`, after confirming with you.
3. Implementation plan via writing-plans, starting with the contracts + mocks so all four people can build in parallel.

## Verification
- `bun test` in `packages/scoring`: golden cases (an R1D-L steep hillside lot → low ease; an RM-M flat city-owned lot near a frequent bus → high; the ADU status flips under the reform scenario).
- Three real demo sites checked by hand against the City zoning map: a city-owned lot in Homewood, an address in Lawrenceville (IZ overlay), and a hillside parcel in Beechview.
- `bun run check-types`, `bun run build`, then a Vercel preview URL opened in a fresh browser (no login, loads in under 3 s, works at mobile width).
- AI brief: every sentence traces to a fact id. Test with the API key removed → a graceful "brief unavailable" message, and the scores still show.

## Risks / mitigations
- bun isn't installed locally → install it first thing (`curl -fsSL https://bun.sh/install | bash`).
- The HUD site blocks bots → download CHAS by hand; the UCSUR profiles are the fallback.
- The parcel polygons file is large (587k county rows) → use the parcel centroids CSV filtered to the city (~140k), shard per neighborhood (~1.5k parcels, ~100 KB each), and draw the clicked parcel's polygon on demand via the WPRDC Property API.
- Satellite rasters are heavy → sample them once, offline, at centroids; ship only the numbers plus a pre-rendered neighborhood choropleth. If the Landsat LST pipeline eats more than 2h, fall back to NLCD canopy/impervious only.
- Zoning→typology rules are hand-coded → label them "simplified interpretation, verify with Zoning Administrator", which counts toward the integrity criterion.
