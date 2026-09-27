# Sweep: Brownfield/contamination layers and demolition history as site-cost signals

**Round 9** · 2026-09-27 · single research subagent, live REST/CKAN queries (curl) plus web search/fetch

> Tags: **[read]** = the endpoint was queried and its response inspected this session, or the document was fetched and read. **[skimmed]** = a search snippet, a partial fetch or a secondary summary. **[found]** = known to exist, not opened. **[inaccessible]** = blocked (blocker noted inline). Counts are as of 2026-09-27 unless marked otherwise. Bulk pulls went to a local scratchpad, not the repo. Only non-personal fields were requested: no `CLIENT_NAME`, `owner_name`, `TANK_OWNER_*`, `contractor_name` or mailing fields. Some layers carry those fields, and they must not be copied into the app.

**Why:** Hackathon SMEs said "undermining and environmental conditions can be up-front deal killers" and "many vacant City lots have demolished houses folded into the old basement". That second point raises site cost (a $25–50k/unit baseline was mentioned). This sweep asks which public layers can put those two signals on a parcel, and how honestly they can do it.

---

## TL;DR

- **The PA DEP contamination layers are all POINTS, with no parcel ID.** eMapPA_External/31 (Act 2 soil), /29 (groundwater) and AUL_NEW/AUL/0 are `esriGeometryPoint`. **Within the City boundary:** 178 soil records (98 facilities), 78 groundwater records (43 facilities), and 105 distinct Land Recycling facilities across all media. AUL has 128 points (79 facilities). The layers have **no Act 2 standard field, no final-report or completion field, and no date**. `SITE_STATUS` is `ACTIVE` for 170 of 178 and `COMPLIANCE` is `YES` for all 178, so neither field discriminates. [read]
- **Point locations are coarse and shared.** 61 of 85 unique soil/groundwater coordinates sit exactly on whole arc-seconds (DMS-derived, a grid of about 25–30 m). One point carries **26 sub-facility records for the whole former LTV South Side works**. 24 of 199 unique DEP points (12%) fall outside any City parcel, in the right-of-way or river. **Containment joins would under-flag big sites and mislocate small ones. Use a buffer.** [read]
- **Act 2 "stage" is only reachable per facility, by scraping eFACTS.** eFACTS gives only NIR (Notice of Intent to Remediate) dates, not the standard or final approval. 71 of 105 City facilities have NIRs, and **most are old**: the latest NIR is 1995–2009 for 46 facilities, 2010–2019 for 17, and 2020+ for 8. [read]
- **Other point sources in the City:** 207 DEP active and 575 inactive storage-tank facilities, 103 EPA ACRES brownfield records (EMEF layer 5), 886 RCRA hazardous-waste handlers, and 0 NPL. **ACRES points are often URA/CDC housing sites that were *assessed* with EPA grant money**, for example "N HOMEWOOD AVE VACANT LAND" and "RISING TIDE HOMEWOOD SITES". Such a point means the site was assessed. It does not mean the site is contaminated. [read]
- **Demolition permits join to parcels at 100%.** WPRDC `pli-permits` has 1,300 `Demolition Permit` records from 2019-06 to 2026-09, and all 1,243 distinct `parcel_num` values match a current County `PARID`. **731 of 22,354 currently vacant City parcels (3.3%) have a full-demolition permit**, 640 of them with status Completed. By year of the latest permit: 2019: 68, 2020: 66, 2021: 117, 2022: 159, 2023: 152, 2024: 82, 2025: 83, 2026: 4 (assessment lag). [read]
- **A second signal comes from diffing assessment snapshots.** Compare today's roll with WPRDC's SEP-2017 assessment snapshot. 1,354 currently vacant City parcels had building value > 0 in 2017, and 1,294 of those had a non-vacant use then (775 SINGLE FAMILY). Combined with the permits, **1,413 vacant parcels (6.3%) have a machine-readable "a building stood here recently" signal**. The other ~94% were most likely cleared before 2017 and carry no public demolition record. We found no public City demolition list from before 2019 (inference; see gaps). [read]
- **City demolitions leave the foundation walls in place.** In 2024–2026, the `work_description` of **City-funded demolitions states "FOUNDATION WALLS REMAIN" on 177 of 192 permits** (24/31, 48/53, 105/108). In the 2019–26 total, 346+ say "VOID TO BE FILLED WITH CLEAN MATERIAL", and only 4 mention foundation removal. PLI's private-demolition requirements (4/27/2021) require the basement **slab** to be broken to ≤24 in and the void backfilled with DEP "Safe Fill". They do **not** require wall removal, and they specify **no compaction**. This supports the SME claim directly: the foundation is folded into the old basement. [read]
- **What neither layer can say:** "no record" ≠ clean; "no record" ≠ no buried basement. A DEP point marks a remediation program's record, not the extent of a plume. Demolition permits don't record fill quality, depth or compaction.

