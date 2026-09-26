# Sweep: LiDAR slope, footprints, sales/rents, revealed outcomes, land availability, other layers

**Round 2** · 2026-09-26 · single research subagent, web search and fetch plus live endpoint probes

> Archived at full fidelity, exactly as the agent reported it. Its tags are its own: some sweeps use [V]/[S]/[U] and some use [F]/[S]. The paper maps these onto `[read]` / `[skimmed]` / `[found]` / `[inaccessible]`. Local scratch paths have been replaced with `<scratch>`. Treat claims here as leads, and check the paper and the corrections log before citing.

---

## Deeper data report: Pittsburgh parcel Development Ease Score

Everything below was probed with curl on 2026-09-26. **V** = I got it to return data. **U** = I did not test it or could only partly confirm it. City AGOL base URL `C = https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services` (977 services). One setup note: Python urllib hit SSL certificate errors on this Mac. That is a local certificate-store problem, not a server problem; use curl or an unverified SSL context.

### 1. Elevation and slope (V, works per parcel)
- **USGS 3DEP ImageServer**: `https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer`. It has 1 m pixels (the service reports a pixel size of 1.0) and data current to 2026-08-24. `getSamples` returned elevations of about 223 m at resolution 1 on the test parcel.
- **Per-parcel slope classes (V)**: POST to `/computeStatisticsHistograms` with:
  - the parcel polygon, fetched with `outSR=26917`
  - `pixelSize={"x":1,"y":1,"spatialReference":{"wkid":26917}}`
  - `renderingRule={"rasterFunction":"Remap","rasterFunctionArguments":{"InputRanges":[0,15,15,25,25,40,40,10000],"OutputValues":[1,2,3,4],"Raster":{"rasterFunction":"Slope","rasterFunctionArguments":{"ZFactor":1,"SlopeType":2}}}}`
  - Read the counts from the first bin and the bins at the 1/3, 2/3 and last positions; each pixel is 1 m².
  - Result for parcel 0006S00252000000: 94 m² under 15%, 116 m² at 15–25%, 198 m² at 25–40%, 114 m² over 40%, out of 522 m². So 60% is over 25% slope and 22% is over 40%. Buildable area ≈ the under-25% pixels.
- **Gotchas**:
  - Use UTM (26917), not 3857. Web Mercator stretches distances by about 1.31× at this latitude, so slope comes out too low.
  - The preset "Slope Degrees" function returns classified integers (values 1–10), not real degrees.
  - About 1 in 4 calls failed once, so add retries.
- **Shortcut (V)**: `C/ETHOS_Lot_Suitability/FeatureServer/0` has 142,806 city parcels (2024) with a precomputed `SteepSlope` fraction (0–1), plus `Vacant`, `Housing` and `Best_Suit`. What threshold `SteepSlope` uses is U; it is probably the share over 25%.

### 2. Building footprints and heights
- **County footprints (V)**: `https://gisdata.alleghenycounty.us/arcgis/rest/services/EGIS/Buildings/MapServer/0` has 573,908 buildings. Fields are FEATURECODE, CLASS, LUC, status, prev_area and pct_change. There are no heights. It supports spatial queries (1,000 records per request). A bulk shapefile is on WPRDC (88.7 MB). The `OPENDATA/Buildings` URL listed on WPRDC is dead (404).
- **City heights (V)**: `C/Buildings_Elevation/FeatureServer/33` has 87,831 footprints with `lotblock`, `bldg_heigh` and `bldg_heigh_new` (ft). Last edited 2023.
- **City lot geometry (V)**: `C/Parcels_Exp_02052025_Residential_Lot_Dimensions/FeatureServer/0` has 105,488 parcels with Parcel_Width, Parcel_Len, Bldg_Width and zone_short (2025). You can check lot width against the district minimum directly.
- `C/Building_Footprints_Adjacency` (117,506) flags attached or row buildings. **U**: Overture, Microsoft and OSM heights were not tested.

