# Briefing: Track 3, with what works and what doesn't

*A 2-minute read. Last updated 2026-09-26. Every line links to where the evidence lives. For the full argument, see [`knowledge/PAPER.md`](knowledge/PAPER.md). To look up one fact, see [`knowledge/INDEX.md`](knowledge/INDEX.md).*

## TL;DR: we're building for Track 3

**Brief:** [Housing Typology, Equity & Climate Matchmaker](https://ai-horizons-2026-ai-for-housing-hackathon.brandon831577.chatgpt.site/challenges/typology-equity-climate) · **Idea bank:** [track3/ideas-and-considerations.md](knowledge/track3/ideas-and-considerations.md)

- **The four acceptance tests** (quoted from the brief). A user can:
  - *"compare at least two housing scenarios for a real place"*
  - *"see why the tool ranked them differently"*
  - *"change normative weights"*
  - *"understand which conclusions are data-driven versus value judgments"*

  The demo must visibly pass all four.
- **Seven axes:** demand, physical feasibility, affordability, displacement risk, infrastructure capacity, access to opportunity, marginal carbon.
- **The brief's closing line doubles as a labeling scheme:** *"separate observed evidence from policy choices, assumptions, and value judgments."* Tag every number with one of those four, plus "unknown".
- **Our Track 1 work becomes the feasibility axis:** zoning gates, lot rules, overlays, city lots, and the ZBA approval sample. It answers the brief's *"or whether current zoning allows it"*. It is **not** a second headline score. The form takes one track.
- **Strongest data:** feasibility, opportunity access, affordability (CHAS). **Weakest:** demand, and carbon for Pittsburgh specifically. **Unknown:** infrastructure capacity, which is not public, so we say so.
- **The biggest trap is equity framing.** A "densify here" ranking lands in Transitional and Stressed markets, where Black residents are concentrated. The published displacement metric does *not* flag those markets. Never output "this neighborhood should get X". → [displacement](knowledge/track3/displacement-and-equity.md)
- **Build approach (unchanged):**
  - geo work offline (Python/DuckDB → PMTiles + JSON)
  - scoring and weights in the browser, so sliders are instant
  - the server only for LLM explanations
  - remove the login wall

  → [architecture](knowledge/build-plan/architecture-options.md)

## Ideas for the product (options, none picked)

**What a "scenario" could mean.** Each option answers a different persona in the brief:

| Scenario type | Example | Serves |
|---|---|---|
| Typology vs typology, same land | Duplexes vs townhomes vs a small apartment on these 12 city lots | CDCs, developers |
| Growth pattern vs growth pattern | 200 homes as scattered ADUs and duplexes vs one building near the busway | Residents, officials |
| Policy vs policy | Current code vs Bill 2025-1545 (ADUs by right, no parking minimums), labeled *proposed* | Planners |
| Place vs place | Triplex in neighborhood A vs B | CDCs. ⚠ Riskiest for equity. |

**Features that map to the tests:**
- **Consequence table:** axes × scenarios, each cell showing a value, a range, a label and a source.
- **Contribution bars and a one-line "why B beats A".** An LLM can write the sentence from the deterministic numbers; it never computes them.
- **Weight sliders and persona lenses** (planner / CDC / developer / resident / climate-first / anti-displacement-first).
- **Tipping points,** e.g. "A overtakes B if carbon weight > 0.35".
- ⭐ **Robust vs contested:** a ranking that holds under every lens is data-driven. One that flips is a value judgment. This speaks directly to the fourth test.
- **"Who benefits / who bears risk" panel,** plus displacement as a *guardrail* (warning) and optionally as a weight.
- **Community input:** saved stakeholder weight profiles shown side by side, not averaged. The brief's owner line asks for "community-stakeholder input".
- **Carbon toggle:** per unit / per person / per m², labeled **value judgment**. A rehab-vs-new scenario could matter given Pittsburgh's 20k+ vacant units.
- **One-page scenario memo** for a community meeting.

The prototype menu from the brief, assessed, and persona needs: → [idea bank §5–6](knowledge/track3/ideas-and-considerations.md)

## What works (verified, usable now)

- **Parcel lookup:** by parcel ID (WPRDC `datastore_search` with filters) or by address (Census geocoder → County parcel point query). → [parcels](knowledge/data/parcels-and-assessments.md)
- **Zoning district per parcel:** city layer `PGHWebZoning`, field `zon_new`. → [zoning GIS](knowledge/data/zoning-gis.md)
- **Residential rules on the official code site** (eCode360): lot sizes, setbacks and heights (§903.03, no FAR), plus the use table (§911.02). → [rules](knowledge/policy/dimensional-standards-and-use-table.md)
- **Hazards:**
  - flood (FEMA NFHL)
  - landslide, 25%+ slope and undermined areas (city layers)
  - contamination (PA DEP and EPA)
  - 1 m slope per parcel (USGS 3DEP)

  → [environmental](knowledge/data/environmental-constraints.md) · [slope](knowledge/data/lidar-slope.md)
- **Approval rules the engine needs, read on eCode360 in round 5:**
  - **Parking shortfall:** an Alternative Access and Parking Plan, not a variance. The Zoning Administrator decides at 10 or fewer spaces; above that it is a ZBA Special Exception.
  - **Missed decision deadlines:** treated as denial.
  - **Site Plan Review:** triggered by ≥4 units or any construction in the H district.
  - **Floodway:** no-rise analysis + DEP permit.

  → [re-read](sweeps/r5-ecode360-reread-ch906-914-915-922.md) · [saved code text](sources/)
- **Undersized lots (§921.04, read on eCode360 in round 6):**
  - **Single house:** a vacant lot below the district minimum can hold one house through an **Administrator Exception that the Zoning Administrator "shall approve"**, provided the lot is recorded or separately deeded and "in separate ownership from abutting lots".
  - **Two or more units:** needs a ZBA special exception.
  - ⚠ **Adjacent lots with the same owner:** the code gives no path when the owner also owns an abutting parcel. That is common for city, URA and Land Bank lots, so scoring needs an **owner-adjacency flag**.
  - **Hillside (H) district:** 3,200 sf minimum, maximum disturbance 50% of the lot, and Site Plan Review.
  - **Ch. 916:** steps down the height of multifamily and non-residential buildings within 100 ft of low-density residential. It does not apply to single-unit houses.

  → [sweep](sweeps/r6-ch921-hillside-916.md) · [921 text](sources/ecode360-2026-09-26-pittsburgh-921-nonconformities.md)
- **Overlay consequences, read on eCode360:**
  - Steep slope → Planning Commission review.
  - Undermined land → only single-unit homes, and only with more than 100 ft of rock or soil above the mine workings; anything else is prohibited until a site investigation clears it.

  → [overlays](knowledge/policy/environmental-overlays-ch906.md)
- **Real outcomes:** about 370 residential new-construction projects since 2019, which lets us backtest a score. → [permits](knowledge/data/permits-and-outcomes.md) · [backtest](knowledge/methods/backtest-and-calibration.md)
- **ZBA outcomes (new, round 5):**
  - We coded **90 decisions from 2026 hearings. Of the 84 relief requests, 81% were approved** (35 of those with conditions), 15.5% were denied and 3.6% split.
  - **Most-varied sections:** setbacks (§903.03, 18 cases), accessory structures / front-yard parking pads (§912.04, 15), signs (§919, 14). Use (§911) is the most cited once special exceptions are counted (24).
  - **Signs and parking pads are the riskiest requests.** Every change of a nonconforming use (§921.02) was approved.
  - **Time:** a median of 34 days from the *final* hearing to the decision. At least 15 cases needed more than one hearing.
  - **Coverage and bias:** about two-thirds of 2026 case numbers are covered, and withdrawn cases are missing, so the approval rate is biased upward. About 1,000 older decision PDFs (2021–2024) exist on the Internet Archive.

  → [sweep](sweeps/r5-zba-decisions-sample.md) · [CSV](sources/pittsburghpa-2026-09-26-zba-decisions-sample.csv)
- **Approval timelines from OneStopPGH:** alterations take a median of 8 days. New construction takes a median of 153 days, but that includes applicant time and counts only the 35% of cases already issued. → [timelines](knowledge/policy/permit-timelines.md)
- **City-owned vacant lots:** 5,786 in total, 3,260 "Available for Sale", with status and inventory type. → [land](knowledge/data/land-availability-and-title.md)
- **Track 3 layers:**
  - MVA market types and the displacement risk ratio (block group)
  - CHAS cost burden
  - FEMA National Risk Index
  - the City's Community Need layer (includes the Opportunity Atlas)
  - high-frequency transit
  - LODES jobs

  → [indicators](knowledge/track3/indicators-and-data.md)
- **Carbon by housing type:** RECS energy per household, Dublin embodied carbon per m², and the BfCA metric-flip finding. → [carbon](knowledge/track3/carbon-by-typology.md)
- **Stack:**
  - Neon supports PostGIS.
  - TanStack Start can turn SSR off per route, which the map needs.
  - Vercel serves the byte-range requests PMTiles needs.
  - tippecanoe, DuckDB and GDAL all install from brew.

  → [pipeline](knowledge/build-plan/data-pipeline.md)

## What doesn't work / traps

- **No public infrastructure capacity data** (sewer, water, power). The tool must say "unknown", never "fails".
  - PWSA decides sewer capacity per project: dry weather, 5 years out, at the tightest downstream sewer.
  - Reviews take 30 business days each. The sewage-planning sign-off takes 3–6 months via a Council resolution.
  - DEP has accepted no planning exemptions in PWSA's area since 3/2/2011.

  → [infrastructure](knowledge/data/infrastructure.md) · [sweep](sweeps/r5-council-records-and-methodologies.md)
- **The zoning code can't be scraped.** eCode360 blocks scripts; a real browser works. → [access log](admin/source-access.md)
- **WPRDC's SQL endpoint blocks WHERE clauses.** Use `filters` or bulk CSV instead.
- **Census API needs a key. HUD needs a token. CHAS needs browser headers.**
- **Permit-type recode in 2025:** query both `NEW CONSTRUCTION` and `New Construction`.
- **Slope layer geometry:** the polygons have holes. Intersect with the parcel polygon, not its centroid.
- **No countywide zoning.** Only the city plus 9 suburban layers, with no code text for the suburbs. → [municipal](knowledge/data/municipal-zoning-outside-city.md)
- **Many City layers were last edited in 2023.** Show data-as-of dates.
- **Privacy:**
  - Never ingest owner names.
  - The RCO layer has contacts' names, emails and phones. Request only the organization name and geometry.
- **The displacement risk ratio does *not* flag the markets you'd expect** (it flags Robust markets), and its formula is undocumented. Don't call anything "highest displacement risk". → [equity](knowledge/track3/displacement-and-equity.md)
- **The scaffold's login wall** is a demo risk for judges.

## Unknown (would change the plan)

**Track 3-specific:**
- which real place to demo
- displacement as weight, guardrail, or both
- default carbon normalization
- whether judges expect all seven axes or depth on some
- which personas the City and County partners care about

**Carried over:**

1. Who the primary user is, and whether "which site is easiest" is a real pain for them.
2. How judges treat a T1 + T3 combination, and whether "Policy-to-Permit" was merged into Track 1.
3. Where projects actually stall. Our ZBA sample says variances are usually granted (81% of posted decisions), which suggests the ZBA may be more *delay* than *denial*. But the Planning Commission, RCO and PWSA steps are still untimed.
4. Which code version to score: current, 2025-1545, or 2026-0834.
5. What "approved affordability assumptions" means for the pro forma.

→ All of these, ranked: [`docs/03-open-questions.md`](docs/03-open-questions.md)

## Find it fast

| I need… | Go to |
|---|---|
| **How to join parcel size, zoning, air quality and weather onto the parcel GeoJSON** | [`knowledge/data/parcel-enrichment-join-plan.md`](knowledge/data/parcel-enrichment-join-plan.md) |
| **Every external link** (datasets, APIs, code, news, papers), grouped and tagged | [`docs/02-bibliography.md`](docs/02-bibliography.md) |
| The one-line list of every topic | [`knowledge/INDEX.md`](knowledge/INDEX.md) |
| An endpoint URL, resource ID or field name | [`knowledge/data/`](knowledge/data/) (one node per data family) |
| A zoning rule or the approval steps | [`knowledge/policy/`](knowledge/policy/) and the saved code text in [`sources/`](sources/) |
| What judges want and the submission rules | [`knowledge/challenge/`](knowledge/challenge/) |
| Scoring, uncertainty and the LLM's role | [`knowledge/methods/`](knowledge/methods/) |
| Track 3 indicators, carbon and equity | [`knowledge/track3/`](knowledge/track3/) |
| Architecture, pipeline and timeline | [`knowledge/build-plan/`](knowledge/build-plan/) |
| What already exists, and other teams' public repos | [`knowledge/landscape/`](knowledge/landscape/) |
| What we got wrong | [Corrections log](knowledge/README.md#corrections-log) and [`docs/04-critique.md`](docs/04-critique.md) |
| Why a source couldn't be reached | [`admin/source-access.md`](admin/source-access.md) |
| The raw research transcripts | [`sweeps/`](sweeps/) |
