# Yinzone

**Where could new housing go in Pittsburgh, what kind, and what stands in the way?**

Yinzone is a parcel-level decision-support map for the City of Pittsburgh. Click a lot and see how good a place it is for new homes, which housing types the zoning code allows there and by what approval pathway, whether the site physically fits each type, a rough "does it pencil?" cost check, and every source behind each number.

- **Live app:** https://yin.zone
- **Methodology and sources:** [`/resources`](https://yin.zone/resources) in the app (every equation, weight, dataset, license and assumption)
- **Limitations statement:** [`limitations.md`](limitations.md)
- **Hackathon:** [AI Horizons 2026: AI for Housing Hackathon](https://ai-horizons-2026-ai-for-housing-hackathon.brandon831577.chatgpt.site/) (Pittsburgh, virtual, Sept 26–27, 2026)
- **Challenge track:** Track 3, [Housing Typology, Equity & Climate Matchmaker](https://ai-horizons-2026-ai-for-housing-hackathon.brandon831577.chatgpt.site/challenges/typology-equity-climate)
- **Team:** Lance Streuber, Mat Manna, Vidyut Sriram, Rishit Rai

> **Decision support only, not legal, financial or zoning advice.** Zoning is a simplified reading of the City code. Verify with the Zoning Administrator and a qualified professional before acting.

---

[![Watch the demo video](https://github.com/user-attachments/assets/420bc51c-d562-426a-885e-c921621474d0)](https://youtu.be/ECZnv7R-q_8)


## Contents

- [The problem](#the-problem)
- [Who it's for](#whos-it-for)
- [What it does](#what-it-does)
- [How it works](#how-it-works)
- [Data sources](#data-sources)
- [AI disclosure](#ai-disclosure)
- [Limitations](#limitations)
- [What we'd build next](#what-wed-build-next)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [Libraries and services](#libraries-and-services)
- [License and attribution](#license-and-attribution)

## The problem

Finding a site for new housing in Pittsburgh means stitching together the zoning code, a dozen hazard layers, Census demand data, sale prices and rents, and Zoning Board history, one parcel at a time. The answer to "can anything go here?" is spread across City, County, state and federal sources that don't talk to each other. Planners, small developers, nonprofits and CDCs do this first-pass screen by hand, before they know whether a lot is worth a closer look.

## Who it's for

- **Small and mid-size developers and CDCs** screening vacant or underused lots.
- **City and County planners** asking where a housing type is allowed and where it would need relief.
- **Nonprofits and community partners** who want to see the tradeoffs (demand, affordability, access, climate) behind a site, with the value judgments visible and adjustable.

## What it does

**Explore the map.** Every City parcel (about 142,000) is scored on five pillars and shaded on the map. Dozens of context layers (flood zones, slopes, undermining, transit, food access, subsidized housing, zoning pathways and more) can be toggled on, each labeled with its source, date, geography and caveats.

**Click a parcel.** The panels show:

| Panel | What you get |
|---|---|
| **Parcel score** | An overall 0–100 score from five pillars: **Demand**, **Site Feasibility**, **Affordability** (unmet need), **Access to Opportunity** and **Climate & Environment**. Each pillar breaks down indicator by indicator, with its contribution in points and a weight-sensitivity range. |
| **Weights** | One slider per pillar, plus presets (equal, family, older adult, climate-first, affordability-first, market-first). The score and map update live. Weights are value judgments, so they are yours to set. |
| **Housing types** | 16 housing types, from a detached house to apartments, elderly housing, assisted living and personal-care residences. For each: the legal pathway in this district (by right, Zoning Administrator, special exception, conditional use, not permitted), its approval clock, and a site-fit rating. |
| **Verdict** | Red / yellow / green per housing type, set by the worst reason: zoning, site hazards, lot width after setbacks, physical fit, or the pencil check. Unknown outranks green, so missing data never reads as buildable. |
| **Does it pencil?** | A first screen comparing construction cost per unit (practitioner $/sf ranges, editable) with nearby sale prices or capitalized rents. Shows the gap beside URA's per-unit subsidy caps for scale. It is not a pro forma. |
| **Levers** | Which programs and policy levers may apply (applies / applies with conditions / doesn't apply / unknown), each with its source. |
| **Alerts** | Deal-killer hazards and flags for the parcel: floodway, sliver lot, steep slope, landslide-prone, mapped mines, lead service lines. |
| **Chat** | An explain-only assistant that answers questions about the selected parcel from the facts on screen, with citations. It can re-run the scorer with new weights to show a what-if. It never makes up a score. |

## How it works

```
Public data ──▶ build scripts ──▶ normalize ──▶ weight + aggregate ──▶ zoning / availability / hazard multipliers ──▶ score
   (134)         (clip, clean)     (0–100)       (open JSON weights)          (read from code, never estimated)
                                                                                                 │
                                          Jev site fit (typed model) ──▶ verdict + pencil check ◀┘
                                                                                                 │
                                                                     Gemini chat explains facts ◀┘
```

1. **Public data.** 134 datasets from the City, County, WPRDC, Census, HUD, FEMA, EPA, USGS, PA agencies and OpenStreetMap, pulled 2026-09-26/27.
2. **Build scripts** clip everything to Allegheny County, clean known data traps, and write map overlays and per-parcel indicator files. No model is involved.
3. **Normalize.** 53 indicators become 0–100 scores by percentile rank or fixed linear thresholds (100 = a good place to build).
4. **Weight and aggregate.** Indicators roll up into sub-scores, then five pillars, then an overall score by **weighted geometric mean**, so strength elsewhere only partly offsets a real weakness. Missing data is dropped and weights renormalized, never filled with a guess. Hazard gates cap Site Feasibility, so good transit can't make a floodway buildable.
5. **Legal, availability and hazard multipliers.** The overall score is multiplied by a zoning factor from the §911.02 use table, a factor for what's on the lot now, and a deal-killer hazard factor.
6. **Site fit (Jev).** A typed decision model rates how well each housing type physically fits the lot, from facts code already computed (lot area, width × depth, minimum lot size, hazard shares). It returns a rubric level with probabilities and a confidence. Low-confidence ratings are flagged for review.
7. **Verdict and pencil.** Pass/fail checks per housing type. Never derived from the weighted score.
8. **Explain (chat).** Gemini explains on-screen facts with citations. Any sentence with a number not found in the facts is dropped.

**The rule we held to:** deterministic code decides every score and every legal status. The AI components sit at the edges, get narrow pre-computed inputs, and have documented failure modes. All equations (E1–E11), weights and gates are on the app's [`/resources`](https://house.bugdex.org/resources) page, which is generated from the same config the scorer reads ([`apps/web/src/lib/pillars/pillars.config.json`](apps/web/src/lib/pillars/pillars.config.json)), so the documentation can't drift from the code.

## Data sources

We use 134 public datasets and services. The full catalog, with publisher, exact endpoint, vintage, license and where each one is used, is on the app's [`/resources#datasets`](https://house.bugdex.org/resources#datasets) page and in [`DATA_SOURCES.md`](DATA_SOURCES.md). The main ones, by theme:

| Theme | Key datasets (publisher) | Where we got them |
|---|---|---|
| **Parcels and geography** | City `ParcelsPublic`; County parcel boundaries; zoning districts `PGHWebZoning`; neighborhoods; 2020 Census tracts, block groups and ZCTAs | City of Pittsburgh ArcGIS, WPRDC, U.S. Census Bureau |
| **Zoning and approvals** | Pittsburgh Zoning Code Title Nine (§911.02 use table, §903.03 dimensional standards, Ch. 922 procedures); Zoning Board of Adjustment decisions; City Council land-use matters; Planning Commission minutes; OneStopPGH permits | eCode360, City DCP, Legistar, City of Pittsburgh |
| **Hazards and climate** | FEMA National Flood Hazard Layer and National Risk Index; USGS 3DEP slope; City steep-slope, landslide-prone and undermined layers; PA DEP mined-out areas; NOAA tornado paths; Landsat surface temperature; NLCD tree canopy and impervious surface; EPA EJScreen | FEMA, USGS, City, PA DEP, NOAA, Microsoft Planetary Computer, MRLC, EPA (public mirror) |
| **Infrastructure and transit** | PWSA lead service lines; County sewer lines; PRT transit stops; UMN Access Across America jobs-by-transit; POGOH bike share | PWSA, Allegheny County GIS, WPRDC, University of Minnesota |
| **Housing costs and subsidy** | ACS 5-year; HUD CHAS, income limits, Small Area FMRs, LIHTC, QCT/DDA, public housing, assisted multifamily, vouchers; DOE LEAD; Eviction Lab; Reinvestment Fund MVA and displacement risk; County property sales; Zillow ZORI | Census Reporter API, HUD, DOE, Princeton Eviction Lab, WPRDC, Zillow Research |
| **Land and property condition** | County assessments; USPS vacancy; City-owned property; tax delinquency; condemned properties; code violations; foreclosure filings | Allegheny County, City of Pittsburgh, HUD/USPS, via WPRDC |
| **Demand and jobs** | 2020 Census PL 94-171; LEHD LODES8; BLS QCEW; new residential construction permits | U.S. Census Bureau, BLS, City PLI via WPRDC |
| **Equity and opportunity** | CDC Social Vulnerability Index; Child Opportunity Index 3.0; Opportunity Atlas; HOLC 1937 redlining map; USDA Food Access Research Atlas; EPA Walkability Index | CDC, diversitydatakids.org, Opportunity Insights, Mapping Inequality, USDA, EPA |
| **Health** | CDC PLACES; USALEEP life expectancy; HRSA shortage areas and health centers; CMS hospitals and nursing homes; NPPES pharmacies; ACHD blood-lead rates | CDC, HRSA, CMS, PA DOH via PASDA, ACHD via WPRDC |
| **Everyday places** | Grocery and SNAP retailers; food facilities; schools; libraries; child care; parks and trails; fire, EMS and police stations; banks; community organizations | USDA, ACHD, Allegheny County GIS, PA DHS, PDE, NCES, FDIC, City, OpenStreetMap (Overpass) |

**Team-built legal-feasibility datasets.** We coded a housing-type × zoning-district pathway matrix from §911.02, plus Zoning Board, Council and permit outcome datasets, as raw coded facts with no scores. They live in [`research/datasets/legal-feasibility/`](research/datasets/legal-feasibility/).

**No personal data.** Owner names and contact fields are never ingested. Crime and race never enter any score.

## AI disclosure

**AI inside the product**

| Component | What it does | What it never does |
|---|---|---|
| **Jev** (TypeSafe "System One" decision model, via OpenRouter) | Rates physical site fit per housing type on a four-level rubric with probabilities and a confidence, from lot facts code computed first. Pinned model version so ratings don't shift. | Decide legality, produce a parcel score, or see your weights. If it fails or has no key, the app shows "unavailable" rather than inventing a number. Its ratings have **not** been validated against ground truth. |
| **Google Gemini** (free-tier flash-lite models, with fallback) | The chat companion: explains the facts on screen with citations, and can call the real scorer to show what a weight change does. Also read-aloud voice. | Produce a score, a legal status, or any number not in the cited facts. A guard strips sentences containing uncited numbers. |

**AI tools used to build it.** We wrote the code with AI coding assistants, mainly **Claude Code** (Anthropic's Claude Opus and Sonnet models); commits it helped write carry a `Co-Authored-By: Claude` trailer. We also used Claude for background research on Pittsburgh zoning, data sources and methods (see [`research/`](research/)). The team designed the scoring model, chose every weight and threshold, checked the zoning transcription by hand, and reviewed the code.

## Limitations

The full statement is in [`limitations.md`](limitations.md) and on the app's [`/resources#limitations`](https://house.bugdex.org/resources#limitations) page. The short version:

- **Not legal advice.** Zoning is our simplified reading of §911.02 and §903.03 as of 2026-09-26. Height, floor-area ratio, front and rear setbacks and lot area per unit are not checked. Pending bills (ADUs, Bill 2025-1545) are not applied.
- **City of Pittsburgh only.** Scores, verdicts and zoning cover City parcels. Other municipalities, including the Mount Oliver enclave, are greyed out.
- **Only a rough cost check.** The pencil check ignores land cost, financing and subsidy terms, and values new homes at existing-home prices, so it leans pessimistic.
- **Not assessed:** environmental contamination, soils and buried foundations, water and sewer capacity (shown as **unknown, not bad**), school quality, and project-level approval odds. Zoning Board approval rates describe districts, not your application.
- **Area averages are not the lot.** Tract, block-group and ZIP indicators apply to every parcel inside them, and source vintages range from 2015–20 to live.
- **AI is advisory.** Jev site fit is an unvalidated model judgment shown with its confidence. The chat explains; it is not a source.
- **Not tested with users.** The scoring follows published composite-indicator methods and hackathon expert feedback, but it has not been calibrated against real project outcomes.

We say "we don't have good data on X" wherever that is true, instead of guessing.

## What we'd build next

- Height and FAR checks in the zoning verdict.
- New-build sales comps in the pencil check, and land cost.
- The pending ADU bill as a switchable policy scenario.
- A contamination flag from PA DEP Act 2 records ("cleanup record nearby, verify").
- User testing with CDCs, small developers and City Planning, and calibration of the verdict against built projects (for example Pro-Housing Pittsburgh's permit timelines).
- Extending zoning coverage beyond the City to other Allegheny County municipalities.

City Planning, URA and Pro-Housing Pittsburgh would be natural pilot partners. None has agreed to anything; this is where we would start.

## Getting started

**Prerequisites:** [Bun](https://bun.sh) 1.3+ and a Postgres database with PostGIS.

```bash
curl -fsSL https://bun.sh/install | bash   # if you don't have bun
```

1. Create `apps/web/.env` **before** installing. The schema is in [`apps/web/.env.schema`](apps/web/.env.schema):

   ```env
   DATABASE_URL=              # Postgres + PostGIS (we use Neon)
   BETTER_AUTH_SECRET=
   BETTER_AUTH_URL=http://localhost:3001
   OPENROUTER_API_KEY=        # optional: Jev site fit; without it, site fit shows "unavailable"
   SYSTEM_ONE_BASE_URL=https://openrouter.ai/api
   SYSTEM_ONE_MODEL=jev-1.13
   GEMINI_API_KEY=            # optional: chat companion
   ```

   Never commit `.env` files or keys. The app runs without the two AI keys; those features show as unavailable.

2. Install and run:

   ```bash
   bun install
   bun run dev
   ```

3. Open http://localhost:3001.

**Rebuild the map data** (fetches public sources and writes overlays to `apps/web/public/data/overlays/`):

```bash
cd apps/web && bun run data:overlays
```

See [`apps/web/scripts/data/README.md`](apps/web/scripts/data/README.md) for how overlays are built and added, and [`apps/web/scripts/pillars/`](apps/web/scripts/pillars/) for the indicator and scoring pipeline.

**Tests:**

```bash
cd apps/web && bun test        # scoring, verdict, pencil, map and chat UI logic
cd packages/api && bun test    # chat guard, rescore, Jev client (provider mocked, no key needed)
```

**Other scripts:**

| Command | What it does |
|---|---|
| `bun run dev` | Start all apps in development mode |
| `bun run build` | Build all apps |
| `bun run check-types` | Type-check every package |
| `bun run db:studio` | Open Drizzle Studio |
| `bun run deploy` / `bun run deploy:prod` | Vercel preview / production deploy |
| `bun run env:preview` / `bun run env:production` | Sync local env to Vercel |

## Project structure

```
yinzone/
├── apps/web/                    # TanStack Start app (map, panels, /resources)
│   ├── src/lib/pillars/         # scorer: pillars.config.json, score.ts, verdict.ts, pencil.ts
│   ├── src/components/map/      # map, overlays registry, parcel / typology / levers panels
│   ├── src/components/chat/     # chat companion UI
│   ├── src/components/resources/# the /resources methodology page
│   └── scripts/                 # data/ (overlay builders), pillars/ (indicator pipeline)
├── packages/
│   ├── api/                     # oRPC routers, Jev client (system-one/), site fit (typology/), chat (chat/)
│   ├── db/                      # Drizzle schema and queries (Postgres + PostGIS)
│   ├── auth/                    # Better Auth config
│   └── ui/                      # shared shadcn/ui components
├── research/                    # domain research: BRIEFING.md, knowledge base, legal-feasibility datasets
├── limitations.md               # limitations statement
└── DATA_SOURCES.md              # full dataset catalog
```

## Libraries and services

**Libraries:** [TypeScript](https://www.typescriptlang.org/), [React 19](https://react.dev/), [TanStack Start / Router / Query / Form](https://tanstack.com/), [MapLibre GL JS](https://maplibre.org/), [oRPC](https://orpc.unnoq.com/), [Drizzle ORM](https://orm.drizzle.team/), [Better Auth](https://www.better-auth.com/), [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Zod](https://zod.dev/), [KaTeX](https://katex.org/), [Varlock](https://varlock.dev/), [Turborepo](https://turbo.build/), [Bun](https://bun.sh/). Scaffolded with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack).

**Services:** [Neon](https://neon.tech/) Postgres + PostGIS, [Vercel](https://vercel.com/) hosting, [OpenRouter](https://openrouter.ai/) (Jev), [Google Gemini API](https://ai.google.dev/), [Microsoft Planetary Computer](https://planetarycomputer.microsoft.com/) (Landsat STAC), [Census Reporter API](https://censusreporter.org/), [Overpass API](https://overpass-api.de/) and [Nominatim](https://nominatim.org/) (OpenStreetMap), [CARTO](https://carto.com/basemaps) basemaps.

## License and attribution

Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) (ODbL) and © [CARTO](https://carto.com/attributions). Redlining map: Mapping Inequality, Nelson et al., University of Richmond Digital Scholarship Lab (CC BY-SA 4.0). Jobs by transit: University of Minnesota Accessibility Observatory (CC BY-NC 4.0, non-commercial). Energy burden: U.S. DOE LEAD Tool, 2022 update (CC BY 4.0). Rents: Zillow Research. Child Opportunity Index: diversitydatakids.org. Eviction data: The Eviction Lab at Princeton University. WPRDC datasets are CC0 or CC BY; we credit the publishing agency and WPRDC. Everything else is U.S. public domain or state, county or city open data. Per-dataset terms are on [`/resources#licenses`](https://house.bugdex.org/resources#licenses).

Built during the AI Horizons 2026 hackathon, Sept 26–27, 2026.
