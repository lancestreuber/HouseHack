# Sweep: Parcel, environmental, infrastructure and market data endpoints (probed live)

**Round 1** · 2026-09-26 · single research subagent, web search and fetch plus live endpoint probes

> Archived at full fidelity, exactly as the agent reported it. Its tags are its own: some sweeps use [V]/[S]/[U] and some use [F]/[S]. The paper maps these onto `[read]` / `[skimmed]` / `[found]` / `[inaccessible]`. Local scratch paths have been replaced with `<scratch>`. Treat claims here as leads, and check the paper and the corrections log before citing.

---

## Pittsburgh parcel data research: parcels, environment, infrastructure, market (probed 2026-09-26)

**Legend:** **[V]** means I fetched it myself this session with curl. **[U]** means it comes only from search results and I did not check it.

### 1. Parcel core

**Assessments [V]**
- WPRDC dataset `property-assessments`. API resource `65855e14-549e-4992-b5be-d629afc676fa`, 584,999 rows, TAXYEAR 2026, ASOFDATE 2026-09-01.
- Fields: PARID, PROPERTYHOUSENUM/ADDRESS/CITY/ZIP, MUNICODE/MUNIDESC, SCHOOLDESC, NEIGHCODE, TAXDESC, OWNERDESC, CLASS/CLASSDESC, USECODE/USEDESC, LOTAREA, HOMESTEADFLAG, ABATEMENTFLAG, SALEDATE/SALEPRICE/SALEDESC, PREVSALE*, COUNTY/LOCAL/FAIRMARKET BUILDING/LAND/TOTAL, YEARBLT, CONDITIONDESC, CDUDESC, GRADEDESC, FINISHEDLIVINGAREA, BEDROOMS and others.
- **The owner name is not included.** You only get OWNERDESC (e.g. "CORPORATION") and CHANGENOTICEADDRESS1-4 (the tax-bill mailing address).

**Parcel ID format [V]**
- The API uses 16 characters with no dashes, e.g. `0001D00128000000`.
- The portal shows the same ID as `0001-D-00128-0000-00`. Stripping the dashes converts between the two.

**Looking up one parcel by ID [V]** (`datastore_search` with a filter works):
```
https://data.wprdc.org/api/3/action/datastore_search?resource_id=65855e14-549e-4992-b5be-d629afc676fa&filters={"PARID":"0001D00128000000"}
→ {'PARID':'0001D00128000000','PROPERTYADDRESS':'MARKET SQ','LOTAREA':2400,'CLASSDESC':'COMMERCIAL','USEDESC':'SMALL DETACHED RET(UNDER 10000)','FAIRMARKETTOTAL':463300,'OWNERDESC':'CORPORATION'}
```

**Gotcha: SQL with WHERE is blocked [V].** `datastore_search_sql` works for simple `SELECT … LIMIT`. Any query with a `WHERE` clause (GET or POST) came back as a CloudFront "403 Request blocked" from here. Use `datastore_search` with `filters` instead.

**Parcel geometry**
- **Allegheny County's own GIS server [V]:** `https://gisdata.alleghenycounty.us/arcgis/rest/services/OPENDATA/Parcels/MapServer/0`. Fields: PIN, MAPBLOCKLOT, MUNICODE, CALCACREAGE. Max 1,000 records per request.
  - Query: `…/query?where=PIN='0001D00128000000'&outFields=*&returnGeometry=true&outSR=4326&f=json` returned the polygon (ring starts at -80.00326, 40.44124).
- **WPRDC CSV copy [V]:** `datastore_search` on resource `858bbc0f-b949-4e22-b4bb-1a78fef24afc` with `filters={"pin":"…"}` returns the polygon as `wkt` in PA South State Plane feet (EPSG:2272).
- **PASDA mirror [V]:** the REST service WPRDC links to (`maps.pasda.psu.edu/…/AlleghenyCounty/MapServer/25`) is down with an "Application Error". Don't use it.
- **Parcel centroids [V]:** resource `3fab7152-3f11-4788-8372-4c33f86ea813` (March 2025) gives PIN, LAT/LONG, census tract/block-group GEOIDs, municipality and city neighborhood. Useful as a ready-made crosswalk.

