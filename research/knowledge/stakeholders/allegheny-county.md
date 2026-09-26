# Allegheny County

**Type:** stakeholder
**One line:** What Allegheny County government says it needs on housing: preservation first, incentives for 130 municipalities to reform zoning, and its own housing needs assessment.
**Why we care:** The County's framing differs from the City's. A City-only parcel score fits the City; a multi-municipal zoning-barrier lens is what the County's stated agenda points to. We also have no county-wide zoning data.
**Last checked:** 2026-09-26

## Stated framing: preservation over supply

- ⚠ The count of apartments renting **under $1,000 a month (nominal)** fell by **44,000+** from 2019 to 2024, per the County as reported by WESA `[read]` ([WESA 2026-02-05](https://www.wesanews.org/politics-government/2026-02-05/allegheny-county-housing-study)). A fixed nominal threshold across five years of rent inflation counts units that re-priced above $1,000 as "lost"; how much is rent inflation vs physical loss (demolition, conversion) is unknown *(corrected 2026-09-26 per docs/04-critique.md row 14)*.
- The County Executive: "We can build all we want, but if we continue to lose units, we will still wind up in a negative situation." `[read]` ([Keystone Newsroom](https://keystonenewsroom.com/news/housing/allegheny-county-officials-tell-pa-lawmakers-that-building-alone-wont-fix-housing-shortage/)).
- The County prefers incentives to penalties: funding priority to multi-municipal applications with pro-housing policies `[skimmed]` (snippet).

## The Feb 5, 2026 executive order `[read]`

The County Executive's order directs ([WESA 2026-02-05](https://www.wesanews.org/politics-government/2026-02-05/allegheny-county-housing-study)):

- **the county's first housing needs assessment**
- a review of land banking
- a study of ways to expand supply
- a fund for affordable and workforce housing
- incentives for municipalities to reform zoning

## Housing for All `[read]`

From the County's Housing for All page ([allin.alleghenycounty.us](https://allin.alleghenycounty.us/housing-for-all/)):

- A land bank feasibility report was due Dec 2025.
- A county comprehensive plan is to include a **library of zoning text amendments and model ordinances** for municipalities, worked through the InterCOG Council.
- Lead-safe and home-repair programs, and a one-stop repair resource portal.

## ⚠ Contradiction, now leaning one way: is there already a County HNA?

- The organizer data catalog lists an existing **"Allegheny County Housing Needs Assessment."**
- The Feb 2026 executive order, as reported by WESA `[read]`, orders the county's **"first"** housing needs assessment.
- Both cannot be true as stated. Possibilities (guesses, not findings): the catalog entry is a City or regional document mislabeled; it is an older study the County does not count as an HNA; or WESA's "first" is loose wording. **Unresolved.** Check the catalog entry's actual file and date before citing either. See [organizer data catalog](../data/organizer-data-catalog.md).
- ⚠ **Tested by the critique** *(corrected 2026-09-26 per docs/04-critique.md row 27)*: the catalog's County HNA link is **dead** (WebFetch 404; curl 403), and a web search found no Allegheny County HNA "with 13 subregions", only DHS's unrelated "Allegheny Housing Assessment" tool. We found no such report, so the executive order's "first" is currently better supported. Ask the organizers which document they meant.

## Data gap: no county-wide zoning

- No county-wide zoning layer was found. The County's ArcGIS org and `gisdata.alleghenycounty.us` have municipal boundaries, a generic `Land_Use` layer (21,520 features, feature codes only) and parcels, but no zoning `[read]` ([r1 zoning sweep](../../sweeps/r1-zoning-data-code-and-reforms.md)).
- Piecemeal options only (ZoningPoint, the Quaker Valley COG GIS, municipal PDFs), all unverified. See [municipal zoning outside the city](../data/municipal-zoning-outside-city.md).
- The National Zoning Atlas is working in the Pittsburgh metro and says a "Zoning Report: Pittsburgh" is due fall 2026 `[read]` ([zoningatlas.org/pennsylvania](https://www.zoningatlas.org/pennsylvania)).

## What this means for us (inference)

- City and County emphasize different things: the Mayor's office frames housing as growth; the County Executive stresses preservation. ⚠ Both agendas include both (the executive order above includes supply expansion and zoning-reform incentives) *(corrected 2026-09-26 per docs/04-critique.md row 16)*. The scale also differs: one city vs. ~130 municipalities with model ordinances.
- A municipality-level "zoning barrier index" might serve the County's model-ordinance and incentive work more than a parcel score does. Untested with anyone at the County.
- Preservation (losing existing affordable units) is a cited constraint a pure new-build "ease" score ignores.

## Open questions

- Which document did the organizers mean by the catalog's County HNA entry (link dead)? When is the new County HNA due?
- Was the Dec 2025 land bank feasibility report published? What did it recommend?
- Would the County use a municipality-level zoning barrier index?
- What are the actual criteria for the pro-housing incentive funding priority?

## Connects to

- [City of Pittsburgh](city-of-pittsburgh.md): the growth-first contrast
- [Land Bank](land-bank.md): the County's land-banking review
- [State: DCED and PHFA](state-dced-phfa.md): state push to modernize municipal codes
- [Municipal zoning outside the city](../data/municipal-zoning-outside-city.md): the coverage gap
- [Organizer data catalog](../data/organizer-data-catalog.md): source of the HNA listing
- [Displacement and equity](../track3/displacement-and-equity.md): preservation framing

## Sources

- [WESA, 2026-02-05, Allegheny County housing study](https://www.wesanews.org/politics-government/2026-02-05/allegheny-county-housing-study) `[read]` *(accessed 2026-09-26)*: executive order contents; 44,000+ units lost
- [Allegheny County, Housing for All](https://allin.alleghenycounty.us/housing-for-all/) `[read]` *(accessed 2026-09-26)*
- [Keystone Newsroom, County officials tell PA lawmakers building alone won't fix shortage](https://keystonenewsroom.com/news/housing/allegheny-county-officials-tell-pa-lawmakers-that-building-alone-wont-fix-housing-shortage/) `[read]` *(accessed 2026-09-26)*
- [WESA, 2026-09-25, housing policy priority, Pittsburgh and Allegheny County](https://www.wesanews.org/politics-government/2026-09-25/housing-policy-priority-pittsburgh-allegheny-county) `[read]` *(accessed 2026-09-26)*
- [National Zoning Atlas, Pennsylvania](https://www.zoningatlas.org/pennsylvania) `[read]` *(accessed 2026-09-26)*
- Organizer data catalog listing of an "Allegheny County Housing Needs Assessment" `[inaccessible]` ⚠ *(accessed 2026-09-26)*: the listed URL returns 404 (WebFetch) / 403 (curl) per the critique's check; no such report found; see [../data/organizer-data-catalog.md](../data/organizer-data-catalog.md)
- Sweep: [../../sweeps/r3-stakeholder-needs.md](../../sweeps/r3-stakeholder-needs.md)
- Sweep: [../../sweeps/r1-zoning-data-code-and-reforms.md](../../sweeps/r1-zoning-data-code-and-reforms.md)
- Working notes: [../../archive/working-notes-2026-09-26/04-stakeholders.md](../../archive/working-notes-2026-09-26/04-stakeholders.md)
- [Adversarial critique](../../docs/04-critique.md) — rows 14, 16, 27
