# Land availability, ownership and title

**Type:** data
**One line:** Which parcels are publicly owned or available (city vacant inventory, treasury and side-yard sales, URA, Land Bank transfers) and which carry title or distress flags (liens, delinquency, foreclosure, conservatorship, condemnation).
**Why we care:** An "acquirable now" filter and title-risk flags are cheap to add and directly useful to the City, URA and Land Bank. Ownership and availability are different things, and several layers are stale.
**Last checked:** 2026-09-26

City base `C = https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services`.

## Availability

### `C/ParcelsPublicCityVacant/FeatureServer/0` `[read]` (best source)
**5,786 city-owned vacant parcels**, edited 2026-09-01. Also carries zoning, flood and prior-years-delinquent fields.

| `current_status` | n | `inventory_type` | n |
|---|---|---|---|
| Available for Sale | **3,260** | Public Sale | 2,480 |
| Hold for Study | 1,836 | URA Transfer | 1,419 |
| Sale Pending | 489 | PLB (Land Bank) Transfer | 117 |

The 3,260 figure was flagged unverified by one sweep and confirmed by another's live query (corrections log).

### Other layers

| Layer | Count | Vintage | Note | Tag |
|---|---|---|---|---|
| WPRDC City-owned properties, resource `e1dcee82-9179-4306-8167-5891915b62a7` (key `pin`) | 12,477 | updated 2026-09-26 | `inventory_type`, `current_status` | `[read]` |
| `C/Treasury_Sales_2026_New` | 41 points | edited 2026-09-18 | upset price, delinquency, outcome | `[read]` |
| `C/Sideyard_Sales` | 652 | 2026-08 | | `[read]` |
| `C/ParcelsURA` | 1,570 | 2023 | | `[read]` |
| `C/Surface_Parking_Lots` | 332 | not stated | | `[read]` |
| `C/Tax_Delinquent` | 13,796 | not stated | | `[read]` |
| `C/City_and_URA_Owned_Parcels` | 62 | stale | | `[read]` |
| `C/Vacant_Lots` | aggregate counts only | | **skip** | `[read]` |
| Assessments `USEDESC='VACANT LAND'` | 65,694 countywide | 2026 | privately and publicly owned | `[read]` |
| WPRDC Lots to Love (`027d0b43…`) | | | **no parcel ID**, only lat/lon and address | `[read]` |

- **Pittsburgh Land Bank:** no WPRDC dataset, no API; its site connection failed (curl code 000). Use `inventory_type = PLB Transfer` above.
- Organizer catalog caveat on city-owned properties: "Ownership and availability are different; verify disposition status."

## Title, distress and ownership (WPRDC) `[read]`

| Dataset | Resource id | Parcel key | Rows | Freshness |
|---|---|---|---|---|
| Tax liens with current status | 65d0d259-3e58-49d3-bebb-80dc75f61245 | pin | 2.16M | current 2026-09 |
| County delinquent RE taxes (cumulative) | 96e9d6b2-3e1a-4a0c-8ef6-23a049c263d8 | parcel_id | 545,765 | |
| City tax delinquency | ed0d1550-c300-4114-865c-82dc7c23235b | pin | 27,527 | catalog: reflects current year |
| Condemned / dead-end | 0a963f26-eb4b-4325-bbbc-3ddf6a871410 | parcel_id | 3,569 | |
| PLI/DOMI/ES violations | 70c06278-92c5-4040-ab28-17671866f81c | parcel_id | 643,994 | |
| Conservatorship filings | fd64c179-b5af-4263-9275-fb581705d878 | pin | 582 | |
| Foreclosure filings | package `allegheny-county-mortgage-foreclosure-records` | | | current 2026-09 |
| Sheriff sales | package `sheriff-sales` | not checked | | **last updated 2024-06 (stale)** |

Catalog caveats: a foreclosure filing does not mean the property changed hands; condemnation does not establish demolition feasibility or availability.

## Owner name
Only the County Real Estate Portal returns the owner's name; WPRDC assessments give OWNERDESC only ([parcels and assessments](parcels-and-assessments.md)).

## Open questions
- Why does WPRDC city-owned (12,477) differ from `ParcelsPublicCityVacant` (5,786)? Presumably non-vacant city property, but not checked.
- Does `inventory_type = PLB Transfer` capture Land Bank holdings fully, or only transfers in progress?
- Sheriff sales after 2024-06: no current source found.
- Adjacency of available city lots (for assembly): not computed.

## Connects to
- [Land Bank](../stakeholders/land-bank.md)
- [City of Pittsburgh](../stakeholders/city-of-pittsburgh.md)
- [Parcels and assessments](parcels-and-assessments.md)
- [Permits and outcomes](permits-and-outcomes.md): condemned and demolition records
- [Score design options](../methods/score-design-options.md): "acquirable now" filter
- [Displacement and equity](../track3/displacement-and-equity.md): distress indicators

## Sources
- [City ParcelsPublicCityVacant](https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services/ParcelsPublicCityVacant/FeatureServer/0) `[read]` *(accessed 2026-09-26)*: status counts
- City `Treasury_Sales_2026_New`, `Sideyard_Sales`, `ParcelsURA`, `Surface_Parking_Lots`, `Tax_Delinquent`, `City_and_URA_Owned_Parcels`, `Vacant_Lots` `[read]` *(accessed 2026-09-26)*: counts and edit dates
- WPRDC resources e1dcee82, 65d0d259, 96e9d6b2, ed0d1550, 0a963f26, 70c06278, fd64c179 via [datastore_search](https://data.wprdc.org/api/3/action/datastore_search) `[read]` *(accessed 2026-09-26)*
- WPRDC `sheriff-sales` and foreclosure packages `[read]` *(accessed 2026-09-26)*: update dates only
- Pittsburgh Land Bank website `[inaccessible]` *(accessed 2026-09-26)*: connection failed (curl 000)
- [WPRDC city-owned-properties](https://data.wprdc.org/dataset/city-owned-properties), [delinquent-real-estate-taxes](https://data.wprdc.org/dataset/delinquent-real-estate-taxes), [city-of-pittsburgh-property-tax-delinquency](https://data.wprdc.org/dataset/city-of-pittsburgh-property-tax-delinquency), [allegheny-county-mortgage-foreclosure-records](https://data.wprdc.org/dataset/allegheny-county-mortgage-foreclosure-records), [condemned-properties](https://data.wprdc.org/dataset/condemned-properties) `[found]` *(accessed 2026-09-26)*: organizer catalog entries
- [Organizer Public Data Catalog (Google Sheet)](https://docs.google.com/spreadsheets/d/19CKyt1kansUZ3VGOAOBihYYxNFuitx5VTkzOiEy4iXA) `[read]` *(accessed 2026-09-26)*; saved copy [../../sources/organizers-2026-09-26-public-data-catalog.csv](../../sources/organizers-2026-09-26-public-data-catalog.csv)
- Sweep: [../../sweeps/r1-parcel-environmental-infrastructure-data.md](../../sweeps/r1-parcel-environmental-infrastructure-data.md)
- Sweep: [../../sweeps/r2-deeper-data-sources.md](../../sweeps/r2-deeper-data-sources.md)
- Notes: [../../archive/working-notes-2026-09-26/01-data-sources.md](../../archive/working-notes-2026-09-26/01-data-sources.md)