---

## A. Environmental / brownfield layers

City boundary used for clipping: `C/City_Boundary/FeatureServer/0`, feature `name='City of Pittsburgh'` (8 rings, 1 hole; `dataLastEditDate` 2023-08-14). Clip bbox `-80.0954,40.3615,-79.8658,40.5011`, then point-in-polygon locally. `C = https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services`. `DEP = https://gis.dep.pa.gov/depgisprd/rest/services`.

⚠ DEP MapServer layers **do not expose `editingInfo`**: the `?f=json` responses have no `editingInfo` and no date fields. Freshness is unknown from the service. The service `documentInfo` says `eMapPA_External.aprx` (ArcGIS Server 10.71). AUL `documentInfo` names an individual as Author, which we did not copy.

### A1. Endpoint table

| Layer | Query | Geometry | Key non-personal fields | Parcel ID? | City count | Freshness | Tag |
|---|---|---|---|---|---|---|---|
| **Act 2 Soil Media** `DEP/emappa/eMapPA_External/MapServer/31` | `…/31/query?where=1=1&geometry={envelope JSON with spatialReference}&geometryType=esriGeometryEnvelope&inSR=4326&outFields=SITE_ID,PRIMARY_FACILITY_ID,PRIMARY_FACILITY_NAME,SUB_FACILITY_NAME,PRIMARY_FACILITY_KIND,OTHER_FACILITY_ID,SITE_STATUS,PRIMARY_FACILITY_STATUS,SUB_FACILITY_STATUS,COMPLIANCE&outSR=4326&f=json` (max 1000/req, `resultOffset` works with `orderByFields=SHAPE_FID`) | Point | `PRIMARY_FACILITY_ID` (joins eFACTS), `OTHER_FACILITY_ID` (`5-2-1-nnnnn` program ID), `PRIMARY_FACILITY_KIND` (129/178 "Unavailable"; 34 "MANUFACTURING - STEEL"; 3 "GAS STATIONS") | **No** | 288 in bbox → **178 in City** (98 facilities, 77 unique xy) | not exposed | [read] |
| **Act 2 Groundwater Media** `…/MapServer/29` | same | Point | same schema | **No** | 145 bbox → **78 in City** (43 facilities) | not exposed | [read] |
| Other LR media `…/27, 28, 30, 32, 33` (air, container, sediment, surface water, waste) | same | Point | same | No | 0 / 0 / 0 / 1 / 3 | not exposed | [read] |
| Parent group `…/MapServer/26` "Land Recycling Cleanup Location" | — | group layer, no features | — | — | — | — | [read] |
| **All LR media, one layer** `DEP/emappa/eFactsQueryExternal/MapServer/0` with `where=PRIMARY_FACILITY_TYPE='LAND RECYCLING CLEANUP LOCATION'` | supports `outStatistics` + `groupByFieldsForStatistics` | Point | as above, no status fields | No | 443 bbox → **260 in City = 105 distinct facilities** (reconciles exactly with /31+/29+/32+/33) | not exposed | [read] |
| **AUL** `DEP/AUL_NEW/AUL/MapServer/0` | `outFields=OBJECTID,AUL_ID,PF_ID,PF_NAME,OTHER_FAC_ID` (max 5000/req) | Point | `AUL_ID`, `PF_ID` (= eFACTS facility), `OTHER_FAC_ID` | **No** | 228 bbox → **128 in City** (79 facilities; 28 also appear in soil/GW layers) | not exposed; **no AUL type, date or restriction text** | [read] |
| **Storage Tanks Active** `…/eMapPA_External/MapServer/171` | request only `OBJECTID,FACILITY_ID,FACILITY_NAME,FACILITY_MUNICIPALITY,PRIMARY_FACILITY_ID,REG_EXPIRATION_DATE,TANK_INFORMATION` (⚠ layer also has `TANK_OWNER_*` name/address) | Point | `TANK_INFORMATION` = link to DEP SSRS tank report | No | 361 bbox → **207 in City** | not exposed | [read] |
| **Storage Tanks Inactive** `…/MapServer/172` | same (no `REG_EXPIRATION_DATE`) | Point | same | No | 980 bbox → **575 in City** (144 with null municipality) | not exposed | [read] |
| eMapPA extraction twins `…/eMapPA_External_Extraction/MapServer/16–22, 118/119` | — | Point | same schema as above | No | not re-counted | — | [read] (schema only) |
| **EPA ACRES Brownfields** `https://geopub.epa.gov/arcgis/rest/services/EMEF/efpoints/MapServer/5` | `outFields=OBJECTID,registry_id,primary_name,pgm_sys_acrnm,pgm_sys_id` | Point | `registry_id` (FRS), `pgm_sys_id` (ACRES ID). **No cleanup status or date** | No | 210 bbox → **103 in City** (92 unique xy) | not exposed | [read] |
| EPA NPL (Superfund) `…/efpoints/MapServer/0` | same | Point | | No | **0 in City** | | [read] |
| EPA RCRA hazardous waste `…/efpoints/MapServer/4` | same | Point | handlers, not contamination | No | 886 in City | | [read] |
| City `C/City_of_Pittsburgh_Storage_Tanks/FeatureServer/0` | — | Point (geocoded DEP AST list) | carries mailing-name fields. **Do not use in app.** | No | 453 | edited 2023-09-14 | [read] (schema/count) |
| Historic maps (Hopkins plats 1872–1939, Pittsburgh1835…1923) `https://tiles.arcgis.com/tiles/jIL9msH9OI208GCb/arcgis/rest/services/Pittsburgh1923/MapServer` etc. | tile service | **Raster tiles only** | none | No | — | items 2018 | [read] (service JSON) |
| Penn State "Pittsburgh Region Sanborn Map Index" `https://pennstate.maps.arcgis.com/apps/MapSeries/index.html?appid=acd05eeee68b4dc5af4f98c45cbc38f0` | index of sheets | index only | — | — | — | 2026-02 | [found] |
| Allegheny Places "Brownfields and Redevelopment Sites" map `https://www.alleghenyplaces.com/maps/ec/Brownfields.pdf` | PDF map | — | — | — | — | 2008 (per snippet) | [skimmed] |
| URA brownfield pages `https://www.ura.org/pages/brownfield-projects`; URA EPA FY24 Brownfield Cleanup Grant narrative (ura.org PDF) | narrative | — | — | — | — | — | [found] |
| EPA CIMC brownfields CSV export (richer ACRES fields incl. cleanup activities) `https://www.epa.gov/cleanups/cimc-how-download-data` | web export | — | — | — | — | — | [skimmed] |
| EPA FRS (Facility Registry) | EMEF `registry_id` is the FRS key | — | — | — | — | — | [found] |

