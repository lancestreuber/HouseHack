# Track 3 indicators and data

**Type:** track3
**One line:** Every Track 3 indicator we have located, with its source, the geography it comes at, its vintage, and what breaks when you try to download it.
**Why we care:** Track 3 mixes parcel, block, block-group and tract data from different years and different tract vintages. Most of the build risk is in access gotchas and geographic mismatches, not in the scoring.
**Last checked:** 2026-09-26

## Indicator table

Geography levels: **parcel**, **block**, **block group (BG)**, **tract**, **city-only** (layer covers only the City of Pittsburgh, not the county). Unless noted, facts are from the [data sweep](../../sweeps/r4-track3-data-methods-and-combination.md), whose agent fetched or queried each source on 2026-09-26.

| Indicator | Source | Geography | Vintage | Tag | Access gotchas |
|---|---|---|---|---|---|
| Housing cost burden by income and tenure | HUD CHAS tract file (summary level 140) | Tract, **2020 tract IDs**; Table8 has 394 Allegheny tracts | 2018–2022 ACS, published Dec 23, 2025 | `[read]` | **curl returns an empty body unless you send a browser User-Agent and Referer.** Zip is 226 MB, unpacks to 1.26 GB across 24 tables. 2019–2023 URL returns 404. A CHAS API exists but needs a token. |
| ACS demographics (general) | Census API | Tract / BG | — | `[read]` | **Needs a key now.** A keyless request redirects to `missing_key.html` with header `X-DataWebAPI-KeyError: 1`. |
| Keyless ACS substitute: median rent, home value, income, poverty, no-vehicle rate; 2020 race shares; z-scored "Level of Need"; Opportunity Atlas field `incomeKids_OpportunityAtlas` | City ArcGIS layer `Tracts2020_Pgh_CommunityNeed` | Tract, **city-only** (128 tracts) | 2022 ACS fields; 2020 race | `[read]` | City-only, so parcels outside the city get nothing. |
| Race, income, education, language scores | City ArcGIS layer `Equity_Map` | Tract, **city-only** (128 tracts) | Not recorded | `[read]` | Vintage not recorded in the sweep. |
| Market type | WPRDC `market-value-analysis-2021` (Reinvestment Fund), CC0 | **BG** (1,114 in GeoJSON; some a/b splits) | 2021 | `[read]` | Field `MVA21`, values A–J plus NC. See [displacement and equity](displacement-and-equity.md). |
| Displacement Risk Ratio (DRR) | Same WPRDC dataset, `pitts_allegheny_drr2021.zip` | **BG** (1,100 records) | 2-year windows 2014/15 → 2019/20 | `[read]` | Formula not given in the data dictionary. 92 records read "Insufficient Data" for 2019/20. |
| Displacement typology | Urban Displacement Project repo | Tract | Last push 2023 | `[read]` | **No Pittsburgh output in the repo.** GPL-3.0. |
| Climate hazard (inland flood `IFLD_RISKR`, landslide `LNDS_RISKR`, heat wave `HWAV_RISKR`, etc.) | FEMA National Risk Index, tract FeatureServer, filter `STCOFIPS='42003'` | Tract (394) | "December 2025" | `[read]` | **(a)** overall risk score grows with exposed building value, so downtown tract 020100 rates "Very High"; **(b)** `RESL_SCORE` was 87.17 for all three sampled tracts, suggesting a county-level value. Use city landslide/undermining/flood layers at parcel scale instead. |
| Landslide, undermining, flood (parcel scale) | City layers | **Parcel** (by overlay) | See node | — | See [environmental constraints](../data/environmental-constraints.md) and [Ch. 906 overlays](../policy/environmental-overlays-ch906.md). |
| Tree canopy | City `Tree_Coverage_Percent_by_Census_Block` (field `PercCover`); per-neighborhood version also exists | **Block** (7,453), city-only | Not recorded | `[read]` | Vintage not recorded in the sweep. |
| Transit service | PRT GTFS `GTFS.zip` (22.5 MB) | Stop | Calendar 2026-06-28 → 2026-10-24 | `[read]` | Covers the event dates. |
| High-frequency transit | City `HighFrequencyTransit` layer | Stop (742), city-only | Not recorded | `[read]` | Has weekday, Saturday and Sunday trip counts. |
| Jobs | LEHD LODES8 PA (`pa_wac_S000_JT00_2023.csv.gz`, `pa_od_main_JT00_2023.csv.gz`) | Not recorded in the sweep | 2023 | `[read]` (files exist) | Geography level not recorded; confirm before joining. |
| Transit access to jobs, distance to transit, zero-car share | EPA Smart Location Database MapServer (30 layers) | Not recorded in the sweep | Not recorded | `[read]` (service responds) | Geography and vintage not recorded; confirm. |
| Economic mobility | Opportunity Atlas `tract_outcomes_simple.csv` (34 MB), e.g. `kfr_pooled_pooled_p25` + SEs | Tract, **2010 tracts** | Not recorded | `[read]` | **2010 tracts need a crosswalk** to join with 2020-tract CHAS and NRI. The city Community Need layer already carries an Opportunity Atlas field on 2020 tracts. |
| Child Opportunity Index | COI site | — | — | `[inaccessible]` | Returned 403 to curl. |
| Housing + transportation cost | CNT H+T Index download page | Neighborhood (per the prior-art sweep) | — | `[skimmed]` | **Needs free registration with a reCAPTCHA.** Register before the build or skip. |
| Household carbon by place | CoolClimate API | ZIP (per the prior-art sweep) | — | `[skimmed]` | Free API key, rate-limited. |
| Community organization areas | City `PGHWebRCO` layer (45 polygons) | Polygon (RCO area), city-only | Not recorded | `[read]` | **The layer includes contacts' names, emails and phone numbers. Request only `organization_name` and geometry** (e.g. `outFields=organization_name`), so no PII enters the pipeline. |
| Housing needs context | Local Housing Solutions needs tool (PolicyMap) | Jurisdiction | — | `[skimmed]` | Free to view. |

