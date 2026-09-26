# Parking requirements (Chapter 914)

**Type:** policy
**One line:** Current residential parking minimums and maximums, the district reductions, and the pending bill that would remove minimums.
**Why we care:** An unmet parking minimum pulls a by-right project into an Alternative Access and Parking Plan (Zoning Administrator for small projects, ZBA special exception for larger ones), not automatically a variance *(corrected 2026-09-26, round 5)*. If Bill 2025-1545 passes, this whole trigger disappears, so it must be a toggle.
**Last checked:** 2026-09-26

✅ **Tags upgraded** *(updated 2026-09-26, round 5)*: §914.02.A, §914.04 and §914.07 were re-read on **eCode360** in a real browser, verbatim text saved in [`sources/ecode360-2026-09-26-pittsburgh-914-parking.md`](../../sources/ecode360-2026-09-26-pittsburgh-914-parking.md) ([sweep](../../sweeps/r5-ecode360-reread-ch906-914-915-922.md)). Everything below is `[read]` except the bicycle swap (§914.05, not re-read).

## Parking Schedule A (§914.02.A), residential rows `[read]`

⚠ The code calls it **"Parking Schedule A"**, not "Table 914.02.A" *(corrected 2026-09-26, round 5)*. History ends at Ord. No. 4-2024, eff. 2-27-2024.

| Use | Minimum | Maximum |
|---|---|---|
| Single-unit detached | 1 per unit | 4 per unit |
| Single-unit attached | 0 per unit | 4 per unit |
| Two-unit, three-unit, multi-unit | 1 per unit | 2 per unit |
| Group residential | 1 per 4 residents | no maximum |
| Housing for the elderly | Parking Demand Analysis required | |

**Contradiction resolved** *(updated 2026-09-26, round 5)*: eCode360 reads "Single-Unit Attached / 0 per unit / 4 per unit". The single-unit attached maximum is **4 per unit** `[read]`.

## Reductions and relief (§914.04, §914.07) `[read]` *(updated 2026-09-26, round 5)*

- **100% reduction:** Downtown, SP-11 Lower Hill Planned Development, Uptown Public Realm District, UC-E.
- **50% reduction:** Riverfront districts, UC-MU and R-MU.
- **East Liberty (50%) and North Side (25%) reductions exclude residential** ("Any use except residential").
- SP districts and PUDs: Parking Demand Analysis required.
- Reductions apply in districts shown on the Official Zoning Map as "Parking Exempt Areas", and uses there "shall provide no more than the otherwise required minimum parking ratio", which works as a **cap** in those areas.
- Reductions do not apply to bicycle parking minimums.
- Bicycle-parking swap: up to 30% of spaces `[skimmed]` (§914.05 not re-read).
- **Parking shortfall → Alternative Access and Parking Plan (AAPP)** *(corrected 2026-09-26, round 5)*. Providing fewer (or more) spaces than Schedule A allows requires an AAPP (§914.07.B). **If ≤10 spaces are required, the Zoning Administrator decides**, after a sign posted ≥10 days (§914.07.D.1). **If >10 are required, the ZBA decides as a Special Exception** under §922.07, with a public hearing (D.2).
- Shared parking within 1,000 ft, and valet: Administrator Exception (§914.07.G.1).
- Off-site parking, transportation-management plan and transit-stop reductions: Special Exception (ZBA) (§914.07.G.2). **Transit-stop reduction is capped at 20% of required spaces** (G.2(d)(4)).
- The GIS layer `PGHWebParkingReductionOverlay` and the combined `PGHWebZoningOverlays` layer (free-text strings for 25/50/100% reduction, North Side Commercial Parking) map where reductions apply `[read]` ([r1 zoning sweep](../../sweeps/r1-zoning-data-code-and-reforms.md)). The combined layer needs regex parsing.

## Rule for a scoring engine (from the sweep)

- ⚠ If the parking minimum isn't met and no reduction applies, output **"AAPP: Zoning Administrator if ≤10 spaces required; ZBA Special Exception if >10"**, not "Variance / ZBA" *(corrected 2026-09-26, round 5)* ([approval pathway](approval-pathway.md)).
- In the 2026 ZBA sample, all **8 of 8** cases with §914 parking/loading relief were approved `[read]` ([ZBA decisions](../data/zba-decisions.md)); small n *(updated 2026-09-26, round 5)*.
- Parking >10 spaces or >2,500 sf in listed districts triggers Site Plan Review; ≥10 stalls is one of the RCO meeting triggers.

## Pending change