**Not found:** a City or URA **machine-readable brownfield inventory**. A search of the City AGOL list (977 services) for brown/contam/environ found none. A WPRDC `package_search?q=brownfield` returned 0. An ArcGIS Online search found only story maps and student maps. [read]

### A2. Status and stage: what's there, and what isn't
- `SITE_STATUS`/`PRIMARY_FACILITY_STATUS` are nearly all `ACTIVE`. `SUB_FACILITY_STATUS` is mostly `Unavailable` (135/178). `COMPLIANCE` is `YES` for 178 of 178. **None of these tells you remediated vs ongoing, or which Act 2 standard applied** (Background / Statewide Health / Site-Specific / Special Industrial Area). [read]
- **eFACTS facility page** `https://www.ahs.dep.pa.gov/eFACTSWeb/searchResults_singleFacility.aspx?FacilityID=<PRIMARY_FACILITY_ID>` (plain curl works): it has a "Land Recycling Information" table listing **NIR type, NIR received date and preparer**, and a "Tank Remediation" table. We scraped all 105 City facilities: 71 have ≥1 NIR (median 1, max 4) and 34 have none. By the facility's latest NIR year: 1995–99: 11, 2000–04: 21, 2005–09: 14, 2010–14: 9, 2015–19: 8, 2020–24: 5, 2025+: 3. **No Final Report, standard or approval date is shown.** The Tank Remediation table was empty for all 105. [read]
- Where the standard and approval live: the DEP Land Recycling "Final Report Summary" site (`https://www.dep.state.pa.us/wm_apps/finalreportsummary/landrecycling/`) [found], and weekly PA Bulletin Act 2 notices [found, not checked]. Neither was tested for bulk access.
- AUL: `AUL_ID` only. The restriction type (e.g. no groundwater use, residential prohibited, cap maintenance) is not in the layer. That matters most for housing, because an AUL can **prohibit residential use**. The next step is the DEP environmental covenant record per `AUL_ID` [found, not located].

