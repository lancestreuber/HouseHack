# Parcels and assessments

**Type:** data
**One line:** The parcel spine: Allegheny County assessment records, parcel polygons, owner category (⚠ not owner names), parcel-ID formats, and the city's lot-dimension and building-footprint layers that hang off them.
**Why we care:** Every Track 1 score starts from a parcel ID. The assessment table gives lot area, use and value; the polygon is what gets intersected with every constraint layer; the ID format decides whether joins work at all.
**Last checked:** 2026-09-26

## Parcel ID formats

| Where | Format | Example |
|---|---|---|
| WPRDC API, county GIS `PIN` | 16 characters, no dashes | `0001D00128000000` |
| County Real Estate Portal display | dashed | `0001-D-00128-0000-00` |

Stripping dashes converts between the two `[read]` ([r1 parcel sweep](../../sweeps/r1-parcel-environmental-infrastructure-data.md)). The key is named differently in each table: `PARID` (assessments, sales), `PIN`/`pin` (county GIS, centroids, liens, city-owned), `parcel_id` (delinquency, condemned, violations), `parcel_num` (PLI permits), `parc_num` (OneStopPGH). See [land availability](land-availability-and-title.md) and [permits](permits-and-outcomes.md) for those tables.

## Assessments (WPRDC `property-assessments`)

- Resource `65855e14-549e-4992-b5be-d629afc676fa`; **584,999 rows**, TAXYEAR 2026, ASOFDATE 2026-09-01 `[read]`.
- Fields: PARID, PROPERTYHOUSENUM/ADDRESS/CITY/ZIP, MUNICODE/MUNIDESC, SCHOOLDESC, NEIGHCODE, TAXDESC, OWNERDESC, CLASS/CLASSDESC, USECODE/USEDESC, LOTAREA, HOMESTEADFLAG, ABATEMENTFLAG, SALEDATE/SALEPRICE/SALEDESC, PREVSALE*, COUNTY/LOCAL/FAIRMARKET BUILDING/LAND/TOTAL, YEARBLT, CONDITIONDESC, CDUDESC, GRADEDESC, FINISHEDLIVINGAREA, BEDROOMS, and others.
- **No owner name.** Only OWNERDESC (e.g. "CORPORATION") and CHANGENOTICEADDRESS1-4 (tax-bill mailing address).
- `USEDESC='VACANT LAND'`: 65,694 parcels countywide `[read]` ([r2 deeper sweep](../../sweeps/r2-deeper-data-sources.md)).
- Bulk CSV is 435 MB ([working notes](../../archive/working-notes-2026-09-26/01-data-sources.md)).
- Organizer catalog caveat: assessment fields can be stale or missing; assessed value is not market value ([organizer catalog](organizer-data-catalog.md)).

Single-parcel lookup that worked `[read]`:
```
https://data.wprdc.org/api/3/action/datastore_search?resource_id=65855e14-549e-4992-b5be-d629afc676fa&filters={"PARID":"0001D00128000000"}
→ PROPERTYADDRESS 'MARKET SQ', LOTAREA 2400, CLASSDESC 'COMMERCIAL', USEDESC 'SMALL DETACHED RET(UNDER 10000)', FAIRMARKETTOTAL 463300, OWNERDESC 'CORPORATION'
```

### Gotcha: WPRDC SQL endpoint
`datastore_search_sql` works for plain `SELECT … LIMIT`, but **any query with `WHERE` (GET or POST) returns a CloudFront "403 Request blocked"** `[read]`. Use `datastore_search` with URL-encoded `filters`, or the bulk `/datastore/dump/<resource_id>` CSV (returned 200) `[read]`. This applies to every WPRDC table in this directory.

## Parcel geometry

| Source | Endpoint / id | Key | Notes | Tag |
|---|---|---|---|---|
| County GIS (authoritative) | `https://gisdata.alleghenycounty.us/arcgis/rest/services/OPENDATA/Parcels/MapServer/0` | `PIN` | Fields PIN, MAPBLOCKLOT, MUNICODE, CALCACREAGE. Max 1,000 records/request. `where=PIN='…'&outFields=*&returnGeometry=true&outSR=4326&f=json` returned the polygon | `[read]` |
| WPRDC CSV copy | resource `858bbc0f-b949-4e22-b4bb-1a78fef24afc`, `filters={"pin":"…"}` | `pin` | Polygon returned as `wkt` in PA South State Plane feet (EPSG:2272) | `[read]` |
| WPRDC bulk | package `allegheny-county-parcel-boundaries1` | | ~115 MB zip | from working notes |
| PASDA mirror | `maps.pasda.psu.edu/…/AlleghenyCounty/MapServer/25` | | **Down ("Application Error"). Do not use.** | `[read]` (probed, failed) |
| Parcel centroids | WPRDC resource `3fab7152-3f11-4788-8372-4c33f86ea813` (March 2025) | PIN | LAT/LONG, tract and block-group GEOIDs, municipality, city neighborhood. Ready-made crosswalk | `[read]` |

