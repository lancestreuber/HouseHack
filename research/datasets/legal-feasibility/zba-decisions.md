# ZBA decisions, 2023–2026 (City of Pittsburgh)

**One line:** 476 Zoning Board of Adjustment decisions, parsed from the Board's own decision PDFs and coded for housing scope, typology, units, relief type and outcome. All 476 are geocoded to a point.
**Why:** This is the historical "how legally hard is it" signal: when a housing project needs a variance or special exception, how often does the ZBA grant it, by district and housing type?
**As of:** 2026-09-26. Map layer id in the folder README: **L5**. These are raw coded facts, with no scores or weights.

## Files

| File | What |
|---|---|
| `zba-decisions.csv` | One row per decision (476). A superset of the round-5 2026 sample schema. |
| `zba-decisions.geojson` | The same rows as points (EPSG:4326). `decision_text_excerpt` and `relief_items` are left out to keep the file small. |
| `zba-outcomes-by-district-typology.csv` | Outcome counts by `zon_base` × `housing_scope` × `typology` × `relief_type`, with `ALL` roll-up rows. Every row carries `n`, and `small_n_flag=yes` when n < 10. |
| `scripts/zba/` | The crawl, parse, code, geocode and write scripts; `overrides.txt` (the manual coding of every row that was changed from the regex coding); the Wayback CDX listing; and the decision links taken from the archived old ZBA page. |

## Headline numbers (verified by recount from the CSV)

- **Decisions:** 476. By decision year: 2023: 139, 2024: 115, 2025: 121, 2026: 100 (to late Aug), 2016: 1 (a stray archived PDF).
- **Housing:**
  - **262** are housing (`is_housing=yes`).
  - **132** of those change, create or legalize dwelling units (`housing_units`): 67 new construction, 16 conversions, 8 unit additions, 38 legalizations/nonconforming reviews, 2 unit reductions, 1 other.
  - **130** are dimensional relief on existing homes (`residential_accessory`: fences, parking pads, decks, additions, garages, generators, subdivisions).
- **Outcomes, all 470 applicant-relief decisions:** 85% approved (400), 11% denied (52), 4% split (18). This excludes 4 third-party appeals and 2 "no relief needed" rulings.
- **Housing-unit cases, excluding 30 nonconforming reviews (all 30 confirmed):** n=101. 83 approved (82%), 13 denied, 5 split.

| Typology (unit cases, excl. NC reviews) | n | Approved | Denied | Split |
|---|---|---|---|---|
| single_detached | 21 | 18 | 2 | 1 |
| single_attached | 14 | 13 | 1 | 0 |
| two_unit | 24 | 20 | 3 | 1 |
| three_unit | 5 | 4 | 1 | 0 |
| multi_unit | 29 | 22 | 5 | 2 |
| senior/elderly | 3 | 3 | 0 | 0 |
| assisted_living/personal_care | 1 | 1 | 0 | 0 |
| other_residential (dorm, student living, multigenerational) | 4 | 2 | 1 | 1 |

| Relief type (unit cases, excl. NC) | n | Approved | Denied | Split | All cases (n / approved %) |
|---|---|---|---|---|---|
| use_variance | 30 | 22 | 6 | 2 | 58 / 78% |
| dimensional_variance | 69 | 56 | 8 | 5 | 319 / 81% |
| special_exception | 30 | 27 | 1 | 2 | 131 / 93% |
| aapp_parking | 1 | 1 | 0 | 0 | 10 / 100% |

| District base (unit cases, excl. NC) | n | Approved | Denied | Split |
|---|---|---|---|---|
| R1A | 24 | 20 | 3 | 1 |
| R2 | 18 | 12 | 5 | 1 |
| R1D | 14 | 12 | 1 | 1 |
| RM | 12 | 12 | 0 | 0 |
| UI | 10 | 9 | 0 | 1 |
| LNC | 5 | 3 | 1 | 1 |
| RIV | 5 | 5 | 0 | 0 |
| H | 3 | 2 | 1 | 0 |