### A3. Location quality (why containment is wrong)
- Unique soil+GW coordinates: 85. **61 of them fall exactly on whole arc-seconds**, i.e. they were digitized from DMS, which puts a point within roughly ±15 m even when correct. Top shared coordinate: `(-79.985, 40.43)` holds 26 records of "LTV STEEL SOUTHSIDE PGH WKS" plus 1 other. That is one point for a ~100+ acre mill site now subdivided into many parcels. [read]
- Point-in-parcel against `C/ParcelsPublic/FeatureServer/0` (edited 2026-09-21), for 199 unique soil/GW/AUL/waste/surface-water points: **175 hit a parcel and 24 (12%) hit none** (street or river). Uses of the hit parcels: COMMERCIAL 114, GOVERNMENT 31, RESIDENTIAL 17, INDUSTRIAL 9. Top uses: APART:40+ UNITS 13, VACANT COMMERCIAL LAND 13, OFFICE/WAREHOUSE 9, CONVENIENCE STORE/GAS 7, VACANT LAND 6. [read]
- ⚠ Remediated brownfields are now **apartments**, for example 13 points on 40+-unit buildings. A flag must not read as "unbuildable". Past Act 2 sites are where Pittsburgh's recent multifamily got built.

### A4. How many vacant parcels would a "nearby" flag touch? (centroid distance)
Parcel centroids come from WPRDC `3fab7152-3f11-4788-8372-4c33f86ea813` (142,226 of 142,395 City PARIDs matched). Vacant = County `USEDESC` containing "VACANT": 22,354 parcels (20,443 `VACANT LAND`). City-owned vacant = `C/ParcelsPublicCityVacant` (5,786, edited 2026-09-01). [read]

| Source (City points) | ≤50 m: all vacant / City-owned vacant | ≤100 m | ≤250 m |
|---|---|---|---|
| Act 2 any medium (260 recs) | 67 / 19 | 308 / 93 | 1,945 / 470 |
| Act 2 soil | 67 / 17 | 301 / 85 | 1,853 / 444 |
| Act 2 groundwater | 17 / 2 | 103 / 13 | 719 / 117 |
| AUL | 47 / 7 | 237 / 35 | 1,788 / 457 |
| EPA ACRES | 274 / 78 | 1,005 / 338 | 4,221 / 1,525 |
| Tanks active | 138 / 20 | 525 / 96 | 3,311 / 676 |
| Tanks inactive | 356 / 75 | 1,569 / 355 | 8,500 / 2,201 |

Reading: at 250 m, inactive tanks touch 38% of vacant parcels. That is noise, not a signal. **Act 2 and AUL at ≤100 m flag roughly 1–1.5% of vacant parcels**, which is proportionate for a "worth a Phase I" warning. ACRES touches many City-owned lots because URA/CDCs ran EPA **assessment** grants on their own land-banked housing sites (inference from site names).

### A5. Recommended join for a parcel-level flag
1. Pull the points at build time: /31, /29, /32, /33 (or `eFactsQueryExternal/0` filtered to Land Recycling), AUL/0, tanks 171, and EMEF/5. Clip to the City (or County).
2. **Join by distance from the parcel polygon edge, not by containment.** Use tiers: `on_or_adjacent` (≤ 30 m from polygon, roughly the arc-second quantization), `nearby` (≤ 100 m), and optionally `area` (≤ 250 m, Act 2/AUL only). A centroid distance is an acceptable shortcut if polygons aren't loaded.
3. Carry through `PRIMARY_FACILITY_ID` (Act 2), `AUL_ID`, `pgm_sys_id` (ACRES) and the facility name, so the UI can link to the eFACTS page for each flag.
4. Optional enrichment: scrape eFACTS NIR dates for the ~105 City facilities (done here in about 2 minutes) and show "NIR filed YYYY".
5. Keep EPA ACRES as a separate, softer label: "EPA brownfield grant activity nearby (assessment ≠ contamination)". Keep inactive tanks at ≤50 m only, or leave them out.
6. **Wording in the app:** "Known environmental record within X m: [type]. Absence of a record does not mean the site is clean; a Phase I ESA is the standard check." Never output "clean". Output "no public record found".

**What the flag CAN say:** a state or federal program has a record of a remediation, deed restriction, tank or grant-funded assessment at or near this location.
**What it CAN'T say:** the extent of contamination, whether cleanup is complete, which Act 2 standard applied (residential vs non-residential), or whether an AUL bars housing. It also misses historic fill, coal ash, old gas stations and dry cleaners that never entered a program. In an old industrial city those unrecorded cases are the bulk. The historic Hopkins/Sanborn maps could reveal prior industrial use, but they are **raster only**; turning them into parcel attributes would mean manual digitizing (out of scope for a 24 h build).

