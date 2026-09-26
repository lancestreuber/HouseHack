# Senior, care and group housing: where it actually exists (City of Pittsburgh)

**One line:** 124 point records (about 101 distinct sites once cross-source duplicates are merged) of senior, assisted-living, personal-care, nursing and disability housing inside the City of Pittsburgh. Each point carries its current zoning district (`zon_new`), the §911.02 code for the zoning use it most likely falls under, and the §911.02 code for Multi-Unit Residential in the same district.
**As of:** pulled live on 2026-09-26. Facility-level public data only. There are no resident data and no composite scores.
**Files:** `senior-and-group-housing.geojson` (points, EPSG:4326) · `senior-and-group-housing-by-district.csv` (type × `zon_new`) · this file.

## Headline (revealed side)

| type | points in City | capacity sum | capacity unit |
|---|---|---|---|
| hud_202_elderly | 26 | 1,411 | dwelling units |
| hud_mf_elderly (HUD-assisted elderly, not 202-financed) | 19 | 1,967 | dwelling units |
| lihtc_elderly | 25 | 2,218 | dwelling units |
| public_housing_senior (HACP) | 16 | 926 (12 of 16 have a unit count) | dwelling units |
| nursing | 12 | 1,634 | CMS certified beds |
| personal_care | 11 | 767 | DHS licensed capacity |
| assisted_living | 1 | 30 | DHS licensed capacity |
| hud_811 | 7 | 109 | dwelling units |
| hud_202_disabled | 1 | 51 | dwelling units |
| hud_mf_disabled | 1 | 18 | dwelling units |
| lihtc_disabled | 5 | 399 | dwelling units |

The sources overlap. The same building can appear as HUD MF, LIHTC and HACP, so **do not add the rows together as distinct sites**. There are 38 points with `possible_same_site_as` set: another source's point lies within 80 m. Merging those gives about 101 sites.

