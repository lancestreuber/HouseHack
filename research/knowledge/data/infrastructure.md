# Infrastructure (sewer, water, stormwater, transit, power)

**Type:** data
**One line:** What public infrastructure data exists per parcel (sewer lines, sewersheds and CSO stress, lead service lines, transit), what we did not find (water mains, sewer capacity, electric hosting capacity; ⚠ search only *(corrected 2026-09-26 per docs/04-critique.md row 20)*), and how PWSA decides capacity per project *(updated 2026-09-26, round 5)*.
**Why we care:** Infrastructure capacity is a real barrier to new units, but most of it is not published. A score can use proxies and must state the gaps as limitations.
**Last checked:** 2026-09-26

## Available

| Item | Endpoint | Count / fields | Vintage | Tag |
|---|---|---|---|---|
| Sewer lines (county AGOL) | `Pittsburgh_Sewers/FeatureServer/0` | 125,128 segments; owner (pwsa), System_Type (combined/separate), Pipe_Flow_Type, Diameter_Range (e.g. "36-59") | **2012 export** ("20120113 LBs export"), dated | `[read]` (100 m buffer query worked) |
| Sewersheds (city) | `C/PGHWebSewersheds/FeatureServer/0` | 233; `cso_shed`, `sewertype`; downtown → `A-04, Combined` | not stated | `[read]` |
| Sewersheds (PWSA) | `https://services5.arcgis.com/jAsbh6V9IpseXByp/arcgis/rest/services/Sewersheds/FeatureServer/0` | typical-year CSO volume, events, duration, RANK. **Best available sewer-stress proxy** | not stated | `[read]` |
| Sewer / water authority | county `Allegheny_Sewer`, `Allegheny_Water` | authority for any point | not stated | `[read]` |
| Lead service lines | `https://services5.arcgis.com/jAsbh6V9IpseXByp/arcgis/rest/services/PGH2O_Water_Service_Line_Material/FeatureServer/0` | 80,876 points; Address, FinalReportedMaterialPublic, FinalReportedMaterialPrivate | not stated | `[read]` |
| Lead replacement areas | PWSA `Lead_Service_Line_Replacement_Areas` | | | `[found]` |
| PRT stops (WPRDC) | resource `d6e6ed6e-9220-4a0e-9796-e72d83ce8e7a` | 6,389 stops with `trips_wd`, `trips_sa`, `trips_su`, `trips_7d`, `route_filter` | | `[read]` |
| GTFS static | `https://www.rideprt.org/developerresources/GTFS.zip` | 22.5 MB | last-modified 2026-09-26 | `[read]` |

`C = https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services`. The county AGOL sewer layer's full host path was not recorded in the sweep.

GTFS gotcha: the old `portauthority.org/generaltransitfeed/` path returns 404. Organizer catalog caveat: scheduled service is not realized reliability, and the agency appears historically as "Port Authority".

## Named but not queried
- PWSA `Stormwater_Issue_Public_Reporting`; WPRDC `pwsa-inlets`; Allegheny County `Act167` and `Stormwater_BMPs` `[found]`.
- PWSA `PWSA_Project_Locations` (GI projects) `[found]`.
- GTFS-realtime `https://truetime.portauthority.org/gtfsrt-bus/` and `…/gtfsrt-train/` (unverified).

## Not found publicly (state as limitations)