### 3. Sales and rents
- **WPRDC sales (V)**: resource `5bbe6c55-bce6-4edb-9d04-68edeb6bf7b1` has 503,747 rows, current to 2026-09-24. Fields include PARID, SALEDATE, PRICE, SALECODE, SALEDESC and INSTRTYP.
  - Valid-sale filter: `SALECODE='0'` (99,176 rows).
  - Exclude: 3 = love and affection (103,908), H = multi-parcel (67,051), 9 = other invalid, 33 = prior foreclosure, 35 = corporation transfer, 13 = exempt buyer or seller.
  - Code **16 "BUILDING NOT YET ASSESSED" (6,657)** marks a sale of a newly built house. That gives you new-construction comps.
  - The sales table has no square footage. Join on PARID to assessments `65855e14-549e-4992-b5be-d629afc676fa` (584,999 rows; FINISHEDLIVINGAREA, YEARBLT, LOTAREA, USEDESC, CONDITION, GRADE).
  - The `datastore_search_sql` endpoint returns **403** (blocked at CloudFront). Use `datastore_search` with `filters`, or the bulk `/datastore/dump/<id>` CSV (returned 200).
- **Zillow ZORI by ZIP (V)**: `https://files.zillowstatic.com/research/public_csvs/zori/Zip_zori_uc_sfrcondomfr_sm_month.csv` (10 MB) covers 55 Allegheny ZIPs through 2026-08. The ZHVI mid-tier CSV is 124 MB (V).
- **ACS B25064 median rent**: the Census API now **requires a free key**; unkeyed calls redirect to `missing_key.html`. The city layer `C/ACS_DP04` has DP04_0134E (median gross rent) keyless, but it is 2020 5-year data.
- **HUD FMR/SAFMR**: the API needs a token (it returned "Unauthenticated"). The SAFMR xlsx returned 202 with an empty body. Treat HUD as U.

### 4. Revealed outcomes (ground truth labels)
- **OneStopPGH OSPI_H (V)** has 330,166 records with `source`, `type`, `type_work_desc`, `property_type`, `parc_num`, `issue_date` and `work_desc`.
  - `source='pli_permits' AND type='BUILDING' AND type_work_desc='NEW CONSTRUCTION'` gives **860 permits (490 Residential, 370 Commercial; 592 unique parcels)**. By year, Residential/Commercial: 2019 14/17, 2020 83/60, 2021 96/62, 2022 99/72, 2023 83/61, 2024 68/80, 2025 23/10, 2026 24/8.
  - The 2025–26 drop is a system change, not a real drop. New work moved to `type_work_desc='New Construction'` (583 records, mainly "Building & Development Application"), so union both queries.
  - Multifamily is filed as "Commercial" (for example, a 6-storey building with 48 apartments), so separate it using `work_desc`.
  - **Demolitions: 1,297** (`type='Demolition Permit'`; 662 complete, 533 city-funded, 102 partial).
  - Also in OSPI_H: condemned (1,946), dead-end (966) and rental registration.
- `C/PLI_Permits/FeatureServer/0` (61,022 records, 2019-06 to 2026-01) and WPRDC `f4d1177a-f597-4c32-8cbf-7885f56253f6` hold the same data. `C/Development_Construction_Projects_v2` has 518 NEW CONSTRUCTION records with a NUMBEROFUNITS field.
- **HUD LIHTC (V, stale)**: `https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/LIHTC/FeatureServer/0` has **215 Allegheny projects** (`CURCNTY_NM like 'Allegheny%'`). The latest real YR_PIS is 2019; 8888 is a placeholder. Same owner: `QUALIFIED_CENSUS_TRACTS` has 96 Allegheny QCTs (V). PHFA award lists were not checked (U).

