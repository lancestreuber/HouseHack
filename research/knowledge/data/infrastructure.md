# Infrastructure (sewer, water, stormwater, transit, power)

**Type:** data
**One line:** What public infrastructure data exists per parcel (sewer lines, sewersheds and CSO stress, lead service lines, transit) and what we did not find (water mains, sewer capacity, electric hosting capacity; ⚠ search only *(corrected 2026-09-26 per docs/04-critique.md row 20)*).
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
- **Sewer and treatment capacity (PWSA, ALCOSAN):** no public data found (unverified beyond search). ALCOSAN operates under the 2020 Modified Consent Decree; the sweep reports DEP has allowed no planning-module exemptions since 2011, so most net-new-unit projects need a **DEP Sewage Facilities Planning Module** (3–6 months per a PWSA page, `[skimmed]` in the approval sweep). Capacity is determined in that process and PWSA permit review, not from a dataset.
- **PWSA Water & Sewer Use Application:** required for anything bigger than one single-family unit, any subdivision, any multi-unit (`[skimmed]`, pgh2o.com).
- **Duquesne Light hosting capacity:** no public map found (search only, unverified); interconnection capacity comes from per-request studies.

See [approval pathway](../policy/approval-pathway.md) for the stormwater (Ch. 1303: ≥10,000 sf disturbance or ≥5,000 sf new impervious) and ACCD Chapter 102 (≥1 acre) triggers.

## Open questions
- Does PWSA or ALCOSAN publish any capacity-constrained area map? (unverified that none exists)
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
- [PWSA DEP Sewage Facilities Planning Module page](https://www.pgh2o.com/developers-contractors-vendors/permits/dep-sewage-facilities-planning-module) `[skimmed]` *(accessed 2026-09-26)*
- [WPRDC PRT transit data (organizer catalog URL)](https://data.wprdc.org/dataset/port-authority-of-allegheny-county-transit-data) `[found]` *(accessed 2026-09-26)*
- [Organizer Public Data Catalog (Google Sheet)](https://docs.google.com/spreadsheets/d/19CKyt1kansUZ3VGOAOBihYYxNFuitx5VTkzOiEy4iXA) `[read]` *(accessed 2026-09-26)*; saved copy [../../sources/organizers-2026-09-26-public-data-catalog.csv](../../sources/organizers-2026-09-26-public-data-catalog.csv)
- Sweep: [../../sweeps/r1-parcel-environmental-infrastructure-data.md](../../sweeps/r1-parcel-environmental-infrastructure-data.md)
- Sweep: [../../sweeps/r2-deeper-data-sources.md](../../sweeps/r2-deeper-data-sources.md)
- Sweep: [../../sweeps/r2-approval-pathway-and-timelines.md](../../sweeps/r2-approval-pathway-and-timelines.md)
- [Adversarial critique](../../docs/04-critique.md) — row 20
