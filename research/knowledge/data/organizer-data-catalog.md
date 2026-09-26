# Organizer data catalog

**Type:** data
**One line:** The organizers' "AI Hackathon for Housing — Public Data Catalog" spreadsheet: ⚠ 60 rows (58 distinct sources) rated Core or Useful and tagged to problem briefs, plus a Read Me and a Brief Source Map.
**Why we care:** It shows which sources the organizers expect a Track 1 or Track 3 entry to use, and it sets explicit quality and privacy rules that bear on the Data & AI Integrity criterion.
**Last checked:** 2026-09-26

## Provenance
- Primary: the organizer-provided Google Sheet, exported as xlsx on 2026-09-26 `[read]`. Saved copies in this repo: [data catalog CSV](../../sources/organizers-2026-09-26-public-data-catalog.csv) and [Read Me + Brief Source Map tabs, verbatim](../../sources/organizers-2026-09-26-public-data-catalog-readme-and-brief-map.md).
- We first saw the same catalog in a participant's public research wiki repo; its CSV has identical dataset names (60 rows) `[read]`.

## Counts
- 60 rows: **31 Core, 29 Useful**. "City-owned property" appears twice (Core under Vacancy & distress; Useful under Housing production).
- ⚠ **60 rows (58 distinct sources)** *(corrected 2026-09-26 per docs/04-critique.md row 19)*: two pairs share a URL ("City-Owned Properties" / "City-owned property"; "PLI Permits" / "Historical PLI Permits"), so there are 58 distinct URLs.
- The catalog's own definitions (Read Me): "Core sources are likely to support a central prototype workflow. Useful sources add context, validation, or specialized features."
- Brief tags per row (a row can carry several; 5 rows say "All briefs", counted in every column below; 4 Core rows, the Vacancy & distress block, have no brief tag):

| | Feasibility (Track 1) | Permit Navigator | Typology & Climate (Track 3) | Observatory |
|---|---|---|---|---|
| Core | 20 | 9 | 20 | 19 |
| Useful | 16 | 4 | 21 | 19 |

## Brief-to-track mapping
The catalog's brief names are "Development Feasibility & Pro Forma Navigator", "Policy-to-Permit Navigator", "Housing Production, Rents & Household Flow Observatory" and "Housing Typology, Equity & Climate Matchmaker". The event site has three tracks. Track 1's page title is "Development Feasibility & Pro Forma Navigator", but its URL slug is `challenges/policy-to-permit.html`.

**Our inference, unverified:** the Policy-to-Permit brief was merged into Track 1, so the Permit Navigator rows (ZBA decisions, municipal codes, violations, historical permits) may be in scope for Track 1. Confirm with the organizers. Track 3 = Typology & Climate by name. See [brief and judging](../challenge/brief-and-judging.md).

## Brief Source Map (verbatim rows for Track 1 and Track 3)

| Problem brief | Start with these core sources | High-value additions |
|---|---|---|
| Development Feasibility & Pro Forma Navigator | County assessments, sales and parcels; Pittsburgh zoning code/map; PLI permits; OneStopPGH; FEMA flood layer; steep slopes; undermined areas | PASDA/USGS elevation and imagery; BLS PPI; HUD income limits/FMR; Zillow, Redfin and Realtor.com aggregate markets |
| Policy-to-Permit Navigator | Pittsburgh zoning code; PLI permits; OneStopPGH; ZBA decisions; municipal codes | Violations; condemned properties; cross-jurisdiction county GIS; historical permits |
| Housing Typology, Equity & Climate Matchmaker | ACS; CHAS; parcels/land use/zoning; PRT GTFS; LAI; FEMA; slopes; ResStock | Opportunity Atlas; EPA EJScreen; NLCD; NOAA; schools; market-demand datasets |

