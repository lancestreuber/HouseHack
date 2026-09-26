# Permits for new residential construction, by typology, district and neighborhood

**One line:** Every City of Pittsburgh building permit for new housing (plus conversions that add units) that we could identify from 2019-05 to 2026-09, classified by housing type, placed in its current zoning district and neighborhood, with days from first workflow step to issue.
**Question it answers:** Where has each type of housing actually been permitted to be built, and how long did the permit take? This is the "revealed" side of legal feasibility. The code side is `typology-district-matrix.csv`.
**As of:** pulled live 2026-09-26 (15:00–15:02 local). City only.
**No scores, no weights.** Counts, medians and flags only.

## Files

| File | Rows | What |
|---|---|---|
| `permits-new-residential.geojson` | 1,088 points (EPSG:4326, 0.9 MB) | One feature per permit |
| `permits-by-typology-district.csv` | 378 rows | Counts and durations per typology × `zon_new` (`group_by=zon_new`) and per typology × neighborhood (`group_by=neighborhood`) |
| `scripts/pull_permits_new_residential.py` | – | Re-pulls every input from the live endpoints into a cache directory |
| `scripts/build_permits_new_residential.py` | – | Classifies, joins and writes the two files. `python build_permits_new_residential.py <out_dir> <cache_dir>` (needs shapely 2) |

## Headline patterns (counts of permits; current zoning)

| typology | n | new / conversion | issued (OSPI) | censored (open) | median days to issue | p75 | KM median* | top current districts |
|---|---|---|---|---|---|---|---|---|
| single_detached | 468 | 464 / 4 | 344 | 28 | 140.0 | 270.0 | 154 | R1D-H 77, R1A-VH 68, R1A-H 58, RM-M 31 |
| single_attached | 234 | 233 / 1 | 225 | 9 | 181 | 271 | 181 | RM-M 94, R1A-H 43, R1A-VH 27, GPRB 10 |
| two_unit | 118 | 35 / 83 | 88 | 22 | 121.5 | 216.0 | 153 | RM-M 18, R1D-H 18, R2-H 14, R1A-VH 10 |
| three_unit | 6 | 4 / 2 | 2 | 2 | 219 | 244 | 269 | R3-M 2, RM-M 2, UPR-B 1, UC-MU 1 |
| multi_unit_4_19 | 35 | 33 / 2 | 24 | 1 | 196.5 | 326 | 205 | RM-M 17, LNC 6, UNC 3, UPR-B 2 |
| multi_unit_20plus | 26 | 25 / 1 | 16 | 3 | 182.5 | 299 | 237 | RIV-IMU 7, LNC 4, UI 4, RP 3 |
| multi_unit_size_unknown | 63 | 56 / 7 | 49 | 14 | 191 | 287 | 235 | UNC 11, RIV-IMU 9, LNC 7, UC-MU 5 |
| senior | 3 | 2 / 1 | 2 | 1 | 70 | 89 | 108 | P 2, R2-H 1 |
| other_group | 4 | 4 / 0 | 3 | 1 | 193 | 259.5 | 193 | EMI 2, H 1, RM-H 1 |
| adu | 2 | 0 / 2 | 2 | 0 | 311.5 | 462 | 10 | R1A-M 1, R2-H 1 |
| unknown | 129 | 127 / 2 | 21 | 87 | 59 | 158 | – | R1A-VH 26, R2-H 13, R2-L 13, R1D-H 12 |

\*KM median: Kaplan–Meier product-limit median that counts open applications as censored at their elapsed age on 2026-09-26. `assisted_living` had **0** records.

- **Apartments (4+ units) are almost absent from R1D, R1A, R2, R3 and H.** Of 124 permits typed 4+ units, 4 sit in those districts: one open R1D-L application (BDA-2026-01372), one R1D-H conversion that adds a first-floor apartment to an existing apartment building, one open R2-L conversion (funeral home to 10 units), and one legacy R1A-H permit (17-B-01582, 14 units per AGOL). 99 are in mixed-use, special or planned districts (LNC, RIV-*, UNC, UI, RP, UC-*, SP-*, NDI…); 21 are in RM.
- **20+ unit buildings: 25 of 26 are outside the residential districts** (only 1 in RM-M). Largest: 343 and 220 units (BP-2019-07202, BP-2023-13277).
- **Two-unit housing in single-family districts is mostly conversions.** 22 of 25 two-unit permits in R1D and 16 of 17 in R1A are "change in use to two-family" permits, not new buildings.
- **Townhouses cluster in RM-M** (94 of 234), mostly Fairywood (45) and Bedford Dwellings (23).
- Among issued permits, median days to issue were 121–196 for every typology with n ≥ 20. Small-n cells (senior, three_unit, adu, other_group) should not be read as patterns.