## Geographic mismatches to plan for

From the [data sweep](../../sweeps/r4-track3-data-methods-and-combination.md), section 3:

- **2010 vs. 2020 tracts.** Opportunity Atlas is on 2010 tracts; CHAS, NRI and the city Community Need layer are on 2020 tracts. Either crosswalk or use the city layer's Opportunity Atlas field.
- **MVA block groups with a/b splits.** 1,114 MVA polygons vs. 1,100 DRR records, so the two do not line up one-to-one.
- **City-only vs. county-wide.** Community Need, Equity Map, canopy, HighFrequencyTransit and RCO layers cover 128 city tracts or city areas; CHAS and NRI cover 394 county tracts.
- **Parcel vs. area.** Zoning and environmental constraints attach at parcel level; everything else in this table is an area value that every parcel in the area inherits. That is a real limit on "per-parcel" claims.

## Output shape

The build sweep proposes precomputing Track 3 metrics per block group into one JSON file of about 1–2 MB (an estimate), consumed client-side so weight sliders update instantly ([build sweep](../../sweeps/r4-build-feasibility-on-team-stack.md)). The pipeline itself is in [data pipeline](../build-plan/data-pipeline.md).

## Open questions

- The DRR formula. Reinvestment Fund might answer.
- LODES and EPA SLD geography level and SLD vintage, not recorded by the sweep.
- Vintages of the Equity Map, canopy and HighFrequencyTransit layers.
- Whether COI or H+T are worth registering for, given the city layer already carries an Opportunity Atlas field.
- Any data source for "infrastructure capacity" (not searched by either Track 3 sweep).
- Whether a "Middle Atlantic" or Pittsburgh-specific RECS cut is needed, or national-by-type is enough (see [carbon](carbon-by-typology.md)).

