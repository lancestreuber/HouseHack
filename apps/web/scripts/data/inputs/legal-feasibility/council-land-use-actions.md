# Council land-use actions (Conditional Use, rezonings, SP/PUD) and Planning Commission actions

**One line:** Every Pittsburgh City Council matter in Legistar from 2000 to 26 Sept 2026 that grants a Conditional Use, amends the zoning map, or creates or amends a Specially Planned (SP) or planned-unit district. Each matter is coded for housing relevance, parsed for districts, addresses and parcels, and geocoded. A companion file parses Planning Commission minutes for 2020–2025.
**As of:** 2026-09-26. All counts below were computed from live API pulls made on that date. This is working research, not legal advice.

## Files

| File | Rows | What it is |
|---|---|---|
| `council-land-use-actions.csv` | 284 | One row per Legistar matter (see field dictionary) |
| `council-land-use-actions.geojson` | 183 points | Rows that could be geocoded (same properties as the CSV) |
| `planning-commission-actions-parsed.csv` | 223 | Machine-parsed motions from the Planning Commission's compiled minutes, 2020–2025. Noisy; see its caveats |

## Headline findings (from the data; interpretation marked)

1. **No Conditional Use for Multi-Unit housing exists in the record, and the code cannot produce one.** In today's §911.02, Multi-Unit Residential is never `C` in any district: it is P, A, S or not permitted. The only residential uses that are `C` are Assisted Living Class C and Multi-Suite Residential (Limited), both in RM. An "approval rate for multi-unit CUs" is therefore undefined (n = 0), not 100%.
2. **Council CUs are almost all non-housing.** There are 75 CU matters (2000–2026): 67 adopted, 2 defeated (a 2001 Moore Park fill and a 2008 East Carson restaurant with a liquor license), 4 expired and 2 pending. Every one of the 22 CUs introduced since 2015 was adopted. Only 14 of the 75 involve residents at all, and all 14 were adopted:
   - 3 Multi-Suite Residential (Limited) in RM: 2004-0636, 2016-0073, 2021-1231
   - 1 Housing for the Elderly in RP: 2005-1510
   - 3 dormitories in EMI
   - 2 custodial-care facilities
   - 5 Golden Triangle **transfers of development rights** under §910.01.D.1, moving 12, 75, 12, 87 and 33+5 dwelling units between Downtown parcels (2016-0716, 2018-0877, 2018-1083, 2020-0926, 2022-0291)

   Most CUs are schools, utilities, fill operations and signs.
3. **Deemed approval at Council.** 39 of the 75 CUs (18 of the 22 since 2015) were recorded as **"Passed pursuant to Case Law"**. The MatterNotes field on 2001-1917 cites *Whale's Tale v. City of Pittsburgh*. *(Inference:)* This appears to mean Council did not vote within its deadline and the resolution passed by operation of law. It sits oddly with §922.06's "deemed denial" text; not reconciled.
4. **Council time for a CU**, from introduction to final passage, has a median of **56 days** (range 7–119). Since 2015 the median is 60 days (n = 21). This excludes the Planning Commission stage before it.
5. **Rezonings.** There are 128 site-specific map amendments or SP-district creations; 110 were adopted, 2 failed (2004-0594, 2010-0184), 3 were withdrawn, 4 expired, 2 are held and 2 are pending. Since 2015: 49, of which 42 were adopted and none were defeated.
   - Compared with **today's** §911.02, 29 rezonings raise the by-right residential ceiling (15 since 2015, all adopted), 32 lower it and 18 leave it unchanged. 48 involve SP/AP/CP/RP/GPR/UPR/OPR districts, which cannot be coded against §911.02.
   - **22 adopted rezonings made Multi-Unit by-right (P) on at least some parcels** where it had been not permitted, S or A. 16 of them were introduced since 2015 (e.g. 2024-0819 R2-M→RM-VH in East Liberty, 2025-1417 R1D-H→UC-MU, 2023-2330 UC-E→R-MU, 2025-1993 RIV-GI→RIV-IMU).
   - *(Caveat:)* many of these are R1A/R2→LNC or NDI commercial rezonings. Multi-unit becoming P is a side effect on paper, not evidence of a housing project.
6. **Rezoning time:** the median from introduction to final passage is 75.5 days overall (n = 110) and **123 days since 2015** (n = 42, range 39–743). Recorded "No" votes on final passage are rare: 7 rezonings, all before 2013.
7. **Planning Commission (2020–2025, parsed):** 223 motions were parsed. 180 approved, 23 recommended approval to Council, 12 continued or tabled, 1 recommended denial (context unverified), and 1 approval motion **failed** (DCP-ZDR-2020-03210, a PDP, 12 Oct 2021). 56 motions concern residential items (46 approvals, 4 recommendations to Council, 2 continuances, 0 denials). Most are PDPs and site plans in the Downtown, Strip and Lawrenceville areas. *(Inference, weak:)* Planning Commission denials of housing are rare in the minutes, but continuances are undercounted and withdrawn applications are invisible.

