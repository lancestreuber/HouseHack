# Groundwork PGH: Catalog Sweep (new datasets only)

I swept the public catalogs on **2026-09-26** and hit every URL below live, unless a row says otherwise. This file lists only datasets that `data-sources.md`, `environment-infrastructure.md`, `access-amenities.md`, `zoning-rules.md` and `pro-forma.md` do **not** already cover. Where a sibling doc owns a topic, the last section points to it.

**What I swept**
- WPRDC CKAN: all **371** packages (`package_search?rows=1000`), 31 organizations and 16 groups, plus keyword searches.
- City AGOL (`YZCmUqbcsUpOKfj7`): all **977** services.
- Allegheny County AGOL (`vdNDkVykv9vEWFX4`): all **709** services, plus the county REST server `gisdata.alleghenycounty.us` (folders `EGIS`, `LandRecords`, `OPENDATA` and others).
- HUD eGIS AGOL (`VTyQ9soqVukalItT`): 299 services.
- SPC AGOL (`MV5wh5WkCMqlwISp`): 563 services.
- data.pa.gov (Socrata catalog API), the Eviction Lab S3 bucket, Zillow Research, Census BPS and NPS NRHP.

**Base aliases**
- `PGH` = `https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services`
- `ALCO` = `https://services1.arcgis.com/vdNDkVykv9vEWFX4/arcgis/rest/services`
- `HUD` = `https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services`
- `SPC` = `https://services3.arcgis.com/MV5wh5WkCMqlwISp/arcgis/rest/services`
- `WPRDC(id)` = `https://data.wprdc.org/api/3/action/datastore_search?resource_id=<id>`. The 32k page cap applies; reuse `wprdcAll()` from `data-sources.md`.

**Conventions**
- "n" is the live `returnCountOnly` or datastore `total`.
- HUD counts are for the Pittsburgh bbox (`-80.10,40.35,-79.85,40.51`) unless a row says "city".
- The city AGOL layers carry **no license string**. Attribute "City of Pittsburgh".
- HUD eGIS data is public domain.
- **Tags** say which Track 3 feature each dataset powers: **TYP** (typology fit), **DEM** (demand), **EQ** (equity/displacement), **ACC** (access), **CLI** (climate), **INF** (infrastructure), **POL** (policy simulation), **NEXT** (next steps).

---

## Top 10 hidden gems

| # | Dataset | Why it makes us stand out | Tag |
|---|---|---|---|
| 1 | **Eviction Lab ETS, Pittsburgh weekly filings by ZIP**, live through the week of **2026-09-13** | A *current* displacement-pressure signal. Nothing else in our stack is newer than 2023 for evictions. | EQ |
| 2 | **HUD Multifamily Assisted `EXPIRATION_DATE1`** plus **HUD LIHTC `YR_PIS`** | Affordability at risk of expiring. In the city, **24 Section 8/PRAC properties (1,125 assisted units) expire by 2031**, and **51 of 109 dated LIHTC projects reach Year 30 by 2031** (80 are already past Year 15). | EQ, POL |
| 3 | **City `AffordableParcels`**, the affordable-housing pipeline | 100 parcels with `Project_Status` (Pipeline 41, Under Construction 25, Closed Financing 5, Complete 29), `Affordable_Units`, `Housing_Affordability_Type` (New / Preservation) and `Residential_Type`. Shows where affordable housing is already landing. | POL, NEXT |
| 4 | **Historic review triggers**: city CHD districts (21), individual sites (157), NRHP (180 points + 60 polygons) | `zoning-rules.md` §558 says historic review "is not in our data". It is now: we can flag the HRC review ($1,350, extra months) per parcel. | POL, TYP |
| 5 | **`Parcels_Exp_02052025_Residential_Lot_Dimensions`** | 105,488 parcels with `Parcel_Width`, `Parcel_Len`, `Bldg_Width`, `Bldg_Len`. Tells us which lots are 16-ft rowhouse lots and which are 40-ft lots that can fit a fourplex or cottage court. | TYP |
| 6 | **ZBA 10-year decisions database** | 4,318 geocoded cases from 2016–2026 with `Request`, `Aggregation_Category`, `Result` (Approved 3,831 / Denied 487) and `zon_new`. Gives real variance approval odds by district and request type. | POL |
| 7 | **County tax liens with current status**, **cumulative delinquent taxes** and **Act 135 conservatorship filings** | 305,791 *unsatisfied* Pittsburgh lien records. Finds distressed parcels to acquire, and flags legacy owners at risk of losing their homes. | EQ, NEXT |
| 8 | **HCV 2026 Payment Standard Schedule by tract** (county AGOL) | Voucher rent ceilings (0–5 BR) by tract, with tier and a "CCD Opportunity" flag. Shows whether a new unit is voucher-feasible, which is the gap for the lowest-income renters. | EQ, DEM |
| 9 | **Census Building Permits Survey, Pittsburgh place, by structure type** | 2025: **75** 1-unit, **0** 2-unit, **4** 3–4-unit (1 building) and **1,905** 5+-unit (19 buildings). The "missing middle" in one row of data. | DEM, POL |
| 10 | **HUD Location Affordability Index v3** (tract) | Housing + transportation % of income and modeled VMT per household for 8 household types. Public domain, so it avoids the CNT H+T license problem. | CLI, EQ |