## Connects to

- [Brief and requirements](brief-and-requirements.md): the "Useful data" list this node resolves
- [Market and affordability](../data/market-and-affordability.md): HUD AMI and rent context
- [Environmental constraints](../data/environmental-constraints.md): parcel-scale hazard layers preferred over NRI
- [Environmental overlays Ch. 906](../policy/environmental-overlays-ch906.md): the legal overlays behind those layers
- [Parcels and assessments](../data/parcels-and-assessments.md): the parcel spine everything joins to
- [Infrastructure](../data/infrastructure.md): the uncovered "infrastructure capacity" axis
- [Organizer data catalog](../data/organizer-data-catalog.md): overlap with organizer-recommended sources
- [Displacement and equity](displacement-and-equity.md): MVA and DRR in depth
- [Data pipeline](../build-plan/data-pipeline.md): how these are pulled and joined

## Sources

- [HUD CHAS data](https://www.huduser.gov/portal/datasets/cp.html) `[read]` *(accessed 2026-09-26)*: tract file 2018–2022, UA/Referer gotcha
- [WPRDC Market Value Analysis 2021](https://data.wprdc.org/dataset/market-value-analysis-2021) `[read]` *(accessed 2026-09-26)*: MVA GeoJSON and DRR shapefile
- [City of Pittsburgh ArcGIS services](https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services) `[read]` *(accessed 2026-09-26)*: Community Need, Equity Map, canopy, HighFrequencyTransit, PGHWebRCO
- [FEMA National Risk Index data resources](https://hazards.fema.gov/nri/data-resources) `[read]` *(accessed 2026-09-26)*: tract service, Dec 2025 version, caveats
- [PRT developer resources](https://www.rideprt.org/business-center/developer-resources/) `[read]` *(accessed 2026-09-26)*: GTFS feed
- [LEHD LODES8 PA](https://lehd.ces.census.gov/data/lodes/LODES8/pa/) `[read]` *(accessed 2026-09-26)*: 2023 WAC and OD files
- [EPA Smart Location Database MapServer](https://geodata.epa.gov/arcgis/rest/services/OA/SmartLocationDatabase/MapServer) `[read]` *(accessed 2026-09-26)*: 30 layers, service responds
- [Opportunity Atlas files](https://www2.census.gov/ces/opportunity/) `[read]` *(accessed 2026-09-26)*: columns checked, 2010 tracts
- Child Opportunity Index site `[inaccessible]` *(accessed 2026-09-26)*: blocker is HTTP 403 to curl; URL not recorded in the sweep
- [CNT H+T Index download](https://htaindex.cnt.org/download/) `[skimmed]` *(accessed 2026-09-26)*: registration + reCAPTCHA wall; not downloaded
- [CoolClimate API](https://coolclimate.berkeley.edu/api) `[skimmed]` *(accessed 2026-09-26)*: search summary only
- [Urban Displacement Project typologies repo](https://github.com/urban-displacement/displacement-typologies) `[read]` *(accessed 2026-09-26)*: no Pittsburgh output
- [Local Housing Solutions needs assessment](https://www.localhousingsolutions.org/housing-needs-assessment/) `[skimmed]` *(accessed 2026-09-26)*: search summary only
- Sweep: [../../sweeps/r4-track3-data-methods-and-combination.md](../../sweeps/r4-track3-data-methods-and-combination.md) `[read]` *(accessed 2026-09-26)*: primary source for this node
- Sweep: [../../sweeps/r4-track3-prior-art-and-hackathons.md](../../sweeps/r4-track3-prior-art-and-hackathons.md) `[read]` *(accessed 2026-09-26)*: H+T, CoolClimate, needs tool
- Sweep: [../../sweeps/r4-build-feasibility-on-team-stack.md](../../sweeps/r4-build-feasibility-on-team-stack.md) `[read]` *(accessed 2026-09-26)*: per-BG metrics JSON