## Method

### Legistar pull (all live on 2026-09-26)

Base: `https://webapi.legistar.com/v1/pittsburgh/matters`. The API has matters from **2000-01-01** onward (checked by `$orderby=MatterIntroDate&$top=1`). Queries were paginated with `$top=1000&$skip=n`. `substringof` is case-insensitive in this API (the upper- and lower-case term counts were identical). Filters, with the number of matters each returned:

| `$filter=` | n |
|---|---|
| `substringof('Zoning',MatterTitle)` | 735 |
| `substringof('Conditional Use',MatterTitle)` | 83 |
| `substringof('Specially Planned',MatterTitle)` | 24 |
| `substringof('Planned Unit',MatterTitle)` | 32 |
| `substringof('Project Development Plan',MatterTitle)` | 3 |
| `substringof('Zoning Map',MatterTitle)` | 110 |
| `substringof('rezon',MatterTitle)` | 9 |
| `substringof('Title Nine',MatterTitle)` | 467 |
| `substringof('Title 9',MatterTitle)` | 6 |
| `substringof('Planned Development',MatterTitle)` | 12 |
| `substringof('Development Plan',MatterTitle)` | 33 |
| `substringof('SP-',MatterTitle)` | 32 |
| `substringof('Institutional Master Plan',MatterTitle)` | 38 |
| `substringof('Zoning',MatterName)` | 227 |
| `substringof('Conditional Use',MatterName)` | 41 |
| `substringof('Specially Planned',MatterName)` | 4 |
| `substringof('Planned Unit',MatterName)` | 4 |

The union is **784 unique matters**. Cross-checks on `922.06`, `911.04.A`, `902.03`, `909.01`, `Residential Planned` and `Conditional` found 1 new matter, which was not a land-use action. The title classifier kept 284 matters:

- **75 CU:** 67 use approvals, 5 TDR, 3 procedural
- **192 map amendments:** 121 site rezonings, 7 SP creations, 53 area-wide remaps (mostly the 2000–2012 "Map Pittsburgh" neighborhood remapping), 4 overlay map+text, 7 text or other
- **17 SP/PUD:** 14 SP text amendments, 2 street dedications, 1 communication

Excluded: the 432 other zoning text amendments and the 37 Institutional Master Plan matters. Also excluded: 31 "development plan" matters, which on inspection were CBO planning grants and climate plans, not PDPs. **PDPs are decided by the Planning Commission, not Council**, so none are in Legistar.

For each kept matter:

- `/matters/{id}/histories` gives every action.
- `/matters/{id}/versions` → `/matters/{id}/texts/{key}` gives the ordinance body. It is used to parse from/to, parcels and units when the title lacks them.
- **Votes:** `MatterHistoryTally` is always null. Roll calls come from `/eventitems/{MatterHistoryId}/votes`; the history ID equals the event-item ID (verified on matter 30723). 1,079 passage-type histories were queried and 275 returned votes. **42 final-passage vote lookups returned HTTP 500**, recorded as `vote_source=votes_endpoint_http_500`. These are mostly "Passed pursuant to Case Law" items with no roll call.

### Geocoding

1. **Parcel first.** Parcel IDs are parsed from the text (`83-J-300`, or "Block No. 7-H, Lot No. 25" → `7-H-25`). They are looked up in the Allegheny County parcel layer `https://gisdata.alleghenycounty.us/arcgis/rest/services/OPENDATA/Parcels/MapServer/0` on `MAPBLOCKLOT` (leading zeros stripped; `X-Y-N-M` also tried as `X-Y-N-0-M`). The point is the polygon centroid, or the mean of up to 25 matched parcel centroids (`allegheny_parcel_centroid_mean`). For TDRs, only the last parcel in the title (the receiving site) is used.
2. **Else address**, via the Census geocoder `onelineaddress` (benchmark `Public_AR_Current`) with ", Pittsburgh, PA" appended. A match is rejected unless a street-name word appears in the matched address and the point falls in a City bounding box (lon −80.10 to −79.86, lat 40.36 to 40.51).
3. **Else none.**

Result: 135 parcel, 48 Census, 101 none (mostly area-wide remaps and text amendments, which have no single location). Pre-2010 parcel IDs often fail because lots have since been consolidated or renumbered.