## Read Me rules that bind us (verbatim)
- **Quality rule:** "Record the download date, source vintage, field definitions, missingness, revisions, and any transformations. Never let an AI-generated answer outrank an authoritative rule or source record."
- **Privacy rule:** "Do not publish person-level tenant, applicant, mortgage, or household data. Aggregate, suppress small cells, and document consent for contributed data."
- "Public does not mean unrestricted": review terms, attribution, API limits and licenses before redistributing derived data.
- Private-company rows (Zillow, Redfin, Realtor.com) mean their public aggregate research datasets, "not listing-level feeds, property APIs, or permission to scrape their consumer websites."
- Geographic joins: prefer parcel ID for property records and Census GEOID/FIPS for statistical geography; keep a crosswalk when vintages differ.

## Catalog vs what we probed
- Sources in the catalog that we have queried live: assessments, sales, parcel boundaries, PLI permits, OneStopPGH (via the `OSPI_H` FeatureServer, not the portal), zoning districts, FEMA NFHL, steep slopes, undermined areas, 3DEP, eMapPA, GTFS, LIHTC, HUD income limits, Zillow, LODES, delinquency, city-owned, condemned, violations. Details in the linked nodes.
- The catalog lists the zoning code via `pittsburghpa.gov/dcp/zoning-code`; the text itself is on eCode360, which blocks scripted fetches ([zoning code text](zoning-code-text.md)).
- The catalog lists ZBA decisions and municipal codes but not how to get structured data from them; see [ZBA decisions](zba-decisions.md) and [municipal zoning](municipal-zoning-outside-city.md).
- Sources we use that are **not** in the catalog: County Real Estate Portal (shows owner name; ⚠ do not ingest, use OWNERDESC only *(corrected 2026-09-26 per docs/04-critique.md row 32)*), `ParcelsPublicCityVacant`, ETHOS lot suitability, lot dimensions, sewersheds/CSO, lead service lines, DEP Act 2/AUL, EPA facilities, wetlands, soils, QCT/DDA/OZ layers, suburban zoning layers via the PRT registry, Pro-Housing Pittsburgh's 20+-unit CSV.
- Catalog caveats are quoted in the relevant nodes.

## Full catalog (compact)
T1 Feas. = tagged Feasibility; PtP = Permit Navigator; T3 Typ. = Typology & Climate; Obs. = Observatory. "All briefs" rows are ticked in every column.

