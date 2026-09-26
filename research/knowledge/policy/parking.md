# Parking requirements (Chapter 914)

**Type:** policy
**One line:** Current residential parking minimums and maximums, the district reductions, and the pending bill that would remove minimums.
**Why we care:** An unmet parking minimum turns a by-right project into a ZBA variance. If Bill 2025-1545 passes, this whole trigger disappears, so it must be a toggle.
**Last checked:** 2026-09-26

⚠ **Tag caveat:** Chapter 914 was read on the **zoneomics.com mirror**, not eCode360. The sweep marked it verified; under the domain rule it is **`[skimmed]`** until re-read in eCode360.

## Table 914.02.A, residential rows `[skimmed]`

| Use | Minimum | Maximum |
|---|---|---|
| Single-unit detached | 1 per unit | 4 per unit |
| Single-unit attached | 0 | 4 per unit (see contradiction) |
| Two-unit, three-unit, multi-unit | 1 per unit | 2 per unit |

**Contradiction:** the approval-pathway sweep gives the single-unit attached maximum as 4 per unit; the working notes built from the same sweep mark it unverified. We keep "4 per unit" as the sweep's reading but treat it as unconfirmed. The minimum (0) is not in dispute.

## Reductions and relief (§914.04, §914.07) `[skimmed]`

- **100% reduction:** Downtown, Lower Hill SP-11, Uptown PRD, UC-E.
- **50% reduction:** Riverfront districts, UC-MU and R-MU.
- **East Liberty (50%) and North Side (25%) reductions exclude residential.**
- Bicycle-parking swap: up to 30% of spaces.
- Shared parking: Administrator Exception (parking alternatives §914.07.G).
- Transit-stop and transportation-management reductions: Special Exception (ZBA).
- The GIS layer `PGHWebParkingReductionOverlay` and the combined `PGHWebZoningOverlays` layer (free-text strings for 25/50/100% reduction, North Side Commercial Parking) map where reductions apply `[read]` ([r1 zoning sweep](../../sweeps/r1-zoning-data-code-and-reforms.md)). The combined layer needs regex parsing.

## Rule for a scoring engine (from the sweep)

- If the parking minimum isn't met and no reduction applies, output **"Variance / ZBA"** ([approval pathway](approval-pathway.md)).
- Parking >10 spaces or >2,500 sf in listed districts triggers Site Plan Review; ≥10 stalls is one of the RCO meeting triggers.

## Pending change

- **Bill 2025-1545** would **eliminate minimum parking** citywide (along with by-right ADUs and the optional Affordable Housing Bonus). Planning Commission recommended it June 2, 2026; Council held its public hearing Sept 23, 2026 `[read]` for the hearing page. ⚠ Legistar (checked 2026-09-26): Bill 2025-1545 is **Held In Council**; public hearings 9/10/25 and 9/23/26; committee substitute and PC referral 10/15/25; PC report received 6/12/26; **no final vote** *(corrected 2026-09-26 per docs/04-critique.md row 9)*. Whether the June 2026 PC redline strikes the parking minimums is undetermined from text extraction. See [reforms in flux](reforms-in-flux-2025-2026.md).
- If it passes, parking minimums drop out of the variance triggers.

## Open questions

- Re-read Table 914.02.A and §914.04 in eCode360.
- Single-unit attached maximum: 4 per unit or something else?
- Has Council voted on Bill 2025-1545 since the Sept 23 hearing? If so, does the parking repeal take effect immediately?
- Does `PGHWebParkingReductionOverlay` match the §914.04 district list exactly?

## Connects to

- [Approval pathway](approval-pathway.md): parking noncompliance → ZBA
- [Reforms in flux](reforms-in-flux-2025-2026.md): Bill 2025-1545
- [Dimensional standards and use table](dimensional-standards-and-use-table.md): the other by-right checks
- [Zoning GIS](../data/zoning-gis.md): reduction overlay layers
- [Pro forma](../methods/pro-forma.md): parking cost as a feasibility input

## Sources

- [zoneomics.com Pittsburgh code mirror, Chapter 914](https://www.zoneomics.com/code/pittsburgh-PA) `[skimmed]` *(accessed 2026-09-26)*: Table 914.02.A and §914.04; mirror, currency unknown
- [City GIS FeatureServers (PGHWebParkingReductionOverlay, PGHWebZoningOverlays)](https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services/) `[read]` *(accessed 2026-09-26)*: reduction overlay geometry
- [City Council Public Hearing, Sept 23, 2026](https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/Council-Public-Hearings/City-Council-Public-Hearing-September-23-2026) `[read]` *(accessed 2026-09-26)*: Bill 2025-1545 hearing
- [EngagePgh, implementing the Housing Needs Assessment](https://engage.pittsburghpa.gov/implementing-housing-needs-assessment) `[read]` *(accessed 2026-09-26)*: bill status shown as pending
- Sweep: [../../sweeps/r2-approval-pathway-and-timelines.md](../../sweeps/r2-approval-pathway-and-timelines.md)
- Sweep: [../../sweeps/r1-zoning-data-code-and-reforms.md](../../sweeps/r1-zoning-data-code-and-reforms.md)
- Working notes: [../../archive/working-notes-2026-09-26/02-approval-pathway.md](../../archive/working-notes-2026-09-26/02-approval-pathway.md)
- [Adversarial critique](../../docs/04-critique.md) — row 9
