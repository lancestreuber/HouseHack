# Groundwork PGH: Design (Track 3, 30-hour cut)

Revised Sat Sep 26, ~3pm ET, from the team whiteboard (demand, site considerations, neighborhood, typology). This replaces the earlier Track 1+3 design. Git history holds the old version. The implementation plan (owners, files, milestones, tasks) is in [`/PLAN.md`](../../../PLAN.md).

## Context
- AI Horizons 2026 AI for Housing Hackathon, Track 3 (Housing Typology, Equity & Climate Matchmaker), City of Pittsburgh.
- **Budget: 30 wall-clock hours**, from Sat 2pm to Sun 8pm. Submissions close Sun 11:59pm, and we submit at 9pm.
- Judges score problem value, usability, a reliable demo, data/AI integrity (citations, uncertainty, no PII), actionability and continuation potential.
- Deliverables: a 3–5 min demo video, a public repo and the Google Form.
- **Guiding rule: demoability over coverage.** One flow must work flawlessly on real data. Every factor we can't source well in about 1 hour gets cut, not faked.

## The product in one sentence
Click any City of Pittsburgh parcel and see **which of six housing types fit there, and why**. That means a ranked list of typology cards, each built from a few sourced factors. Sliders let you reweight Demand, Site and Access. A transparent, deterministic engine makes suggestions, and people decide. **A chatbot explains them:** ask about any parcel and it answers in plain language, only from the engine's sourced facts.

## Demo story: "Homewood CDC wants to know which vacant lots fit what housing"
1. The map opens on Pittsburgh. Neighborhoods are shaded by a **Demand** score built from age mix, household size, vacancy and recent permits.
2. Search "Homewood" and fly there. Turn on the **city-owned lots** layer. Zoom in until parcels appear, colored by their best-fit typology.
3. Click a city-owned vacant lot. The right-hand report shows 6 typology cards, ranked. Each card shows:
   - fit 0–100
   - legal status: by right, needs approval, or not allowed
   - its top 3 reasons, each with a source chip
4. Drag the **Access** weight up. The ranking and the map recolor live.
5. **Pin** that lot plus 1–2 others. The **compare** view shows them side by side.
6. **Print** the report as a one-page brief for a community meeting.
7. Open the **Methodology** page. It lists sources, dates, weights and "what this tool can't tell you".

## Typologies (6)
| Id | Name | Meaning | Legality source |
|---|---|---|---|
| `sfd` | Classic neighborhood | Single-family detached | zoning-rules.md table |
| `adu` | ADU | Backyard or garage unit on a lot with a house | Illegal everywhere today, so the card always shows "not allowed". Its reason text notes that pending Bill 2025-1545 would allow ADUs by right. There is no reform toggle (cut). |
| `duplex` | Duplex | 2 units (triplex treated the same) | zoning-rules.md |
| `townhome` | Townhome | Attached rowhouses | zoning-rules.md. R1D is "uncertain" and gets flagged. |
| `apartments` | Apartments | 4+ units, no mid-rise split | zoning-rules.md |
| `senior` | Senior housing | Age-friendly small multifamily or duplex | Same legality as `duplex` or `apartments`, whichever is more permissive. There is no separate zoning use for it. It is scored on the 65+ share, flat slope and hospital/transit proximity. |

Legality is a **gate**. When a type is "not allowed", its card still shows but is greyed out and ranked last, with the reason. "Needs approval" (special exception, Administrator Exception or variance) is a 0.6× penalty on fit and gets a chip.

## Factors (whiteboard mapping)
★ marks a factor starred on the whiteboard. **Status** says what we do with it in the 30h scope.

### Demand (per neighborhood, 90 neighborhoods)
| Factor | Source (WPRDC unless noted) | Status |
|---|---|---|
| Population age (share 65+, share under 18) | `2009-13-and-2019-23-american-community-survey-estimates-for-city-of-pittsburgh-neighborhoods`: `Var_2023_Age_*` | Scored |
| Household size / type | same file, `Var_2023_hhtype_*` | Scored (drives the small-unit vs family-unit split) |
| Vacancy % ★ | same file (housing vacancy) + parcel vacancy | Scored. High vacancy means lower demand for new stock, but more lots to fill. |
| Permit activity | `pli-permits`: new residential and renovation permits per neighborhood, last 3 years | Scored |

