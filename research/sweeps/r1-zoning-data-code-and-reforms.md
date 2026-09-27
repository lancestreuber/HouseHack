# Sweep: Zoning GIS, code text, use table, reforms 2023-2026, ZBA/permit data

**Round 1** · 2026-09-26 · single research subagent, web search and fetch plus live endpoint probes

> Archived at full fidelity, exactly as the agent reported it. Its tags are its own: some sweeps use [V]/[S]/[U] and some use [F]/[S]. The paper maps these onto `[read]` / `[skimmed]` / `[found]` / `[inaccessible]`. Local scratch paths have been replaced with `<scratch>`. Treat claims here as leads, and check the paper and the corrections log before citing.

---

## Pittsburgh zoning research: data sources, rules and reforms (as of Sep 26, 2026)

"Verified" means I fetched or queried it in this session. "Unverified" means it comes only from a search snippet or a secondary summary.

### 1. City zoning GIS (verified)
All layers are ArcGIS FeatureServers under `https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services/`. Their native spatial reference is EPSG:2272, but they accept `inSR=4326`.

- **Base zoning: `PGHWebZoning/FeatureServer/0`** (1,069 polygons, maxRecordCount 1000).
  - WPRDC dataset `zoning` (modified 2026-09-23) also has GeoJSON, CSV, KML and SHP downloads.
  - The district code field is **`zon_new`** (e.g. `R1D-M`, `RM-H`, `H`, `LNC`, `RIV-MU`, `SP-5`).
  - Other useful fields: `full_zoning_type`, `legendtype`, `status`, and `municode`, which holds the eCode360 link for the district's section.
  - I tested a point-in-polygon query at -79.9156, 40.4764 and it returned `R1D-M`.
  - `H` is a base district, not an overlay (65 polygons).
  - There is also `Multi_Unit_Zoning_Districts` (417 features, same schema plus an `Asterisk` field).
- **Combined overlays: `PGHWebZoningOverlays/0`** (139 polygons, fields `overlay`, `criteria`).
  - It mixes several things in free-text strings: parking reduction (25/50/100%), riverfront height caps (45/90/150/250 ft), Inclusionary Housing Overlay (IZ-O), Baum Centre, North Side Commercial Parking, Riparian Buffer, and RCO (Registered Community Organization) areas.
  - You would have to parse the strings with regex.
- **Single-purpose layers** (feature counts from queries):

| Layer | Features | Key field(s) |
|---|---|---|
| `InclusionaryHousingOverlayDistrict` | 1 | |
| `Riverfront_IPOD` | 5 | `Type` = 50/95/200 ft bands |
| `PGHWebRiverfrontOverlay` | | |
| `PGHZoningRiverfrontHeightOverlay` | | |
| `PGHWebUptownIPOD` | | |
| `PGHWebParkingReductionOverlay` | | |
| `PGHWebBaumCentreOverlay` | | |
| `PGHWEBNorthSideCommercialParkingOverlay` | | |
| `HeightReductionZone_ZoningOverlay` | 4 | |
| `PGHWebCHDHistoricDistricts` | 21 | `historic_name` (e.g. Mexican War Streets, Deutschtown, Manchester) |
| `PGHWebLandslideProne` | 37 | `landslideprone`=Yes |
| `PGHWebSlope25` | 1,714 | 25%+ slope |
| `PGHWebUndermined` | 47 | `undermined` |
| `PGHWebFEMA2014` | | flood zones |

- WPRDC also lists `city-designated-historic-districts`, `city-designated-individual-historic-sites`, `landslide-prone-areas`, `25-or-greater-slope` and `undermined-areas`.
- The CKAN search works: `https://data.wprdc.org/api/3/action/package_search?q=zoning` returned 75 results.

### 2. Zoning Code text (Title Nine)
- The GIS `municode` field points to **eCode360** (e.g. Chapter 903 at `https://ecode360.com/45474194`). Municode library pages (`library.municode.com/pa/pittsburgh/...`) still exist but are a JavaScript single-page app.
- **Neither is easy to scrape.**
  - eCode360 returned a 403 Cloudflare challenge to both curl and WebFetch.
  - pittsburghpa.gov PDFs also return 403 to curl. WebFetch did download them, and I extracted the text with `pdftotext`.
  - `pittsburgh-pa.elaws.us` (a mirror) timed out.
  - **Plan to hand-transcribe the dimensional table into JSON.**