Organizer catalog caveat: geometry and assessment records update on different schedules, so validate IDs across them.

## Owner name: County Real Estate Portal (do not ingest)
- ⚠ **Owner names exist on the County portal; do not ingest them. Use OWNERDESC (category) only** *(corrected 2026-09-26 per docs/04-critique.md row 32)*. Owner names of private individuals are PII under the project's hard rule. `ParcelsPublicCityVacant` also carries owner fields; request only non-owner fields from it.
- For reference only: `https://realestate.alleghenycounty.us/GeneralInfo?ID=<PARID>` is a plain GET ASP.NET page `[read]` that shows the owner name, which WPRDC omits. **Terms of use were not reviewed.** This is not a pipeline input.

## Address to parcel
Census geocoder `onelineaddress` → point query on county parcels. Both free, marked [V] in the [working notes](../../archive/working-notes-2026-09-26/01-data-sources.md); the exact geocoder URL was not recorded.

## City lot and building layers
City ArcGIS base `C = https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services` (977 services).

| Layer | Count | Key fields | Vintage | Tag |
|---|---|---|---|---|
| `C/Parcels_Exp_02052025_Residential_Lot_Dimensions/FeatureServer/0` | 105,488 | Parcel_Width, Parcel_Len, Bldg_Width, zone_short | 2025 | `[read]` |
| `C/ETHOS_Lot_Suitability/FeatureServer/0` | 142,806 | pin, SteepSlope (0–1), Vacant, Housing, Best_Suit | ⚠ unverified (working notes said Dec 2024) | `[read]` |
| `C/Buildings_Elevation/FeatureServer/33` | 87,831 | lotblock, bldg_heigh, bldg_heigh_new (ft) | last edited 2023 | `[read]` |
| `C/Building_Footprints_Adjacency` | 117,506 | flags attached/row buildings | not stated | `[read]` |
| County `https://gisdata.alleghenycounty.us/arcgis/rest/services/EGIS/Buildings/MapServer/0` | 573,908 | FEATURECODE, CLASS, LUC, status, prev_area, pct_change; **no heights**; spatial query, 1,000/request | not stated | `[read]` |

- County footprints bulk shapefile on WPRDC is 88.7 MB. The `OPENDATA/Buildings` URL listed on WPRDC is **dead (404)** `[read]`.
- ⚠ ETHOS is **narrower than we said** *(corrected 2026-09-26 per docs/04-critique.md row 31)*. A Pittsburgh Water press release (2026-01-14, `[skimmed]`) describes it as a City/Ethos Collaborative **stormwater and green-infrastructure** suitability analysis of vacant lots, not a housing-reuse model. The layer does carry a `Housing` field. Its methodology and the "Dec 2024" date are unverified. It is a possible input (e.g. the `SteepSlope` fallback, see [lidar slope](lidar-slope.md)) and related prior art, not the City's housing-suitability model. See [Pittsburgh civic tools](../landscape/pittsburgh-civic-tools.md).
- Lot dimensions let a rule check lot width against a district minimum, but whether §903.03 sets a minimum lot width is itself unverified ([zoning code text](zoning-code-text.md)).

## Pipeline sketch (from the r1 sweep)
1. PARID via WPRDC `filters`. 2. Polygon from county `OPENDATA/Parcels` with `outSR=4326`. 3. Intersect polygon with each constraint layer. 4. Join other WPRDC tables by PIN/PARID/parcel_id.

## Open questions
- County Real Estate Portal terms of use and acceptable scrape rate: unreviewed.
- `Building_Footprints_Adjacency` vintage and exact endpoint path.
- Overture, Microsoft and OSM building heights: untested (unverified).
- Whether assessment `LOTAREA` and GIS `CALCACREAGE` agree well enough to use either for envelope math.