### Housing coding

- `from_to_pairs` is built from each "from X … to Y" clause (codes, or long district names mapped to codes).
- `byright_ceiling_effect_today` compares, for each pair, the highest by-right residential type under **today's** §911.02 (read from `../../sources/ecode360-2026-09-26-pittsburgh-911-02-use-table-residential.md`): 1 = single-unit, 2, 3, 4 = multi-unit, 0 = none.
- `multi_unit_code_change_today` gives the Multi-Unit cell (P/A/S/`-`) before>after.
- Pre-2000 legacy codes (RT-2, RM-3, RSD-2) are coded by name: two-unit, multi, single.
- SP, AP, CP, RP, GPR, UPR and OPR districts are coded `?`. See `special-district-residential-permissions.csv` once it is filled.
- `housing_typology` is a keyword match. For CUs it uses the title only; for other matters, title plus body, with district names like "Residential Multi-Unit … District" removed first.

## Field dictionary (`council-land-use-actions.csv`)

| Field | Meaning |
|---|---|
| `matter_id`, `file_number`, `matter_type` | Legistar MatterId, MatterFile (e.g. 2024-0819), Ordinance or Resolution |
| `action_category` | `conditional_use` / `map_amendment` / `sp_pud` |
| `action_subtype` | `cu_use_approval`, `cu_transfer_of_development_rights`, `cu_other_or_procedural`, `site_rezoning`, `sp_district_created`, `area_wide_remap`, `overlay_map_and_text`, `text_amendment_other`, `sp_text_amendment`, `sp_street_dedication`, `communication` |
| `residential_relevance` | CU: `residential_use`, `group_quarters_use` (dorm or custodial care), `tdr_dwelling_units`, `non_residential`. Rezoning: `enables_more_housing_byright`, `reduces_housing_byright`, `no_change_in_residential_ceiling`, `mixed_up_and_down`, `unclear_special_district`; `+text_mentions_housing` if housing words appear. Also `area_wide_remap_mixed`, `overlay`, `not_a_map_change`, `sp_text_or_other` |
| `title` | Full MatterTitle |
| `intro_date`, `passed_date`, `final_action`, `final_action_date`, `mayor_signed_date` | From the matter and its histories |
| `status_legistar` / `status` | Raw status, and our normalized one: `adopted`, `failed`, `withdrawn`, `expired_end_of_session`, `held`, `pending`, `tabled`, `filed_not_action` |
| `days_intro_to_final` | Intro → passed date (adopted), or → final action date (failed, withdrawn, expired, tabled). Blank if still open. **Council stage only** |
| `passed_pursuant_to_case_law` | True if any history is "Passed pursuant to Case Law" |
| `public_hearing_held_date` | Last "Public Hearing Held" date |
| `referred_to_planning_commission_in_history` | A "Referred for Report and Recommendation" action exists |
| `vote_action`, `vote_date`, `votes_aye`, `votes_nay`, `votes_abstain`, `votes_absent_or_other`, `votes_other_detail`, `vote_source` | Roll call on the last passage-type action |
| `from_districts`, `to_districts`, `from_to_pairs` | Parsed districts (pipe-separated); pairs as `FROM>TO` |
| `multi_unit_code_change_today`, `byright_ceiling_effect_today` | See Housing coding. Uses today's table, **not the table in force at the time** |
| `cu_district_zoned` | District named in the CU title ("zoned …") |
| `housing_typology` | `multi_unit`, `single_or_townhouse`, `senior_elderly`, `assisted_living`, `personal_care`, `community_home`, `multi_suite_residential`, `student_housing_dormitory`, `custodial_care_group_residential`, `mixed_use_with_residential` |
| `units_stated`, `beds_or_residents_stated` | Numbers parsed from the text ("87 dwelling units", "49 adult males") |
| `addresses`, `parcels` | Parsed from the title (or the body if the title has none) |
| `lon`, `lat`, `geocode_method`, `geocode_detail`, `parcels_matched` | See Geocoding |
| `legistar_api_url`, `legistar_web_url` | Links |

## Planning Commission (`planning-commission-actions-parsed.csv`)

- **Source:** the DCP's compiled minutes PDFs. They return 403 to curl (Akamai), but WebFetch saved the binaries, which were parsed with `pdftotext`:
  - [2020](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/minutes-2020-21-22-23-24/planning-commission-minutes-2020.pdf)
  - [2021](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/minutes-2020-21-22-23-24-25untilnov/planning-commission-minutes-2021.pdf)
  - [2022](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/minutes-2020-21-22-23-24-25untilnov/planning-commission-minutes-2022.pdf)
  - [2023](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/minutes-2020-21-22-23-24-25untilnov/planning-commission-minutes-2023.pdf)
  - [2024, **June 25–Dec 10 only**](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/minutes-2020-21-22-23-24-25untilnov/planning-commission-minutes-2024.pdf)
  - [2025, Jan 14–Dec 16](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/minutes-2020-21-22-23-24-25untilnov/approved-planning-commission-minutes-2025.pdf)