- **Structure:** five Use Subdistricts (R1D, R1A, R2, R3, RM) combined with five Development Subdistricts (VL/L/M/H/VH). Site standards are in **§903.03.A–E**. Contextual setbacks and heights are in §925.06–.07, environmental standards in Ch. 915, and residential compatibility in Ch. 916.
- **Numbers (verified)** come from Ord. 2025-1579's amendment text (Planning Commission (PC) draft 2024-12-10). It shows old → new values as strikethrough/underline; old/new is inferred from word order.

| | VL | L | M | H | VH |
|---|---|---|---|---|---|
| Min lot size (old → new) | 8,000 → 6,000 sf | 5,000 → 3,000 | 3,200 → 2,400 | 1,800 → 1,200 | 1,200 → eliminated* |
| Lot area per unit (old, now **eliminated**) | 8,000 | 3,000 | 1,800 | 750 | 400 |
| Front / rear setback, R1D–R3 | 30 / 30 | 30 / 30 | 30 / 30 | 15 / 15 | 5 / 15 |
| Front / rear setback, RM | 30 / 30 | 25 / 25 | 25 / 25 | 25 / 25 | 25 / 25 |
| Interior side yard, R1D–R3 | 5 | 5 | 5 | 5 | 5 |
| Interior side yard, RM | 30 | 25 | 10 | 10 | 10 |
| Max height, R1D–R3 | 40 ft / 3 st | 40 / 3 | 40 / 3 | 40 / 3 | 40 / 3 |
| Max height, RM | 40 / 3 | 40 / 3 | 55 / 4 | 85 / 9 | "no limit / 180 ft"* |

\*Which value was struck is ambiguous in the text extraction. The "eliminated" VH lot size is backed by secondary sources. A party-wall (attached) lot has a zero interior side yard.

**Min lot width:** not found in these tables. It is unverified whether one exists.

### 3. Use table (§911.02)
Legend: P = permitted by right, A = administrator exception, S = special exception, C = conditional use. This is verified from the use table attached to Bill 2024-0701 (July 2024), which reflects the code as it stood then:
- **Single-unit detached:** P in R1D, R1A, R2, R3, RM.
- **Single-unit attached:** P/S in R1D; P in R1A, R2, R3, RM.
- **Two-unit:** P in R2, R3, RM. Not allowed in R1D or R1A.
- **Three-unit:** P in R3 and RM only.
- **Multi-unit (4+ units):** P only in RM among residential districts. Also P in NDO, LNC, NDI and UNC. Use standard §911.04.A.85.
- **Assisted Living A:** S in R1D, R1A, R2, R3, RM.
- **Community Home:** S in residential districts (2024-0701 proposed changing it to C; I did not check whether it passed).

Scoring implication: if the target unit count exceeds the district's P ceiling, flag it as needing a use variance.

### 4. Reforms 2023–2026
- **Minimum lot size, Bill 2025-1579:** adopted May 5–6, 2025 (8–0) and signed May 7. It eliminates lot-area-per-unit in all residential districts. Verified via the EngagePgh page and search results.
- **Bill 2025-1545 (Housing Needs Assessment bill) is still pending:**
  - It would allow ADUs by right citywide (replacing the ADU overlay pilot) and eliminate minimum parking.
  - Mandatory citywide inclusionary zoning was replaced in October 2025 (5–4 council vote) by an optional **Affordable Housing Bonus Program**.
  - PC gave a positive recommendation on June 2, 2026, and a council public hearing was scheduled for **Sept 23, 2026**.
  - I could not confirm a final vote. It is not adopted as of the EngagePgh status I fetched.
  - The existing IZ-O overlay (Lawrenceville, Bloomfield, Polish Hill, Oakland) remains in effect in GIS.