---

## B. Demolition history as a site-cost signal

### B1. Endpoint table

| Source | Query | Content | Parcel key | Join rate | Freshness | Tag |
|---|---|---|---|---|---|---|
| **WPRDC `pli-permits`** resource `f4d1177a-f597-4c32-8cbf-7885f56253f6` | `datastore_search?resource_id=…&fields=permit_id,permit_type,work_type,work_description,commercial_or_residential,issue_date,parcel_num,status&limit=20000&offset=…` (⚠ `q=demolition` full-text returns 0. Filter client-side on `permit_type='Demolition Permit'`) | 65,378 permits, 2019-06 → 2026-09. **Demolition Permit 1,300**: COMPLETE DEMOLITION 665, CITY FUNDED DEMOLITION 533, PARTIAL DEMOLITION 102. Status: Completed 956, Issued 205, Expired 128, Revoked 6 | `parcel_num` (16-char County PIN format) | **1,243/1,243 distinct parcels = 100%** match current `PARID` | resource modified 2026-09-27 | [read] |
| OneStopPGH `OSPI_H` `https://pghbridgis.pittsburghpa.gov/hosting/rest/services/Hosted/OSPI_H/FeatureServer/0` | `where=type like '%emol%' or type_work_desc like '%emol%'` grouped | Same PLI demolitions (533/662/102 = 1,297) + **6,244 DOMI "Demolition Dumpster"** staging permits (mostly interior work, inference) | `parc_num` | — | `editingInfo` not exposed | [read] |
| WPRDC `city-of-pittsburgh-building-permit-summary` (monthly XLSX, 2012-01 → 2023-04) | e.g. resource `87258f18-…` (Dec 2018) | **Building permits only**; no demolition permit class. "DEMO" appears only as interior demolition or "demolish and build new" (35 of 860 rows in Dec 2018) | `PARCEL` | not tested | archive | [read] (2 months sampled) |
| WPRDC `condemned-properties` resource `0a963f26-eb4b-4325-bbbc-3ddf6a871410` | datastore | 3,569 condemned records (fields: `parcel_id`, `property_type`, `create_date`, `latest_inspection_result`, `inspection_status`…; ⚠ has `owner`) | `parcel_id` | not tested | modified 2026-09-27 | [read] (schema/count) |
| `C/condemned_dead_end/FeatureServer/0` | — | 3,236 points (⚠ `owner` field) | `parc_num` | — | edited 2026-01-28 | [read] |
| `C/PLI_CDE_Parcels/FeatureServer/0` | — | 2,212 condemned/dead-end parcel polygons with Regrid fields (`ll_bldg_count`, `usps_vacancy`) | `pin`/`parid` | — | edited **2023-11-29 (stale)** | [read] (schema/count) |
| `C/Zoning_Demolitions/FeatureServer/0` | — | 179 polygons, "Planning Commission Demolitions Review" areas (`pc_review`) | none | — | edited **2019-10-08** | [read] (schema/count) |
| `C/DemolitionMoratorium/FeatureServer/0` | — | 1 polygon | — | — | edited 2018-05-30 | [read] |
| ACHD Asbestos Permits (WPRDC `allegheny-county-asbestos-permit`, `0a5408a4-…` 2013–2025, `8e91e9ae-…` current) | datastore | 9,523 permits countywide 2013–2025; `project_type` DEM 1,262 (PAA 6,995, UND 847, RES 413). 359 DEM with a Pittsburgh address. **Commercial/regulated only; no parcel ID** (address + lat/lon) | none | — | 2025-08-27 / 2026-08-05 | [read] (schema/counts) |
| `services1.arcgis.com/HmwnYiJTBZ4UkySc/…/Demolitions_By_COG_WFL1` | — | 329 geocoded residential demolitions **outside** Pittsburgh (COG CDBG, 2014–2019) | none | — | edited 2019-05-02 | [read] (schema/count) |
| **County assessment (current)** WPRDC `65855e14-549e-4992-b5be-d629afc676fa` | `fields=PARID,MUNICODE,USEDESC,COUNTYBUILDING,YEARBLT,…&filters={"MUNICODE":["101",…,"132"]}` | 142,395 City parcels, `ASOFDATE` 2026-09-01 | `PARID` | — | 2026-09-07 | [read] |
| **County assessment SEP-2017 snapshot** WPRDC `2514a4e4-5842-4dca-aff6-099bcd68482c` | same filter | 142,823 City parcels, with 2017 `USEDESC`, `COUNTYBUILDING`, `YEARBLT` | `PARID` | 22,149 of 22,354 current vacant parcels present | 2017-10-02 | [read] |
| Older assessment files (2016, 2017, 2019, 2020 zips) on the same package | — | could extend the snapshot diff | `PARID` | — | — | [found] |