## Sources, endpoints and exact queries (all pulled 2026-09-26)

**1. OneStopPGH `OSPI_H`** `https://pghbridgis.pittsburghpa.gov/hosting/rest/services/Hosted/OSPI_H/FeatureServer/0/query`, `outFields=*`, `outSR=4326`, paginated by 1,000 on `objectid`.
- New construction: `source='pli_permits' AND ((type='BUILDING' AND type_work_desc='NEW CONSTRUCTION') OR (type='Building & Development Application' AND type_work_desc='New Construction'))` → **1,350 rows, 1,340 unique `record_id`** (860 BUILDING: 490 Residential + 370 Commercial; 490 BDA: 210 Residential + 280 Commercial). Duplicates were resolved to the row with an issue date, then the highest `objectid`.
- Conversion candidates: same `source` and types, `type_work_desc IN ('ADDITION / ALTERATION','MINOR ALTERATION','Existing (alteration/addition)')` and `UPPER(work_desc) LIKE` any of `%CONVER%`, `%CHANGE OF USE%`, `%CHANGE IN USE%`, `%CHANGE USE%`, `%ACCESSORY DWELLING%`, `%ADU%`, `%ADDITIONAL DWELLING%`, `%ADDITIONAL UNIT%`, `%NEW DWELLING UNIT%`, `%NEW UNIT%`, `%ADD UNIT%`, `%ADD A UNIT%`, `%ADDING%UNIT%` → **541 rows**.
- Same-parcel context (for records with an empty or generic description): `parc_num IN (…) AND work_desc IS NOT NULL AND type NOT IN ('ELECTRICAL','MECHANICAL')` for 228 parcels → 2,063 rows.
- Other OSPI groupings seen but not used: ELECTRICAL/MECHANICAL "new construction" trade permits (duplicates of building permits), Floodplain (52), DOMI ROW (41).

**2. WPRDC `pli-permits`** resource `f4d1177a-f597-4c32-8cbf-7885f56253f6`, `datastore_search` with `filters={"work_type":"NEW CONSTRUCTION"}` and `{"work_type":"New Construction"}` → 3,156 + 283 = **3,439 rows** (65,378 total rows in the resource). Of these, 1,091 are BUILDING or BDA permits, and **all 1,091 are also in OSPI_H** (WPRDC holds only issued BDAs: 231 of 490). WPRDC was used as a cross-check and description fallback; it added no records. `owner_name` was dropped on pull.

**3. City AGOL `Development_Construction_Projects_v2`** `https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services/Development_Construction_Projects_v2/FeatureServer/0/query?where=USER_TYPEOFWORKDESCRIPTION='NEW CONSTRUCTION'` → **518 rows (510 unique permit numbers)**, completed 2020-01-03 to 2023-08-31; the layer was last edited 2023-09-11 (stale). 253 permit numbers match OSPI (these supply `agol_units` = `USER_NUMBEROFUNITS`). The other 257 are pre-OneStop permits (`09-`…`19-B-`): 113 Commercial with 0 or 1 units were dropped as probably non-residential, and **144 were added** (`source=agol_dev_construction_v2`, no description, no timeline).

**4. Zoning** `…/PGHWebZoning/FeatureServer/0` (1,069 polygons, `zon_new`), **5. Neighborhoods** `…/PGHWebNeighborhoods/FeatureServer/0` (90 polygons, `hood`), both `outSR=4326` (`editingInfo.lastEditDate`: zoning 2026-09-22, neighborhoods 2026-07-02; OSPI_H exposes no `editingInfo`). Point-in-polygon join with shapely; **all 1,088 points fell inside a zoning polygon and a neighborhood** (no nearest-neighbour fallback used). The joined neighborhood matched OSPI's own `neighborhood` field in every case where both exist. One zoning feature (`R1A-VH`) has null geometry in the service and was skipped.

## Selection and classification

