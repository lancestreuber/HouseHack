# Permits and revealed outcomes

**Type:** data
**One line:** City permit records (OneStopPGH `OSPI_H`, WPRDC PLI permits) and other revealed-outcome sets (new construction, demolitions, LIHTC, the Pro-Housing Pittsburgh 20+-unit list) that can serve as ground truth and as timeline data.
**Why we care:** These are the only labels available to calibrate or backtest a Development Ease Score, and the only source of computed approval durations. They are joinable by parcel.
**Last checked:** 2026-09-26

## OneStopPGH backing layer `OSPI_H` `[read]`
- `https://pghbridgis.pittsburghpa.gov/hosting/rest/services/Hosted/OSPI_H/FeatureServer/0`
- **330,166 records.** Fields include `source`, `type`, `type_work_desc`, `property_type`, `parc_num`, `record_id`, `status`, `work_desc`, `issue_date`, `total_proj_value`, and `workflows` (JSON of dated steps).
- **Slow:** queries take ~11 s.
- `create_date` and `submitted_date` are empty; ZDR records have no `issue_date`. Durations must come from `workflows` step dates (Application Submitted, Completeness Check, Perform Review with "Revisions Required", Issue Permit).
- Contains 18,937 "Zoning Development Review Application" records (DCP-ZDR-2019 onward). ZDR workflow steps are completeness check and review only; **no ZBA or variance step is exposed**. A keyword search of `work_desc`/`process_summary_data` found 49 "variance" and 11 "ZBA" hits.
- Other record groups: condemned (1,946), dead-end (966), rental registration, floodplain permits (494), DOMI curb cuts (1,606).
- Organizer catalog lists OneStopPGH as a Core source via the public search portal and cautions the portal is "not necessarily suitable for bulk extraction; respect terms and rate limits". The FeatureServer above is the bulk route.

### New construction `[read]`
Query: `source='pli_permits' AND type='BUILDING' AND type_work_desc='NEW CONSTRUCTION'` → **860 permits (490 Residential, 370 Commercial; 592 unique parcels)**.

| Year | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026 |
|---|---|---|---|---|---|---|---|---|
| Residential | 14 | 83 | 96 | 99 | 83 | 68 | 23 | 24 |
| Commercial | 17 | 60 | 62 | 72 | 61 | 80 | 10 | 8 |

- **Gotcha: permit recode in 2025.** The 2025–26 drop is a system change. New work moved to `type_work_desc='New Construction'` (583 records, mainly "Building & Development Application"). **Union both spellings.**
- **Multifamily is often filed as "Commercial"** (e.g. a 6-storey, 48-apartment building); separate it via `work_desc`.
- **Demolitions: 1,297** (`type='Demolition Permit'`; 662 complete, 533 city-funded, 102 partial).

### Computed timelines (summary) `[read]`
From 30,775 paginated ZDR + BDA records; start = earliest workflow date, end = Issue Permit. Full tables and caveats: [permit timelines](../policy/permit-timelines.md).

| Series | n | median | p75 | p90 |
|---|---|---|---|---|
| ZDR 2019–24 | 17,129 | 25 d | 68 d | 168 d |
| BDA residential alteration 2024–26 | 6,872 | 8 d | 34 d | 95 d |
| BDA residential new construction 2024–26 | 74 issued | 153 d | 246 d | 340 d |
| BDA commercial new construction 2024–26 | 157 | 104 d | 245 d | – |

⚠ Residential new construction is **heavily right-censored**: only 74 of 210 (35%) finished (62 Issued + 12 Completed); the 136 unfinished include 78 Applicant Revisions, 27 Application Finalization and 22 Application Incomplete. The median describes the finished minority and is biased short by an unknown amount. Durations run from the earliest workflow date, so they **include applicant time**. The "5 revision cycles" is a median of ~5 reviewer-level "Revisions Required" flags; parallel discipline reviews share one scheduled start, so these are **flags, not resubmission rounds** *(corrected 2026-09-26 per docs/04-critique.md rows 2–3)*. The ZDR series is effectively dead after mid-2024; zoning review appears merged into the BDA (inference).

## PLI permits `[read]`
- WPRDC `pli-permits`, resource `f4d1177a-f597-4c32-8cbf-7885f56253f6`: 65,378 rows from 2019-06 (to 2026-09 per working notes). Fields `permit_id`, `permit_type`, `work_description`, `work_type`, `commercial_or_residential`, `total_project_value`, `issue_date`, `parcel_num`, `latitude`/`longitude`, `status`.
- `datastore_search` works; **`datastore_search_sql` → CloudFront 403**.
- ArcGIS mirror `C/PLI_Permits/FeatureServer/0`: 61,022 rows, issue dates end 2026-01-27 → **stale**.
- Historical permits from 2012: WPRDC `city-of-pittsburgh-building-permit-summary` `[found]`. Catalog caveat: older records use different schemas.
- `C/Development_Construction_Projects_v2`: 518 NEW CONSTRUCTION records with a `NUMBEROFUNITS` field `[read]`.