- **Not obtained:** 2026 minutes and Jan–Jun 2024 (a copy at `.../03-11-2025-meeting/planning-commission-minutes-2024.pdf` is identical to the Jun–Dec file). Per-meeting 2026 pages exist (e.g. `…/PC-Agendas/Planning-Commission-July-28-2026/…`) but were not scraped.
- **Parse:** the text is split at each "MOTION CARRIED / CARRIED / MOTION FAILED" marker and cut back to the last numbered item header. From each piece we take the `DCP-ZDR-…` / `DCP-MPZC-…` case numbers, the item kinds (PDP, site plan, SS-O, map amendment, IMP, PUD…), the verb from the motion text (`approve`, `recommend_approval_to_council`, `continue_or_table`, `deny_or_negative_recommendation`, `unclassified_motion_carried`) and a residential keyword flag on the item header and motion.
- **Columns:** `meeting_date`, `year`, `cases`, `case_types`, `item_kinds`, `residential_item`, `units_stated`, `action`, `outcome_marker`, `opposed_count`, `item_description` (item header only, truncated so it carries no commenter names), `source_file`. Commissioner and public-commenter names are deliberately not stored. 8 motions had one or more commissioners opposed.
- ⚠ **Noisy.**
  - It is a **lower bound**: about 37–49 actions a year against about 23 meetings a year, so items voted as a group or written in other formats are missed.
  - Some rows carry extra case numbers from correspondence lists.
  - `meeting_date` is the nearest preceding meeting header.
  - Plans of lots (`DCP-LOT`) and historic nominations (`DCP-HN`) are excluded by design.
  - Treat these rows as pointers to the minutes, not as coded decisions.

## Caveats

- **Title parsing limits.** Districts, addresses, parcels, units and typology come from regexes over titles and ordinance bodies. Rezoning ordinances almost never name the project or unit count; that is in Planning Commission reports attached as PDFs, which were not read. `residential_relevance` for rezonings is a **legal-capacity** code, not a statement that housing was proposed.
- **Today's table vs. then.** The ceiling and multi-unit codes use the §911.02 table as of 2026-09-26. Before about 2024 the use table differed (see Bill 2024-0701 and older ordinances), so the historic effect may differ.
- **§911.02 transcription quirk.** The saved transcription shows single-unit detached as `P` in the **P (Parks)** and **EMI** columns. So R1D→P and P→EMI rezonings code as "no change". Check this cell before relying on it.
- **Multi-pair rezonings** (e.g. 2024-1303, the North Oakland TOD rezoning) are coded as the full cross-product of from and to districts, because the parser cannot tell which parcel goes where.
- **Withdrawn and failed items** are included and flagged (5 withdrawn, 4 failed, 13 expired at the end of a session). Applications withdrawn **before** Council introduction, and CU or rezoning requests the Planning Commission sank before they reached Council, are invisible here.
- `days_intro_to_final` covers the Council stage only. Total CU time also includes the Planning Commission hearing (§922.06, up to 45 + 45 days).
- **Consent-agenda and case-law passages** often have no roll call (42 vote-lookup errors, 34 with no passage action).
- **Scope** is the City of Pittsburgh only. Legistar covers City Council; Mount Oliver Borough is not included.

## Connects to

- `typology-district-matrix.csv` (what the code says) and `pathways.csv` (the CU and ZBA steps)
- `special-district-residential-permissions.csv` and `special-districts.md` (the `?` districts)
- `../../knowledge/policy/approval-pathway.md` (§922.06 CU process, §922.10 PDP)
- `../../knowledge/policy/reforms-in-flux-2025-2026.md` (Bills 2025-1545 and 2026-0834 are in this Legistar pull as text amendments, not rows)

## Reproduce

Run the scripts in `scripts/` in this order (they write intermediates to their own directory): `council_pull.py`, `council_pull2.py`, `council_hist.py`, `council_votes.py`, `council_build.py`, `council_geocode.py`. The Planning Commission step, `council_pc.py`, needs the six minutes PDFs converted with `pdftotext -layout`. You need Python 3 with `certifi`. `pull.py` classifies titles in an inline step that was run by hand; the classification rules are the regexes in `council_build.py`.