## Connects to
- [Zoning GIS](zoning-gis.md): district per parcel polygon
- [Environmental constraints](environmental-constraints.md): layers intersected with the polygon
- [LiDAR slope](lidar-slope.md): slope histogram over the polygon
- [Land availability and title](land-availability-and-title.md): ownership and distress tables keyed on the same ID
- [Market and affordability](market-and-affordability.md): sales table joined on PARID
- [Dimensional standards](../policy/dimensional-standards-and-use-table.md): lot area and width checks
- [Data pipeline](../build-plan/data-pipeline.md)

## Sources
- [WPRDC property assessments resource](https://data.wprdc.org/api/3/action/datastore_search?resource_id=65855e14-549e-4992-b5be-d629afc676fa) `[read]` *(accessed 2026-09-26)*: queried with filters; row count and fields
- [WPRDC property-assessments dataset page](https://data.wprdc.org/dataset/property-assessments) `[found]` *(accessed 2026-09-26)*: catalog entry
- [County OPENDATA/Parcels MapServer/0](https://gisdata.alleghenycounty.us/arcgis/rest/services/OPENDATA/Parcels/MapServer/0) `[read]` *(accessed 2026-09-26)*: parcel polygons by PIN
- [WPRDC parcel boundaries resource 858bbc0f](https://data.wprdc.org/api/3/action/datastore_search?resource_id=858bbc0f-b949-4e22-b4bb-1a78fef24afc) `[read]` *(accessed 2026-09-26)*: WKT polygons, EPSG:2272
- PASDA AlleghenyCounty MapServer/25 (`maps.pasda.psu.edu/…`) `[inaccessible]` *(accessed 2026-09-26)*: Application Error
- [WPRDC parcel centroids resource 3fab7152](https://data.wprdc.org/api/3/action/datastore_search?resource_id=3fab7152-3f11-4788-8372-4c33f86ea813) `[read]` *(accessed 2026-09-26)*: PIN to tract/block group/neighborhood
- [County Real Estate Portal](https://realestate.alleghenycounty.us/GeneralInfo?ID=0001D00128000000) `[read]` *(accessed 2026-09-26)*: shows owner name; ⚠ do not ingest (PII)
- [Residential lot dimensions](https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services/Parcels_Exp_02052025_Residential_Lot_Dimensions/FeatureServer/0) `[read]` *(accessed 2026-09-26)*
- [ETHOS lot suitability](https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services/ETHOS_Lot_Suitability/FeatureServer/0) `[read]` *(accessed 2026-09-26)*
- [City building heights](https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services/Buildings_Elevation/FeatureServer/33) `[read]` *(accessed 2026-09-26)*
- City `Building_Footprints_Adjacency` `[read]` *(accessed 2026-09-26)*: count only; full path not recorded
- [County EGIS/Buildings MapServer/0](https://gisdata.alleghenycounty.us/arcgis/rest/services/EGIS/Buildings/MapServer/0) `[read]` *(accessed 2026-09-26)*: footprints, no heights
- County `OPENDATA/Buildings` `[inaccessible]` *(accessed 2026-09-26)*: 404
- [Organizer Public Data Catalog (Google Sheet)](https://docs.google.com/spreadsheets/d/19CKyt1kansUZ3VGOAOBihYYxNFuitx5VTkzOiEy4iXA) `[read]` *(accessed 2026-09-26)*; saved copy [../../sources/organizers-2026-09-26-public-data-catalog.csv](../../sources/organizers-2026-09-26-public-data-catalog.csv): caveats on assessments and boundaries
- Sweep: [../../sweeps/r1-parcel-environmental-infrastructure-data.md](../../sweeps/r1-parcel-environmental-infrastructure-data.md)
- Sweep: [../../sweeps/r2-deeper-data-sources.md](../../sweeps/r2-deeper-data-sources.md)
- Notes: [../../archive/working-notes-2026-09-26/01-data-sources.md](../../archive/working-notes-2026-09-26/01-data-sources.md)
- [Pittsburgh Water, Rain Reclaim press release, 2026-01-14](https://www.pgh2o.com/news-events/news/press-release/2026-01-14-rain-reclaim-turning-vacant-lots-green-solutions) `[skimmed]` *(accessed 2026-09-26)*: ETHOS as a stormwater analysis
- [Adversarial critique](../../docs/04-critique.md) — rows 31, 32