Runners-up:
- Short-term rentals: Airbnb 2024 (3,136 listings) and the draft `Proposed_STR_Zoning`.
- NCRC gentrification tracts (2000 → 2015–19).
- City building heights (87,831).
- 2026 accepted tax abatements (733, with program and end year).
- 2-1-1 housing and rent-help requests by ZIP.

---

## A. Displacement and equity pressure (EQ)

| Name | URL | Verified | n / size | Key fields | Updated | License |
|---|---|---|---|---|---|---|
| **Eviction Lab ETS, weekly** | `https://eviction-lab-data-downloads.s3.amazonaws.com/ets/all_sites_weekly_2020_2021.csv` | ✓ | **350 MB** (all sites). Pittsburgh has 51,246 rows over 146 ZIPs. 2025 sum ≈13,660 filings in the site area. | `city="Pittsburgh, PA"`, `type` (Zip Code), `GEOID` (ZIP), `racial_majority`, `week_date`, **`filings_2020`** (this week's count despite the name), `filings_avg`, `filings_avg_prepandemic_baseline` | file 2026-09-17, data to 2026-09-13 | ODC-BY 1.0 |
| ETS monthly | `…/ets/all_sites_monthly_2020_2021.csv` | ✓ | smaller | same, monthly | same | ODC-BY |
| Eviction Lab tract history | `…/data-for-analysis/tract_proprietary_valid_2000_2018_y2024m12.csv` | ✓ | 35 MB. **Allegheny covers only 2000–2006** (402 tracts per year). | `filings, filing_rate, judgements` | 2024-12 | ODC-BY. Historical context only. |
| City evictions by ZIP 2020–23 | `PGH/Evictions_2020_to_2023_by_Zip_Code/FeatureServer/89` | ✓ | 40 polygons (duplicate ZIPs) | `zip5`, `Evictions` (15221 = 1,744; 15210 = 1,386) | 2023-08 | none stated |
| **County tax liens, current status** | `WPRDC(65d0d259-3e58-49d3-bebb-80dc75f61245)` | ✓ | 2,159,875 records. Pittsburgh unsatisfied: 305,791. | `pin, filing_date, tax_year, lien_description` (e.g. Pgh Water & Sewer), `amount, assignee, satisfied, last_docket_entry` | 2026-09-07 | CC0 |
| Tax liens summary per PIN | `WPRDC(d1e80180-5b2e-4dab-8ec3-be621628649e)` | ✓ | 87,962 PINs | `pin, number, total_amount` | 2026-09-07 | CC0 |
| **Cumulative delinquent RE taxes** (county) | `WPRDC(96e9d6b2-3e1a-4a0c-8ef6-23a049c263d8)`, plus yearly files 2023–25 | ✓ | 126,000 | `parcel_id, year, muni_name, orig_bill, penalties, interest, total_payments, last_pay_date` | 2026-09-19 | CC0 |
| City property tax delinquency | `WPRDC(ed0d1550-c300-4114-865c-82dc7c23235b)` | ✓ | 27,527 | `pin, current_delq_tax, prior_years, prior_delq_tax, state_description, neighborhood, lat/lon` | 2026-09-24 | CC-BY |
| **Act 135 conservatorship filings** | `WPRDC(fd64c179-b5af-4263-9275-fb581705d878)` | ✓ | 582 | `pin, filing_date, case_id, municipality, party_type, party_name, last_activity` | 2026-09-08 | CC-BY |
| Mortgage foreclosure filings (fields; ID already in data-sources) | `WPRDC(859bccfd-…)` | ✓ | 40,743 | `pin, filing_date, docket_type, amount, plaintiff, last_activity` | 2026-09-08 | CC0 |
| Sheriff sales | `WPRDC(adffb94b-6175-4612-8628-44e7c9baa620)` | ✓ but **stale** | 75 | `SaleType, SaleDate, SaleStatus, Plaintiff, lat/lon` | **2022-12** | CC0 |
| Assessment appeals 2015–26 | `WPRDC(8a7607fb-c93e-4d7a-9b23-528b5c25b1de)` | ✓ | 96,713 | pre/post appeal values, `COMPLAINANT` (Municipality = reassessment pressure) | 2026-08 | CC0 |
| **NCRC gentrification tracts** (economic / racial) | `ALCO/Gentrification_and_Economic_Displacement/FeatureServer/0`, `…_Racial_Displacement` | ✓ | 402 tracts | `NCRC_*` race, poverty, income and home value 2000 vs 2015–19, `NCRC_Economic_Displacement` | 2021–22 | none stated |
| Pittsburgh neighborhood need over time | `ALCO/Pittsburgh_Nhood_Need_Overtime/FeatureServer/12` | ✓ | 79 | `AverageZScore2009_2013`, `…2016_2020`, `LevelofNeed…`, `NeedOvertime` | 2023-01 | none stated |
| DHS community profiles (neighborhood) | `WPRDC(33490823-a68e-40ce-b22d-cd7e03f0f2b2)` | ✓ | 11,035 (to 2026) | `metric_name` (Homeless Population, Individuals Receiving Homelessness & Housing Services, Income Supports…), `calendar_year, geo_area_name, kpi_count` | 2026-08 | CC0 |
| 2-1-1 requests | `WPRDC(0ce22487-5707-4e64-8e59-5b189cfc69cb)` | ✓ | 279,464 (2023–25). About 33k match "Rent". | `contact_date, zip_code, needs_category, level_1/2_classification, needs_met` | 2026-05 | CC-BY |
| **Short-term rentals** (Airbnb) | `PGH/Pittsburgh_2024_Airbnb_Listings___AirBTics/FeatureServer/0`, plus Oct-2024 Inside Airbnb copy `PGH/Pittsburgh_Airbnb_Listings_October_24` | ✓ | 3,136 / 2,152 | `Listing_Type, Bedrooms, Created_Date, lat/lon`, host listings count | 2025 | third-party scrape. Use aggregates only. |
| HUD R/ECAP 2020 | `HUD/Racially_or_Ethnically_Concentrated_Areas_of_Poverty_2020/FeatureServer/16` | ✓ | 23 in bbox | `GEOID, RCAP_20` | 2023 | public domain |
| HUD HCV by tract | `HUD/Housing_Choice_Vouchers_by_Tract/FeatureServer/0` | ✓ | 257 | `HCV_PUBLIC, HCV_PUBLIC_PCT` | 2026-07 | PD |
| HACP vouchers by tract, April 2026 | `WPRDC(3f133311-43af-4009-a1d4-84fbfb46aaa1)`; yearly 2023–25 files also exist | ✓ | 102 tracts | `Tract, Count of Vouchers` | 2026-04 | CC-BY |
| **HCV payment standards 2026** | `ALCO/2026_Payment_Standard_Schedule/FeatureServer/45` (2024 tiers: `ALCO/2024_PS_TIERS_FOR_AC_TRACTS/FeatureServer/32`) | ✓ | 394 tracts | `GEOID20, PGHNhood, PHA_Jurisdiction, Updated_CCD_Opportunity, F2026_PS_Tier, Efficiency…Five_Bedroom` (for example, Shadyside 2BR $2,020 and Middle Hill 2BR $1,587) | 2026-07 | none stated |

## B. Subsidized stock and expiring affordability (EQ, POL)

| Name | URL | n (bbox or city) | Key fields | Updated |
|---|---|---|---|---|
| **HUD LIHTC properties** | `HUD/LIHTC/FeatureServer/0` | 155 bbox, 134 city (4,775 LI units) | `PROJECT, N_UNITS, LI_UNITS, N_0BR…N_4BR, YR_PIS, YR_ALLOC, CREDIT, NONPROG, TRGT_*, QCT, DDA, LAT, LON` | 2024-12 |
| **HUD Multifamily Assisted** | `HUD/MULTIFAMILY_PROPERTIES_ASSISTED/FeatureServer/0` | 153 bbox, 68 city (4,526 assisted units) | **`EXPIRATION_DATE1/2`** (text `DD-MON-YY`), `PROGRAM_TYPE1`, `TOTAL_ASSISTED_UNIT_COUNT`, `RENT_TO_FMR_RATIO1`, `REAC_LAST_INSPECTION_SCORE`, `TROUBLED_CODE`, `IS_ON_WATCH_LIST_IND`, BR mix, tenant income and race | 2026-07 |
| HUD Public Housing buildings / developments | `HUD/Public_Housing_Buildings/FeatureServer/0`, `HUD/Public_Housing_Developments/FeatureServer/0` | 632 / 48 | `PARTICIPANT_CODE` (HACP=PA001), `TOTAL_DWELLING_UNITS, PCT_OCCUPIED, REGULAR_VACANT, HH_INCOME, CONSTRUCT_DATE` | 2026-07 |
| HUD Section 202 (elderly) / 811 (disability) | `HUD/HUD_Section_202_Properties/FeatureServer/0`, `HUD/Section_811_Properties/FeatureServer/21` | 73 / 37 | same schema as MF Assisted | 2026-07 / 2023 |
| HUD MF properties and pipeline | `HUD/Multifamily_Properties_and_Pipeline/FeatureServer/0` | 103 | `Project_Status, Total_Units, Assisted_Units, Production_Pipeline_Y_N, LIHTC_Y_N` | 2024-08 |
| HUD Picture of Subsidized Households (tract) | `HUD/Snapshot_HUD_Picture_Subsidized_Households/FeatureServer/0` | 232 | `program_label, total_units, hh_income, pct_disabled_all` | 2020 data |
| City subsidized units, with **`Subsidy_End_Date`** | `PGH/Affordable_Housing_Data/FeatureServer/3` (layer 8 = BG totals) | 146 points | `Property_Name, Total_Units, Active_Subsidies, Subsidy_End_Date, Owner_Type` | about 2018 vintage |
| City affordable pipeline (gem 3) | `PGH/AffordableParcels/FeatureServer/0` (points: `Affordable_Parcel_Points`) | 100 | see gem table | 2025-04 |
| County public housing addresses | `ALCO/Public_Housing/FeatureServer/0` | 381 (includes scattered sites) | `Provider, Complete_Address, Lat/Long` | 2020 |
| ACHA sites | `ALCO/ACHA_Sites/FeatureServer/0` | 11 | `NAME, ADDRESS` | — |
| Senior housing buildings | `ALCO/Senior_Housing_Locations_geocoded/FeatureServer/0` | 173 | `Building_Name, Type, Unit_Count, Neighborhood` | 2021 |

**Blocked**
- **NHPD** (`preservationdatabase.org`) returns 403 and needs a login.
- **PHFA** has no machine-readable LIHTC award list (`phfa.org/developers/developer/lihtc.aspx` returns 500).

Expiry recipe: parse `EXPIRATION_DATE1` as `DD-MON-YY`, and treat LIHTC `YR_PIS + 15` / `+ 30` as the Year-15 and Year-30 risk dates. Ignore `YR_PIS` values of 8888 and 9999.

## C. Typology fit and built form (TYP)

| Name | URL | n | Key fields | Updated |
|---|---|---|---|---|
| **Residential lot dimensions** | `PGH/Parcels_Exp_02052025_Residential_Lot_Dimensions/FeatureServer/0` | 105,488 | `pin, Parcel_Width, Parcel_Len, Bldg_Width, Bldg_Len, zone_short, Hood` (ft, minimum-bounding-geometry) | 2025-02 |
| Parcel width + building height | `PGH/Parcels_for_Height_and_Width/FeatureServer/8` | 135,036 | `Parcel_Width, Bldg_Height_New, usedesc` | 2023-08 |
| Building heights (footprints) | `PGH/Buildings_Elevation/FeatureServer/33` | 87,831 | `lotblock, bldg_heigh_new, Neighborhood` | 2023-08 |
| Neighborhood width/height summary | `PGH/WidthHeightHoods/FeatureServer/43` | 90 | median/mean lot width and building height per hood (context-sensitive massing) | 2023-08 |
| Footprint adjacency (attached vs detached) | `PGH/Building_Footprints_Adjacency/FeatureServer/0` | 117,506 | `…_Alone2` flag, neighbor counts, `CLASS, LUC` | 2023-10 |
| County building footprints | `https://gisdata.alleghenycounty.us/arcgis/rest/services/EGIS/Buildings/MapServer/0` | 573,908 (maxRecordCount 1000) | `FEATURECODE, CLASS, LUC, status, pct_change` | live |
| R1D parcels with width | `PGH/R1D_Parcels/FeatureServer/0`, hood summary `R1D_Neighborhoods` | 56,013 | `parcel_width, Class_Desc, Use_Desc` (the R1D ADU/infill reform universe) | 2024-01 |
| Single-family-attached-in-detached permits | `PGH/Single_Family_Attached_in_Detached/FeatureServer/0` | 29 | `net_num_units, affordable_units, type_of_structure` | 2026-07 |
| ETHOS lot suitability | `PGH/ETHOS_Lot_Suitability/FeatureServer/0` | 142,806 | per-parcel suitability flags `Housing, Stormwater, TreeNew, SteepSlope, HFA, CleanEnerg, Best_Suit` | 2024-12 |
| SPC land use / land cover 2023 | `SPC/Land_Use_Land_Cover_Allegheny_County_2023/FeatureServer/0` | 18,496 | `NAME_ID1/2/3` hierarchy | 2026-07 |
| Street façade hierarchy | `PGH/Pittsburgh_Hierarchy_of_Facades/FeatureServer/0–2` | 415 / 287 / 395 lines | `AddressSt, Facade` (Primary / Contributing / Non-contributing) | 2026-04 |

## D. Policy simulation and review triggers (POL)

| Name | URL | n | Key fields / use | Updated |
|---|---|---|---|---|
| **City Historic Districts (CHD)** | `PGH/PGHWebCHDHistoricDistricts/FeatureServer/0`; WPRDC CSV `dde7f2f6-425d-4960-a77f-92363ef3e3ec` | 21 | `historic_name, type, guideline_link` | 2025-10 |
| City individual historic sites | `PGH/PGHWEBCHDIndividialProperties/FeatureServer/0` | 157 | `name, address, lotblock` | 2026-09 |
| NRHP points / polygons (NPS) | `https://mapservices.nps.gov/arcgis/rest/services/cultural_resources/nrhp_locations/MapServer/0` and `/1` | 180 / 60 in bbox | Section 106 trigger when federal money is used (HOME, CDBG, LIHTC) | live, PD |
| **ZBA decisions, 10 years** | `PGH/ZBA_Database_10_Year_Data_Set_Clean_Geocoded/FeatureServer/0` (2-yr: `…_2_Year_…`) | 4,318 | `Year, Type` (Variance / Special Exception), `Request, Aggregation_Category` (253 "Residential Use"), `Result, zon_new, hood` | 2026-04 |
| Draft STR zoning | `PGH/Proposed_STR_Zoning/FeatureServer/0` | 735 | `zon_new, struse` | 2025-09 |
| Oakland proposed rezoning | `PGH/Oakland_Proposed_Zoning_WFL1/FeatureServer/2` | 55 | before/after `zon_new` (a template for rezoning "what-ifs") | 2022 |
| Height overlays | `PGH/HeightReductionZone_ZoningOverlay/FeatureServer/0` (4); WPRDC `pghzoningheightoverlay` | — | `Zone, Height` | 2024 / 2026 |
| Accepted tax abatements | `PGH/Accepted_Abatements_2026_view/FeatureServer/0` (2025: 794); WPRDC `fd924520-d568-4da2-967c-60b3a305e681` (1,975 rows, 2011→) | 733 | `ABATEMENT_PROGRAM` (Residential LERTA etc.), `START_YEAR, END_YEAR`, amounts | 2026-02 / daily |
| Opportunity Zones | `PGH/Opportunity_Zone_Nominations/FeatureServer/0` (48, `FOZ` flag); `HUD/Opportunity_Zones/FeatureServer/13` (58 bbox) | — | tract GEOID | 2026 |
| TIF districts | WPRDC `ecb714c4-223c-4a26-8cb9-bc75448672b0` (34, `termination_date`); parcels `ALCO/TIF_Districts_2018/FeatureServer/0` (206) | — | `name, sponsor, TIF_District` | 2023 / 2018 |
| Business Improvement District parcels | `ALCO/BID_Parcels_2026_Jan/FeatureServer/8` | 1,480 | `PIN` | 2026-01 |
| City business-district streets | `PGH/Business_District_Streets/FeatureServer/0` | 659 | main-street frontage for mixed-use typologies | 2026-04 |
| CDBG eligibility 2024 (BG) | `PGH/BlockGroups2020_withCDBGstats2024/FeatureServer/0` | 314 | `LOWMOD_PCT, CDBG_elig_2024`. This drives the **enhanced Ch. 265 abatement** in `pro-forma.md`. | 2024-07 |
| HUD Qualified BG estimates 2026 | `PGH/HUD_Qualified_Block_Group_Estimates_2026/FeatureServer/0` | 314 | `VLIL4_*`, poverty, income | 2025-07 |
| DDA 2026 | `HUD/Difficult_Development_Areas_2026/FeatureServer/0` | 3 ZCTAs | 130% basis boost (complements QCT) | 2025-09 |
| Neighborhood plans | `PGH/NeighborhoodPlans/FeatureServer/0` | 6 | `Name, Link, Active` | 2025-01 |
| Demolition moratorium / zoning demolitions | `PGH/DemolitionMoratorium` (1), `PGH/Zoning_Demolitions` (179) | — | preservation constraints | 2018–19 |

## E. Demand, market and transportation-emissions context (DEM, CLI)

| Name | URL | Verified | Notes |
|---|---|---|---|
| **Census BPS, place annual** | `https://www2.census.gov/econ/bps/Place/Northeast%20Region/ne2025a.txt` (monthly `ne2608c.txt`) | ✓ | Pittsburgh row `61000`: units by 1 / 2 / 3–4 / 5+ with values. Public domain. |
| **Zillow ZORI by ZIP** | `https://files.zillowstatic.com/research/public_csvs/zori/Zip_zori_uc_sfrcondomfr_sm_month.csv` | ✓ | 55 Allegheny ZIPs, through **2026-08**. Rent trend (e.g. 15235 $1,337 → $1,419 YoY). Zillow terms require attribution. |
| Zillow ZHVI by ZIP (mid tier) | `…/zhvi/Zip_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv` | ✓ (124 MB, 2026-09-16) | home-value trend |
| **HUD LAI v3** | `HUD/Location_Affordability_Index_v3/FeatureServer/0` | ✓ 267 tracts | `hh1…hh8_ht` (H+T % of income), `hhN_model_vmt_per_hh`, `hhN_vmt_cost`, `median_gross_rent`, `pct_transit_j2w`. Public domain. Tract 1405: H+T 50.3%, 21.0k VMT. |
| HUD Jobs Proximity Index 2020 (BG) | `HUD/Jobs_Proximity_Index_2020/FeatureServer/0` | ✓ 631 | `jobs_idx` (AFFH percentile). A quick ACC proxy. |
| City development projects (with units) | `PGH/Development_Construction_Projects_v2/FeatureServer/0` | ✓ 7,077 | `USER_NUMBEROFUNITS, USER_TOTALPROJECTVALUE, USER_COMPLETEDDATE`. Stale since 2023-09. |
| Solar permits | `PGH/solar_permits/FeatureServer/0` | ✓ 1,542 | residential rooftop solar adoption (CLI), updated 2026-09 |
| City capital budget line items 2017–26 | `PGH/Capital_Budget_Line_Items_2017_to_2026/FeatureServer/0` | ✓ 2,419 | planned public investment near a site (INF readiness) |
| SPC HPMS traffic counts | `SPC/Traffic_Counts/FeatureServer/0` | ✓ 5,336 | `Volume, Class, Prev_Tot1–3` |
| SPC 2027–30 TIP / LRP 2050 projects | `SPC/Draft_TIP_2027_2030/FeatureServer/0` (462), `SPC/LRP_Projects_2026_Update/FeatureServer/0` (339) | ✓ | future transport investment (DEM, INF) |
| SPC MERLAM forecast zones | `SPC/SPC_MerlamZones_SPC_Cycle12/FeatureServer/4` | ✓ 1,357 | **geometry only.** Cycle-12 population and employment forecasts are not published. |

## F. Next steps: acquisition and who to call (NEXT)

| Name | URL | n | Use |
|---|---|---|---|
| URA-owned parcels | `PGH/ParcelsURA/FeatureServer/0` | 1,570 | URA disposition candidates (2023-11) |
| URA conveyance list | `PGH/URA_Conveyance/FeatureServer/0` | 162 | `Category, Status, City_Dept` (2026-03) |
| Side-yard sales | `PGH/Sideyard_Sales/FeatureServer/0` | 652 | `Action_Step, Area_sq_ft` (2026-08). Neighbor-lot consolidation. |
| City "parcels to acquire" | `PGH/Parcels_to_Acquire/FeatureServer/0` | 148 | greenway acquisition. Treat as a *do-not-build* flag. |
| City vacant inventory (EPP feed) | `PGH/epp_properties/FeatureServer/0` | 12,604 | `current_status, inventory_type, acquisition_method` (2026-06) |
| Public residential parcels | `PGH/Public_Parcels_Residential/FeatureServer/0` | 7,855 | `OwnerCateg` |
| **Registered Community Organizations** | WPRDC CSV `70e41827-b416-46c6-8226-53bff2b48691` (GeoJSON `7dacbc47-…`) | 44 | `organization_name, primary_contact_email, meeting_dates_and_times, rco_expiration_date`. Tells the user which RCO to meet (a required step for projects). |
| Neighborhood planners | `PGH/NeighborhoodPlanner/FeatureServer/0` | 93 | `Planner, Phone, Email` (**2017, likely stale**) |

---

## G. Found, but owned by sibling docs (don't re-research)

- **`environment-infrastructure.md`**: condemned properties, PLI/DOMI violations, hydrants, lead lines (`lead-risk`), crashes/HIN, steps and paper streets, `Noncompliant_IFC_Roads`, 311, NRI/CMRA.
- **`access-amenities.md`**: LODES 2023, PA child care (data.pa.gov `ajn5-kaxt`, 718 Allegheny), schools, the county assets file.
- Still unused, for the Climate/INF owners to consider:
  - `ALCO/2100_Projections_for_SFHA_NEW` (130 municipalities, structures in the SFHA now vs 2100)
  - `PGH/Parcels_On_Mines` (25,821 parcels over abandoned mines) and `PGH/Abandoned_Mines`
  - `irise` landslide DB (WPRDC `f6aea9d6-…`, 6,461)
  - ACCD development applications with pre/post impervious acres (WPRDC `f3b9a9aa-…`, 1,431)
  - `PGH/Stormwater_Riparian_Buffers`
  - `ALCO/Allegheny_County_EJ_map_with_Indicators_WFL1`

## Down, blocked or stale

- `spcarcgis.org` (SPC's own ArcGIS server): connection failed (000). Use SPC AGOL (`MV5wh5WkCMqlwISp`) instead.
- Eviction Lab site pages (`evictionlab.org/*`) return 403 to curl. The S3 bucket works.
- Eviction Lab tract data for Allegheny ends in 2006.
- HMDA data-browser API (`ffiec.cfpb.gov/v2/data-browser-api`): 503 "Platform Outage" today. Retry for tract lending and denial rates (EQ).
- NHPD: 403 (login). PHFA LIHTC page: 500.
- WPRDC `sheriff-sales`: last data 2022-12.
- `PGH/ZoningApplications`: 0 features.
- `PGH/Social_Vulnerability_Index`: 1 feature, no attributes.
- WPRDC has **no landlord-tenant, LIHTC or rental-registration dataset**. The city `grid_quarter_km_permit_stats` shows only 472 rental registrations in aggregate. Use ETS for evictions.
- Pittsburgh "Housing Opportunity Fund" investments: not published as data. `PGH/HOF_RPCF` turned out to be façade lines, not HOF.