| Priority | Source | T1 Feas. | PtP | T3 Typ. | Obs. | Our node |
|---|---|---|---|---|---|---|
| Core | Allegheny County Property Assessments | ✓ |  | ✓ |  | [parcels-and-assessments](parcels-and-assessments.md) |
| Core | Allegheny County Property Sale Transactions | ✓ |  |  | ✓ | [market-and-affordability](market-and-affordability.md) |
| Core | Allegheny County Parcel Boundaries | ✓ | ✓ | ✓ | ✓ | [parcels-and-assessments](parcels-and-assessments.md) |
| Core | Allegheny County GIS Open Data Portal | ✓ | ✓ | ✓ | ✓ | [municipal-zoning-outside-city](municipal-zoning-outside-city.md) |
| Core | PLI Permits | ✓ | ✓ |  | ✓ | [permits-and-outcomes](permits-and-outcomes.md) |
| Core | Historical PLI Permits |  | ✓ |  | ✓ | [permits-and-outcomes](permits-and-outcomes.md) |
| Core | PLI / DOMI / Environmental Services Violations | ✓ | ✓ |  | ✓ | [land-availability-and-title](land-availability-and-title.md) |
| Core | Pittsburgh Zoning Districts | ✓ | ✓ | ✓ |  | [zoning-gis](zoning-gis.md) |
| Core | Pittsburgh Zoning Code | ✓ | ✓ | ✓ |  | [zoning-code-text](zoning-code-text.md) |
| Core | Pittsburgh Development / Permit Records via OneStopPGH | ✓ | ✓ |  | ✓ | [permits-and-outcomes](permits-and-outcomes.md) |
| Core | Allegheny County Housing Needs Assessment ⚠ link dead (404); no such report found; see [Allegheny County](../stakeholders/allegheny-county.md) *(corrected 2026-09-26 per docs/04-critique.md row 27)* |  |  | ✓ | ✓ | – |
| Core | American Community Survey 5-Year |  |  | ✓ | ✓ | – |
| Core | Decennial Census |  |  | ✓ | ✓ | – |
| Core | TIGER/Line Shapefiles | ✓ | ✓ | ✓ | ✓ | [market-and-affordability](market-and-affordability.md) |
| Core | Comprehensive Housing Affordability Strategy (CHAS) |  |  | ✓ | ✓ | – |
| Core | Fair Market Rents and Small Area FMRs | ✓ |  |  | ✓ | [market-and-affordability](market-and-affordability.md) |
| Core | Low-Income Housing Tax Credit Database |  |  | ✓ | ✓ | [permits-and-outcomes](permits-and-outcomes.md) |
| Core | Home Mortgage Disclosure Act Data | ✓ |  |  | ✓ | – |
| Core | Pittsburgh Regional Transit GTFS |  |  | ✓ | ✓ | [infrastructure](infrastructure.md) |
| Core | Pennsylvania Spatial Data Access (PASDA) | ✓ |  | ✓ |  | [lidar-slope](lidar-slope.md) |
| Core | USGS 3D Elevation Program | ✓ |  | ✓ |  | [lidar-slope](lidar-slope.md) |
| Core | FEMA National Flood Hazard Layer | ✓ |  | ✓ |  | [environmental-constraints](environmental-constraints.md) |
| Core | Pittsburgh Steep Slopes (25% or greater) | ✓ |  | ✓ |  | [environmental-constraints](environmental-constraints.md) |
| Core | Pittsburgh Undermined Areas | ✓ |  | ✓ |  | [environmental-constraints](environmental-constraints.md) |
| Core | Zillow Research Housing Data | ✓ |  | ✓ | ✓ | [market-and-affordability](market-and-affordability.md) |
| Core | Redfin Housing Market Data Center | ✓ |  | ✓ | ✓ | – |
| Core | Realtor.com Residential Real Estate Data Library | ✓ |  | ✓ | ✓ | – |
| Core | Allegheny County Real Estate Tax Delinquency |  |  |  |  | [land-availability-and-title](land-availability-and-title.md) |
| Core | City of Pittsburgh and School District Property Tax Delinquency |  |  |  |  | [land-availability-and-title](land-availability-and-title.md) |
| Core | Mortgage Foreclosures |  |  |  |  | [land-availability-and-title](land-availability-and-title.md) |
| Core | City-owned property |  |  |  |  | [land-availability-and-title](land-availability-and-title.md) |
| Useful | Condemned and Dead-End Properties | ✓ |  |  | ✓ | [land-availability-and-title](land-availability-and-title.md) |
| Useful | Pittsburgh Zoning Board of Adjustment Decisions | ✓ | ✓ |  |  | [zba-decisions](zba-decisions.md) |
| Useful | Pennsylvania Municipal Codes |  | ✓ | ✓ |  | [municipal-zoning-outside-city](municipal-zoning-outside-city.md) |
| Useful | City-Owned Properties | ✓ |  |  | ✓ | [land-availability-and-title](land-availability-and-title.md) |
| Useful | City of Pittsburgh Property Tax Abatements | ✓ |  |  | ✓ | – |
| Useful | Location Affordability Index |  |  | ✓ | ✓ | – |
| Useful | HUD Income Limits | ✓ |  | ✓ |  | [market-and-affordability](market-and-affordability.md) |
| Useful | National Housing Preservation Database |  |  | ✓ | ✓ | – |
| Useful | USPS Vacancy Data |  |  | ✓ | ✓ | – |
| Useful | LEHD Origin-Destination Employment Statistics (LODES) |  |  | ✓ | ✓ | [market-and-affordability](market-and-affordability.md) |
| Useful | Quarterly Census of Employment and Wages |  |  | ✓ | ✓ | – |
| Useful | Producer Price Index | ✓ |  |  |  | – |
| Useful | PennDOT Open Data | ✓ |  | ✓ |  | – |
| Useful | OpenStreetMap | ✓ | ✓ | ✓ | ✓ | – |
| Useful | OpenAddresses | ✓ | ✓ | ✓ | ✓ | – |
| Useful | Allegheny County Orthoimagery | ✓ |  |  | ✓ | – |
| Useful | PA DEP eMapPA | ✓ |  | ✓ |  | [environmental-constraints](environmental-constraints.md) |
| Useful | EPA EJScreen |  |  | ✓ | ✓ | – |
| Useful | National Land Cover Database |  |  | ✓ |  | – |
| Useful | NOAA Climate Data Online |  |  | ✓ |  | – |
| Useful | ResStock Public Data | ✓ |  | ✓ |  | – |
| Useful | Redfin Migration Patterns |  |  | ✓ | ✓ | – |
| Useful | Primary Mortgage Market Survey | ✓ |  |  | ✓ | – |
| Useful | FHFA House Price Index | ✓ |  |  | ✓ | – |
| Useful | Opportunity Atlas |  |  | ✓ | ✓ | – |
| Useful | Allegheny County 311 / Pittsburgh 311 Requests |  |  | ✓ | ✓ | [market-and-affordability](market-and-affordability.md) |
| Useful | NCES School Locations and Characteristics |  |  | ✓ |  | – |
| Useful | Mercatus Commuter Market Access Dataset for Congested Auto Travel (McMADCAT) | ✓ |  | ✓ | ✓ | – |
| Useful | Access Across America | ✓ |  | ✓ | ✓ | – |