### B2. Assessment fields on vacant land
- `YEARBLT` is populated on only **3** of 20,443 current `VACANT LAND` parcels; `STYLEDESC` also on 3. `COUNTYBUILDING` is 0 on 20,437. **The current roll wipes the building attributes once a parcel becomes vacant land.** No field says "prior structure". [read]
- The history lives in **old snapshots**. For the 1,294 currently vacant parcels that had a non-vacant use in SEP-2017, the 2017 row still carries `YEARBLT` (1,019 populated), style and use. 2017 uses: SINGLE FAMILY 775, ROWHOUSE 112, TWO FAMILY 76, RES AUX BUILDING 53, RETL/APT'S OVER 34, THREE FAMILY 26. [read]

### B3. Quantification (City of Pittsburgh, as of 2026-09-27)

| Measure | Count |
|---|---|
| City parcels (MUNICODE 101–132) | 142,395 |
| Currently vacant (`USEDESC` contains VACANT) | 22,354 (VACANT LAND 20,443; VACANT COMMERCIAL 1,777; VACANT INDUSTRIAL 127; >10 ACRES 7) |
| Distinct parcels with any demolition permit 2019–26 | 1,243 (100% PARID match) |
| …with a full demolition (Complete or City-funded) | 1,146 (879 with a Completed permit) |
| Full-demo parcels now vacant | **731** (640 Completed); 637 VACANT LAND + 93 VACANT COMMERCIAL |
| Full-demo parcels not (yet) vacant | ~415. Top uses SINGLE FAMILY 202, TWO FAMILY 25, ROWHOUSE 17. 43 of 244 residential-use ones also have a new-construction permit (demo-and-rebuild); the rest are likely assessment lag or unexecuted permits (inference) |
| City-funded demo parcels now vacant | 397 of 532 |
| Vacant now **and** building value > 0 in SEP-2017 | 1,354 (672 overlap with demo permits) |
| **Vacant with either signal** | **1,413 (6.3% of vacant)** |
| City-owned vacant inventory (5,786) with a demo permit / with 2017 building | 175 (3.0%) / 314 (5.4%) |

Vacant + full-demo by year of latest permit: 2019: 68 · 2020: 66 · 2021: 117 · 2022: 159 · 2023: 152 · 2024: 82 · 2025: 83 · 2026: 4.

### B4. Do City demolitions remove the basement? No, per the permits' own text
- City-funded permit `work_description` fields hold the **bid scope**. We classified all 533 by regex (`FOUNDATION… REMAIN/LEFT` vs `FOUNDATION… REMOV`):

| Year | "Foundation walls remain" stated | Foundation removal stated | Not stated |
|---|---|---|---|
| 2019 | 0 | 0 | 4 |
| 2020 | 1 | 0 | 26 |
| 2021 | 6 | 0 | 84 |
| 2022 | 0 | 2 | 107 |
| 2023 | 19 | 0 | 92 |
| 2024 | 24 | 0 | 7 |
| 2025 | 48 | 0 | 5 |
| 2026 | 105 | 0 | 3 |

- Recurring phrases across all 533: "VOID TO BE FILLED WITH CLEAN MATERIAL" (346, plus 31+12 variants), "FOUNDATION WALLS REMAIN" (161), "FOUNDATION WALLS TO REMAIN" (20), "REMAINING VOID TO BE FILLED TO ENGINEER'S SPECS" (6), "FOUNDATION WALLS MUST BE LEFT IN PLACE FOR HILLSIDE STABILIZATION" (2), "FOUNDATION TO BE REMOVED FOR DEVELOPMENT" / "FUTURE DEVELOPMENT TOTAL FOUNDATION REMOVAL" (2 each). Slabs: "remove … concrete slabs" appears in 483 of 533, and in context this refers to surface slabs, steps and pads. [read]
- Private complete demolitions (665): "BASEMENT" appears in 97, and only 2 state foundation removal (e.g. "DEMO HOUSE INCLUDING FOUNDATION AND PREP SITE FOR CONSTRUCTION…"). [read]
- **PLI Revised Private Demolition Requirements (issued 4/27/2021)** require: a pre-construction inspection confirming "presence of a basement"; a void inspection confirming "basement slabs and building materials are broken into pieces 24 inches or less"; "All voids shall be backfilled with clean fill per PA DEP 'Safe Fill Regulations' … exclude wood, roots, grass, coal, and carbonaceous shale"; 4" topsoil, seed and straw. Where a basement wall abuts a neighbour's, it will "remain stable … (serving as retaining wall)". **There is no wall-removal or compaction requirement.** The document cites "PLI's current demolition specifications", which were not found. Saved excerpt: [../sources/pittsburghpa-2026-09-27-pli-private-demolition-requirements-2021.md](../sources/pittsburghpa-2026-09-27-pli-private-demolition-requirements-2021.md). [read]
- The City's Lead Safe Demolitions PQ solicitation (OpenGov project 20770) reportedly says voids are "backfilled to the elevation of the surrounding grade … only clean fill" under DEP Safe Fill. That comes from a search snippet only; the page returned **403 to both curl and web fetch** (JS app). [skimmed]/[inaccessible]
- City page "City Funded Demolition" (last updated 04/24/2025) describes bidding and the Demolition List. It says nothing about basements or fill. [read]