**County Real Estate Portal [V]:** `https://realestate.alleghenycounty.us/GeneralInfo?ID=0001D00128000000`
- Plain GET works with no captcha. It is an ASP.NET page (has `__VIEWSTATE`).
- It returns the **owner name** ("REVOCABLE TRUST OF NICHOLAS G NICHOLAS"), which WPRDC leaves out.
- It is scrapable, but do it gently and cache results. It has a disclaimer page; I did not check its terms of use.

### 2. Related parcel-level datasets on WPRDC [V]
All confirmed with `datastore_search`. The parcel-ID field is named in each row.

| Dataset | Resource id | Parcel key | Rows |
|---|---|---|---|
| Property sales | 5bbe6c55-bce6-4edb-9d04-68edeb6bf7b1 | PARID | 503,747 |
| Tax liens with current status | 65d0d259-3e58-49d3-bebb-80dc75f61245 | pin | 2.16M |
| County delinquent RE taxes (cumulative) | 96e9d6b2-3e1a-4a0c-8ef6-23a049c263d8 | parcel_id | 545,765 |
| City tax delinquency | ed0d1550-c300-4114-865c-82dc7c23235b | pin | 27,527 |
| City-owned properties (updated 2026-09-26) | e1dcee82-9179-4306-8167-5891915b62a7 | pin | 12,477 |
| Condemned / dead-end properties | 0a963f26-eb4b-4325-bbbc-3ddf6a871410 | parcel_id | 3,569 |
| PLI/DOMI/ES violations | 70c06278-92c5-4040-ab28-17671866f81c | parcel_id | 643,994 |
| PLI permits | f4d1177a-f597-4c32-8cbf-7885f56253f6 | parcel_num | 65,378 |
| Conservatorship filings | fd64c179-b5af-4263-9275-fb581705d878 | pin | 582 |
| Sheriff sales | (package `sheriff-sales`) | not checked | – |

- **City-owned properties** also carry `inventory_type` (e.g. "Public Sale") and `current_status` (e.g. "Available for Sale", "Sale Pending").
- **Lots to Love** (027d0b43…) has **no parcel ID**, only lat/lon and address.
- **Pittsburgh Land Bank:** I found no dedicated WPRDC dataset. The city's ArcGIS org has `City_and_URA_Owned_Parcels`, `Vacant_Lots` and `ParcelsPublicCityVacant`; I saw their names only and did not query them.
- **Zoning [V]:** `services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services/PGHWebZoning/FeatureServer/0`. A point query returned `zon_new: GT-A` plus a link to the code section.

### 3. Environmental and site constraints
Base URL for the City of Pittsburgh ArcGIS org: `C = https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services`. All of these accept `geometry=lon,lat&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects`, and also polygon geometry.

**Flood**
- **FEMA NFHL [V]:** `https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28` (Flood Hazard Zones).
  - Point (-80.0120, 40.4420) returned `FLD_ZONE AE, SFHA_TF T, DFIRM_ID 42003C`.
  - Downtown returned `X / 0.2 PCT ANNUAL CHANCE`.
  - A POST with a polygon geometry (the parcel footprint) also worked.
- **City copy [V]:** `C/PGHWebFEMA2014/FeatureServer/0` has fld_zone, floodway and sfha_tf, but it is the 2014 data. There is also `C/FEMA_2026`, described as derived from PASDA on 2026-08-31. I only read its description.

**Landslide-prone areas [V]:** `C/PGHWebLandslideProne/FeatureServer/0`
- Point (-80.030984, 40.435139) returned `landslideprone: Yes`.
- The county has a more detailed version at `services1.arcgis.com/vdNDkVykv9vEWFX4/arcgis/rest/services/Landslide_Prone_Areas/FeatureServer/0` (7,242 polygons). Its flags are REDBED, CREEP, MANFILL, ROCKFALL, DEBRIS and PREHIS.