**Kept:** OSPI new-construction permits whose text describes dwellings (or Residential-coded ones with empty or generic text, typed `unknown`), conversions that add units, and the 144 AGOL legacy records. **Excluded** (counts from the 2026-09-26 run): no dwelling terms 179; commercial with empty description 68; non-residential keyword (sign, warehouse, zoo, restaurant fit-out, etc.) 129; generic "new N-story building" with no use stated and no same-parcel clue 57; garages 23; accessory to an existing dwelling (deck, pool, fence) 12; other accessory structures 24; manual exclusions 11 (listed in the script); conversions that reduce or keep units 32; conversions with no residential target 317; "change in use to single-family" with no stated non-residential source 79; group quarters to household dwelling 3.

**Typology** (`typology`; rule in `classification_rule`, first match wins):
1. `assisted_living` — assisted living, personal care, nursing, memory care. 2. `senior` — senior, elderly, 55+/62+. 3. `other_group` — group/community home, SRO, multi-suite, rooming, dormitory, "sleeping rooms", treatment facility. 4. `adu` — accessory dwelling/ADU/carriage house, or a garage converted to a dwelling. 5. `three_unit` / `two_unit` — "three/two-family", "3/2-unit", triplex/duplex (not "2 unit cluster"). 6. `single_attached` — townhouse/townhome, rowhouse, "attached" dwelling, party wall. 7. Explicit unit count in text (e.g. "224 DWELLING UNITS", "(TOTAL 9)", "3 UNITS ON FIRST LEVEL, 10 UNITS ON…" summed) → 1 `single_detached`, 2 `two_unit`, 3 `three_unit`, 4–19 `multi_unit_4_19`, 20+ `multi_unit_20plus`. 8. "single-family" → `single_detached`. 9. Apartment/multi-family/condominium/high-rise with no count → AGOL units if ≥2, else **`multi_unit_size_unknown`** (a value we added: we know it is apartments but not how many). 10. Generic house/home/dwelling → `single_detached` (med). 11. Otherwise `unknown`.

Conversions are classified on the text after "to/into/as" (the target). **Confidence:** `high` = explicit type term or unit count; `med` = generic "house/dwelling", AGOL-only unit count, apartment with no count, conversions whose source use is unstated; `low` = no description (Residential-coded), or type borrowed from another permit on the same parcel within ±3 years (`classification_rule` starts `parcel_context:`, and `work_desc` is prefixed `[… same-parcel <id>]`). Totals: 597 high, 350 med, 141 low.

Typology ids map to the matrix ids: `single_detached`→`single_detached`, `single_attached`→`single_attached`, `two_unit`→`two_unit`, `three_unit`→`three_unit`, all `multi_unit_*`→`multi_unit`, `senior`→`elderly_limited`/`elderly_general` (text does not say which), `assisted_living`→`assisted_living_*`/`personal_care_*`, `other_group`→`community_home`/`multi_suite_*`.

## Durations

- `start_date` = earliest dated step in `workflows` (any `DATECOMPLETED` or `SCHEDULEDSTARTDATE` on or before the issue date). `issue_date` = the `issue_date` field, else the first `Issue Permit`/`Issued` step. `days_to_issue` = issue − start.
- `censored=true` when there is no issue date and the status is open (Applicant Revisions, Application Finalization, Application Incomplete, In Review, Reviews Paused, Submitted, Ready For Issue, Amendment…). `days_elapsed_if_open` = 2026-09-26 − start. **Censored records are kept** (168; median elapsed 439 days).
- Result: 776 issued with a duration, 168 censored, 0 negative durations, 0 OSPI records without a start date. AGOL legacy records have no dates (`n_legacy_agol_no_dates`).
- Check against earlier work: legacy BP residential new construction median 155 d (n=478); BDA residential median 153 d over 68 issued with 127 open. The research base reported 153 d for BDA residential (`knowledge/policy/permit-timelines.md`).

## Field dictionary

GeoJSON properties:

| field | meaning |
|---|---|
| `permit_id` | OSPI `record_id` / WPRDC `permit_id` (BP-…, BDA-…) or AGOL `USER_PERMITNUMBER` (legacy) |
| `source` | `ospi_h` or `agol_dev_construction_v2` |
| `record_kind` | `new_construction` or `conversion` |
| `property_type` | City's Residential/Commercial code (multifamily is often Commercial: 166 of 839 kept OSPI new-construction records) |
| `parcel_id` | 16-character county PIN, no dashes (`parc_num`) |
| `address` | Site address |
| `start_date`, `issue_date` | ISO dates, see Durations |
| `completed_date` | AGOL legacy records only |
| `status` | City status at pull time |
| `typology`, `units`, `agol_units` | Our class; unit count from text (or AGOL); AGOL `USER_NUMBEROFUNITS` where the permit matched (0 is common and means unrecorded) |
| `classification_confidence`, `classification_rule` | high/med/low and the rule that fired |
| `phase_flag` | Text says foundation-only, phased, superstructure, etc. |
| `zon_new`, `neighborhood` | **Current** zoning district and City neighborhood at the point |
| `days_to_issue`, `days_elapsed_if_open`, `censored` | See Durations |
| `same_parcel_n` | Number of records in this file on the same parcel |
| `overlap_flag` | `bda_umbrella_with_N_child_bp`, `phase_or_partial_scope_permit`, `repeat_application_same_parcel`, or null. 38 records are flagged; they may double-count a building |
| `join_note` | How the spatial join resolved (all `within`) |
| `work_desc` | City description, whitespace-normalised, truncated to 300 characters |

