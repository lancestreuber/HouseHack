## 1. Attribution and license obligations

Most sources are U.S. federal, state, county or city open data. A few carry obligations that must appear in the app and the README:

| Source | License / terms | What we must do |
|---|---|---|
| OpenStreetMap (basemap tiles, 3D buildings in CARTO tiles, Overpass extracts, Nominatim search, ALPR locations, post offices, laundromats, dentists, community centers, police/EMS additions) | ODbL 1.0 | Show "© OpenStreetMap contributors" with a link to https://www.openstreetmap.org/copyright. Share-alike applies to derived databases we redistribute. Respect the tile and Nominatim usage policies (low volume, identifying User-Agent). |
| CARTO basemaps (Dark Matter, Positron) | CARTO basemap terms | Show "© CARTO" next to the OSM credit. |
| Mapping Inequality (HOLC 1937 redlining) | CC BY-SA 4.0 | Credit "Mapping Inequality, Nelson et al., University of Richmond Digital Scholarship Lab". Derived redistribution must stay CC BY-SA. |
| UMN Accessibility Observatory, Access Across America: Transit 2024 | CC BY-NC 4.0 | Credit UMN; non-commercial use only. Fine for the hackathon; a commercial pilot would need permission. |
| DOE LEAD Tool 2022 | CC BY 4.0 | Credit "U.S. DOE Low-Income Energy Affordability Data (LEAD) Tool, 2022 update". |
| WPRDC datasets | CC0 or CC BY (varies by dataset; listed per row below) | For CC BY rows, credit the publishing agency and WPRDC. |
| Zillow Research (ZORI) | Zillow Research data terms | Credit "Zillow Research". Aggregates only. |
| Child Opportunity Index 3.0 | diversitydatakids.org terms (free with attribution) | Credit diversitydatakids.org. Note that we read a third-party ArcGIS mirror. |
| Princeton Eviction Lab (Eviction Tracking System) | Eviction Lab data terms | Credit "The Eviction Lab at Princeton University". |
| Live camera feeds | Each owner's terms; feeds are embedded or proxied, never re-hosted | Credit the operator in the viewer (the app does this per camera). |
| Everything else in this document | U.S. federal public domain, or state/county/city open data with no stated license | Credit the publisher. Where "not stated" appears, no license string was published. |

**Suggested one-line credit for the app footer:** Data: City of Pittsburgh, Allegheny County, WPRDC, U.S. Census Bureau, HUD, FEMA, USGS, EPA, CDC, HRSA, USDA, PA DEP, PA DOH, PA DHS, PA DOE, PWSA, PRT, and others (see DATA_SOURCES.md). Basemap © CARTO © OpenStreetMap contributors. Redlining: Mapping Inequality (CC BY-SA). Transit access: UMN Accessibility Observatory (CC BY-NC).

---

## 2. Dataset catalog, by theme

Conventions:
- **Accessed** means the date the team pulled or verified the source live. Unless noted, that was **2026-09-26** (a few items on 2026-09-27).
- **Used in** names the map layer id (see §3), a pillar indicator (see §4), or a legal-feasibility file (see §5).
- ArcGIS REST endpoints are given as the exact layer URL. `CITY` = `https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services` (City of Pittsburgh). `COUNTY` = `https://services1.arcgis.com/vdNDkVykv9vEWFX4/arcgis/rest/services` (Allegheny County GIS). `HUD` = `https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services` (HUD eGIS). `CG` = `https://services.arcgis.com/Kwm2c3YqtFhUC26N/arcgis/rest/services` (ConnectGovs, a municipal GIS consortium for Allegheny County). `PWSA` = `https://services5.arcgis.com/jAsbh6V9IpseXByp/arcgis/rest/services`. `PASDA_DOH` = `https://mapservices.pasda.psu.edu/server/rest/services/pasda/DepHealth/MapServer`.

### 2.1 Base map, parcels and geography

| Dataset (publisher) | Source / endpoint | Vintage | License | Used in |
|---|---|---|---|---|
| Allegheny County parcel boundaries (Allegheny County GIS, via WPRDC) | https://data.wprdc.org/dataset/709e4e52-6f82-4cd0-a848-f3e2b3f5d22b/resource/3f50d47a-ab54-4da2-9f03-8519006e9fc9/download/alleghenycounty_parcels202609.geojson (~585k parcels; imported into the team's Neon PostGIS database, reprojected from EPSG:2272) | Sept 2026 | WPRDC (county data) | Parcel outlines on the map; parcel selection |
| City of Pittsburgh `ParcelsPublic` (City of Pittsburgh) | `CITY/ParcelsPublic/FeatureServer/0` (142,635 features, 142,365 distinct PINs; private owners already anonymized as "Private") | edited 2026-09-21 | City open data | Pillar "parcel spine" (every scored parcel), vacant-building address join, lot area |
| Parcel centroids with census geographies (Allegheny County, via WPRDC) | https://data.wprdc.org/dataset/2536e5e2-253b-4c58-969d-687828bb94c6/resource/3fab7152-3f11-4788-8372-4c33f86ea813/download/parcel_centroids_2025_march.csv (585,387 rows; 2020 tract and block-group codes, verified 99.994% match) | March 2025 | CC0 | Parcel → tract / block-group crosswalk for every pillar indicator; parcel-level heat and canopy sampling |
| City zoning districts `PGHWebZoning` (City of Pittsburgh Dept. of City Planning) | `CITY/PGHWebZoning/FeatureServer/0` (1,069 polygons, field `zon_new`); also WPRDC https://data.wprdc.org/dataset/zoning | edited 2026-09-22 | City open data | `pittsburgh-zoning.geojson` base layer, `residential-zoning`, legal matrix join, permit and ZBA district joins |
| City neighborhoods `PGHWebNeighborhoods` | `CITY/PGHWebNeighborhoods/FeatureServer/0` (90 polygons) | edited 2026-07-02 | City open data | Permit and ZBA neighborhood joins |
| City boundary | `CITY/City_Boundary/FeatureServer/0` | – | City open data | Clipping City-only layers |
| Allegheny County boundary | `COUNTY/Allegheny_County_Boundary/FeatureServer/0`; TIGERweb https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/1 (GEOID 42003) | current | County / public domain | Clipping every county-wide layer |
| Census tracts, block groups (2020) and ZCTAs (U.S. Census Bureau) | Census Reporter geometry API https://api.censusreporter.org/1.0/geo/show/latest?geo_ids=150\|05000US42003 (1,062 block groups) and `140\|05000US42003` (394 tracts); TIGERweb ZCTA https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/PUMA_TAD_TAZ_UGA_ZCTA/MapServer/1 | 2020 geography | Public domain | Every tract / block-group / ZIP choropleth |
| Census tracts (2010 geography) | https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Census2010/MapServer/14 | 2010 | Public domain | Opportunity Atlas, life expectancy and blood-lead layers (2010-tract data) |
| 2020↔2010 tract relationship file; 2010 Gazetteer tract file (U.S. Census Bureau) | https://www2.census.gov/geo/docs/maps-data/data/rel2020/tract/tab20_tract20_tract10_st42.txt ; https://www2.census.gov/geo/docs/maps-data/data/gazetteer/census_tracts_list_42.txt | 2020 / 2010 | Public domain | Early population-change estimate (superseded by §2.6 household growth) |
| Basemap: CARTO Dark Matter and Positron vector styles, incl. 3D building extrusions | https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json ; https://basemaps.cartocdn.com/gl/positron-gl-style/style.json (buildings from the `building` source-layer, OpenStreetMap data) | live | CARTO terms + ODbL | App basemap; 3D buildings (Mat's `3d-buildings` branch) |
| Basemap: OpenStreetMap raster tiles | https://tile.openstreetmap.org/{z}/{x}/{y}.png | live | ODbL; OSM tile usage policy | Alternate basemap |
| U.S. Census Geocoder | https://geocoding.geo.census.gov/geocoder/locations/addressbatch and `/geocoder/geographies/onelineaddress` (benchmark Public_AR_Current) | live | Public domain | Geocoding pharmacies, clinics, senior/care facilities |
| OpenStreetMap Nominatim | https://nominatim.openstreetmap.org/search | live | ODbL; Nominatim usage policy | App address search; fallback geocoding for 29 pharmacies |