**Steep slope, 25% or more [V]:** `C/PGHWebSlope25/FeatureServer/0`, 1,714 polygons.
- An envelope/polygon query returned `slope25: Yes`.
- A point I picked inside one polygon returned nothing, probably because the polygons have holes. **Intersect with the parcel polygon rather than its centroid.**
- I found no public 40% slope layer. You could derive one from the county soils data, or from DEM data (not checked).

**Undermined areas**
- **City [V]:** `C/PGHWebUndermined/FeatureServer/0`. Mt Washington point (-80.0133, 40.4356) returned `undermined: Yes`.
- **PA DEP [V]:** `https://gis.dep.pa.gov/depgisprd/rest/services/DigitizedMinedArea/MapServer/0` (6,848 polygons; coal seam, operator, last mined). The same point returned nothing, so coverage is partial.
  - DEP needs the geometry as JSON with `spatialReference`. A bare `lon,lat` plus `inSR` gave a 400 error.
- **DEP Mine Subsidence Insurance [V]:** `…/MineSubsidenceInsurance/MSI_SubsidenceRiskMiningConfirmed/FeatureServer/0` returned a hit, but it is one huge regional polygon, so it is too coarse to score a parcel.

**PA DEP eMapPA [V]:** `https://gis.dep.pa.gov/depgisprd/rest/services/emappa/eMapPA_External_Extraction/MapServer/{id}`
- Useful layer ids:
  - 17–22: Land Recycling (Act 2) media records (Soil Media is 20). A 500 m buffer around downtown returned 4 records with type "LAND RECYCLING CLEANUP LOCATION".
  - 118/119: Storage Tanks Active/Inactive. A 300 m buffer returned 5 tanks.
  - 47: Digitized Mined Area.
  - 50/51: Abandoned Mine Land (AML) sites.
  - 54/58/62/63: oil and gas wells, including abandoned/orphaned and historical wells.
  - 91–94: floodplains.
  - 225: public water supply service areas.
  - 260: environmental justice tracts.
- The non-extraction service `emappa/eMapPA_External` has layer 26 "Land Recycling Cleanup Location" (not queried).

**EPA [V]:** `https://geopub.epa.gov/arcgis/rest/services/EMEF/efpoints/MapServer`. Layer 0 is Superfund, 5 is Brownfields (ACRES), plus TRI, RCRA and air.
- A 1.5 km buffer around downtown returned 4 brownfields and 0 Superfund sites.

**Wetlands [V]:** `https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/rest/services/Wetlands/MapServer/0`. A 500 m buffer returned a riverine polygon (R2UBH).

**Soils [V]**
- USDA Soil Data Access: POST to `https://SDMDataAccess.sc.egov.usda.gov/Tabular/post.rest` with SQL using `SDA_Get_Mukey_from_intersection_with_WktWgs84('point(lon lat)')`.
  - Returned "Urban land-Culleoka complex, steep", slope_r 30/45, hydrologic group B.
- County soils layer also exists at `vdNDkVykv9vEWFX4/…/Soils/FeatureServer/0`.

### 4. Infrastructure

**Sewer lines — public, but geometry only [V]**
- County AGOL `Pittsburgh_Sewers/FeatureServer/0`: 125,128 line segments with owner (pwsa), System_Type (combined/separate), Pipe_Flow_Type and Diameter_Range (e.g. "36-59").
- It is a **2012 export** ("20120113 LBs export"), so it is dated.
- A 100 m buffer query worked.

**Sewersheds [V]**
- City `C/PGHWebSewersheds/FeatureServer/0`: downtown returned `cso_shed A-04, sewertype Combined`.
- PWSA `https://services5.arcgis.com/jAsbh6V9IpseXByp/arcgis/rest/services/Sewersheds/FeatureServer/0` adds typical-year combined sewer overflow (CSO) volume, events, duration and RANK. This is the best available proxy for sewer stress.
- County `Allegheny_Sewer` and `Allegheny_Water` give the sanitary/water authority for any point.