- **Two-unit use variances in single-unit or H districts:** 6 cases. 3 approved, 2 denied (1 of them without prejudice), 1 split in which the use part was denied.
- **Parking pads** (§912.04.L and "parking pad" requests), across all scopes: n=39. 23 approved, 13 denied, 3 split. This is the least successful common request.
- **Hearing to decision:** n=468. Median **34 days**, IQR 26–41, range 1–118. The share over 45 days was 14% in 2023, 8% in 2024, 14% in 2025 and 19% in 2026.

Small cells: most district × typology cells have n < 5. Treat them as indicative only.

## Sources and method

1. **Live meeting pages (2025–2026).**
   - The page slugs `https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/ZBA-Agendas/ZBA-<Month>-<D>-<YYYY>` were requested for every Thursday from 2022-01-06 to 2026-10-15.
   - 61 pages returned 200, starting 2025-01-02. Every 2022–2024 Thursday returned 404.
   - The crawl kept 222 links whose title or URL says "decision"; 220 were decision PDFs.
   - Access: plain `curl` gets an Akamai 403. The `curl_cffi` library with Chrome TLS impersonation returns 200. The crawl paused about 1 s between requests.
2. **Wayback CDX, new site folder.**
   - Query: `https://web.archive.org/cdx/search/cdx?url=pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/&matchType=prefix&output=json&fl=original,timestamp,statuscode,mimetype,digest&collapse=urlkey`
   - It returned 1,091 URLs, mostly captured in Feb 2025.
   - 217 likely-decision PDFs were fetched with the `id_` raw form at a 4 s delay.
   - ⚠ Files named `NNNNN_zba_<n>_of_<yyyy>_...` (2021–2023) are **ZBA Requests Supplements**, not decisions; this was checked by opening a sample. Decisions use the `<address>_-_<lot-block>_-_<n>_of_<yyyy>` pattern (2023) or hyphenated names (2024).
3. **Archived old ZBA page.**
   - Snapshots of `pittsburghpa.gov/dcp/zba` (2023, 2024-04-24, 2024-07-19, 2024-10-08) list 253 "Decision" links on `apps.pittsburghpa.gov/redtail/images/...`.
   - The redtail host no longer responds, and its Wayback captures are 302s that were not archived.
   - 89 of those files were found live at `.../zoning-board-of-adjustment/<lowercased original name>`. 30 were not found under any name tried; they are listed in `scripts/zba/unrecovered-2024-decision-files.txt` and are mostly Jun–Oct 2024.
4. **No decisions posted before 2023.** The archived 2023 ZBA page says "To request a copy of a ZBA decision, contact zoningboard@pittsburghpa.gov". The `zba-archive` and `zba-archive-15-16` pages link no decisions. The one 2016 decision is a stray scanned PDF, read with macOS Vision OCR.
5. **Parsing.**
   - `pdftotext -layout` extracted the text. All decisions except the 2016 one have a text layer.
   - Regex pulled the caption (hearing and decision dates, zone case, address, lot and block, district, ward, neighborhood, request, application), the relief table, and the "Decision:" paragraph.
   - Rows were de-duplicated on zone case + address. The live copy was preferred.
6. **Coding.**
   - **Outcome:** regex on the decision paragraph (APPROVED / DENIED / without prejudice / "may continue" / appeal wording). "With conditions" means the paragraph contains "subject to" or "condition".
   - **Validation:** the regex was checked against the 87 overlapping rows of the round-5 hand-coded 2026 sample. It agreed on 78. For all overlapping rows the sample's code is used (`outcome_source`).
   - **Relief types:** taken from the decision paragraph first, with relief-table rows added only for sections the paragraph doesn't cite. 20 table/paragraph conflicts were resolved in favor of the paragraph, e.g. tables labelling a §921.02 special exception "Variance".
   - **Manual review:** housing scope, typology and units were **hand-reviewed for every housing-unit case** and most others (`overrides.txt`, 243 rows).
   - **Accessory typology:** for `residential_accessory` rows without a manual code, `typology` comes from text matching after stripping district-name phrases like "Residential Two Unit"; `typology_source` says so. It is often `other_residential` because the dwelling type is not stated.