### 5. Land availability
- **`C/ParcelsPublicCityVacant/FeatureServer/0` (V)** is the best one. It has 5,786 city-owned vacant parcels, edited 2026-09-01.
  - `current_status`: **Available for Sale 3,260**, Hold for Study 1,836, Sale Pending 489.
  - `inventory_type`: Public Sale 2,480, URA Transfer 1,419, PLB (Land Bank) Transfer 117.
  - It also carries zoning, flood and prior-years-delinquent fields.
- `C/Treasury_Sales_2026_New` has 41 points (edited 2026-09-18) with upset price, delinquency and outcome.
- `C/Sideyard_Sales` has 652 (2026-08). `C/ParcelsURA` has 1,570 (2023). `C/Surface_Parking_Lots` has 332. `C/Tax_Delinquent` has 13,796. `C/City_and_URA_Owned_Parcels` has only 62 (stale).
- `C/Vacant_Lots` is only aggregate counts. Skip it.
- **Assessments** with `USEDESC='VACANT LAND'`: 65,694 countywide (V).
- **Pittsburgh Land Bank site**: the connection failed (curl code 000). No API was found. Use the PLB Transfer inventory type above instead.
- **WPRDC sheriff sales**: last updated 2024-06 (stale). WPRDC tax liens and foreclosure filings are current as of 2026-09.

### 6. Other constraints and opportunities (all point- or parcel-queryable unless noted)
- **PA DEP land recycling / Act 2 (V)**: `https://gis.dep.pa.gov/depgisprd/rest/services/emappa/eMapPA_External/MapServer/31` (soil media, 752 in the county bounding box) and `/29` (groundwater, 345). The AUL (activity and use limitation) layer at `AUL_NEW/AUL/MapServer/0` has 473 points. Why it matters: contamination and deed restrictions add cost and time, but brownfield sites can also unlock grants.
- **PA mine subsidence insurance (V)**: `MineSubsidenceInsurance/MSI_SubsidenceRiskMiningConfirmed/FeatureServer/0`. `C/Parcels_On_Mines` has 25,821 city parcels already joined. This is a finer-grained version of the undermined layer.
- **Historic districts (V)**: `C/PGHWebCHDHistoricDistricts` (21 polygons, with a guideline_link field). Parcels inside need Historic Review Commission review, which adds time.
- **RCOs (V)**: `C/PGHWebRCO` has 45 organizations with contacts. It tells you which community meeting you must hold.
- **Neighborhood plans (V)**: `C/NeighborhoodPlans` has 6 plans with links and an Active flag.
- **Inclusionary Housing Overlay (V)**: 1 polygon. It triggers an affordable-unit mandate.
- **Other zoning overlays**: `PGHWebZoningOverlays`, `HeightReductionZone_ZoningOverlay` and `PGHWebParkingReductionOverlay` were not probed (U).
- **Sewersheds / CSO (V)**: `C/PGHWebSewersheds` (233, with `cso_shed` and `sewertype`) shows stormwater-management burden. PWSA GI project locations are at `services5.arcgis.com/jAsbh6V9IpseXByp/.../PWSA_Project_Locations` (U).
- **Tree canopy (V)**: `C/Tree_Coverage_Percent_by_Census_Block` (7,453 blocks, PercCover).
- **EPA walkability (V)**: `https://geodata.epa.gov/arcgis/rest/services/OA/WalkabilityIndex/MapServer/0`, block-group NatWalkInd, D3B and D4A (distance to transit). The point query worked. Don't use the Learn_ArcGIS copy; it returned nothing for Allegheny.
- **LODES jobs (V)**: `https://lehd.ces.census.gov/data/lodes/LODES8/pa/wac/pa_wac_S000_JT00_2023.csv.gz` (2.4 MB). Block-level jobs, useful for a jobs-within-X-miles measure.
- **Crime (V dataset)**: WPRDC blotter `1797ead8-...` and UCR `044f2016-...`. **311 (V)**: `5202679a-d243-402e-b82a-63189995a942`.
- **Condemned (V)**: WPRDC `0a963f26-...`.
- **Not verified**: ACHD air quality, school quality (PA Future Ready), and Overture heights.