**Lead service lines [V]**
- `services5.arcgis.com/jAsbh6V9IpseXByp/arcgis/rest/services/PGH2O_Water_Service_Line_Material/FeatureServer/0`, 80,876 points.
- Fields: Address, FinalReportedMaterialPublic, FinalReportedMaterialPrivate (e.g. NonLead).
- Also `Lead_Service_Line_Replacement_Areas`.

**Stormwater:** PWSA has `Stormwater_Issue_Public_Reporting` and inlets (WPRDC `pwsa-inlets`); I did not query them. Allegheny County `Act167` and `Stormwater_BMPs` exist (names only).

**Not publicly available (important):**
- **PWSA water mains:** no public water-main layer found in PWSA's ArcGIS org (85 services listed). Only service areas, repair contract sites and the reliability-plan projects.
- **Sewer capacity:** no public sewer or treatment capacity data exists for PWSA or ALCOSAN [U].
  - ALCOSAN operates under the 2020 Modified Consent Decree.
  - Because of it, DEP has not allowed planning-module exemptions since 2011. Every new development needs a DEP Sewage Facilities Planning Module. Capacity comes out of that process and PWSA's permit review, not from a dataset [U].
- **Duquesne Light:** no public hosting-capacity map found [U, search only]. Interconnection capacity comes from studies done per request.

**Transit [V]**
- GTFS static: `https://www.rideprt.org/developerresources/GTFS.zip` (22.5 MB, last-modified 2026-09-26). The `portauthority.org/generaltransitfeed/` path returns 404.
- GTFS-realtime [U]: `https://truetime.portauthority.org/gtfsrt-bus/` and `…/gtfsrt-train/`.
- WPRDC PRT stops `d6e6ed6e-9220-4a0e-9796-e72d83ce8e7a` (6,389 stops) already includes `trips_wd`, `trips_sa`, `trips_su`, `trips_7d` and `route_filter`, so transit-access scoring is easy.

### 5. Market and neighborhood

**Neighborhoods [V]:** `C/PGHWebNeighborhoods/FeatureServer/0`. Downtown returned `hood: Central Business District`. WPRDC also has `neighborhoods2`.

**Census tracts [V]:** `https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Tracts_Blocks/MapServer/0` returned GEOID 42003020100.

**HUD FY2026 income limits [V]** (parsed from `https://www.huduser.gov/portal/datasets/il/il26/Section8-FY26.xlsx`, Pittsburgh, PA HUD Metro FMR Area, Allegheny row):

| | Area median income | 30% (extremely low), 4-person | 50% (very low), 4-person | 80% (low), 4-person |
|---|---|---|---|---|
| FY2026 | $110,400 | $33,100 | $55,200 | $88,300 |
| FY2025 | $107,300 | $32,200 | $53,650 | $85,850 |

The HUD HTML summary pages returned HTTP 202 with no content to curl, so use the xlsx.

**Qualified Census Tracts (QCT) and Difficult Development Areas (DDA) for the low-income housing tax credit [V]** (HUD eGIS):
- `https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/QUALIFIED_CENSUS_TRACTS_2026/FeatureServer/0`: a Homewood point returned tract 42003130800.
- `…/Difficult_Development_Areas_2026/FeatureServer/0`: downtown returned `ZCTA5 15222, DDA_TYPE SA` (a small-area DDA).

**Opportunity Zones [V]:** `…/Opportunity_Zones/FeatureServer/13` (the layer id is 13, not 0). Homewood returned GEOID10 42003130300.
- This layer uses 2010 tracts, so its tract IDs won't match the 2020 IDs from the QCT layer for the same point.
- I did not check the status of the OZ program or any post-2026 designations.

### Parcel-to-score pipeline
1. Look up the PARID via WPRDC filters.
2. Get the polygon from the county's OPENDATA/Parcels service with `outSR=4326`.
3. Intersect that polygon with each REST layer above.
4. Join the other WPRDC tables by PIN/PARID/parcel_id.