CSV columns: `group_by` (`zon_new` or `neighborhood`), `group_value`, `typology`, `n`, `n_with_timeline` (OSPI records), `n_issued`, `n_censored`, `n_legacy_agol_no_dates`, `median_days_to_issue` and `p75_days_to_issue` (issued only, linear interpolation), `km_median_days` (blank if the survival curve never reaches 0.5), `n_days_known`, `units_sum_known`, `n_units_known`, `n_high_conf`, `n_conversions`, `n_parcels`, `n_overlap_flagged`, `first_year`, `last_year`.

## Caveats

1. **Coverage years.** OSPI records start 2019-05-29 (the OneStop cut-over); the last issue date is 2026-09-14. 2019 is partial (13 records). AGOL adds pre-2019 permits completed 2020–2023 only. Nothing here covers 2012–2019 permits that closed before 2020 (the WPRDC `city-of-pittsburgh-building-permit-summary` is the route for those; not pulled).
2. **2024 recode.** New applications moved from `type='BUILDING'`/`NEW CONSTRUCTION` to `type='Building & Development Application'`/`New Construction`. Both spellings are unioned. Under BDA, one application can spawn child BP permits for each building (e.g. BDA-2024-03554 with 21 BPs), so **permit counts are not building counts**. Use `overlap_flag` and `n_parcels`.
3. **Censoring.** 168 open applications are kept. 87 of them are typed `unknown` because open BDAs often have no description, so the typology-specific medians describe mostly finished permits and are biased short. KM medians are given where computable. Some open applications may be abandoned rather than pending.
4. **Durations include applicant time** (start = first workflow date), and they end at permit issue. Zoning variances, ZBA hearings and conditional-use approvals that happen before or outside the building permit are not measured.
5. **Current zoning join.** `zon_new` is today's district at the permit point. Districts may have been different at filing (for example, rezonings in 2019–2026), so "permitted in district X" means "built on land that is X today".
6. **Classification is keyword-based.** Descriptions are free text, often empty for open BDAs. 67 of the 83 two-unit conversions give no prior use (e.g. "change in use to two-family"); some may legalise an existing duplex rather than add a unit. 63 apartment permits have no unit count. Phased projects produce several permits per building (27 `phase_flag=true`).
7. **Excluded ambiguity.** 68 commercial BDAs with empty descriptions and 57 generic "new N-story building" permits could include apartments but could not be confirmed; they are excluded, not guessed.
8. **Points** are the OSPI/AGOL point for the parcel. A multi-parcel project appears at one parcel.

## Suggested map style

Overlay group **"Legal feasibility"**, layer "New housing permits 2019–2026". Circle points coloured by `typology` with a categorical palette: single_detached, single_attached, two_unit and three_unit in one hue family (light to dark), multi_unit_4_19 / multi_unit_20plus / multi_unit_size_unknown in a second family, senior / other_group / adu as distinct accents, and `unknown` in neutral grey. Radius steps by `units` (1, 2–3, 4–19, 20+; unknown = smallest). Open ring (stroke only) for `censored=true`. Reduced opacity for `classification_confidence='low'` and for records with an `overlap_flag`. Popup: `typology`, `units`, `status`, `days_to_issue` or "open N days", `zon_new`, `neighborhood`, `work_desc`, `permit_id`. Filters: typology, year of `issue_date`, `record_kind`.


## Review fix (2026-09-26)

`FAM2` matched `DOUBLE` in "double-car garage", which typed one new single-family house as `two_unit`. `DOUBLE` now counts only when it isn't followed by car/garage/wide/door/hung/stack/bay/stud/height/story/deck/porch. The result: single_detached 467 → 468, two_unit 119 → 118. The rebuild reproduced the previous outputs byte for byte before the fix.