- **Bill 2025-1545** would **eliminate minimum parking** citywide (along with by-right ADUs and the optional Affordable Housing Bonus). Planning Commission recommended it June 2, 2026; Council held its public hearing Sept 23, 2026 `[read]` for the hearing page. ⚠ Legistar (checked 2026-09-26): Bill 2025-1545 is **Held In Council**; public hearings 9/10/25 and 9/23/26; committee substitute and PC referral 10/15/25; PC report received 6/12/26; **no final vote** *(corrected 2026-09-26 per docs/04-critique.md row 9)*. ~~Whether the June 2026 PC redline strikes the parking minimums is undetermined~~ *(updated 2026-09-26, round 5)*: the Planning Commission's Report & Recommendation (letter June 11, 2026) says the bill keeps "Removal of Parking Minimums for all uses/districts" in both the Oct 2025 Council substitute and the PC-recommended substitute, with maximums tiered by frequent-transit access, a Mobility Trust Fund payment to exceed maximums, and TDM above a size threshold `[read]`. It is **not** on the 9/29 or 9/30/26 agendas. See [reforms in flux](reforms-in-flux-2025-2026.md).
- If it passes, parking minimums drop out of the variance triggers.

## Open questions

- ~~Re-read Schedule A and §914.04 in eCode360; single-unit attached max~~ done round 5 (4 per unit).
- Re-read §914.05 to confirm the 30% bicycle swap.
- Has Council voted on Bill 2025-1545 since the Sept 23 hearing? If so, does the parking repeal take effect immediately?
- Does `PGHWebParkingReductionOverlay` match the §914.04 district list exactly?

## Connects to

- [Approval pathway](approval-pathway.md): parking shortfall → AAPP (ZA ≤10 / ZBA SE >10)
- [ZBA decisions](../data/zba-decisions.md): §914 relief outcomes
- [Reforms in flux](reforms-in-flux-2025-2026.md): Bill 2025-1545
- [Dimensional standards and use table](dimensional-standards-and-use-table.md): the other by-right checks
- [Zoning GIS](../data/zoning-gis.md): reduction overlay layers
- [Pro forma](../methods/pro-forma.md): parking cost as a feasibility input

## Sources

- [eCode360 §914.02](https://ecode360.com/45478045), [§914.04](https://ecode360.com/45478059), [§914.07](https://ecode360.com/45478103), verbatim saved in [../../sources/ecode360-2026-09-26-pittsburgh-914-parking.md](../../sources/ecode360-2026-09-26-pittsburgh-914-parking.md) `[read]` *(accessed 2026-09-26, round 5)*
- [Legistar, 2025-1545 Planning Commission Report & Recommendation (PDF)](https://pittsburgh.legistar1.com/pittsburgh/attachments/1aea03bb-c723-4b1d-bff2-f7b61b7766db.pdf) `[read]` *(accessed 2026-09-26)*: parking-minimum removal in both substitutes; saved [../../sources/pittsburgh-legistar-2026-09-26-zoning-bills-1545-0834-1579.md](../../sources/pittsburgh-legistar-2026-09-26-zoning-bills-1545-0834-1579.md)
- [zoneomics.com Pittsburgh code mirror, Chapter 914](https://www.zoneomics.com/code/pittsburgh-PA) `[skimmed]` *(accessed 2026-09-26)*: superseded by eCode360
- [City GIS FeatureServers (PGHWebParkingReductionOverlay, PGHWebZoningOverlays)](https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services/) `[read]` *(accessed 2026-09-26)*: reduction overlay geometry
- [City Council Public Hearing, Sept 23, 2026](https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/Council-Public-Hearings/City-Council-Public-Hearing-September-23-2026) `[read]` *(accessed 2026-09-26)*: Bill 2025-1545 hearing
- [EngagePgh, implementing the Housing Needs Assessment](https://engage.pittsburghpa.gov/implementing-housing-needs-assessment) `[read]` *(accessed 2026-09-26)*: bill status shown as pending
- Sweep: [../../sweeps/r5-ecode360-reread-ch906-914-915-922.md](../../sweeps/r5-ecode360-reread-ch906-914-915-922.md)
- Sweep: [../../sweeps/r5-council-records-and-methodologies.md](../../sweeps/r5-council-records-and-methodologies.md)
- Sweep: [../../sweeps/r2-approval-pathway-and-timelines.md](../../sweeps/r2-approval-pathway-and-timelines.md)
- Sweep: [../../sweeps/r1-zoning-data-code-and-reforms.md](../../sweeps/r1-zoning-data-code-and-reforms.md)
- Working notes: [../../archive/working-notes-2026-09-26/02-approval-pathway.md](../../archive/working-notes-2026-09-26/02-approval-pathway.md)
- [Adversarial critique](../../docs/04-critique.md) — row 9