### 2.2 Natural hazards and climate

| Dataset (publisher) | Source / endpoint | Vintage | License | Used in |
|---|---|---|---|---|
| National Flood Hazard Layer, flood hazard zones (FEMA) | https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28 (county bbox; 9,501 polygons kept after dropping "minimal hazard") | effective FIRMs, current | Public domain | `flood-zones`; pillar gates (floodway, floodplain) |
| National Risk Index, census tracts (FEMA) | https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/National_Risk_Index_Census_Tracts/FeatureServer/0 (inland flood, heat wave, cold wave, winter weather, strong wind, landslide, ice storm, tornado ratings) | NRI Dec 2025 | Public domain | `weather-risk`; climate pillar |
| 3D Elevation Program slope, computed on the fly (USGS) | https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer (raster function `Slope Degrees`, remapped to 15–25% and ≥25%) | service dated 2026-08-25 | Public domain | `slope-raster` |
| Steep slopes ≥25% `PGHWebSlope25` (City) | `CITY/PGHWebSlope25/FeatureServer/0` (1,714 polygons) | edited 2018-05-31 | City open data | `city-steep-slopes`; pillar gate (steep slope share) |
| Landslide-prone areas `PGHWebLandslideProne` (City) | `CITY/PGHWebLandslideProne/FeatureServer/0` (37 polygons) | edited 2024-12-19 | City open data | `city-hazard-overlays`; pillar gate |
| Undermined areas `PGHWebUndermined` (City) | `CITY/PGHWebUndermined/FeatureServer/0` (47 polygons) | edited 2018-04-27 | City open data | `city-hazard-overlays`; pillar flag |
| Landslide susceptibility (Allegheny County GIS; flags consistent with 1970s–80s USGS Pomeroy mapping, provenance inferred) | `COUNTY/Landslide_Prone_Areas/FeatureServer/0` (7,242 polygons; 6,792 with a hazard flag) | edited 2018-07-19 | Not stated | `landslide-susceptibility`; pillar gate |
| Landslide incidents on county roads (Allegheny County Public Works) | `COUNTY/Landslides_DPW/FeatureServer/0` (115 points) | edited 2025-09-24 | Not stated | `landslide-incidents` |
| Landslide public-assistance sites (Allegheny County) | `COUNTY/Landslide_Public_Assistance/FeatureServer/0` (86 points) | edited 2023-10-20 | Not stated | `landslide-public-assistance` |
| Mined-out areas, underground coal (PA DEP) | https://gis.dep.pa.gov/depgisprd/rest/services/DistrictMiningOperations/DMO_MinedOutAreaCoalUnderground/FeatureServer/0 (997 polygons in the county bbox) | current | PA public data | `mined-out-areas` |
| Mine Subsidence Insurance risk, mining confirmed (PA DEP) | https://gis.dep.pa.gov/depgisprd/rest/services/MineSubsidenceInsurance/MSI_SubsidenceRiskMiningConfirmed/MapServer (raster export) | current | PA public data | `mine-subsidence-raster` |
| Tornado paths 1950–2025 (NOAA Storm Prediction Center) | https://www.spc.noaa.gov/gis/svrgis/zipped/1950-2025-torn-aspath.zip (44 tracks touching the county) | through 2025 | Public domain | `tornado-paths` |
| Urban heat island, 2020 mean land surface temperature tiles (City of Pittsburgh) | https://tiles.arcgis.com/tiles/YZCmUqbcsUpOKfj7/arcgis/rest/services/UHI_CU_PIT_2020_MEANLST_Clip1/MapServer (display only; no values) | 2020 | City open data | `surface-heat-raster` |
| Landsat 8 Collection 2 Level-2 surface temperature (USGS; served by Microsoft Planetary Computer) | STAC https://planetarycomputer.microsoft.com/api/stac/v1 collection `landsat-c2-l2`; data API `/api/data/v1/item/bbox/...npy` (band `lwir11` + `qa_pixel`). Scenes: LC08_L2SP_017032_20250810_02_T1, LC08_L2SP_017032_20240823_02_T1, LC08_L2SP_017032_20230618_02_T1, LC08_L2SP_017032_20230602_02_T1 | 2023–2025 summers | Public domain (USGS Landsat) | Pillar indicators: parcel and block-group land surface temperature (4-scene anomaly composite) |
| NLCD 2021 tree canopy cover (USFS / MRLC) | https://www.mrlc.gov/data ; WMS https://www.mrlc.gov/geoserver/mrlc_display/wms (layer `nlcd_tcc_conus_2021_v2021-4`); WCS https://www.mrlc.gov/geoserver/wcs and `/geoserver/mrlc_display/wcs` (coverage `mrlc_display__nlcd_tcc_conus_2021_v2021-4`) | 2021 | Public domain | `tree-canopy-raster`; pillar canopy indicators |
| NLCD 2021 percent developed impervious (MRLC) | WMS layer `NLCD_2021_Impervious_L48`; WCS coverage `mrlc_download__NLCD_2021_Impervious_L48` | 2021 | Public domain | `impervious-raster`; pillar impervious indicator |
| EPA EJScreen v2.32, state percentiles by block group (EPA; via the Public Environmental Data Partners mirror after EPA took EJScreen offline in 2025) | https://services2.arcgis.com/w4yiQqB14ZaAGzJq/arcgis/rest/services/EJScreenStatePercentilesBlockGroup/FeatureServer/0 (PM2.5, ozone, NO2, diesel PM, traffic proximity, RSEI air toxics) | v2.32 (indicator years vary) | Public domain (EPA data; mirror) | `air-quality`; climate pillar air indicators. Mirror homes: https://pedp-ejscreen.azurewebsites.net , https://screening-tools.com/epa-ejscreen ; the original https://ejscreen.epa.gov/mapper was offline |
| ACHD point-source emissions inventory (Allegheny County Health Dept, via WPRDC) | https://data.wprdc.org/dataset/emissions-inventory (resource `1ab77bb5-5684-430e-bdda-fb401167fb6a`, 16,768 rows, 58 current facilities) | 2010–2021 (latest year 2021) | WPRDC | Pillar indicator: nearby industrial emissions (`achd_facilities_latest.csv`) |

### 2.3 Infrastructure and transportation

| Dataset (publisher) | Source / endpoint | Vintage | License | Used in |
|---|---|---|---|---|
| Water service line material, lead (Pittsburgh Water / PWSA) | `PWSA/PGH2O_Water_Service_Line_Material/FeatureServer/0` (80,876 service addresses) | edited 2026-08-31 | Not stated; PWSA accuracy disclaimer | `lead-service-lines`; pillar flag |
| Sewer lines, county-wide (Allegheny County GIS; 3 Rivers Wet Weather "LBs" export) | `COUNTY/Pittsburgh_Sewers/FeatureServer/0` (125,128 segments, 86 municipal systems) | 2012 export | Not stated | `sewer-lines` (loaded by viewport) |
| Pittsburgh Regional Transit stops with scheduled trips (PRT, via WPRDC) | https://data.wprdc.org/dataset/prt-of-allegheny-county-transit-stops ; file https://data.wprdc.org/dataset/33d5f44b-5315-4374-b3e3-e4246e8ad5c9/resource/d6e6ed6e-9220-4a0e-9796-e72d83ce8e7a/download/stops.geojson (6,389 stops) | GTFS feed 2606, updated 2026-09-22 | CC BY | `transit-stops`; access pillar transit indicator |
| Access Across America: Transit 2024, jobs reachable by transit (University of Minnesota Accessibility Observatory) | https://conservancy.umn.edu/server/api/core/bitstreams/82f5db0b-5e6b-495b-9685-374219785c17/content (PA file, block groups, 30 / 45 minutes) | 2024 | CC BY-NC 4.0 | `jobs` (transit_jobs_30/45); access pillar |
| POGOH bike-share stations (POGOH, GBFS feed) | https://pittsburgh.publicbikesystem.net/customer/gbfs/v2/en/station_information (60 stations) | live | GBFS public feed | `places-bike-share` |
| PennDOT reportable crashes, Allegheny County (PennDOT, via WPRDC) | https://data.wprdc.org/dataset/allegheny-county-crash-data (2025 resource `c6bedb17-2d23-49b1-843a-8f6b41e5e5c3`; 2024 `4c016b4c-59f0-45ca-981c-718c784b3462`; 2023 `96777349-57df-48fb-a1d7-8384786fe71a`) | 2023–2025 | CC0 | `serious-crashes` (killed-or-seriously-injured, 1,174) |