⚠ **Absence of evidence, not evidence of absence** *(corrected 2026-09-26 per docs/04-critique.md row 20)*. We found no public capacity data (search only; PWSA's ArcGIS service list was checked for water mains). The tool and the pitch should say "unknown", not "no data exists" or "fails".
- **PWSA water mains:** no public water-main layer among the 85 services in PWSA's ArcGIS org; only service areas, repair-contract sites and reliability-plan projects `[read]` (service list inspected).
- **Sewer and treatment capacity (PWSA, ALCOSAN):** **no public capacity map** *(updated 2026-09-26, round 5)*. Neither pgh2o.com nor an ArcGIS Online search turned up a sewer or water capacity layer; the public layers are sewersheds, `PWSA_Sanitary_Sewer_Areas` and project locations `[skimmed]` (search metadata). Capacity is determined **per project**, which fits the rule "capacity is unknown, not fails". ALCOSAN operates under the 2020 Modified Consent Decree.
- **Duquesne Light hosting capacity:** no public map found (search only, unverified); interconnection capacity comes from per-request studies.

## How PWSA decides capacity and service *(updated 2026-09-26, round 5)*
From the PWSA Developer's Manual (rev. **March 6, 2026**, 47 pp), the SFPM and Permits pages, the 2026 Fee Schedule and the 2025 Development Services Report `[read]` (excerpts saved at [../../sources/pgh2o-2026-09-26-developers-manual-sfpm-fees-excerpts.md](../../sources/pgh2o-2026-09-26-developers-manual-sfpm-fees-excerpts.md); [sweep](../../sweeps/r5-council-records-and-methodologies.md) §4):

- **DEP exemptions stopped on March 2, 2011.** The Manual: "On March 2, 2011, the DEP issued a determination that, due to an ongoing consent order regarding the discharge of untreated wastewater, the Pittsburgh Water and ALCOSAN do not comply with the Clean Streams Law. As a result, the DEP does not accept SFPM exemptions for any development located within the Pittsburgh Water service area" (citing 25 Pa. Code 71.51(2)). A snippet's "March 24, 2011" is not on the live page and is unverified.
- ⚠ **Not every project needs a planning module.** "No exemptions" applies only once planning is required. The Planning Workflow Diagram sets the thresholds `[skimmed]` (branch arrows reconstructed from extracted text): for a lot created **before May 15, 1972**, planning is triggered by existing flows >799 gpd **and** net flows >399 gpd, or project flows >799 gpd; for newer lots, by no prior planning approval, lots added since 1972, or flows above the prior approval. "Subdivisions which result in additional lots … **will always** result in the need for sewage planning"; consolidations and lot-line revisions "do not necessarily" trigger it `[read]`. The earlier claim that "most net-new-unit projects need one" is therefore too strong; it depends on flows and lot history.
- **Capacity test:** does the proposed flow cause a **dry-weather** hydraulic overload within **5 years** at the **most limited capacity sewer (MLCS)** downstream? PWSA gives the MLCS location in its portal. Present flow is measured by 5 flow-depth readings when project flow is ≤4,000 gpd, or 30-day professional monitoring above that. Peaking factors 3.5 (combined) / 3.0 (separate). ALCOSAN separately reviews conveyance and treatment.
- **What triggers a PWSA review:** every development permit starts with a mandatory **pre-development meeting**. A **development permit** is required for anything other than a single-family tap: single-family with fire service, subdivided lots, >2 homes in a planned development, >2 tap terminations. **Residential** (single-family new or reconnected tap) permits need no tap-in drawings and are "typically issued within two weeks". PE-stamped tap-in plans are needed for new taps or increased flow. A **Water & Sewer Availability ("will-serve") letter** is required where an SFPM is needed; it "is not a permit".
- **Timelines:** **30 business days per review** (expedited: guaranteed within **15**). SFPM sign-off runs PWSA → ALCOSAN → City Planning → Law (drafts a resolution) → **City Council resolution** → DEP; PWSA says this "could take **3-6 months**", and DEP "has up to 90 days to respond". "No Pittsburgh Water tap-in permits will be issued until final approval from DEP". Permits valid 5 years; applications lapse after 1 year of inactivity. A live example of the Council step: resolution **2026-0892** (SFPM revision for 929 Liberty Avenue) on the 9/30/26 Standing Committees agenda `[read]`.
- **2025 actuals:** 63 development permits and 32 availability requests; development permits took "an average of just **6 to 8 months**", including developer delays; fastest 68 days; one expedited review done in 9 days.
- **Fees (2026):** availability letter **$40**; residential permit $40; **development permit $740** (includes SFPM and tap-in review; expedited $1,290); SFPM review only $320; tap-in review only $420; connection $340 (1") to $400 (4–12"); 5/8" meter $190; typical single-family 1" service + meter $570 total. "Pittsburgh Water does not provide a preliminary cost estimation."


See [approval pathway](../policy/approval-pathway.md) for the stormwater (Ch. 1303: ≥10,000 sf disturbance or ≥5,000 sf new impervious) and ACCD Chapter 102 (≥1 acre) triggers.

## Open questions
- Does PWSA or ALCOSAN publish any capacity-constrained area map? None found on pgh2o.com or ArcGIS Online (round 5); still search-only.
- Can the MLCS for a parcel be looked up before a pre-development meeting (the portal is not public)?
- The Planning Workflow Diagram's branch arrows should be checked against the graphic.
- Current county sewer geometry newer than 2012?
- GTFS-realtime endpoints: not tested.
- Duquesne Light hosting capacity: search-only finding.

## Connects to
- [Approval pathway](../policy/approval-pathway.md): SFPM, PWSA, stormwater triggers
- [Permit timelines](../policy/permit-timelines.md)
- [Environmental constraints](environmental-constraints.md): floodplain, stormwater burden
- [Market and affordability](market-and-affordability.md): walkability, jobs access
- [Track 3 indicators and data](../track3/indicators-and-data.md): transit access for climate scoring
- [Uncertainty and explainability](../methods/uncertainty-and-explainability.md): stating gaps as limitations

## Sources
- County AGOL `Pittsburgh_Sewers/FeatureServer/0` `[read]` *(accessed 2026-09-26)*: 2012 export; full host path not recorded
- [City PGHWebSewersheds](https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services/PGHWebSewersheds/FeatureServer/0) `[read]` *(accessed 2026-09-26)*
- [PWSA Sewersheds](https://services5.arcgis.com/jAsbh6V9IpseXByp/arcgis/rest/services/Sewersheds/FeatureServer/0) `[read]` *(accessed 2026-09-26)*: CSO stress proxy
- County `Allegheny_Sewer`, `Allegheny_Water` `[read]` *(accessed 2026-09-26)*: full paths not recorded
- [PWSA service line material](https://services5.arcgis.com/jAsbh6V9IpseXByp/arcgis/rest/services/PGH2O_Water_Service_Line_Material/FeatureServer/0) `[read]` *(accessed 2026-09-26)*
- PWSA ArcGIS org service list (85 services) `[read]` *(accessed 2026-09-26)*: basis for "no water mains"
- [WPRDC PRT stops d6e6ed6e](https://data.wprdc.org/api/3/action/datastore_search?resource_id=d6e6ed6e-9220-4a0e-9796-e72d83ce8e7a) `[read]` *(accessed 2026-09-26)*
- [PRT GTFS.zip](https://www.rideprt.org/developerresources/GTFS.zip) `[read]` *(accessed 2026-09-26)*
- [PRT GTFS-realtime bus](https://truetime.portauthority.org/gtfsrt-bus/) `[found]` *(accessed 2026-09-26)*: untested
- [PWSA DEP Sewage Facilities Planning Module page](https://www.pgh2o.com/developers-contractors-vendors/permits/dep-sewage-facilities-planning-module) `[read]` *(accessed 2026-09-26; upgraded round 5)*: sign-off chain, 3–6 months
- [PWSA Developer's Manual, rev. March 6, 2026 (PDF)](https://www.pgh2o.com/sites/default/files/2026-03/2026%20Developer%27s%20Manual.pdf) `[read]` *(accessed 2026-09-26, round 5)*: 2011 DEP determination, capacity test, review times; excerpts at [../../sources/pgh2o-2026-09-26-developers-manual-sfpm-fees-excerpts.md](../../sources/pgh2o-2026-09-26-developers-manual-sfpm-fees-excerpts.md)
- [PWSA Permits page](https://www.pgh2o.com/developers-contractors-vendors/permits) `[read]` *(accessed 2026-09-26, round 5)*: permit types
- [PWSA Tap-in Plan Review page](https://www.pgh2o.com/developers-contractors-vendors/permits/water-and-sewer-tap-plan-review) `[read]` *(accessed 2026-09-26, round 5)*
- [PWSA 2026 Fee Schedule (PDF)](https://www.pgh2o.com/sites/default/files/2026-01/Fee%20Schedule%202026_0.pdf) `[read]` *(accessed 2026-09-26, round 5)*
- [PWSA Planning Workflow Diagram (PDF)](https://www.pgh2o.com/sites/default/files/2025-04/WSUse_PlanningWorkflowDiagram.pdf) `[skimmed]` *(accessed 2026-09-26, round 5)*: text extracted; arrows reconstructed
- [PWSA Development Services Report, 2025 in Review (PDF)](https://www.pgh2o.com/sites/default/files/2026-01/Development%20Services%20Report%202025%20For%20Website.pdf) `[read]` *(accessed 2026-09-26, round 5)*: 6–8 month average
- ArcGIS Online search for PWSA sewer layers `[skimmed]` *(accessed 2026-09-26, round 5)*: metadata only; no capacity layer
- Sweep: [../../sweeps/r5-council-records-and-methodologies.md](../../sweeps/r5-council-records-and-methodologies.md) §4
- [WPRDC PRT transit data (organizer catalog URL)](https://data.wprdc.org/dataset/port-authority-of-allegheny-county-transit-data) `[found]` *(accessed 2026-09-26)*
- [Organizer Public Data Catalog (Google Sheet)](https://docs.google.com/spreadsheets/d/19CKyt1kansUZ3VGOAOBihYYxNFuitx5VTkzOiEy4iXA) `[read]` *(accessed 2026-09-26)*; saved copy [../../sources/organizers-2026-09-26-public-data-catalog.csv](../../sources/organizers-2026-09-26-public-data-catalog.csv)
- Sweep: [../../sweeps/r1-parcel-environmental-infrastructure-data.md](../../sweeps/r1-parcel-environmental-infrastructure-data.md)
- Sweep: [../../sweeps/r2-deeper-data-sources.md](../../sweeps/r2-deeper-data-sources.md)
- Sweep: [../../sweeps/r2-approval-pathway-and-timelines.md](../../sweeps/r2-approval-pathway-and-timelines.md)
- [Adversarial critique](../../docs/04-critique.md) — row 20