### 7. Zoning outside the city (V)
Pittsburgh Regional Transit (`owner:gisadmin_PRT`) keeps a registry of municipal zoning layers. I verified these zoning layers return records:
- Penn Hills: `services5.arcgis.com/DllnbBENKfts6TQD/.../Zoning/FeatureServer/1` (220)
- Bethel Park: `services7.../ptmAvweveinujaUS/.../Public_View___Zoning_and_Parcels_and_Addresses/4` (686)
- Monroeville: `services9.../8FOQ9nDvQJjqML1o/.../Monroeville_Zoning_view/0` (686)
- Mt Lebanon: `services8.../4sXEsxQJTWBlSKA1/.../BasemapFeatureService_ReadOnl/9` (645, with a HEIGHT field)
- Whitehall: `services8.../A3O49kUB98Moka4Y/.../MasterFeatureService_ReadOnlyView/24` (60)
- Dormont, parcel-level zoning: `services6.../pIIoxuHIRX225O2N/.../MasterFeatureService_PublicView/7` (3,259)
- Moon: `services8.../g8yM34Z7IOCI3L3m/.../Zoning/2` (93)
- McCandless: `services1.../q8sarOko6mCDwiGm/.../McCandless_Zoning/1` (76)
- Franklin Park: `services9.../Dk5rlrQSwBJZ7C1H/.../Zoning/0` (20)

Gateway Engineers hosts "MasterFeatureService" layers for more boroughs (Crafton, Churchill, Upper St Clair); I did not check them for zoning. Nothing was found for Wilkinsburg, Millvale or McKees Rocks. **National Zoning Atlas**: the Pittsburgh metro is being mapped on its online map, with a report due "fall 2026". A downloadable Allegheny dataset is **U** because the pages are JS-rendered and I found no download.

### Top 8 differentiating layers for a 36-hour build
1. **3DEP slope histogram per parcel**: real % over 25% and over 40% slope, and buildable m². Verified end to end. Use ETHOS `SteepSlope` as a precomputed fallback.
2. **OSPI_H new-construction and demolition permits as ground-truth labels**: about 700 residential new builds and 1,297 demolitions with parcel IDs. Use them to calibrate or validate the score, or show "N new homes built within 500 m since 2019."
3. **ParcelsPublicCityVacant**: 3,260 city parcels available for sale, with status, zoning and flood. Enough to build an "acquirable now" filter.
4. **WPRDC sales (code 0 valid, code 16 new builds) joined to assessment square footage**: neighborhood new-construction $/sqft as an after-repair-value proxy.
5. **Residential lot dimensions layer**: parcel width and depth for a check against the zoning minimum lot width.
6. **Municipal zoning via the PRT registry**: covers about 9 suburbs beyond the city, which most teams will skip.
7. **PA DEP Act 2 / AUL plus mine-subsidence layers**: contamination and deed-restriction flags on top of the undermined layer.
8. **Zillow ZORI by ZIP plus EPA walkability and D4A transit distance**: rent and demand side. Add LODES jobs if time allows.

Traps to avoid:
- The WPRDC SQL endpoint returns 403.
- The Census API now needs a key.
- HUD LIHTC data stops at 2019.
- New-construction permits were re-coded in 2025.
- Many city layers were last edited in 2023. Check `editingInfo` before you rely on one.

Scratch files (parcel JSONs, zori.csv, probe scripts) are in `<scratch>`. I also accidentally wrote one throwaway HTML file to `/tmp/nza.html`. No project files were changed.

Sources: [National Zoning Atlas – Pennsylvania](https://www.zoningatlas.org/pennsylvania), [NZA editor status](https://edit.zoningatlas.org/atlas/status/?areatype=state&areaid=42)