### 2.4 Housing costs, affordability and subsidy

| Dataset (publisher) | Source / endpoint | Vintage | License | Used in |
|---|---|---|---|---|
| American Community Survey 5-year (U.S. Census Bureau, via the Census Reporter API) | https://api.censusreporter.org/1.0/data/show/acs2024_5yr (human-readable: https://censusreporter.org/profiles/05000US42003-allegheny-county-pa/ ; table pages such as https://censusreporter.org/tables/B28002/) — tables B19013 (median household income), B25064 (median gross rent), B25077 (home value), B25070 (rent burden), B25002/B25004 (vacancy), B25003 (tenure), B25001 (housing units), B28002 (internet), B01001/B01003 (age, population), B25010 (household size), B11001 (household type), B14007 (school enrollment), B26001 (group quarters) | ACS 2020–2024 | Public domain | `housing-costs`, `home-internet`; pillar demand, need and affordability indicators; college-enrollment adjustment |
| Comprehensive Housing Affordability Strategy, CHAS (HUD) | https://www.huduser.gov/PORTAL/datasets/cp/2018thru2022-140-csv.zip (tract Table 8) + data dictionary https://www.huduser.gov/PORTAL/datasets/cp/CHAS-data-dictionary-18-22.xlsx ; landing page https://www.huduser.gov/portal/datasets/cp.html | 2018–2022 (released Dec 2025) | Public domain | `chas-cost-burden`; need pillar |
| FY2026 income limits (HUD) | https://www.huduser.gov/portal/datasets/il/il26/Section8-FY26.xlsx (Pittsburgh HMFA, fips 4200399999; MFI $110,400); also the HUD USER API https://www.huduser.gov/hudapi/public/il/data/METRO38300M38300 | FY2026 | Public domain | `hud_fy2026_pittsburgh.json` (affordability context) |
| FY2026 Fair Market Rents and Small Area FMRs (HUD) | https://www.huduser.gov/portal/datasets/fmr/fmr2026/FY26_FMRs_revised.xlsx ; https://www.huduser.gov/portal/datasets/fmr/fmr2026/fy2026_safmrs_revised.xlsx (393 ZIPs) | FY2026 | Public domain | `pittsburgh_safmr_fy2026.csv` |
| Designated mandatory Small Area FMR areas (HUD) | https://www.huduser.gov/portal/datasets/fmr/fmr2025/designated-safmr-areas.pdf (Pittsburgh HMFA designated 2016, implemented 4/1/2018) | Aug 2024 list | Public domain | Methodology note (vouchers use ZIP-level SAFMRs) |
| FY2026 Multifamily Tax Subsidy Project (LIHTC) income limits (HUD) | https://www.huduser.gov/portal/datasets/mtsp/mtsp26/MTSP-Data-FY26.xlsx ; https://www.huduser.gov/portal/datasets/mtsp.html | FY2026 | Public domain | `hud_fy2026_pittsburgh.json` |
| Location Affordability Index v3 (HUD / DOT) | `HUD/Location_Affordability_Index_v3/FeatureServer/0` + methodology https://files.hudexchange.info/resources/documents/Location-Affordability-Index-Version-3-Data-and-Methodology.pdf (Table 11 household profiles); https://www.hudexchange.info/programs/location-affordability-index/ ; https://hudgis-hud.opendata.arcgis.com/datasets/HUD::location-affordability-index-v-3/about | 2012–2016 ACS inputs; 2010 tracts | Public domain | `location-affordability` (VMT, housing + transportation cost); pillar indicators |
| Qualified Census Tracts 2026, Difficult Development Areas 2026, Opportunity Zones (HUD) | `HUD/QUALIFIED_CENSUS_TRACTS_2026/FeatureServer/0`; `HUD/Difficult_Development_Areas_2026/FeatureServer/0`; `HUD/Opportunity_Zones/FeatureServer/13`; landing https://www.huduser.gov/portal/datasets/qct.html | 2026 (OZ 2018 designations) | Public domain | `designation-areas` |
| LIHTC properties (HUD) | `HUD/LIHTC/FeatureServer/0`; https://www.huduser.gov/portal/datasets/lihtc/property.html | data edited 2024-12-09 | Public domain | `subsidized-housing`; senior housing |
| Public Housing Buildings and Developments (HUD) | `HUD/Public_Housing_Buildings/FeatureServer/0`; `HUD/Public_Housing_Developments/FeatureServer/0` | edited 2026-07-21 | Public domain | `subsidized-housing`; senior housing (HACP units) |
| Multifamily Properties – Assisted; Section 202; Section 811 (HUD) | `HUD/MULTIFAMILY_PROPERTIES_ASSISTED/FeatureServer/0`; `HUD/HUD_Section_202_Properties/FeatureServer/0`; `HUD/Section_811_Properties/FeatureServer/21` | edited 2026-07-21 | Public domain | `subsidized-housing` (incl. HAP contract expirations); `senior-supportive-housing` |
| Housing Choice Vouchers by tract (HUD) | `HUD/Housing_Choice_Vouchers_by_Tract/FeatureServer/0` | edited 2026-07-21 | Public domain | `housing-vouchers` |
| Housing Authority of the City of Pittsburgh communities (HACP) | https://hacp.org/housing/communities/ (16 senior communities) | read 2026-09-26 | Web page | `senior-supportive-housing` |
| Low-Income Energy Affordability Data (LEAD) Tool, 2022 (U.S. DOE) | https://data.openei.org/files/6219/PA-2022-LEAD-data.zip (file "PA AMI Census Tracts 2022.csv"); DOI 10.25984/2504170; units per Scheier & Kittner, Nature Communications 2022 | ACS 2022 basis | CC BY 4.0 | Pillar energy-burden indicator |
| Eviction Tracking System, Pittsburgh (Princeton Eviction Lab; filings collected by Legal Services Corporation with CMU CREATE Lab) | https://eviction-lab-data-downloads.s3.amazonaws.com/ets/all_sites_monthly_2020_2021.csv (Pittsburgh rows run 01/2020–12/2025, ZIP level); pages https://evictionlab.org/eviction-tracking/pittsburgh-pa/ , https://evictionlab.org/eviction-tracking/get-the-data/ | 2025 filings | Eviction Lab terms | `evictions` (ZIP); pillar displacement indicator |
| Market Value Analysis 2021 and Displacement Risk Ratio 2021 (Reinvestment Fund for URA / Allegheny County, via WPRDC) | https://data.wprdc.org/dataset/market-value-analysis-2021 (package `f669d677-c9e2-4d2f-b16f-c9ab5a4f3d10`) — MVA GeoJSON `.../resource/ec09f5ad-f43e-4f06-af3a-65641c2818dc/download/mva.geojson`; DRR shapefile `.../resource/3a648531-15d7-4fc0-aba0-611968b92435/download/pitts_allegheny_drr2021.zip`; dictionary `.../resource/45fe19b5-26bd-455e-aae7-c4b99f30946d/...` | 2017–2019 sales; 2014–2020 DRR | CC0 | `market-mva`; demand and displacement indicators |
| Property sale transactions (Allegheny County, via WPRDC) | Resource `5bbe6c55-bce6-4edb-9d04-68edeb6bf7b1`, https://data.wprdc.org/datastore/dump/5bbe6c55-bce6-4edb-9d04-68edeb6bf7b1 (503,747 rows; filtered to `VALID SALE`, dwellings, ≥ $10,000) | 2012–Sept 2026 | CC0 | `market-zip` (median sale price); `allegheny_tract_sales_2019_2025.csv`; demand pillar turnover |
| Zillow Observed Rent Index, ZIP (Zillow Research) | https://www.zillow.com/research/data/ ; ZORI https://files.zillowstatic.com/research/public_csvs/zori/Zip_zori_uc_sfrcondomfr_sm_month.csv (55 Allegheny ZIPs, Aug 2026); ZHVI https://files.zillowstatic.com/research/public_csvs/zhvi/Zip_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv | monthly through 2026-08-31 | Zillow Research terms | `market-zip`; demand pillar rent growth |
| USPS vacant addresses by tract (HUD/USPS, via WPRDC) | https://data.wprdc.org/datastore/dump/70dd02d2-137d-43c9-b158-f7b1ec6c6d42 (2023-Q4 used) | 2023 | CC0 | `usps-vacancy`; demand pillar |

