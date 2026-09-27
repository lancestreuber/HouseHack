# Market, affordability and geography

**Type:** data
**One line:** Sales comps, rents, HUD income limits, LIHTC incentive geographies (QCT/DDA/OZ), and the geography and access layers used to join them to parcels.
**Why we care:** A score that says "buildable" should also say whether it pencils and at what affordability level. These are also the demand and equity inputs Track 3 needs.
**Last checked:** 2026-09-26

## Sales comps: WPRDC property sales `[read]`
- Resource `5bbe6c55-bce6-4edb-9d04-68edeb6bf7b1`, **503,747 rows**, current to 2026-09-24. Fields include PARID, SALEDATE, PRICE, SALECODE, SALEDESC, INSTRTYP.
- **No square footage.** Join on PARID to assessments `65855e14-…` (FINISHEDLIVINGAREA, YEARBLT, LOTAREA, USEDESC, CONDITION, GRADE).
- `datastore_search_sql` → **403**; use `datastore_search` `filters` or `/datastore/dump/<id>` CSV (200).

| SALECODE | Meaning | Rows | Use |
|---|---|---|---|
| 0 | valid sale | 99,176 | keep |
| **16** | **"BUILDING NOT YET ASSESSED"** = sale of a newly built house | 6,657 | new-construction comps |
| 3 | love and affection | 103,908 | exclude |
| H | multi-parcel | 67,051 | exclude |
| 9 / 33 / 35 / 13 | other invalid / prior foreclosure / corporation transfer / exempt party | | exclude |

Catalog caveat: many nominal transfers are not arm's-length.

## Rents and values

| Source | Detail | Tag |
|---|---|---|
| Zillow ZORI by ZIP `https://files.zillowstatic.com/research/public_csvs/zori/Zip_zori_uc_sfrcondomfr_sm_month.csv` | 10 MB; 55 Allegheny ZIPs through 2026-08 | `[read]` |
| Zillow ZHVI mid-tier CSV | 124 MB | `[read]` |
| Census ACS B25064 (median rent) | The Census API needs a free key (unkeyed calls redirect to `missing_key.html`). ⚠ **Keyless workaround (2026-09-27):** Census Reporter serves ACS 2024 5-year B25064 by tract and block group. City tracts run $501–$2,345 (p10–p90 $895–$1,773, 2.0×); 48 of 265 block groups have CV > 30%. → [r9 comps sweep](../../sweeps/r9-revenue-comps-sub-zip.md) | `[read]` (redirect observed; Census Reporter queried 2026-09-27) |
| City `C/ACS_DP04` | DP04_0134E median gross rent, keyless; **2020 5-year** | `[read]` |
| HUD FMR / SAFMR | API returned "Unauthenticated"; SAFMR xlsx returned 202 with empty body | `[inaccessible]` |

Catalog caveat on Zillow: aggregate only; CSV URLs can change and values may be revised.

## HUD income limits `[read]`
Parsed from `https://www.huduser.gov/portal/datasets/il/il26/Section8-FY26.xlsx`, Pittsburgh, PA HUD Metro FMR Area, Allegheny row. HUD HTML summary pages returned HTTP 202 with no content to curl; use the xlsx.

| | AMI | 30%, 4-person | 50%, 4-person | 80%, 4-person |
|---|---|---|---|---|
| FY2026 | $110,400 | $33,100 | $55,200 | $88,300 |
| FY2025 | $107,300 | $32,200 | $53,650 | $85,850 |

⚠ $55,200 is the **FY2026** 50% figure; an earlier secondary source had attributed it to FY2025 (corrections log).

## Incentive geographies (HUD eGIS) `[read]`
| Layer | Test | Note |
|---|---|---|
| `https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/QUALIFIED_CENSUS_TRACTS_2026/FeatureServer/0` | Homewood → tract 42003130800 | 96 Allegheny QCTs (from `QUALIFIED_CENSUS_TRACTS`) |
| `…/Difficult_Development_Areas_2026/FeatureServer/0` | downtown → `ZCTA5 15222, DDA_TYPE SA` | small-area DDA |
| `…/Opportunity_Zones/FeatureServer/13` | Homewood → GEOID10 42003130300 | **layer id 13, not 0; 2010 tracts**, won't match 2020 QCT IDs. OZ program status not checked |
| `…/LIHTC/FeatureServer/0` | 215 Allegheny projects | latest real YR_PIS 2019 ([permits](permits-and-outcomes.md)) |

