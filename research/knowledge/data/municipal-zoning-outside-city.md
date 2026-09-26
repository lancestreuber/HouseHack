# Municipal zoning outside the City of Pittsburgh

**Type:** data
**One line:** There is no countywide zoning layer for Allegheny County; nine suburban municipalities have queryable zoning layers found via a Pittsburgh Regional Transit registry, and the rest are PDFs or unknown.
**Why we care:** A parcel ID can be anywhere in the county. Outside the city, a score can compute environmental flags but usually cannot compute zoning, and should say so rather than guess.
**Last checked:** 2026-09-26

## No countywide layer `[read]`
- Allegheny County's AGOL org (`services1.arcgis.com/vdNDkVykv9vEWFX4`) and `gisdata.alleghenycounty.us` hold municipal boundaries, a generic `Land_Use` layer (21,520 features, feature codes only) and parcels, **but no zoning**.
- WPRDC searches for "municipal zoning" and "zoning allegheny" returned nothing.

## Municipal layers that returned records `[read]`
Found through Pittsburgh Regional Transit's registry of municipal zoning layers (`owner:gisadmin_PRT`). Paths are abbreviated as the sweep recorded them; the elided org segments were not written down.

| Municipality | Layer (as recorded) | Records |
|---|---|---|
| Penn Hills | `services5.arcgis.com/DllnbBENKfts6TQD/.../Zoning/FeatureServer/1` | 220 |
| Bethel Park | `services7.../ptmAvweveinujaUS/.../Public_View___Zoning_and_Parcels_and_Addresses/4` | 686 |
| Monroeville | `services9.../8FOQ9nDvQJjqML1o/.../Monroeville_Zoning_view/0` | 686 |
| Mt Lebanon | `services8.../4sXEsxQJTWBlSKA1/.../BasemapFeatureService_ReadOnl/9` | 645 (has `HEIGHT`) |
| Whitehall | `services8.../A3O49kUB98Moka4Y/.../MasterFeatureService_ReadOnlyView/24` | 60 |
| Dormont | `services6.../pIIoxuHIRX225O2N/.../MasterFeatureService_PublicView/7` | 3,259 (parcel-level zoning) |
| Moon | `services8.../g8yM34Z7IOCI3L3m/.../Zoning/2` | 93 |
| McCandless | `services1.../q8sarOko6mCDwiGm/.../McCandless_Zoning/1` | 76 |
| Franklin Park | `services9.../Dk5rlrQSwBJZ7C1H/.../Zoning/0` | 20 |

Each municipality has its own code text; **none is transcribed**. District codes are not comparable to the City's `zon_new`.

## Leads not checked
- Gateway Engineers hosts "MasterFeatureService" layers for more boroughs (Crafton, Churchill, Upper St Clair); not checked for zoning `[found]`.
- Nothing found for Wilkinsburg, Millvale, McKees Rocks.
- ZoningPoint (commercial per-municipality site): unverified.
- Quaker Valley COG GIS for member municipalities: unverified.
- Zoneomics lists Allegheny County coverage (search snippet; paid, avoided).
- Organizer catalog: "Pennsylvania Municipal Codes" via General Code (`generalcode.com/library/pa`), Useful, for Permit Navigator and Typology & Climate; caveat that coverage and update timing vary and some municipalities use other publishers or PDFs.

## National Zoning Atlas
Mapping the Pittsburgh metro on its online map; "Zoning Report: Pittsburgh" due fall 2026 `[read]` (state page). A downloadable Allegheny dataset is **unverified**: pages are JS-rendered and no download was found.

## Recommended handling (from the r1 sweep; a design choice, not a fact)
Score zoning only for City of Pittsburgh parcels. For the other municipalities (~129 per the sweep; count not verified), use the municipal-boundary layer to show "zoning unavailable" and still compute environmental flags from county/state layers (landslide, FEMA flood, DEP, EPA).

## Open questions
- Full URLs for the nine layers (the org path segments were elided).
- Number of Allegheny municipalities (the "~129 others" figure is from the sweep, not checked).
- Whether the PRT registry lists more municipalities than the nine tested.
- National Zoning Atlas data release format and timing.

## Connects to
- [Zoning GIS](zoning-gis.md): the City layer
- [Environmental constraints](environmental-constraints.md): county-wide flags
- [Allegheny County](../stakeholders/allegheny-county.md)
- [Uncertainty and explainability](../methods/uncertainty-and-explainability.md): "unknown" vs "bad"
- [Organizer data catalog](organizer-data-catalog.md)

## Sources
- Nine municipal zoning FeatureServers listed above `[read]` *(accessed 2026-09-26)*: returned records; paths abbreviated in the sweep
- PRT ArcGIS registry of municipal zoning layers (`owner:gisadmin_PRT`) `[read]` *(accessed 2026-09-26)*
- Allegheny County AGOL `services1.arcgis.com/vdNDkVykv9vEWFX4` and `gisdata.alleghenycounty.us` service lists `[read]` *(accessed 2026-09-26)*: no zoning layer
- Gateway Engineers MasterFeatureService layers `[found]` *(accessed 2026-09-26)*
- [National Zoning Atlas, Pennsylvania](https://www.zoningatlas.org/pennsylvania) `[read]` *(accessed 2026-09-26)*
- [NZA editor status](https://edit.zoningatlas.org/atlas/status/?areatype=state&areaid=42) `[skimmed]` *(accessed 2026-09-26)*: JS-rendered
- [Zoneomics Allegheny County](https://www.zoneomics.com/zoning-maps/pennsylvania/allegheny-county) `[skimmed]` *(accessed 2026-09-26)*: search snippet
- [General Code PA library (organizer catalog URL)](https://www.generalcode.com/library/pa) `[found]` *(accessed 2026-09-26)*
- [Organizer Public Data Catalog (Google Sheet)](https://docs.google.com/spreadsheets/d/19CKyt1kansUZ3VGOAOBihYYxNFuitx5VTkzOiEy4iXA) `[read]` *(accessed 2026-09-26)*; saved copy [../../sources/organizers-2026-09-26-public-data-catalog.csv](../../sources/organizers-2026-09-26-public-data-catalog.csv)
- Sweep: [../../sweeps/r1-zoning-data-code-and-reforms.md](../../sweeps/r1-zoning-data-code-and-reforms.md)
- Sweep: [../../sweeps/r2-deeper-data-sources.md](../../sweeps/r2-deeper-data-sources.md)
- Sweep: [../../sweeps/r3-reality-check-existing-tools.md](../../sweeps/r3-reality-check-existing-tools.md)