**Where they sit, against the apartment permission** (`multi_unit_pathway` in the point's district):
- 71 points are in districts where Multi-Unit Residential is **by right** (RM 40, LNC 22, UC-MU 5, UNC 3, and others).
- **28 points are in districts where Multi-Unit is not permitted**: 27 in R1D/R1A/R2 and 1 in GI (Hazelwood Towers). Of those 27, 9 are hud_202_elderly, 6 personal_care, 4 hud_mf_elderly, 3 HACP senior, 2 nursing, 1 hud_811, 1 lihtc_elderly and 1 lihtc_disabled. In these areas senior, care and group housing has been built or licensed where apartments have no by-right or exception path.
- 6 points are in districts where Multi-Unit is A (EMI) and 4 where it is S (UI).
- 15 points are in districts outside §911.02 (RP, AP, UPR-A/B, GPRC, GT-C). For these the code is `?` (unknown), not "not permitted".
- Only **7 points** sit where their own inferred use is by right. 54 are special exception, 10 administrator exception and 10 conditional use. **24 sit where their inferred use is not permitted today** (for example Housing for the Elderly (General) in R1D/R1A/R2). These are most likely built before the current code (1958/1998 codes, variances, or older zoning), or sites whose zoning changed later. That is an inference: no approval record was checked.

## Sources (exact URLs and queries)

| Source | URL / query | Live count, 2026-09-26 | Used for |
|---|---|---|---|
| PA DHS Human Services Provider Directory | `https://www.humanservices.dhs.pa.gov/HUMAN_SERVICE_PROVIDER_DIRECTORY/`: POST `Home/HumanServicesProviderDirectorySearchResult`, ProgramOffice=Office of Long-Term Living, County=2 (Allegheny), ServiceCode=25 / 26 (Assisted Living / AL-Special Care) and 19 (Personal Care Homes) | Allegheny: 8 ALRs (code 26 returned a subset of code 25), 99 PCHs | `personal_care`, `assisted_living`; name, address, capacity, dementia special-care capacity, license id/type/status/period |
| PA Open Data: Licensed Personal Care Homes | `https://data.pa.gov/resource/pqf4-d4xn.json?$limit=50000` (rowsUpdatedAt 2026-09-22) | 995 statewide, 99 Allegheny (matches DHS) | coordinates for PCHs (matched by name, then by street+ZIP) |
| PA Open Data: Nursing Homes (DOH) | `https://data.pa.gov/resource/xgn8-z9eg.json?$limit=50000` | 666 statewide, 52 Allegheny | `nursing` points |
| CMS Provider Information (Nursing Home Compare) | `https://data.cms.gov/provider-data/api/1/datastore/query/4pq5-n9py/0` with state=PA (dataset modified 2026-08-01) | 656 PA | certified beds, date first approved. Matched to DOH by street number and within 300 m (all 22 in the bbox matched) |
| HUD Multifamily Properties – Assisted | `https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/MULTIFAMILY_PROPERTIES_ASSISTED/FeatureServer/0/query` (bbox −80.10,40.36,−79.86,40.51, outFields=*) | 144 in bbox, 95 in City (44 Elderly, 9 Disabled, 41 Family, 1 null) | `hud_*` types. Family properties are excluded |
| HUD Section 202 Properties | `.../HUD_Section_202_Properties/FeatureServer/0` | 45 in City | cross-check. It holds all elderly-client properties, not only 202-financed ones; 1 property not in MF-Assisted (South Hills Retirement Apts.) was added |
| HUD Section 811 Properties | `.../Section_811_Properties/FeatureServer/21` | 20 in City (13 elderly, 7 disabled) | cross-check only (it is the 202/811 subset) |
| HUD LIHTC | `https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/LIHTC/FeatureServer/0/query` (same bbox) | 151 in bbox, 102 in City | `lihtc_elderly` (TRGT_ELD='1'), `lihtc_disabled` (TRGT_DIS='1' and not elderly) |
| HACP Housing Communities | `https://hacp.org/housing/communities/` (read 2026-09-26) | 16 communities labeled "Seniors" | `public_housing_senior`. Units come from HUD `Public_Housing_Developments` where the name matches (12 of 16) |
| HUD Public Housing Developments | `.../Public_Housing_Developments/FeatureServer/0` | 46 in bbox | HACP coordinates and units |
| City boundary | `https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services/City_Boundary/FeatureServer/0` (feature "City of Pittsburgh", minus the "Mt. Oliver Borough" feature, which the city polygon contains) | – | clip |
| Zoning | `https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services/PGHWebZoning/FeatureServer/0` (1,069 polygons, 1 with null geometry; lastEdit 2026-09-22) | – | `zon_new` by point-in-polygon (all 124 joined; no nearest-polygon fallback was needed) |
| Permission codes | `typology-district-matrix.csv` in this folder (from the §911.02 transcription, `../../sources/ecode360-2026-09-26-pittsburgh-911-02-use-table-residential.md`, columns verified in round 5) | – | `permission_code`, `multi_unit_code` |
| Use definitions | City DCP handout "Pittsburgh Zoning Code Use Classifications": `https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/5990_zoning_code_use_classifications_handout.pdf` | – | size thresholds (below) |

Geocoding: the 6 DHS ALRs and 4 HACP sites with no source coordinates were run through the US Census geocoder (`geocoding.geo.census.gov/.../onelineaddress`, benchmark Public_AR_Current). One ALR (Cumberland Crossing Manor, 1201 Cumberland Rd, 15237) did not geocode. Its ZIP is north-suburban, so it was dropped as unlocated.

Out of 275 candidate records in the bbox, 150 were outside the City, 1 was not geocoded and **124 were kept**.

## Use inference (our mapping, not a City determination)

Size thresholds are from the City handout: Assisted Living A <9 beds, B 9–17, C ≥18. Housing for the Elderly Limited <30 units, General ≥30. Personal Care Residence Small ≤8 clients, Large ≤17 clients.

| type | inferred §911.02 use | confidence |
|---|---|---|
| nursing | Assisted Living A/B/C by certified beds. The code definition ("convalescents or chronically ill… nursing care") fits nursing homes | medium |
| assisted_living (PA ALR) | Assisted Living A/B/C by licensed capacity | low |
| personal_care | ≤8 → PCR Small; 9–17 → PCR Large; ≥18 → Assisted Living C. The last one is **unverified**: a large PCH exceeds the PCR ceiling, and the City's actual classification is not known | medium / low |
| hud_202_elderly, hud_mf_elderly, lihtc_elderly, public_housing_senior | Housing for the Elderly Limited/General by units. If units are missing, both codes are given as `A|B` | medium |
| hud_811, hud_202_disabled, hud_mf_disabled, lihtc_disabled | Multi-Unit Residential. These could instead be Community Homes if they are group living | low |

## Field dictionary (geojson properties)

| field | meaning |
|---|---|
| id | `<source>-<n>`, stable within this build only |
| name, address | facility name and service address as published. Legal-entity/operator names, executive names, emails and phones are **deliberately dropped** |
| type | `personal_care`, `assisted_living`, `nursing`, `hud_202_elderly`, `hud_mf_elderly`, `hud_811`, `hud_202_disabled`, `hud_mf_disabled`, `lihtc_elderly`, `lihtc_disabled`, `public_housing_senior` |
| capacity, capacity_unit | beds (DHS licensed capacity / CMS certified beds) or dwelling units (HUD TOTAL_UNIT_COUNT, LIHTC N_UNITS, HUD PH TOTAL_DWELLING_UNITS) |
| year, year_basis | HUD `OCCUPANCY_DATE` year; LIHTC `YR_PIS`; CMS first Medicare/Medicaid approval; DHS **current license period start**. None of these is a zoning approval date |
| source, geocode | source dataset, and where the coordinate came from (with HUD `LVL2KX` accuracy code) |
| zon_new, zoning_full, zoning_join | current district from PGHWebZoning, and the join method |
| zoning_use_inferred, zoning_use_label, zoning_use_confidence | see Use inference |
| permission_code, permission_pathway | §911.02 code for the inferred use in `zon_new`: P/A/S/C; `-` = blank (not permitted); `?` = district not in §911.02. The pathway comes from the matrix enum |
| multi_unit_code, multi_unit_pathway | §911.02 Multi-Unit Residential in the same district (blank = not permitted) |
| possible_same_site_as | ids from other sources within 80 m (likely the same building) |
| DHS extras | license_id, license_type (FULL/PROVISIONAL), license_status, license_period, dementia_special_care_capacity, operation (profit/non-profit), dhs_service |
| DOH extras | doh_facility_id, cms_ccn |
| HUD extras | hud_property_id, hud_client_group, hud_category, hud_assisted_units, hud_program_flags (202/811/PRAC/Sec8-202 indicators Y) |
| LIHTC extras | lihtc_hud_id, lihtc_li_units, lihtc_trgt_eld, lihtc_trgt_dis, lihtc_yr_alloc |
| HACP extras | hacp_management (HACP-managed / privately managed), hud_development_code |

The CSV has one row per `type` × `zon_new`, with n_sites, n_with_capacity, capacity_sum, capacity_unit, n_possible_cross_source_duplicates, inferred_uses, permission_codes and multi_unit_code/pathway.

## Caveats

1. **Licensing ≠ zoning approval.** DHS license dates are the current annual license period, not first licensure. HUD occupancy, LIHTC placed-in-service and CMS certification years are not zoning approval dates. None of these points proves the use was approved under today's §911.02.
2. **This is a current-zoning join.** Most HUD 202 and HACP buildings date from the 1960s–1990s, before the 1998 code and later remaps. A point in R1D with "not permitted" is most likely nonconforming or grandfathered, not evidence that the path is open today.
3. **The use mapping is ours.** Nursing and ALR map to "Assisted Living" by bed count, and large PCHs (≥18) are placed in Assisted Living C without verification. Disability housing is mapped to Multi-Unit. Confidence is recorded per point.
4. **LIHTC TRGT_* coding** was inferred as 1 = yes, 2 = no, 0/null = not reported. HUD's data dictionary could not be fetched (huduser.gov returned nothing to automated fetches). The inference is consistent with project names: all "Senior"/"Retirement" projects are 1, and "Heidelberg Apartments" (autistic adults) has TRGT_DIS=1. Some TRGT_ELD=1 records have family-sounding names (e.g. "BEDFORD IA", "OAK HILL IC"). They are kept as coded.
5. **Point locations:** HUD LIHTC points are at the largest building's address. Of the 102 in-City LIHTC points, 8 are tract centroids (`LVL2KX`=T). Two of the kept points are among them, Garfield Heights Phase III and Larimer Phase 1 (both lihtc_disabled), so their zoning join is unreliable. Check the `geocode` field. Points near district edges can join to the wrong district.
6. **Coverage gaps:** DHS PCH data covers licensed homes only; unlicensed boarding homes are absent. Only 1 PA-licensed Assisted Living Residence is in the City (Ahava Memory Care, 200 JHF Dr). Market-rate independent-living senior apartments with no HUD/LIHTC/HACP tie are **not in any source here**. HACP Murray Towers, Northview Heights High Rise, Cedarwood Homes and Glen Hazel High Rise have no unit count, and their points come from the Census geocoder (Northview HR shares the Northview Heights address).
7. **Not collected on purpose:** ODP Community Living Homes (licensed group homes for people with intellectual disabilities or autism, DHS service code 521CLH) and mental-health CRR homes. Individual addresses of small group homes disclose where people with disabilities live. The task rules exclude resident-sensitive data, so they were not pulled. No public City/County "community home" point dataset was found.
8. The use-definition handout dates from the Peduto administration (2014–2022). The size thresholds were not re-checked against the live §926 text, because ecode360 returned 403 to automated fetch.

## Suggested map style

- Overlay group **"Legal feasibility"**, layer "Senior & group housing (existing)".
- Circle points colored by `type`, with the families grouped: care (nursing, assisted_living, personal_care) in warm hues; subsidized senior (hud_202_elderly, hud_mf_elderly, lihtc_elderly, public_housing_senior) in blues; disability (hud_811, hud_*_disabled, lihtc_disabled) in purples.
- Radius scales with `sqrt(capacity)`.
- Stroke or halo red where `multi_unit_pathway` = `not_permitted`. This shows the senior-vs-apartments contrast directly.
- Popup: name, type, capacity + unit, year + year_basis, zon_new, "inferred use: label (code)", "apartments here: multi_unit_code", source.
