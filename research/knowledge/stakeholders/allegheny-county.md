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

**Primary text** *(updated 2026-09-26, round 5)* `[read]`: [Executive Order **2026-1**, "HOUSING (Housing Outcomes through Unified Strategies, Investment, and Governance) for All", dated February 5, 2026](https://www.alleghenycounty.us/files/assets/county/v/1/government/county-executive/documents/executive-orders/executive-order-housing-for-all.pdf) (extracted text saved at [../../sources/alleghenycounty-2026-09-26-executive-order-2026-1-housing-for-all.md](../../sources/alleghenycounty-2026-09-26-executive-order-2026-1-housing-for-all.md)). Key orders:
- **§2:** Allegheny County, through Allegheny County Economic Development (ACED), shall "undertake the **County's first Housing Needs Assessment**", covering financial, regulatory and land-use barriers; a shortage estimate "across all income levels, geographic areas, and household sizes"; available financing tools; and policy recommendations.
- **§3:** review of land recycling and land banking countywide, led by ACED.
- **§4.1:** investment strategy with a target of **$50M–$100M**, focused on deeply affordable (<60% AMI) and workforce (<120% AMI) housing; recommendations due **June 1, 2026**.
- **§4.3:** use the ongoing Comprehensive Plan to build a **library of template ordinances and zoning code amendments** for municipalities; HNA to recommend permit-review modernization.
- **§5:** rank-order County-owned real estate by housing feasibility by **December 1, 2026**.
- **§6:** homeowner reassessment protections, ≥$1.5M home repair in 2026, lead-safe homes, tenant protections.
- §8 (per the sweep): an Emergency Housing Strike Team at-risk list using "other key metrics as identified in the Housing Needs Assessment".

## Housing for All `[read]`

From the County's Housing for All page ([allin.alleghenycounty.us](https://allin.alleghenycounty.us/housing-for-all/)):

- A land bank feasibility report was due Dec 2025.
- A county comprehensive plan is to include a **library of zoning text amendments and model ordinances** for municipalities, worked through the InterCOG Council.
- Lead-safe and home-repair programs, and a one-stop repair resource portal.

## ✅ Contradiction resolved: is there already a County HNA? *(updated 2026-09-26, round 5)*

**Resolved in favor of the executive order.** The EO's own text orders "the County's first Housing Needs Assessment" `[read]`, so no completed County HNA predated Feb 2026 by the County's own account. The organizer catalog's entry cannot be verified: its URL is dead and no such report was found on the County's Housing page or ACED's Plans and Evaluations page (which lists the 2015 Analysis of Impediments, the **2021 MVA**, the 2020–2024 Consolidated Plan, a 2024 Annual Report and the 2023 CAPER, but no HNA) `[read]`. What does exist:
- An RFP for a countywide HNA, issued by the Redevelopment Authority of Allegheny County and administered by ACED, dated about **June 11, 2025** `[skimmed]` (search summary; the BidNet page is `[inaccessible]`, HTTP 403).
- WESA (2026-08-03) quotes "the county's **ongoing** housing needs assessment" `[read]`, and the Altoona Mirror (2026-09-18) reports the County Executive outlining its findings to a state House committee (starter-home supply dwindling, ~$1,000/month apartments lost, $2,000+/month units gained) `[skimmed]`.
- **No published report** (title, consultant or PDF) was found as of 2026-09-26.
- Look-alikes that are not a County HNA: the **City of Pittsburgh HNA** (2017, updated by HR&A in Jan 2022); DHS's **"Allegheny Housing Assessment (AHA)"** homelessness-prioritization tool `[skimmed]`; the Consolidated Plan's HUD-required needs-assessment section `[found]`.
- Inference (ours): the catalog entry, with its "13 subregions" and nonexistent URL, is a placeholder for the in-progress study or a conflation with a look-alike. "13 subregions" was not found in any source (RFP text not opened).

Earlier history of this contradiction, kept for the record:

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

- Which document did the organizers mean by the catalog's County HNA entry (link dead)? When will the in-progress County HNA be published, by which consultant, and at what geography ("13 subregions"?)?
- Did ACED deliver the §4.1 investment recommendations due June 1, 2026? Will the §5 County-owned site ranking (due Dec 1, 2026) be public?
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

- [Allegheny County Executive Order 2026-1, "HOUSING for All" (PDF)](https://www.alleghenycounty.us/files/assets/county/v/1/government/county-executive/documents/executive-orders/executive-order-housing-for-all.pdf) `[read]` *(accessed 2026-09-26, round 5)*: primary text, "the County's first Housing Needs Assessment"; extracted text at [../../sources/alleghenycounty-2026-09-26-executive-order-2026-1-housing-for-all.md](../../sources/alleghenycounty-2026-09-26-executive-order-2026-1-housing-for-all.md)
- [WESA, 2026-02-05, Allegheny County housing study](https://www.wesanews.org/politics-government/2026-02-05/allegheny-county-housing-study) `[read]` *(accessed 2026-09-26)*: executive order contents; 44,000+ units lost; RFP already issued
- [WESA, 2026-08-03, housing acquisition fund](https://www.wesanews.org/development-transportation/2026-08-03/housing-acquisition-fund) `[read]` *(accessed 2026-09-26, round 5)*: "ongoing" HNA
- [Altoona Mirror, 2026-09-18](https://www.altoonamirror.com/news/local-news/2026/09/pittsburgh-targets-housing-woes) `[skimmed]` *(accessed 2026-09-26, round 5)*: HNA findings presented to a state House committee
- [BidNet, RAAC Housing Needs Assessment RFP](https://www.bidnetdirect.com/pennsylvania/solicitations/open-bids/statewide/Housing-Needs-Assessment/443543343419) `[skimmed]` *(accessed 2026-09-26, round 5)*: search summary only; page `[inaccessible]` (HTTP 403)
- [Allegheny County Housing services page](https://www.alleghenycounty.us/Services/Housing) `[read]` *(accessed 2026-09-26, round 5)*: no HNA listed
- [ACED Plans and Evaluations](https://www.alleghenycounty.us/Projects-and-Initiatives/Economic-Development/Plans-and-Evaluations) `[read]` *(accessed 2026-09-26, round 5)*: no HNA listed
- [DHS Allegheny Housing Assessment (AHA)](https://www.alleghenycounty.us/Services/Human-Services-DHS/DHS-News-and-Events/Accomplishments-and-Innovations/Allegheny-Housing-Assessment) `[skimmed]` *(accessed 2026-09-26, round 5)*: look-alike, not an HNA
- [Allegheny County, Housing for All](https://allin.alleghenycounty.us/housing-for-all/) `[read]` *(accessed 2026-09-26)*
- [Keystone Newsroom, County officials tell PA lawmakers building alone won't fix shortage](https://keystonenewsroom.com/news/housing/allegheny-county-officials-tell-pa-lawmakers-that-building-alone-wont-fix-housing-shortage/) `[read]` *(accessed 2026-09-26)*
- [WESA, 2026-09-25, housing policy priority, Pittsburgh and Allegheny County](https://www.wesanews.org/politics-government/2026-09-25/housing-policy-priority-pittsburgh-allegheny-county) `[read]` *(accessed 2026-09-26)*
- [National Zoning Atlas, Pennsylvania](https://www.zoningatlas.org/pennsylvania) `[read]` *(accessed 2026-09-26)*
- Organizer data catalog listing of an "Allegheny County Housing Needs Assessment", URL `https://www.alleghenycounty.us/Services/Housing/Housing-Needs-Assessment` `[inaccessible]` ⚠ *(accessed 2026-09-26; re-checked round 5)*: 404 (WebFetch) / 403 (curl); no such report found; see [../data/organizer-data-catalog.md](../data/organizer-data-catalog.md)
- Sweep: [../../sweeps/r5-council-records-and-methodologies.md](../../sweeps/r5-council-records-and-methodologies.md) §2
- Sweep: [../../sweeps/r3-stakeholder-needs.md](../../sweeps/r3-stakeholder-needs.md)
- Sweep: [../../sweeps/r1-zoning-data-code-and-reforms.md](../../sweeps/r1-zoning-data-code-and-reforms.md)
- Working notes: [../../archive/working-notes-2026-09-26/04-stakeholders.md](../../archive/working-notes-2026-09-26/04-stakeholders.md)
- [Adversarial critique](../../docs/04-critique.md) — rows 14, 16, 27