### B5. What the demolition signal CAN and CAN'T tell
- **CAN:** that a structure stood on the parcel recently (2017+ via the snapshot diff, 2019+ via permits); its 2017 use, style and year built; whether the City paid for the demolition; and, for City-funded demos since ~2023, that **foundation walls were explicitly left in place and the void filled**.
- **CAN'T:** the depth, type or compaction of the fill; whether debris was buried (the rules say disposal receipts are required, but compliance isn't recorded in open data); what happened in demolitions **before 2017/2019**, which covers most of the ~22k vacant lots; or whether the "clean fill" was tested. **Absence of a demolition record ≠ virgin ground.** Pittsburgh's vacant lots are overwhelmingly former house lots (inference from the assessment history and SME testimony), so the conservative default for any vacant City lot is "assume an old foundation unless shown otherwise".
- Practical use: a three-level label. **(1) Known recent demo, foundation left** (City-funded and states "remain", or any City-funded demo since 2023). **(2) Known recent demo, foundation unknown.** **(3) No record: likely historic structure; assume buried foundation.** Apply the SME site-cost adder to levels 1 and 3 as a range. Don't subtract it for "no record".

---

## Gotchas
- DEP REST needs geometry as JSON with `spatialReference`; bare `lon,lat` → HTTP 400 (confirmed again). The DEP tank layers reject unknown `outFields` with HTTP 400, because their schema differs from the Land Recycling layers.
- DEP layers expose no `editingInfo` and no record dates. You cannot tell from the service how current they are.
- `CLIENT_NAME` (Land Recycling), `TANK_OWNER_*`, AUL `documentInfo.Author`, City `City_of_Pittsburgh_Storage_Tanks` mailing fields, condemned `owner`, and pli-permits `owner_name`/`contractor_name` may be personal. **Never request them.**
- Multiple sub-facility records share one point. Deduplicate on `PRIMARY_FACILITY_ID` before counting sites.
- WPRDC `datastore_search` `q=` full-text returned 0 for "demolition" on pli-permits and on the historic summaries, although matching rows exist. Filter client-side.
- WPRDC `datastore_search` `filters` accepts a list for `MUNICODE` (string codes "101"…"132").
- SEP-2017 assessment numeric fields come back as **strings**. Cast before comparing.
- pittsburghpa.gov PDFs return Akamai 403 to curl. A web-fetch tool got the PDF bytes.
- Full demolitions whose parcel still shows SINGLE FAMILY: the assessment lags or the site was rebuilt. Use permit status plus current `USEDESC` together.

## Recommendations for the build
1. **Environmental flag:** buffer-join (≤30 m / ≤100 m) to Act 2 (any medium) and AUL. List ACRES separately as "brownfield grant activity". Tanks: active only, ≤50 m. Link each flag to its eFACTS page. Put "no record ≠ clean" in the UI text.
2. **Demolition flag:** union (a) pli-permits full demolitions (join on `parcel_num`=`PARID`) and (b) the SEP-2017 snapshot diff (building value > 0 in 2017, vacant now). Display the 2017 use and year built as "what used to be here".
3. **Site-cost default:** for any vacant City lot, show the basement/fill cost adder as a range by default, and label its basis (the SME statement plus the PLI rules quoted above). Don't claim precision.
4. Do not merge the environmental and demolition flags into one score. They are different risks with different evidence quality.