7. **Geocoding.**
   - Lot/block → 16-character PIN (`24-F-196` → `0024F00196000000`), then WPRDC parcel centroids (resource `3fab7152-3f11-4788-8372-4c33f86ea813`, March 2025) → **456**.
   - Fallback 1: centroid of the County `OPENDATA/Parcels/MapServer/0` polygon → **4**.
   - Fallback 2: Census `onelineaddress` geocoder on the first address → **16**, mostly lots with no caption or with parcels consolidated after 2025.
   - Multi-parcel captions are placed at the first matched parcel (see `notes`).

## Coverage (by the case-number year in "N of YYYY")

| Case year | Distinct case numbers in data | Highest number seen | Coverage (lower bound on filed cases) |
|---|---|---|---|
| 2023 | 150 | 206 | 73% |
| 2024 | 115 | 188 | 61% |
| 2025 | 127 | 190 | 67% |
| 2026 | 73 | 102 | 72% (year still running) |

Coverage is measured against the highest number seen. Missing numbers include withdrawn, continued or undecided cases, cases decided but never posted, and the 30 unrecovered 2024 files.

## Field dictionary (`zba-decisions.csv`)

**Identifiers and dates**

| Field | Meaning |
|---|---|
| `zone_case` | As captioned, "N of YYYY". Numbers are not unique: a few PDFs reuse or mistype them (see `notes`). |
| `bda_application` | Application number as captioned (BDA-/DCP-ZDR-). Joins to OneStopPGH. |
| `year` | Decision year. It is the hearing year if the printed decision date precedes the hearing. |
| `hearing_date` | Last hearing date listed in the caption. |
| `first_hearing_date_listed` | Earliest hearing date listed, when the caption lists more than one. |
| `decision_date` | Decision date. Blank for 4 PDFs that print "May __", "October 154" and similar. |
| `days_hearing_to_decision` | Days from `hearing_date` to `decision_date`. Blank when the printed dates imply a year typo (<0 or >300 days). |

**Location**

| Field | Meaning |
|---|---|
| `address`, `lot_block`, `ward`, `neighborhood` | As captioned. |
| `parcel_pin` | 16-character PIN used for the point. |
| `zon_new` | Zoning district as captioned. It may list 2 districts, e.g. "P, R1D-L". |
| `zon_base` | First district's prefix: R1D, R1A, R2, RM, H, LNC, UI, RIV, R-MU, SP… |
| `lat`, `lon` | Point location, EPSG:4326. |
| `geocode_method` | `parcel_centroid_wprdc`, `parcel_polygon_centroid_county_gis` or `census_geocoder_address`. |

**Project**

| Field | Meaning |
|---|---|
| `request_as_captioned` | The Request line. It is sometimes only an application number. |
| `is_housing` | `yes` when `housing_scope` is `housing_units` or `residential_accessory`. |
| `housing_scope` | `housing_units`: creates, converts, adds, removes or legalizes dwelling units, or builds new residential structures. `residential_accessory`: dimensional or accessory relief on a residential property with no unit change. `non_housing`. |
| `typology` | single_detached, single_attached, two_unit, three_unit, multi_unit (4+), senior/elderly, assisted_living/personal_care, community_home, other_residential, non_residential. |
| `typology_source` | `manual` or `auto`. |
| `units_before`, `units_after`, `units_added` | Only when stated in the decision. Blank otherwise; nothing is inferred. |
| `residential_units_class` | NEW, CONV, ADD, LEGAL (existing units confirmed or legalized), REDUCE, NONE. |

**Relief and outcome**