## Other outcome sets
| Set | Content | Caveat | Tag |
|---|---|---|---|
| HUD LIHTC `https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/LIHTC/FeatureServer/0` | 215 Allegheny projects (`CURCNTY_NM like 'Allegheny%'`) | **Latest real YR_PIS is 2019**; 8888 is a placeholder | `[read]` |
| `prohousingpgh/pittsburgh_iz` (GitHub) | Hand-built CSV of 109 buildings with 20+ units since 2012; zoning-accepted, zoning-approved and CO dates checked on Agency Counter | **CC BY-NC**; small sample | `[read]` |
| PLI/DOMI/ES violations, condemned | see [land availability](land-availability-and-title.md) | | `[read]` |
| PHFA award lists | | not checked | – |

## Gotchas (collected)
- Union `NEW CONSTRUCTION` and `New Construction`.
- Multifamily coded as Commercial.
- OSPI queries ~11 s; paginate and cache.
- `ZoningApplications` FeatureServer returns 0 records.
- WPRDC SQL `WHERE` → 403.

## Open questions
- Unit counts per permit: only `Development_Construction_Projects_v2` has `NUMBEROFUNITS`; otherwise parse `work_desc`.
- How well `parc_num` matches county `PIN` format (not reported).
- Whether the residential new-construction median stabilizes once censored records close.
- PHFA award lists as a post-2019 LIHTC substitute: not checked.

## Connects to
- [Permit timelines](../policy/permit-timelines.md)
- [ZBA decisions](zba-decisions.md): BDA numbers join to OSPI
- [Backtest and calibration](../methods/backtest-and-calibration.md): labels
- [Approval pathway](../policy/approval-pathway.md)
- [Parcels and assessments](parcels-and-assessments.md)
- [Hackathon precedents](../landscape/hackathon-precedents.md): Permit Predictor, housing-element backtests

## Sources
- [OneStopPGH OSPI_H FeatureServer/0](https://pghbridgis.pittsburghpa.gov/hosting/rest/services/Hosted/OSPI_H/FeatureServer/0) `[read]` *(accessed 2026-09-26)*: queried, paginated, counts and timelines computed
- [OneStopPGH portal (organizer catalog URL)](https://onestoppgh.pittsburghpa.gov/) `[found]` *(accessed 2026-09-26)*
- [WPRDC PLI permits f4d1177a](https://data.wprdc.org/api/3/action/datastore_search?resource_id=f4d1177a-f597-4c32-8cbf-7885f56253f6) `[read]` *(accessed 2026-09-26)*
- [WPRDC pli-permits dataset page](https://data.wprdc.org/dataset/pli-permits) `[found]` *(accessed 2026-09-26)*
- City `PLI_Permits/FeatureServer/0` and `Development_Construction_Projects_v2` `[read]` *(accessed 2026-09-26)*
- WPRDC `city-of-pittsburgh-building-permit-summary` `[found]` *(accessed 2026-09-26)*
- [HUD LIHTC FeatureServer/0](https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/LIHTC/FeatureServer/0) `[read]` *(accessed 2026-09-26)*: stale after 2019
- [prohousingpgh/pittsburgh_iz](https://github.com/prohousingpgh/pittsburgh_iz) `[read]` *(accessed 2026-09-26)*
- [Organizer Public Data Catalog (Google Sheet)](https://docs.google.com/spreadsheets/d/19CKyt1kansUZ3VGOAOBihYYxNFuitx5VTkzOiEy4iXA) `[read]` *(accessed 2026-09-26)*; saved copy [../../sources/organizers-2026-09-26-public-data-catalog.csv](../../sources/organizers-2026-09-26-public-data-catalog.csv)
- Sweep: [../../sweeps/r2-deeper-data-sources.md](../../sweeps/r2-deeper-data-sources.md)
- Sweep: [../../sweeps/r2-approval-pathway-and-timelines.md](../../sweeps/r2-approval-pathway-and-timelines.md)
- Sweep: [../../sweeps/r1-zoning-data-code-and-reforms.md](../../sweeps/r1-zoning-data-code-and-reforms.md)
- Sweep: [../../sweeps/r3-reality-check-existing-tools.md](../../sweeps/r3-reality-check-existing-tools.md)
- [Adversarial critique](../../docs/04-critique.md) — rows 2, 3
- Notes: [../../archive/working-notes-2026-09-26/01-data-sources.md](../../archive/working-notes-2026-09-26/01-data-sources.md)