## Open questions
- Was the Policy-to-Permit brief merged into Track 1? (inference from the URL slug; confirm with organizers)
- Which track, if any, the Observatory brief corresponds to (not needed for Track 1/3 work).
- Why the four Vacancy & distress Core rows carry no brief tag.
- Whether the catalog will be revised during the event (the saved copy is dated 2026-09-26).
- Which document the County HNA row was meant to point to (its URL is dead).

## Connects to
- [Brief and judging](../challenge/brief-and-judging.md): tracks and the Data & AI Integrity criterion
- [Rules and deliverables](../challenge/rules-and-deliverables.md): dataset listing in the README
- [Track 3 brief and requirements](../track3/brief-and-requirements.md)
- [Track 3 indicators and data](../track3/indicators-and-data.md)
- [Other participants](../landscape/other-participants.md): where the catalog was first seen
- [LLM role](../methods/llm-role.md): the quality rule on AI answers vs authoritative records
- [Data pipeline](../build-plan/data-pipeline.md)

## Sources
- [AI Hackathon for Housing — Public Data Catalog (organizer Google Sheet)](https://docs.google.com/spreadsheets/d/19CKyt1kansUZ3VGOAOBihYYxNFuitx5VTkzOiEy4iXA) `[read]` *(accessed 2026-09-26)*: primary; Data Catalog, Read Me and Brief Source Map tabs
- Saved copies: [../../sources/organizers-2026-09-26-public-data-catalog.csv](../../sources/organizers-2026-09-26-public-data-catalog.csv), [../../sources/organizers-2026-09-26-public-data-catalog-readme-and-brief-map.md](../../sources/organizers-2026-09-26-public-data-catalog-readme-and-brief-map.md)
- [het-sheth/ai-housing-hackathon-wiki](https://github.com/het-sheth/ai-housing-hackathon-wiki), file `raw/hackathon/AI Hackathon for Housing — Public Data Catalog - Data Catalog.csv` `[read]` *(accessed 2026-09-26)*: where we first saw it; same 60 dataset names
- [Track 1 brief page](https://ai-horizons-2026-ai-for-housing-hackathon.brandon831577.chatgpt.site/challenges/policy-to-permit.html) `[read]` *(accessed 2026-09-26)*: URL slug vs title
- Sweep: [../../sweeps/r3-reality-check-existing-tools.md](../../sweeps/r3-reality-check-existing-tools.md)
- [Adversarial critique](../../docs/04-critique.md) — rows 19, 27, 32