- **Mayor Corey O'Connor took office in January 2026** (verified via WESA).
  - He ordered a 60-day permitting review on his first day.
  - On March 9, 2026 he announced a two-phase plan: Phase I is near-term permitting fixes and a city-led public review in place of the RCO process; Phase II is a comprehensive **zoning code update** tied to a $6M 2050 comprehensive plan.
  - Search snippets name this as EO 2026-01; I did not verify the number.
  - He has said citywide inclusionary zoning is "off the table" (per search snippet).
  - Sept 2026: an "EZ Permit" one-day fast lane and virtual inspections (per WESA, 2026-09-25).

### 5. ZBA and permit data
- **There is no structured ZBA or variance dataset** on WPRDC (searches for "zoning board" and "variance" found none).
  - Decisions are **per-case PDFs** under `pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/` (e.g. `e-jefferson-street-3-of-2026-zba-decision.pdf`).
  - Agenda PDFs and per-hearing pages sit under `.../City-Planning-Meetings/ZBA-Agendas/ZBA-<date>/Decisions`.
  - Getting variance history means scraping PDFs and parsing addresses.
  - The `ZoningApplications` FeatureServer exists but returns **0 records**.
- **OneStopPGH backing layer (verified):** `https://pghbridgis.pittsburghpa.gov/hosting/rest/services/Hosted/OSPI_H/FeatureServer/0`.
  - 330,166 records with `parc_num`, `type`, `status`, `record_id`, `workflows` (JSON), `work_desc`, `issue_date` and `total_proj_value`.
  - It includes **18,937 "Zoning Development Review Application"** records (DCP-ZDR-2019 onward).
  - Their workflow steps are only completeness check and review, with **no ZBA or variance step exposed**.
  - A keyword search of `work_desc`/`process_summary_data` found only 49 "variance" and 11 "ZBA" hits.
  - It is a weak proxy, but it is joinable by parcel.
- **PLI permits:**
  - WPRDC `pli-permits` (resource `f4d1177a-f597-4c32-8cbf-7885f56253f6`): 65,378 rows from 2019-06 on, with `permit_id`, `permit_type`, `work_description`, `work_type`, `commercial_or_residential`, `total_project_value`, `issue_date`, `parcel_num`, `latitude`/`longitude`, `status`.
  - `datastore_search` works; **`datastore_search_sql` is blocked (CloudFront 403).**
  - ArcGIS mirror `PLI_Permits/0` has 61,022 rows. Its issue dates end 2026-01-27, so it is stale.
  - Historical permits from 2012: `city-of-pittsburgh-building-permit-summary`.

### 6. Outside the city (coverage gap)
- **I found no county-wide zoning layer.**
  - Allegheny County's AGOL org (`services1.arcgis.com/vdNDkVykv9vEWFX4`) and `gisdata.alleghenycounty.us` have municipal boundaries, a generic `Land_Use` layer (21,520 features, feature codes only) and parcels, but no zoning.
  - WPRDC searches for "municipal zoning" and "zoning allegheny" found none.
- Only piecemeal sources exist:
  - ZoningPoint, a commercial per-municipality site (unverified).
  - The Quaker Valley COG's COG-wide GIS for member municipalities only (unverified).
  - Individual municipal PDFs.
- **Recommendation:** score zoning only for City of Pittsburgh parcels. For the other ~129 municipalities, use the municipal-boundary layer to show "zoning unavailable" and still compute environmental flags from county-wide layers such as landslides and FEMA flood zones.

Sources:
- https://engage.pittsburghpa.gov/implementing-housing-needs-assessment
- https://www.wesanews.org/politics-government/2026-03-09/pittsburgh-permitting-zoning-reforms
- https://www.wesanews.org/politics-government/2026-09-25/housing-policy-priority-pittsburgh-allegheny-county
- https://www.wesa.fm/politics-government/2025-10-15/inclusionary-zoning-debate-rages-on-as-pittsburgh-city-council-votes-to-rewrite-proposed-policy
- https://www.post-gazette.com/news/politics-local/2025/05/06/pittsburgh-housing-zoning-lots-gainey/stories/202505060064
- https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/draft-minimum-lot-size-legislation_pc-hearing-and-action_2024-12-10.pdf
- https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/planning-commission/council-bill-draft-legislation-2024-0701.pdf
- https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/e-jefferson-street-3-of-2026-zba-decision.pdf
- https://ecode360.com/45474194

No project files were modified.