| Field | Meaning |
|---|---|
| `relief_type` | Pipe list of use_variance (variance from §911), dimensional_variance (any other variance), special_exception, aapp_parking (§914.07 off-site/alternative parking), appeal, nonconforming_review. |
| `relief_sections` | Section families cited, e.g. 903.03, 911.02. |
| `relief_items` | TYPE\|section pairs (V, SE, APPEAL, REVIEW). |
| `outcome_code` | A, AC, D, DWP, S, NC, APD, APG, NR. |
| `outcome_group` | approved = A/AC/NC; denied = D/DWP; split; appeal; no_relief_needed. |
| `outcome_source` | `2026 hand-coded sample`, `auto (regex…, reviewed)` or `manual`. |
| `decision_text_excerpt` | First 500 characters of the Decision paragraph, with recusal lines stripped. |

**Provenance**

| Field | Meaning |
|---|---|
| `decision_pdf` | Live URL, or Wayback URL with timestamp. |
| `source` | Where the PDF came from. |
| `meeting_page_date` | For live-crawled rows, the meeting page the link was found on. |
| `notes` | Data-quality flags. |

**PII:** the CSV holds no applicant, owner, attorney, objector or board-member names. Captions name owners and applicants, but those fields were never extracted.

## Biases and caveats (read before quoting a rate)

- **Withdrawn cases are invisible.** Withdrawn and never-decided cases get no posted decision, so every approval rate here is **conditional on a decision being issued and posted**. If withdrawals are mostly would-be denials, the true success rate for filers is lower. The rates are biased **upward**.
- **Archive gaps.**
  - 2024 is the thinnest year: 30 decisions linked on the old page were not recoverable, mostly Jun–Oct 2024.
  - Nov–Dec 2024 hearings appear only if they were decided in 2025 and linked on 2025 pages.
  - 2025 meeting pages do not all post decisions.
  - Meetings on non-Thursday dates or with non-standard slugs were not crawled.
- **Nonconforming reviews (30 two-/three-/multi-unit legalizations) were all confirmed.** They are counted as `approved` but kept apart as `relief_type=nonconforming_review`. Exclude them when asking "how often is new relief granted". The headline tables above exclude them.
- **Case-level outcomes.** A split means part of the relief was denied. A case with both a variance and a special exception is counted under both relief types in the aggregate, so the `relief_type` rows are not additive. `relief_type=ALL` counts each case once.
- **Typology is one coder's reading.** Mixed projects are coded to their dominant type: e.g. 148 of 2024 (70 townhouses/apartments + 60 senior + 50 apartments) is senior/elderly, and 68 of 2023 (2 attached + 1 detached) is single_attached. For accessory rows, typology is text-matched and often unknown.
- **Outcome regex:** "with conditions" includes routine DOMI curb-cut review. The 2026 sample coded one "consistent with the plans" approval as AC, where the regex gives A.
- **Printed-date errors:** there are year typos in 3 PDFs and a hearing-year typo in 1 (days blanked). Several file names carry the wrong case number (flagged in `notes`).
- Rates are **not** adjusted for project size, neighborhood opposition or year. There are no composite scores.

## Suggested map style (L5)

- Overlay group **"Legal feasibility"**, layer "ZBA decisions (2023–2026)".
- Circles colored by `outcome_group`:
  - approved: green
  - approved with conditions (`outcome_code=AC`): light green, or a ring
  - denied: red
  - split: amber
  - appeal / no_relief_needed: grey
- Default filter `is_housing=yes`; toggle `housing_scope=housing_units` only. Size by `units_after` where present, otherwise a fixed small radius.
- Popup: `zone_case`, `address`, `zon_new`, `typology`, `request_as_captioned`, `relief_type`, `outcome`, `decision_date`, and a link to `decision_pdf`.
- Pair it with a district-level choropleth only from `zba-outcomes-by-district-typology.csv` rows with n ≥ 10, and show `n` on hover.