## Open questions / gaps
- Act 2 standard and final-approval status per facility: DEP Final Report Summary site and PA Bulletin not tested for bulk access.
- AUL restriction text (does it bar residential?): source not located.
- The actual "PLI current demolition specifications" and City bid specs (OpenGov 403).
- Pre-2017 demolitions: try the 2016 assessment zip, or older WPRDC PLI exports [found]. Does the URA/Land Bank hold demolition records for its inventory? Not checked.
- Whether the 2008 County brownfield map has a GIS version.

## Sources
- PA DEP eMapPA_External MapServer (layer list; /26 group, /27–/33, /171, /172) `https://gis.dep.pa.gov/depgisprd/rest/services/emappa/eMapPA_External/MapServer` [read] *(accessed 2026-09-27)*
- PA DEP eFactsQueryExternal/MapServer/0 [read] *(accessed 2026-09-27)*: grouped counts, Land Recycling subset
- PA DEP AUL_NEW/AUL/MapServer/0 [read] *(accessed 2026-09-27)*
- PA DEP eMapPA_External_Extraction MapServer (layer ids/schema) [read] *(accessed 2026-09-27)*
- PA DEP eFACTS facility pages `https://www.ahs.dep.pa.gov/eFACTSWeb/searchResults_singleFacility.aspx?FacilityID=…` (105 City LR facilities) [read] *(accessed 2026-09-27)*
- PA DEP Land Recycling Final Report Summary site `https://www.dep.state.pa.us/wm_apps/finalreportsummary/landrecycling/` [found] *(accessed 2026-09-27)*
- PA DEP Land Recycling Program pages (pa.gov) [skimmed] *(accessed 2026-09-27)*
- EPA EMEF efpoints MapServer layers 0/4/5 `https://geopub.epa.gov/arcgis/rest/services/EMEF/efpoints/MapServer` [read] *(accessed 2026-09-27)*
- EPA CIMC download instructions `https://www.epa.gov/cleanups/cimc-how-download-data` [skimmed]; data.gov ACRES entry `https://catalog.data.gov/dataset/acres-brownfields-properties` [read] (catalog page only; lists "Dataset Last Updated 2014-01-01") *(accessed 2026-09-27)*
- City AGOL service list, `City_Boundary`, `ParcelsPublic`, `ParcelsPublicCityVacant`, `Zoning_Demolitions`, `DemolitionMoratorium`, `condemned_dead_end`, `PLI_CDE_Parcels`, `City_of_Pittsburgh_Storage_Tanks` [read] *(accessed 2026-09-27)*: dates in the tables above
- WPRDC `pli-permits` f4d1177a [read]; `condemned-properties` 0a963f26 [read]; `city-of-pittsburgh-building-permit-summary` [read] (2 months sampled); `allegheny-county-asbestos-permit` [read]; `property-assessments` 65855e14 and SEP-2017 2514a4e4 [read]; parcel centroids 3fab7152 [read] *(accessed 2026-09-27)*
- OneStopPGH OSPI_H FeatureServer/0 (grouped demolition counts) [read] *(accessed 2026-09-27)*
- PLI Revised Private Demolition Requirements (issued 4/27/2021) [read] *(accessed 2026-09-27)*; excerpt saved in `sources/`
- City "City Funded Demolition" page `https://www.pittsburghpa.gov/Business-Development/Permits-Licenses-and-Inspections/Condemned-Buildings/City-Funded-Demolition` [read] *(accessed 2026-09-27; page updated 04/24/2025)*
- City Lead Safe Demolitions PQ solicitation, OpenGov project 20770 [skimmed] via search snippet; direct fetch [inaccessible] (HTTP 403) *(accessed 2026-09-27)*
- Historic Pittsburgh / Pitt ULS Hopkins maps; tile services `tiles.arcgis.com/tiles/jIL9msH9OI208GCb/…/Pittsburgh{1835,1855,1862,1872,1882,1890,1903,1910,1923}/MapServer` [read] (Pittsburgh1923 service JSON only) *(accessed 2026-09-27)*
- Penn State Pittsburgh Region Sanborn Map Index viewer [found] *(accessed 2026-09-27)*
- `Demolitions_By_COG_WFL1` (services1.arcgis.com/HmwnYiJTBZ4UkySc) [read] *(accessed 2026-09-27)*
- Allegheny Places Brownfields map PDF [skimmed]; URA brownfield pages and EPA FY24 grant narrative [found] *(accessed 2026-09-27)*
- Prior context: [r2 deeper data sources §6](r2-deeper-data-sources.md), [environmental constraints node](../knowledge/data/environmental-constraints.md), [permits and outcomes node](../knowledge/data/permits-and-outcomes.md)