### 2.5 Land, ownership and property condition

| Dataset (publisher) | Source / endpoint | Vintage | License | Used in |
|---|---|---|---|---|
| Property assessments (Allegheny County Office of Property Assessments, via WPRDC) | https://data.wprdc.org/dataset/property-assessments (API resource `65855e14-549e-4992-b5be-d629afc676fa`; bulk CSV resource `9a1c60bd-f9f7-4aba-aeb7-af8c3aaa44e5`) | as of 2026-09-01 | CC0 | `vacant-lots` (75,982 vacant-land parcels); dwelling filter for tract sales |
| USPS-vacant parcels `Vacant_USPS_Feb_24` (City of Pittsburgh) | `CITY/Vacant_USPS_Feb_24/FeatureServer/0` (4,686 parcels), joined to `ParcelsPublic` addresses | Feb 2024 snapshot; edited 2026-05-28 | City open data | `vacant-buildings` |
| City-owned property (City of Pittsburgh, via WPRDC) | https://data.wprdc.org/dataset/city-owned-properties (resource `e1dcee82-9179-4306-8167-5891915b62a7`, 12,477 parcels) | updated daily (2026-09-26) | CC BY | `city-owned-land` |
| City and school property tax delinquency (City of Pittsburgh, via WPRDC) | https://data.wprdc.org/dataset/city-of-pittsburgh-property-tax-delinquency (resource `ed0d1550-c300-4114-865c-82dc7c23235b`) | 2026-09-24 | CC BY | `tax-delinquent` |
| Treasurer sales (City of Pittsburgh, via WPRDC) | https://data.wprdc.org/dataset/city-treasury-sales (resource `6b2aa631-26e0-4d02-abe0-7fb87707210c`, 96 parcels) | 2026-09-24 | Not specified | `treasury-sales` |
| Condemned and dead-end properties (City of Pittsburgh PLI, via WPRDC) | https://data.wprdc.org/dataset/condemned-properties (resource `0a963f26-eb4b-4325-bbbc-3ddf6a871410`, 3,569) | daily | CC BY | `condemned-properties` |
| PLI / DOMI / ES code violations (City of Pittsburgh, via WPRDC) | https://data.wprdc.org/dataset/pittsburgh-pli-violations-report (resource `70c06278-92c5-4040-ab28-17671866f81c`; last 24 months aggregated per block group) | daily | CC0 | `code-violations` |
| County real estate tax delinquency; mortgage foreclosure filings (Allegheny County, via WPRDC) | https://data.wprdc.org/dataset/delinquent-real-estate-taxes (resources `b81a8a22-…` 2025, `96e9d6b2-…` cumulative); https://data.wprdc.org/dataset/allegheny-county-mortgage-foreclosure-records (`859bccfd-0e12-4161-a348-313d734f25fd`) | 2026-09 | CC0 | Researched and handed off; not on the map (need a parcel-centroid join) |

### 2.6 Population, demand and jobs

| Dataset (publisher) | Source / endpoint | Vintage | License | Used in |
|---|---|---|---|---|
| 2020 Census redistricting data, PL 94-171, Pennsylvania (U.S. Census Bureau) | https://www2.census.gov/programs-surveys/decennial/2020/data/01-Redistricting_File--PL_94-171/Pennsylvania/pa2020.pl.zip (H1 occupied units, P1 population; tract level) | April 2020 | Public domain | Pillar household-growth indicator (`allegheny_tract_household_growth_2020_2024.csv`) |
| LEHD Origin-Destination Employment Statistics, LODES8 (U.S. Census Bureau) | WAC https://lehd.ces.census.gov/data/lodes/LODES8/pa/wac/pa_wac_S000_JT00_2023.csv.gz and `..._2019.csv.gz`; RAC `.../pa/rac/pa_rac_S000_JT00_2023.csv.gz`; OD `.../pa/od/pa_od_main_JT00_2023.csv.gz` and `pa_od_aux_JT00_2023.csv.gz`; crosswalk `.../pa/pa_xwalk.csv.gz` | 2019 and 2023 | Public domain | `jobs`; demand pillar job growth (`allegheny_jobs_demand_bg_2023.csv`) |
| Quarterly Census of Employment and Wages, Allegheny County (BLS) | https://data.bls.gov/cew/data/api/2025/4/area/42003.csv (and 2026/1) | 2025 Q4 | Public domain | Context statistic (county jobs and wages) |
| New residential construction permits (City of Pittsburgh PLI, via WPRDC) | https://data.wprdc.org/dataset/pli-permits (resource `f4d1177a-f597-4c32-8cbf-7885f56253f6`, 65,378 permits, 2019-06 → 2026-09) | daily | CC BY | `permits-activity`; `pgh_new_residential_permits_classified.csv` (keyword-classified housing type; demand-pillar new-construction indicator, labeled an assumption); raw rows in `pgh_new_construction_permits_raw.csv` |

### 2.7 Equity and opportunity

| Dataset (publisher) | Source / endpoint | Vintage | License | Used in |
|---|---|---|---|---|
| Social Vulnerability Index 2022 (CDC / ATSDR) | https://services3.arcgis.com/ZvidGQkLaDJxRSJ2/arcgis/rest/services/CDC_ATSDR_Social_Vulnerability_Index_2022_USA/FeatureServer/2 (394 tracts); https://www.atsdr.cdc.gov/place-health/php/svi/index.html | 2022 | Public domain | `equity` |
| Child Opportunity Index 3.0 (diversitydatakids.org, via a third-party ArcGIS mirror) | https://services7.arcgis.com/s3vGpGobX9nzlLH3/arcgis/rest/services/coi3_20_2021_shp3/FeatureServer/0 (392 tracts) | 2021 data year | diversitydatakids terms | `equity` |
| The Opportunity Atlas (Opportunity Insights / U.S. Census Bureau) | https://opportunityinsights.org/wp-content/uploads/2018/10/tract_outcomes_simple.csv ; 2010→2020 tract crosswalk https://opportunityinsights.org/wp-content/uploads/2021/05/us_tract_2010_2020_crosswalk.csv ; https://opportunityinsights.org/data/ | 1978–83 birth cohorts; 2010 tracts | Public | `opportunity-atlas` |
| HOLC 1937 residential security map, Pittsburgh (Mapping Inequality, University of Richmond; via WPRDC) | https://data.wprdc.org/dataset/904294e5-ba3f-47f0-9e68-e7ede3ba6b33/resource/9f67567a-a4d8-455f-804e-d22db49318a0/download/holc-simplified.geojson (full-detail version: resource `e17b6d76-4060-4691-be66-2edc367d87b8`, papittsburgh1937.geojson); https://dsl.richmond.edu/panorama/redlining/ | 1937 | CC BY-SA | `holc-1937` |
| Food Access Research Atlas 2025 (USDA ERS) | https://gisportal.ers.usda.gov/server/rest/services/FARA/FARA_2025_StraightLine/MapServer/5 (394 tracts; 32 low-income / low-access); https://www.ers.usda.gov/data-products/food-access-research-atlas | 2025 edition | Public domain | `food-access` |
| National Walkability Index (U.S. EPA, Smart Location Database) | https://geodata.epa.gov/arcgis/rest/services/OA/WalkabilityIndex/MapServer/0 (1,100 block groups); https://www.epa.gov/smartgrowth/smart-location-mapping | ~2019 inputs | Public domain | `walkability` |
| Census college enrollment and group quarters (ACS B14007, B26001) | Census Reporter, as in §2.4 | ACS 2020–2024 | Public domain | Pillar student-household adjustment (`allegheny_tract_college_enrollment.csv`) |