## PHFA 2025–26 QAP (from working notes, marked [V] there)
Max basis per unit $320k (9%) / $380k (4%); developer fee caps; cost limits: general requirements ≤6%, overhead 2%, profit 6%, contingency 5%/10%. **The QAP URL was not recorded** in the working notes, so these figures stay `[skimmed]` until re-read. ⚠ Tag reconciliation *(corrected 2026-09-26 per docs/04-critique.md row 30)*: the [State node](../stakeholders/state-dced-phfa.md), [pro forma](../methods/pro-forma.md) and [framings](../landscape/framings.md) name the QAP PDF they read ([PHFA 2025–2026 LIHTC QAP](https://www.phfa.org/forms/multifamily_program_notices/qap/2025_and_2026/2025-2026-lihtc-qap.pdf)) and keep `[read]`; this node's figures come from working notes, not that artefact, so they stay `[skimmed]` until checked against it.

## Geography and access `[read]`
| Layer | Detail |
|---|---|
| `C/PGHWebNeighborhoods/FeatureServer/0` | downtown → `hood: Central Business District`; WPRDC `neighborhoods2` also exists |
| TIGERweb `https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Tracts_Blocks/MapServer/0` | → GEOID 42003020100 |
| WPRDC parcel centroids `3fab7152-…` | PIN → tract/block group ([parcels](parcels-and-assessments.md)) |
| EPA walkability `https://geodata.epa.gov/arcgis/rest/services/OA/WalkabilityIndex/MapServer/0` | block-group NatWalkInd, D3B, D4A (distance to transit). Do not use the Learn_ArcGIS copy (nothing for Allegheny) |
| LODES8 WAC `https://lehd.ces.census.gov/data/lodes/LODES8/pa/wac/pa_wac_S000_JT00_2023.csv.gz` | 2.4 MB; block-level jobs |
| WPRDC crime blotter `1797ead8-…`, UCR `044f2016-…`; 311 `5202679a-d243-402e-b82a-63189995a942` | dataset-level `[read]`; catalog caveat: 311 reporting propensity varies by neighborhood |

`C = https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services`.

## Not verified
ACHD air quality, school quality (PA Future Ready), HUD FMR/SAFMR values, PHFA award lists.

## Open questions
- ~~A keyed Census API call for current ACS rents.~~ Census Reporter is keyless (above).
- HUD FMR/SAFMR values via browser download.
- PHFA QAP document URL and page references.
- Opportunity Zone status after 2026.
- Whether SALECODE 16 captures all new-construction sales or only some.

## Connects to
- [Pro forma](../methods/pro-forma.md)
- [Inclusionary zoning and bonus](../policy/inclusionary-zoning-and-bonus.md): AMI levels
- [State DCED / PHFA](../stakeholders/state-dced-phfa.md)
- [Track 3 indicators and data](../track3/indicators-and-data.md)
- [Displacement and equity](../track3/displacement-and-equity.md)
- [Infrastructure](infrastructure.md): transit access
- [Organizer data catalog](organizer-data-catalog.md): Redfin, Realtor.com, CHAS, HMDA and others not probed by us

## Sources
- [WPRDC property sales 5bbe6c55](https://data.wprdc.org/api/3/action/datastore_search?resource_id=5bbe6c55-bce6-4edb-9d04-68edeb6bf7b1) `[read]` *(accessed 2026-09-26)*
- [Zillow ZORI ZIP CSV](https://files.zillowstatic.com/research/public_csvs/zori/Zip_zori_uc_sfrcondomfr_sm_month.csv) `[read]` *(accessed 2026-09-26)*
- Zillow ZHVI mid-tier CSV `[read]` *(accessed 2026-09-26)*: exact URL not recorded
- Census ACS API `[inaccessible]` *(accessed 2026-09-26)*: key required
- City `ACS_DP04` `[read]` *(accessed 2026-09-26)*
- HUD FMR/SAFMR API and xlsx `[inaccessible]` *(accessed 2026-09-26)*: token required / empty 202
- [HUD FY26 Section 8 income limits xlsx](https://www.huduser.gov/portal/datasets/il/il26/Section8-FY26.xlsx) `[read]` *(accessed 2026-09-26)*: parsed
- [HUD QCT 2026](https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/QUALIFIED_CENSUS_TRACTS_2026/FeatureServer/0) `[read]` *(accessed 2026-09-26)*
- [HUD DDA 2026](https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/Difficult_Development_Areas_2026/FeatureServer/0) `[read]` *(accessed 2026-09-26)*
- [HUD Opportunity Zones layer 13](https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/Opportunity_Zones/FeatureServer/13) `[read]` *(accessed 2026-09-26)*
- PHFA 2025–26 QAP `[skimmed]` *(accessed 2026-09-26)*: figures in working notes, URL not recorded
- [City PGHWebNeighborhoods](https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services/PGHWebNeighborhoods/FeatureServer/0) `[read]` *(accessed 2026-09-26)*
- [TIGERweb tracts](https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Tracts_Blocks/MapServer/0) `[read]` *(accessed 2026-09-26)*
- [EPA walkability index](https://geodata.epa.gov/arcgis/rest/services/OA/WalkabilityIndex/MapServer/0) `[read]` *(accessed 2026-09-26)*
- [LODES8 PA WAC 2023](https://lehd.ces.census.gov/data/lodes/LODES8/pa/wac/pa_wac_S000_JT00_2023.csv.gz) `[read]` *(accessed 2026-09-26)*
- WPRDC crime, UCR, 311 datasets `[read]` *(accessed 2026-09-26)*: dataset-level check
- [HUD income limits](https://www.huduser.gov/portal/datasets/il.html), [HUD FMR](https://www.huduser.gov/portal/datasets/fmr.html), [Zillow research data](https://www.zillow.com/research/data/) `[found]` *(accessed 2026-09-26)*: organizer catalog URLs
- [Organizer Public Data Catalog (Google Sheet)](https://docs.google.com/spreadsheets/d/19CKyt1kansUZ3VGOAOBihYYxNFuitx5VTkzOiEy4iXA) `[read]` *(accessed 2026-09-26)*; saved copy [../../sources/organizers-2026-09-26-public-data-catalog.csv](../../sources/organizers-2026-09-26-public-data-catalog.csv)
- Sweep: [../../sweeps/r1-parcel-environmental-infrastructure-data.md](../../sweeps/r1-parcel-environmental-infrastructure-data.md)
- Sweep: [../../sweeps/r2-deeper-data-sources.md](../../sweeps/r2-deeper-data-sources.md)
- Notes: [../../archive/working-notes-2026-09-26/01-data-sources.md](../../archive/working-notes-2026-09-26/01-data-sources.md)
- [Adversarial critique](../../docs/04-critique.md) — row 30
