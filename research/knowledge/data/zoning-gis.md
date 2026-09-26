# Zoning GIS (City of Pittsburgh)

**Type:** data
**One line:** The City's ArcGIS FeatureServers for base zoning districts, overlays, historic districts and RCO areas, and how to query them per parcel.
**Why we care:** The base district (`zon_new`) selects the dimensional row and the use-table column; overlays add height caps, parking reductions, inclusionary requirements and review steps. This is the binding spatial input for a Track 1 score inside the city.
**Last checked:** 2026-09-26

## Access
- Base: `C = https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services` (City AGOL org, ~977 services).
- Native spatial reference EPSG:2272; layers accept `inSR=4326`.
- Point or polygon query: `geometry=lon,lat&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects` (polygon geometry also works).
- WPRDC CKAN search `https://data.wprdc.org/api/3/action/package_search?q=zoning` returned 75 results `[read]`.

## Base districts: `C/PGHWebZoning/FeatureServer/0` `[read]`
- 1,069 polygons, maxRecordCount 1000.
- **District code field: `zon_new`** (e.g. `R1D-M`, `RM-H`, `H`, `LNC`, `RIV-MU`, `SP-5`, `GT-A`).
- Other fields: `full_zoning_type`, `legendtype`, `status`, `municode` (eCode360 link to the district's section).
- Tests: point -79.9156, 40.4764 → `R1D-M`; another point query (location not recorded) → `zon_new: GT-A` plus code link.
- `H` (Hillside) is a **base district, not an overlay** (65 polygons). Any construction in H triggers Site Plan Review ([approval pathway](../policy/approval-pathway.md)).
- WPRDC dataset `zoning` (modified 2026-09-23) mirrors it as GeoJSON (~3.5 MB), CSV, KML, SHP.
- `Multi_Unit_Zoning_Districts`: 417 features, same schema plus an `Asterisk` field.
- `zon_new` encodes use subdistrict + development subdistrict (e.g. `R1D-M` = R1D, M); see [zoning code text](zoning-code-text.md).

## Overlays and related layers

| Layer (under `C/`) | Features | Key field(s) | Notes | Tag |
|---|---|---|---|---|
| `PGHWebZoningOverlays/0` | 139 | `overlay`, `criteria` | **Free-text mix**: parking reduction (25/50/100%), riverfront height caps (45/90/150/250 ft), IZ-O, Baum Centre, North Side Commercial Parking, Riparian Buffer, RCO areas. Needs regex parsing | `[read]` |
| `InclusionaryHousingOverlayDistrict` | 1 | | Triggers affordable-unit mandate (Lawrenceville, Bloomfield, Polish Hill, Oakland) | `[read]` |
| `Riverfront_IPOD` | 5 | `Type` = 50/95/200 ft bands | | `[read]` |
| `HeightReductionZone_ZoningOverlay` | 4 | | | `[read]` |
| `PGHWebCHDHistoricDistricts` | 21 | `historic_name`, `guideline_link` | e.g. Mexican War Streets, Deutschtown, Manchester. Parcels inside need HRC review | `[read]` |
| `PGHWebRCO` | 45 | organization name; also contact fields | Which RCO hosts the Development Activities Meeting. **Contact fields are personal data: request only non-personal fields; never copy contacts into the repo or app** | `[read]` |
| `NeighborhoodPlans` | 6 | links, `Active` | | `[read]` |
| `PGHWebRiverfrontOverlay`, `PGHZoningRiverfrontHeightOverlay`, `PGHWebUptownIPOD`, `PGHWebParkingReductionOverlay`, `PGHWebBaumCentreOverlay`, `PGHWEBNorthSideCommercialParkingOverlay` | not recorded | | Names listed; counts not recorded | `[found]` |
| `PGHWebLandslideProne`, `PGHWebSlope25`, `PGHWebUndermined`, `PGHWebFEMA2014` | 37 / 1,714 / 47 / – | | Environmental; see [environmental constraints](environmental-constraints.md) | `[read]` |

The Round 2 sweep lists `PGHWebZoningOverlays`, `HeightReductionZone_ZoningOverlay` and `PGHWebParkingReductionOverlay` as "not probed" by that agent; the Round 1 sweep did query the first two (counts above). Not a contradiction, just different agents.

WPRDC also lists `city-designated-historic-districts`, `city-designated-individual-historic-sites`, `landslide-prone-areas`, `25-or-greater-slope`, `undermined-areas` ([r1 zoning sweep](../../sweeps/r1-zoning-data-code-and-reforms.md)).

## Gotchas
- The map alone is insufficient: overlays, definitions, exceptions and review rules matter (organizer catalog caveat).
- The IZ-O overlay remains in GIS; the citywide IZ debate and Bill 2025-1545 are pending policy ([reforms](../policy/reforms-in-flux-2025-2026.md)).
- Many city layers were last edited in 2023; check each layer's `editingInfo` before relying on it and show as-of dates.
- `ZoningApplications` FeatureServer exists but returns 0 records ([ZBA decisions](zba-decisions.md)).

## Open questions
- Feature counts and field schemas for the six overlay layers marked `[found]`.
- Whether the combined `PGHWebZoningOverlays` and the single-purpose layers are kept in sync.
- Whether SS-O (§906.08) is mapped as its own layer or only via `PGHWebSlope25` (unverified; see [environmental overlays](../policy/environmental-overlays-ch906.md)).
- How the Phase II zoning code rewrite will change district codes in GIS.

## Connects to
- [Zoning code text](zoning-code-text.md): what each `zon_new` value means
- [Dimensional standards and use table](../policy/dimensional-standards-and-use-table.md)
- [Parking](../policy/parking.md): parking-reduction overlays
- [Inclusionary zoning and bonus](../policy/inclusionary-zoning-and-bonus.md): IZ-O
- [Approval pathway](../policy/approval-pathway.md): H district, historic, RCO triggers
- [Municipal zoning outside the city](municipal-zoning-outside-city.md)
- [Parcels and assessments](parcels-and-assessments.md)

## Sources
- [PGHWebZoning FeatureServer/0](https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services/PGHWebZoning/FeatureServer/0) `[read]` *(accessed 2026-09-26)*: base districts, `zon_new`
- [PGHWebZoningOverlays/0](https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services/PGHWebZoningOverlays/FeatureServer/0) `[read]` *(accessed 2026-09-26)*: combined overlays
- City `InclusionaryHousingOverlayDistrict`, `Riverfront_IPOD`, `HeightReductionZone_ZoningOverlay`, `PGHWebCHDHistoricDistricts`, `PGHWebRCO`, `NeighborhoodPlans`, `Multi_Unit_Zoning_Districts` (under the base above) `[read]` *(accessed 2026-09-26)*: feature counts queried
- City `PGHWebRiverfrontOverlay`, `PGHZoningRiverfrontHeightOverlay`, `PGHWebUptownIPOD`, `PGHWebParkingReductionOverlay`, `PGHWebBaumCentreOverlay`, `PGHWEBNorthSideCommercialParkingOverlay` `[found]` *(accessed 2026-09-26)*: names only
- [WPRDC CKAN package_search q=zoning](https://data.wprdc.org/api/3/action/package_search?q=zoning) `[read]` *(accessed 2026-09-26)*
- [WPRDC pittsburgh-zoning dataset page](https://data.wprdc.org/dataset/pittsburgh-zoning) `[found]` *(accessed 2026-09-26)*: organizer catalog entry
- [Organizer Public Data Catalog (Google Sheet)](https://docs.google.com/spreadsheets/d/19CKyt1kansUZ3VGOAOBihYYxNFuitx5VTkzOiEy4iXA) `[read]` *(accessed 2026-09-26)*; saved copy [../../sources/organizers-2026-09-26-public-data-catalog.csv](../../sources/organizers-2026-09-26-public-data-catalog.csv): "map alone is insufficient" caveat
- Sweep: [../../sweeps/r1-zoning-data-code-and-reforms.md](../../sweeps/r1-zoning-data-code-and-reforms.md)
- Sweep: [../../sweeps/r1-parcel-environmental-infrastructure-data.md](../../sweeps/r1-parcel-environmental-infrastructure-data.md)
- Sweep: [../../sweeps/r2-deeper-data-sources.md](../../sweeps/r2-deeper-data-sources.md)
- Notes: [../../archive/working-notes-2026-09-26/01-data-sources.md](../../archive/working-notes-2026-09-26/01-data-sources.md)