### 2.8 Health and health care

| Dataset (publisher) | Source / endpoint | Vintage | License | Used in |
|---|---|---|---|---|
| PLACES: census tract estimates, 2024 release (CDC) | https://data.cdc.gov/resource/k9zj-b28y.json?countyfips=42003 (382 tracts); https://www.cdc.gov/places/ | 2024 release | Public domain | `health-outcomes` |
| U.S. Small-Area Life Expectancy Estimates, USALEEP (CDC / NCHS) | https://ftp.cdc.gov/pub/Health_Statistics/NCHS/Datasets/NVSS/USALEEP/CSV/PA_A.CSV (357 Allegheny tracts); https://www.cdc.gov/nchs/nvss/usaleep/usaleep.html | 2010–2015 | Public domain | `life-expectancy` |
| Health Professional Shortage Areas: primary care, dental, mental health (HRSA) | https://gisportal.hrsa.gov/server/rest/services/Shortage/HealthProfessionalShortageAreas_FS/MapServer (layers 2, 6, 10, 11); https://data.hrsa.gov/topics/health-workforce/shortage-areas ; bulk file https://data.hrsa.gov/DataDownload/DD_Files/BCD_HPSA_FCT_DET_PC.csv | updated daily | Public domain | `health-shortage-areas` (7 areas) |
| Health center service delivery and look-alike sites (HRSA) | https://data.hrsa.gov/DataDownload/DD_Files/Health_Center_Service_Delivery_and_LookAlike_Sites.csv (35 active Allegheny sites); download page https://data.hrsa.gov/data/download | 2026-09-26 | Public domain | `places-health-centers`; access pillar |
| Hospital General Information, star ratings and ER flag (CMS Care Compare) | https://data.cms.gov/provider-data/api/1/datastore/query/xubh-q36u/0 (18 Allegheny hospitals) | dataset modified 2026-07-22 | Public domain | `places-hospitals` (CMS rating, emergency flag) |
| Licensed hospitals (PA Department of Health, via PASDA) | `PASDA_DOH/6` ("DOH Hospitals 202511", 26 in Allegheny) | Nov 2025 | PA public data | `places-hospitals` |
| Licensed drug and alcohol treatment facilities (PA DOH, via PASDA) | `PASDA_DOH/3` ("202512", 70 in Allegheny) | Dec 2025 | PA public data | `places-treatment` |
| Nursing homes (PA DOH, via PASDA and data.pa.gov) | `PASDA_DOH/12` ("202609", 52 in Allegheny); https://data.pa.gov/resource/xgn8-z9eg.json | Sept 2026 | PA public data | `places-nursing-homes`; `senior-supportive-housing` |
| Nursing home provider information, certified beds (CMS) | https://data.cms.gov/provider-data/api/1/datastore/query/4pq5-n9py/0 (state = PA) | modified 2026-08-01 | Public domain | `senior-supportive-housing` |
| NPPES NPI Registry: pharmacies and clinics (CMS) | https://npiregistry.cms.hhs.gov/api/?version=2.1 (organization NPIs; Pharmacy taxonomies; Urgent Care, FQHC, Primary Care and Community Health clinic taxonomies; 112 Allegheny ZIPs) | live, 2026-09-26 | Public domain | `places-pharmacies` (275; Rite Aid removed), `places-clinics` (69); access pillar |
| Elevated blood lead level rates (Allegheny County Health Dept, via WPRDC) | https://data.wprdc.org/dataset/allegheny-county-elevated-blood-lead-level-rates (tract resource `8432f1ad-c5bf-447f-b34b-160d8ee063b6`; 2015–20 column only; neighborhood resource `4e215bd5-7e83-4cd2-ae48-4de5dc29910c`; Lead Data Guide `a8f69277-6328-4421-a508-8b2100d753e3`); ACHD testing page https://www.alleghenycounty.us/Services/Health-Department/Lead-Exposure-Prevention/Blood-Lead-Level-Testing | 2015–2020 | CC0 | `child-blood-lead` |

### 2.9 Public safety

| Dataset (publisher) | Source / endpoint | Vintage | License | Used in |
|---|---|---|---|---|
| Police incident blotter, UCR-coded archive (Pittsburgh Bureau of Police, via WPRDC) | https://data.wprdc.org/dataset/uniform-crime-reporting-data (resource `044f2016-1dfd-4ab0-bc1e-065da05fca2e`, 340,996 incidents; last 3 years to 2023-11) | ends Nov 2023 | CC BY | `safety` (violent / property per 1,000, City tracts) |
| Homicide incidents 2007–2022 and 2024 (Allegheny County, Medical Examiner locations) | `COUNTY/AC_Homicide_Incidents_2007_2022/FeatureServer/2`; `COUNTY/2024_Homicides_in_Allegheny_County/FeatureServer/59` (victim fields dropped; aggregated per tract) | 2007–2022, 2024 | Not stated | `safety` (homicides per 10k) |
| PennDOT crashes | See §2.3 | 2023–2025 | CC0 | `serious-crashes` |

### 2.10 Places and everyday services (points)