### Site considerations (per parcel)
| Factor | Source | Status |
|---|---|---|
| Parcel size ★ | `allegheny-county-parcel-boundaries1` geometry (already in PostGIS on the zoning-parcels branch) | Scored, per-typology minimums |
| Zoning ★ | `zoning` (already shipped as `public/data/pittsburgh-zoning.geojson`) + `ZONING_RULES` | Legality gate |
| Slope of yard | `25-or-greater-slope`: share of the parcel inside a ≥25% slope polygon | Scored |
| Natural disasters ★: landslide, flood, undermined | `landslide-prone-areas`, `landslides` (events), `2014-fema-flood-zones`, `undermined-areas` | Scored as hazard flags. **Tornado is cut:** it has no meaningful variation inside the city, and the methodology page says so. |
| Air quality ★ | `emissions-inventory` (16.8k rows of facility × pollutant × year, with lat/lon and tons/yr): the latest year's criteria-pollutant tons within 2 km, inverse-distance weighted | Scored (Site). It varies within the city, unlike the monitors. Labeled **Evidence** for the emissions data, and the proxy is disclosed on the methodology page. |
| Air quality context | `allegheny-county-air-quality`: "Sensor Locations" (lat/lon) + "Daily AQI Data" (87k rows) → the nearest active monitor's median PM2.5 AQI over the last 12 months | Context row, not scored, because only a handful of monitors cover the city. |
| Greenways / parks | `parks1`, `greenways`: distance to nearest | Scored (Access) |
| Transit ★ | `prt-of-allegheny-county-transit-stops`: distance to the nearest stop, frequency where available | Scored (Access) |
| Cost of living | ACS neighborhood file: median rent and income | Context row, not scored |
| Safety / crime | none | **Cut.** The city's crime data feed has been broken since 2025-10, and crime scoring carries equity bias. The methodology page states this. |

### Neighborhood services (per parcel distance, or per neighborhood)
| Factor | Source | Status |
|---|---|---|
| Hospitals / fire ★ | `pgh-fire-stations`, `hospitals` | Scored (Access). Senior housing weights hospitals higher. |
| Schools (proximity) | `pittsburgh-public-school-locations` | Scored (Access). Family types weight it higher. **Quality is cut** (data and equity concerns). |
| Local economy / shops | `allegheny-county-assets` (grocery and retail points) | *Should*: count within 800 m |
| Average income | ACS neighborhood file | Context row (equity) |
| % vacancy ★ | see Demand | — |
| Transit | see Site | — |
| Water / sewage | none usable | **Cut.** Main capacity isn't public. The methodology page states this. |

## Engine (deterministic and transparent; "we suggest, people decide")
- **Normalize.** Each raw factor becomes a 0–1 score, using a percentile rank across city parcels or neighborhoods, or a fixed threshold for distances and hazards. The mapping is written in `packages/scoring/src/factors.ts` and shown on the methodology page.
- **Sub-scores.** Three sub-scores, each a weighted mean of its factors:
  - **Demand**: age, household mix, vacancy, permits.
  - **Site**: lot size vs. the typology minimum, slope, hazards, air.
  - **Access**: transit, parks, schools, fire/hospital, shops.
- **Typology profiles.** Each typology has its own factor weights inside each sub-score. Examples:
  - `senior` weights the 65+ share, hospitals and flat slope.
  - `apartments` weights transit and lot size.
  - `sfd` weights schools and lot size.
  - `adu` needs an existing structure and lot area ≥ threshold.
- **Fit.** `fit = legalityMultiplier × Σ(userWeight_s × subScore_s(typology))`, where the user weights (default ⅓ each) come from the sliders.
- **Why.** Each card lists its top 3 contributing factors plus any red-flag factor (hazard, slope, not allowed).
- **Uncertainty (cut down).**
  - Each card gets a **coverage badge**: how many of its factors have data for this parcel.
  - Each fact carries an **Evidence** or **Assumption** label.
  - The 300-draw Monte Carlo and P10–P90 bands are **cut**.
- **Where it runs.** Scoring runs **in the browser** (`packages/scoring`, pure TS), so sliders are instant. The server only serves features.

## AI: an explain-only chatbot (team decision)
- **The engine stays rule-based.** Every score, fit, legal status and ranking comes from `packages/scoring`, where every number traces to a public dataset. It suggests, and people decide.
- **One chatbot sits on top** (owner: Vidyut; see PLAN.md Lane E). It answers questions like "Why is duplex first here?", "What changes if I weight Access higher?", "Compare these two lots" or "What does 'needs approval' mean?".
- **It uses only facts from the engine and API**, cites them with the same source chips as the cards, and never produces a number, fit or legal status of its own. When it's asked something the data doesn't cover (crime, sewer capacity), it says so and points to "What this tool can't tell you".
- **Provider:** a free Gemini tier, called with plain `fetch`, key server-side only. The exact model is picked in PLAN.md E1.
- **Fallback:** without a key, or on errors, the panel shows the card's deterministic reasons. Nothing depends on the chatbot, and it's first to hide if it's shaky at the Sun 2pm freeze.
- **Pitch:** the AI is used where it's trustworthy, explaining sourced facts in plain language, not deciding. The video and the methodology page say this plainly.
- **Still cut:** the Claude brief, "ask the map" (natural-language filters), personas.

## Equity and integrity (what judges check)
- Income and cost of living appear as context on every report. They never lower a typology's fit.
- Race and crime never enter any score.
- Every fact shows its source dataset link and as-of date.
- Zoning interpretation carries the note: "Simplified interpretation. Verify with the Zoning Administrator."
- The methodology page includes a "What this tool can't tell you" section covering:
  - tornado, water/sewer capacity, crime, school quality
  - market feasibility and cost
  - air quality measured as a proxy (emissions from permitted facilities, not measured exposure)
- No PII. Owner names are dropped from parcel properties at import.

## Also in scope
- **City-owned lots layer**: `city-owned-properties` joined on PIN. It's a map toggle plus a "City-owned" badge on the report, pointing to the acquisition path.
- **Compare**: pin 2–3 parcels, then view a side-by-side table (fit per typology, key factors).
- **Print**: print CSS for the report panel, giving a one-page brief with sources and date.

## Stack (committed; no new frameworks)
- **Base is the `zoning-parcels` branch.** It gives us:
  - Neon Postgres + PostGIS parcel table (`packages/db/src/schema/parcels.ts`) and a streaming import (`packages/db/src/scripts/import-parcels.ts`)
  - an oRPC bbox query (`packages/api/src/routers/parcels.ts`)
  - a raw `maplibre-gl` 6 map with a Carto dark basemap and the zoning layer (`apps/web/src/components/parcel-map.tsx`), including the worker/Vite fixes
- This **reverses the earlier "no DB" decision**. PostGIS turns every spatial join (hazard overlap, nearest stop, containing neighborhood) into one SQL statement. That is the biggest scope saver we have.
- Monorepo stays as scaffolded: bun + Turborepo, TanStack Start (`apps/web`), oRPC (`packages/api`), Drizzle (`packages/db`), shadcn/base-ui (`packages/ui`), Vercel.
- **One new package:** `packages/scoring` (pure TS, `bun test`). Data scripts live in `packages/db/src/scripts/`, next to the existing import. There is no separate `scripts/data` workspace.
- Auth stays in the code but is unused. The login and todos routes and their header links get deleted.
- **No new runtime dependencies.** Everything is already installed or comes from shadcn.

## Explicitly cut (don't build; mention on the methodology page if relevant)
- LLM features other than the explain-only chatbot: Claude brief, "ask the map"
- ADU reform toggle
- Pro forma, reverse lot finder
- Personas and commute (r5py)
- Satellite canopy/heat, 3D massing
- Mobile bottom sheet (responsive stacking only)
- Monte Carlo confidence
- Redlining layer, lead lines, Eviction Lab, displacement ratio, Market Value Analysis
- Tornado, crime, water/sewer, school quality

The research docs in `docs/research/` stay as reference for continuation after the hackathon.

## Verification
- `bun test` in `packages/scoring`, with golden cases:
  1. A flat R1D lot near a school: `sfd` ranks first, and `apartments` is not allowed.
  2. A flat RM lot near transit with a high 65+ share: `senior` or `apartments` in the top 2.
  3. A parcel inside a landslide-prone polygon with steep slope: its hazard red flag shows and every fit drops.
  4. The ADU card is `not_allowed` for every district.
- Three demo parcels are checked by hand against the city zoning map (Homewood city-owned vacant lot, Lawrenceville, Beechview hillside).
- Deploy checks: `bun run check-types` and `bun run build`. Open the Vercel preview in a fresh browser with no login. It must be interactive in under 3 s.