| Dataset (publisher) | Source / endpoint | Vintage | License | Used in |
|---|---|---|---|---|
| SNAP-authorized retailers (USDA Food and Nutrition Service) | https://services1.arcgis.com/RLQu0rK7h4kbsBq5/arcgis/rest/services/snap_retailer_location_data/FeatureServer/0 (839 in Allegheny) | edited 2026-09-17 | Public domain | `places-groceries` (329), `places-food-other` (1,257); access pillar |
| Geocoded food facilities and inspection history (Allegheny County Health Dept, via WPRDC) | Facilities resource `112a3821-334d-4f3f-ab40-4de1220b1a0a` (https://data.wprdc.org/datastore/dump/112a3821-334d-4f3f-ab40-4de1220b1a0a); inspections 2014–2025 resource `4ea730d8-2bf9-4783-b0a5-b41ed687097e`; package https://data.wprdc.org/dataset/allegheny-county-restaurant-food-facility-inspection-violations | as of 2025 (inspections to 2025-07-31) | CC0 | Grocery merge (stale-record filter); `commerce-density` |
| Allegheny County Assets (WPRDC aggregator) | https://data.wprdc.org/dataset/allegheny-county-assets (resource `5c7825d2-6814-40c7-aefe-3d0f3d6f22e7`, 32,001 assets; sources mostly 2017–2020) | modified 2026-09-21 | CC0 | `places-senior-centers`; merged into post offices, laundromats, dentists, community centers |
| OpenStreetMap amenities via the Overpass API | https://overpass-api.de/api/interpreter and https://overpass.kumi.systems/api/interpreter (4 tiles, clipped to the county; 2,329 features) | OSM data as of 2026-05-31 | ODbL | Post offices, laundromats, dentists, community centers, police and EMS additions, fire-station cross-check |
| Bank branches (FDIC BankFind) | https://api.fdic.gov/banks/locations (364 Allegheny branches) | index built 2026-09-25 | Public domain | `places-banks` |
| Food assistance programs (Greater Pittsburgh Community Food Bank; hosted by PRT) | https://services3.arcgis.com/544gNI3xxlFIWuTc/arcgis/rest/services/Food_Banks__Greater_Pittsburgh_Community_Food_Bank_/FeatureServer/8 (163 sites) | April 2025 | Not stated | `places-food-banks`; access pillar |
| Farmers markets (Allegheny County, via WPRDC) | https://data.wprdc.org/dataset/allegheny-county-farmers-markets-locations (resource `0d99978a-ccf6-4315-af5a-a95acec87a9f`, 69) | 2026-08-01 | CC0 | `places-farmers-markets` |
| Child care providers (PA Department of Human Services, data.pa.gov) | https://data.pa.gov/resource/ajn5-kaxt.json?facility_county=Allegheny (718 providers) | updated daily | Public | `places-child-care`; access pillar |
| Allegheny County Schools (Allegheny County GIS) | `COUNTY/Allegheny_County_Schools/FeatureServer/0` (411) | edited 2026-03-27 | Not stated | `places-schools`; access pillar |
| Future Ready PA Index 2024–25 (PA Department of Education) | School Fast Facts https://futurereadypa.org/home/getdatafile?id=58 ; performance https://futurereadypa.org/home/getdatafile?id=60 ; glossary https://futurereadypa.org/home/Glossary | 2024–25 | Public | `school-quality` (275 schools) |
| Postsecondary school locations (NCES EDGE) | https://nces.ed.gov/opengis/rest/services/Postsecondary_School_Locations/EDGE_GEOCODE_POSTSECONDARYSCH_2324/MapServer/0 (37); https://nces.ed.gov/programs/edge/Geographic/SchoolLocations | 2023–24 | Public domain | `places-colleges` |
| Libraries (Allegheny County GIS) | `COUNTY/Libraries/FeatureServer/0` (72) | edited 2024-12-04 | Not stated | `places-libraries`; access pillar |
| Municipal police departments; designated EMS agencies; fire departments; magisterial district court offices (ConnectGovs) | `CG/Police_Departments_Allegheny_County/FeatureServer/0`; `CG/EMS_Departments_Allegheny_County/FeatureServer/0`; `CG/Fire_Departments_Allegheny_County/FeatureServer/0`; `CG/Magisterial_District_Judges_Office_Locations/FeatureServer/0` | 2023-12 to 2024-02 | Not stated | `places-police` (122), `places-ems` (58), `places-fire` (252), `places-courts` (46) |
| City fire stations and EMS medic stations (City of Pittsburgh) | `CITY/Fire_Station/FeatureServer/0`; `CITY/EMS_Station/FeatureServer/0` | 2024-05 | City open data | `places-fire`, `places-ems` |
| Pennsylvania State Police stations (PSP, via PASDA) | https://mapservices.pasda.psu.edu/server/rest/services/pasda/PennsylvaniaStatePolice/MapServer/1 | March 2025 | PA public data | `places-police` |
| Parks, county parks, greenways (Allegheny County GIS) | `COUNTY/Allegheny_County_Municipal_Parks_New/FeatureServer/0` (752); `COUNTY/ParkBoundaries/FeatureServer/0` (10); `COUNTY/Allegheny_County_Greenways_New/FeatureServer/0` (13) | 2026-04-08 | Not stated | `parks`; access pillar |
| Regional trails (Allegheny County planning) | `COUNTY/Regional_Trails_(PUBLIC)/FeatureServer/0` (3,193 segments) | 2025-01-02 | Not stated | `trails` |
| City playgrounds (City of Pittsburgh, via WPRDC) | https://data.wprdc.org/dataset/playgrounds (resource `47350364-44a8-4d15-b6e0-5f79ddff9367`, 125) | 2022-12 | CC BY | `places-playgrounds` |
| Citiparks pools and recreation centers (City of Pittsburgh) | `CITY/Citipark_Facilities/FeatureServer/1` (rec centers), `/2` (pools) | 2022–2026 | City open data | `places-citiparks` |
| Registered Community Organizations (City of Pittsburgh) | `CITY/PGHWebRCO/FeatureServer/0` (45; contact fields dropped) | edited 2026-08-05 | City open data | `rcos` |

### 2.11 Zoning, legal feasibility and approvals

| Dataset (publisher) | Source / endpoint | Vintage | License | Used in |
|---|---|---|---|---|
| Pittsburgh Zoning Code, Title Nine, incl. §911.02 use table (City of Pittsburgh, published by General Code eCode360) | https://ecode360.com/45476524 (§911.02); print views `https://ecode360.com/print/PI6865?guid=` 45475424 (Art. IV), 45476514 (Art. V), 45479638 (Art. IX); TOC https://ecode360.com/45474054 and https://ecode360.com/PI6865 ; other sections read directly (e.g. https://ecode360.com/45479650 , https://ecode360.com/45479719 , https://ecode360.com/45609156); SP-10 Appendix PDF (eCode360 attachment 336977) | legislation through 2026-09-16 | Code of record | `typology-district-matrix.csv`, `special-district-residential-permissions.csv`, `use-definitions.csv`; `legal-pathway-plan`, `residential-zoning` layers; pillar legal multiplier |
| Zoning Code use classifications handout (City DCP) | https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/5990_zoning_code_use_classifications_handout.pdf | – | City document | Use-size thresholds for senior and care housing |
| Zoning overlays and historic districts (City of Pittsburgh) | `CITY/InclusionaryHousingOverlayDistrict/FeatureServer/0`, `CITY/PGHWebParkingReductionOverlay/FeatureServer/0`, `CITY/PGHWebMajorTransitBuffer/FeatureServer/0`, `CITY/Multi_Unit_Zoning_Districts/FeatureServer/0`, `CITY/PGHWebCHDHistoricDistricts/FeatureServer/0`, `CITY/PGHWebZoningOverlays/FeatureServer/0` | 2026 | City open data | `city-zoning-overlays` (608 features) |
| Suburban municipal zoning (each municipality's GIS; several listed in PRT's registry) | Penn Hills https://services5.arcgis.com/DllnbBENKfts6TQD/arcgis/rest/services/Zoning/FeatureServer/1 · Bethel Park https://services7.arcgis.com/ptmAvweveinujaUS/arcgis/rest/services/Public_View___Zoning_and_Parcels_and_Addresses/FeatureServer/4 · Monroeville https://services9.arcgis.com/8FOQ9nDvQJjqML1o/arcgis/rest/services/Monroeville_Zoning_view/FeatureServer/0 · Mt. Lebanon https://services8.arcgis.com/4sXEsxQJTWBlSKA1/arcgis/rest/services/BasemapFeatureService_ReadOnl/FeatureServer/9 · Whitehall https://services8.arcgis.com/A3O49kUB98Moka4Y/arcgis/rest/services/MasterFeatureService_ReadOnlyView/FeatureServer/24 · Upper St. Clair https://services6.arcgis.com/XgADIppb49xTX0al/arcgis/rest/services/MasterFeatureService_ReadOnlyView/FeatureServer/35 · Dormont https://services6.arcgis.com/pIIoxuHIRX225O2N/arcgis/rest/services/MasterFeatureService_PublicView/FeatureServer/7 · Moon https://services8.arcgis.com/g8yM34Z7IOCI3L3m/arcgis/rest/services/Zoning/FeatureServer/2 · McCandless https://services1.arcgis.com/q8sarOko6mCDwiGm/arcgis/rest/services/McCandless_Zoning/FeatureServer/1 | 2026 | Not stated (municipal) | `suburban-zoning` (5,872 polygons) |
| Zoning Board of Adjustment decisions (City of Pittsburgh DCP) | Decision PDFs under https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/ (1,362 PDF links), found via the Wayback Machine CDX API https://web.archive.org/cdx/search/cdx?url=pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/ and the archived ZBA page (253 links); agenda page https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/ZBA-Agendas ; board page https://www.pittsburghpa.gov/City-Government/Boards-Commissions/Zoning-Board-of-Adjustment | 2023–Aug 2026 (476 decisions) | Public records | `zba-decisions` layer and outcome tables |
| City Council land-use matters (Pittsburgh City Council, Legistar) | Legistar Web API https://webapi.legistar.com/v1/pittsburgh/matters (284 matters, 2000–2026-09-26); https://pittsburgh.legistar.com/ ; attachments on pittsburgh.legistar1.com | 2000–2026 | Public records | `council-land-use-actions` (183 geocoded) |
| Planning Commission minutes 2020–2025 (City DCP) | https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/minutes-2020-21-22-23-24-25untilnov/ (one PDF per year) | 2020–2025 | Public records | `planning-commission-actions-parsed.csv` |
| OneStopPGH permit records `OSPI_H` (City of Pittsburgh) | https://pghbridgis.pittsburghpa.gov/hosting/rest/services/Hosted/OSPI_H/FeatureServer/0 | pulled 2026-09-26 | City data | `permits-by-type` (1,088 new-housing permits, days to issue) |
| Development & Construction Projects v2 (City of Pittsburgh; legacy, stale) | `CITY/Development_Construction_Projects_v2/FeatureServer/0` | 2020–2023 (edited 2023-09-11) | City open data | `permits-by-type` (144 legacy records) |
| Allegheny County parcels MapServer (Allegheny County GIS) | https://gisdata.alleghenycounty.us/arcgis/rest/services/OPENDATA/Parcels/MapServer/0 | current | County data | Parcel matching for Council actions |
| PA DHS Human Services Provider Directory; Licensed Personal Care Homes (PA DHS) | https://www.humanservices.dhs.pa.gov/HUMAN_SERVICE_PROVIDER_DIRECTORY/ (Office of Long-Term Living, Allegheny); https://data.pa.gov/resource/pqf4-d4xn.json | 2026-09-22 | Public | `senior-supportive-housing`; `care-facility-spacing` (800 ft rule) |

### 2.12 Live cameras

`cameras.geojson` holds 244 live feeds and `alpr-cameras.geojson` holds 956 ALPR points (branch `lance-flock`). They are rebuilt by `apps/web/scripts/data/cameras.ts`, which is wired into `build-all.ts` and fetches 511PA and PA Turnpike live. Each feed carries name, operator, category, feed_type (jpeg/hls/youtube/iframe), feed_url, page_url, refresh_s, attribution and coord_quality.

| Camera network (operator) | Source | License / terms | Used in |
|---|---|---|---|
| 511PA traffic cameras (PennDOT) | https://www.511pa.com/cctv (still images, ~10 s refresh); camera list from the site's data endpoint https://www.511pa.com/List/GetData/Cameras (DataTables query parameter, 100 rows per page), which yields 210 PennDOT stills (image `/map/Cctv/<id>`, ~60 s) plus 8 PA Turnpike HLS feeds; video URLs via https://www.511pa.com/Camera/GetVideoUrl (PennDOT streams on pa-se1.arcadis-ivds.com returned 401, so stills are used) | 511PA terms | `cameras` |
| PA Turnpike traffic cameras (Pennsylvania Turnpike Commission) | https://www.paturnpike.com/traveling/traffic-cameras ; roadway API https://www.paturnpike.com/traveling/traffic-cameras/getroadways and `/getbyroadway?roadwayId=` (needs header `X-Requested-With: XMLHttpRequest`; in-county roadways I-76 `ef2829cb-fea1-4083-af4c-9bfbd85b8568` and PA-576 `2e8b2a93-1f81-4fed-8919-58b33b638eb8`; CloudFront streams are Referer-gated) (HLS streams on CloudFront, played through the app's same-origin proxy) | PA Turnpike terms | `cameras` |
| USGS HIVIS river cameras (USGS) | camera registry https://api.waterdata.usgs.gov/nims/v0/cameras?enabled=true (needs an `api-key` header; the public key embedded in the HIVIS web app is used and isn't reproduced here); 2 cameras in Allegheny; https://apps.usgs.gov/hivis/camera/PA_Monongahela_R_at_Point_State_Park_at_Pittsburgh ; https://apps.usgs.gov/hivis/camera/PA_Pine_Creek_at_Grant_Avenue_at_Etna (images `https://usgs-nims-images.s3.amazonaws.com/720/<camId>/<camId>_newest.jpg`) | Public domain | `cameras` |
| Breathe Cam industrial smoke cameras (CMU CREATE Lab) | https://breathecam.org/ ; list https://breathecam.org/cameras.json ; embedded as `https://breathecam.org/#s=<id>` (braddock2, westmifflin2, accan2, cementcam) | CREATE Lab terms | `cameras` |
| WeatherSTEM Allegheny sky cameras (WeatherSTEM) | https://allegheny.weatherstem.com/heinzfield ; https://allegheny.weatherstem.com/falk (station list https://allegheny.weatherstem.com/stations ; snapshots `https://images.weatherstem.com/skycamera/allegheny/<handle>/cumulus/snapshot.jpg`; the `pitt` camera has been frozen since 2024 and is excluded) | WeatherSTEM terms | `cameras` |
| EarthCam: Pittsburgh (Troy Hill) and The Andy Warhol Museum FigmentCam / ChurchCam | https://www.earthcam.com/usa/pennsylvania/pittsburgh/?cam=pittsburgh ; https://www.warhol.org/andy-warhols-life/figment/ ; https://www.earthcam.com/usa/pennsylvania/pittsburgh/warhol/?cam=warhol_churchcam | EarthCam terms; re-streaming is forbidden, so the pages are embedded as sandboxed iframes | `cameras` |
| PixCams bald eagle and red-tailed hawk nest cams (U. S. Steel, Duquesne Light; YouTube embeds) | https://pixcams.com/uss-eagles/ and related pages; 7 YouTube live embeds: U. S. Steel eagles `2CP8QA_xKx4`, `9njkml1oQRQ`, `uxzRXhKshow`, `a83Y5shllLg`, `dDIfhPXn_-c`; hawk `jUS-CaVPNYU`; Hays eagle `yPq9aNukckQ` | Owner terms | `cameras` |
| Pittsburgh Zoo & Aquarium penguin and cheetah cams (Ozolio) | https://www.pittsburghzoo.org/animals/webcams-online-activities/penguin-webcam/ ; `.../cheetah-webcam/` (Ozolio embeds `EMB_QVKU00000674` penguin, `EMB_ODOJ00000679` cheetah) | Owner terms | `cameras` |
| Discover the Burgh North Side skyline cam (Nest) | https://www.discovertheburgh.com/pittsburgh-skyline/ | Owner terms | `cameras` |
| PPG Place plaza cam | https://www.ppgplace.com/webcam/ ; StarDot image http://96.69.79.178/image.jpg (HTTP, served through the app proxy) | Owner terms | `cameras` |
| W3SLL personal weather station cam (Squirrel Hill) | http://wx.w3sll.net/weewx/ ; image http://wx.w3sll.net/weewx/image.jpg (HTTP, served through the app proxy) | Owner terms | `cameras` |
| Camp Guyasuta cam (WeatherBug, via the Webcam Galore cache) | https://www.webcamgalore.com/webcam/USA-Pennsylvania-Sharpsburg/24760.html ; image https://images.webcamgalore.com/24760-current-webcam-Sharpsburg-Pennsylvania.jpg (~30 min refresh) | Owner terms | `cameras` |
| Automatic license plate reader locations (OpenStreetMap contributors, incl. DeFlock mapping) | Overpass extract saved as `inputs/cameras/alpr.json` (956 OSM features; ~225 Flock Safety). Query: `nwr["man_made"="surveillance"]` and `nwr["surveillance:type"]` in bbox 40.19,-80.37,40.68,-79.68, `out center tags`, clipped to the TIGERweb county polygon (GEOID 42003). Tags carry manufacturer, operator and direction; https://deflock.me | ODbL | `alpr-cameras` (locations only, no feeds) |

Duplicate trap (verified): the Windy and Weather Underground "Pittsburgh webcams" are all re-hosted PennDOT cameras, so they are skipped. PennDOT HLS video returns 401, so only stills are used. National Aviary falcon cams are seasonal or offline and aren't included.

---

## 6. AI models and runtime services

| Service (provider) | How it is used | Endpoint |
|---|---|---|
| Jev ("TypeSafe") decision model, served through OpenRouter | Site-fit scores per housing type (with confidence) shown in the typology panel and cited by the chat companion; outputs are labeled "assumption", not evidence | https://openrouter.ai/api (model set by the `SYSTEM_ONE_MODEL` environment variable). About Jev: https://typesafe.ai/blog/introducing-system-one-models-and-jev ; https://dev.to/valyuai/how-to-use-jev-a-practical-guide-to-typesafes-system-one-model-g5e ; press: https://www.marktechpost.com/2026/09/19/typesafe-ai-releases-jev , https://www.tomshardware.com/tech-industry/artificial-intelligence/typesafe-ais-jev-offers-an-alternative-to-llms-that-claims-to-be-193x-faster-and-44 |
| Google Gemini API | Chat companion (tool calling over the scoring model) and read-aloud voice | https://generativelanguage.googleapis.com/v1beta/models |
| Neon Postgres + PostGIS | Hosts the ~585k county parcels for viewport queries | Neon (serverless Postgres) |
| Microsoft Planetary Computer | STAC search and pixel extraction for Landsat surface temperature | https://planetarycomputer.microsoft.com/api/stac/v1 ; `/api/data/v1` |
| Census Reporter API | ACS tables and census geometries without an API key | https://api.censusreporter.org/1.0 |
| Overpass API | OpenStreetMap extracts | https://overpass-api.de/api/interpreter ; https://overpass.kumi.systems/api/interpreter |
| Socrata catalog API | Discovering data.pa.gov and data.cdc.gov datasets | https://api.us.socrata.com/api/catalog/v1 |
| ArcGIS Online search | Discovering public feature services | https://www.arcgis.com/sharing/rest/search |

---

## 8. Researched but not used in the product

These were found, and usually probed, but are not rendered or scored. They are listed so reviewers know they were considered.

| Source | Why it isn't used |
|---|---|
| PWSA sewersheds with combined-sewer overflow volume (`PWSA/Sewersheds/FeatureServer/0`, 485 polygons) | Researched as a sewer-stress proxy; the map shows sewer lines instead |
| ALCOSAN interceptors and outfalls (`https://services8.arcgis.com/vXrmg6iOl1pzNz4z/arcgis/rest/services/ALCOSAN_Collection_Network_Assets_LOCKED_Public/FeatureServer/4`, `ALCOSAN_Outfalls_LOCKED/FeatureServer/2`) | Regional context only |
| County sewer and water authority boundaries (`COUNTY/Allegheny_Sewer`, `COUNTY/Allegheny_Water`) | Context only |
| County "2100 projections for SFHA" (`COUNTY/2100_Projections_for_SFHA_NEW/FeatureServer/0`) | Offered as an optional future-flood layer; not integrated |
| City residential lot dimensions (`CITY/Parcels_Exp_02052025_Residential_Lot_Dimensions/FeatureServer/0`) and ETHOS lot suitability (`CITY/ETHOS_Lot_Suitability/FeatureServer/0`) | Provided to the pillar work; ETHOS scores are City composites, used only as a cross-check |
| County business district streets (`CITY/Business_District_Streets/FeatureServer/0`) | Optional; not integrated |
| MSI "possible mining" zones (PA DEP `MSI_SubsidenceRiskMiningPossible`) | Only the "confirmed" zones are mapped |
| CDC PLACES social-needs measures (housing insecurity, utility shutoff, transportation) | Empty for Pennsylvania in the 2024 and 2025 releases (stated as a data gap) |
| ACHD 2021–2024 blood-lead columns | No published definition; inconsistent with ACHD's own county rate (~3.1% in 2023) |
| U.S. DOT BTS National Transportation Noise Map (`maps.bts.dot.gov`) | Service unreachable on 2026-09-26 |
| County WIC offices (`COUNTY/WICOffices`) | No usable names |
| Postal_Service_Vacant_Parcels (City; a Regrid export) | Contains owner names and mailing addresses; excluded for privacy and licensing |
| Homeless and domestic-violence shelter locations | Deliberately excluded (DV shelter locations are confidential) |
| Allegheny County DHS landlord/tenant dashboard (https://tableau.alleghenycounty.us/t/PublicSite/views/LandlordTenantCasesDashboard/Home) | Tableau view only; no downloadable tract data |
| FBI Crime Data Explorer | Needs an API key and agency-to-municipality matching |
| WPRDC air quality: monitor readings, sensor locations, forecasts, inversions, 2011 PM2.5 (https://data.wprdc.org/dataset/allegheny-county-air-quality , resource `b646336a-deb4-4075-aee4-c5d28d88c426`; https://data.wprdc.org/dataset/air-quality-forecast ; https://data.wprdc.org/dataset/temperature-inversions ; https://data.wprdc.org/dataset/particulate-matter-2-5) | Monitors too sparse to vary by parcel; forecasts aren't site characteristics; 2011 PM2.5 superseded by EJScreen |
| EPA facility points (EMEF, https://geopub.epa.gov/arcgis/rest/services/EMEF/efpoints/MapServer/5) and PA DEP eMapPA extraction (https://gis.dep.pa.gov/depgisprd/rest/services/emappa/eMapPA_External_Extraction/MapServer/20) | Probed during integration; the ACHD inventory was used instead |
| WPRDC parcel-level lead hazard file (resource `2ddfd798-b71a-4f78-bc17-8c54c6a30511`) | The map uses PWSA's newer address points instead |
| City individual historic properties (`CITY/PGHWEBCHDIndividialProperties/FeatureServer/0`) | Researched for the legal work; historic districts are mapped instead |
| City parks `PGHWebParks`, TPL ParkServe priority areas (`CITY/TPL_ParkServe_ParkPriorityAreas/FeatureServer/0`), county park hiking trails (`COUNTY/Allegheny_County_Trails/FeatureServer/0`) | County-wide park layers were used instead |
| County municipal boundaries (`COUNTY/Allegheny_County_Municipal_Boundaries/FeatureServer/0`), ConnectGovs fire districts (`CG/Allegheny_County_Fire_Districts/FeatureServer/0`) | Context only |
| City `Police_Incidents_Blotter` layer | Stale (2023); the WPRDC archive was used |
| HUD CHAS on ArcGIS (`HUD/ACS_5YR_ESTIMATES_CHAS_TRACT/FeatureServer/1`) and the 2017–21 dictionary | 2013–2017 vintage; the 2018–2022 files were used |
| Esri Landsat Level-2 ImageServer (landsat.imagery1.arcgis.com, utility.arcgis.com proxy) | Requires a token; Microsoft Planetary Computer was used instead |
| OpenFreeMap tiles (tiles.openfreemap.org) | Considered as a basemap; CARTO and OSM are used |
| Census Bureau API (api.census.gov) | Requires a key since 2026; Census Reporter was used |
| Municode (https://library.municode.com/pa/pittsburgh/codes/code_of_ordinances ; api.municode.com) | eCode360 is Pittsburgh's code of record |
| Allegheny County Housing Needs Assessment (https://www.alleghenycounty.us/Services/Housing/Housing-Needs-Assessment) | Listed in the organizer catalog; too aggregated for parcel scoring |
| CDC PLACES other releases (data.cdc.gov `yjkw-uj5s` 2025, `cwsq-ngmh`) | 2025 release has no Pennsylvania tract values; the 2024 release was used |
| Water-lead context pages cited in answers: https://www.pgh2o.com/your-water/lead-information , https://gettheleadoutpgh.org/as-an-allegheny-county-resident-is-lead-in-my-drinking-water-something-i-should-worry-about , https://www.amwater.com/paaw/water-quality/lead-and-drinking-water/service-line-material-inventory-project , https://www.alcosan.org/clean-water-plan/system-mapping | Background for the lead and sewer layers |
| Allegheny County eviction analyses: https://analytics.alleghenycounty.us/2022/10/18/eviction-cases-in-allegheny-county-2012-2019/ ; https://analytics.alleghenycounty.us/2023/03/31/landlord-tenant-cases-interactive-dashboard/ | Context; no tract-level download |
| Legal references consulted by the legal-feasibility work: PA Municipalities Planning Code (https://www.dep.state.pa.us/hosting/growingsmarter/MPCode%5B1%5D.pdf); Babst Calland, "The devil is in the details and the deemed approval deadlines" (https://www.babstcalland.com/news-article/the-devil-is-in-the-details-and-the-deemed-approval-deadlines) | Background for deemed-approval and hearing timelines |
