# Pittsburgh civic tools

**Type:** landscape
**One line:** Public, nonprofit and academic tools and datasets that already describe Pittsburgh parcels, vacancy, permits, boards and neighborhoods.
**Why we care:** These are the tools a Pittsburgh judge or practitioner already knows. None found is a development-ease scorer; several are data sources or ground truth we can build on.
**Last checked:** 2026-09-26

## Summary

Every regional tool found is a **data explorer**, not a scorer ([r3 sweep](../../sweeps/r3-reality-check-existing-tools.md)). GitHub searches for Pittsburgh zoning, parcel, OneStopPGH and vacant-lot tools returned nothing relevant (same sweep). No Pittsburgh typology-matching or housing-scenario tool was found from CMU, Pitt UCSUR or PCRG, on limited searching ([r4 sweep](../../sweeps/r4-track3-prior-art-and-hackathons.md)).

## Parcel and property explorers

- **WPRDC Tools** ([tools.wprdc.org](https://tools.wprdc.org/) `[skimmed]`): includes Parcels n'at and the Property Dashboard. Code: [WPRDC/wprdc-apps](https://github.com/WPRDC/wprdc-apps) `[read]`, **AGPL-3.0**, last push 2026-09-23 (GitHub API). AGPL is strong copyleft; treat as reference, not code to copy.
- **SpaceRAT** ([WPRDC/SpaceRAT](https://github.com/WPRDC/SpaceRAT) `[read]`): WPRDC spatial tool; **no license** in GitHub API; last push 2025-08-04.
- **Burgh's Eye View** parcel map: named by the round-1 sweep alongside WPRDC tools `[skimmed]`; no URL recorded.

## Vacant land

- **Lots to Love** ([lotstolove.org](https://www.lotstolove.org/) `[skimmed]`; [WPRDC dataset](https://data.wprdc.org/dataset/lots-to-love) `[skimmed]`): says there are more than 45,000 vacant lots in Allegheny County. A search snippet of its [About page](https://www.lotstolove.org/about/) `[skimmed]` describes a countywide map where clicking a lot shows its ID, ownership and tax-delinquency status, populated from County Assessment, City Real Estate and City Planning data.
- **City Vacant Lot Toolkit and Adopt-A-Lot** ([City page](https://www.pittsburghpa.gov/Business-Development/City-Planning/Planning-Programs/Adopt-A-Lot/Vacant-Lot-Toolkit) `[skimmed]`): a search snippet describes it as addressing reuse of "over 28,000 vacant lots in the City," focused on gardens, art spaces and long-term commercial reuse. Not a housing tool.
- **ETHOS lot suitability analysis** ([Pittsburgh Water press release, 2026-01-14](https://www.pgh2o.com/news-events/news/press-release/2026-01-14-rain-reclaim-turning-vacant-lots-green-solutions) `[skimmed]`): a search snippet says the City and Ethos Collaborative analyzed the City's vacant lots for **stormwater management** suitability and co-benefits (urban cooling, beautification), identifying 12 potential Rain Reclaim sites. This is green-infrastructure reuse, not housing. Our working notes dated it Dec 2024; that date is unverified.

## Permitting and boards

- **OneStopPGH Insights** ([ArcGIS Experience dashboard](https://experience.arcgis.com/experience/89d500285ecd4804ae9945d93d424569) `[skimmed]`): City permitting dashboard. See [permits and outcomes](../data/permits-and-outcomes.md).
- **PublicSource Board Explorer, ZBA** ([boards.publicsource.org](https://boards.publicsource.org/board/zoning-board-of-adjustment/) `[skimmed]`): covers the Zoning Board of Adjustment. See [ZBA decisions](../data/zba-decisions.md).
- **Pro-Housing Pittsburgh IZ dataset** ([prohousingpgh/pittsburgh_iz](https://github.com/prohousingpgh/pittsburgh_iz) `[read]`, README and LICENSE read 2026-09-26):
  - A CSV of market-rate buildings of 20+ units in Pittsburgh since 2012, built from WPRDC PLI permits, with each building checked on Agency Counter for "Zoning Review Accepted," "Zoning Review Approved" and certificate-of-occupancy dates; unit counts checked against floorplans where public.
  - "only 109 buildings of 20 units or more were completed citywide between January 2012 and November 2024." Dormitories and hotels excluded.
  - Used for a difference-in-differences study finding that after IZ, new 20+-unit construction in Lawrenceville fell 30% while the Strip District and South Side Flats rose 36% and 18% (the repo's own finding, from a small sample).
  - **License: CC BY-NC 4.0.** Pro-Housing Pittsburgh is an event partner ([r3 sweep](../../sweeps/r3-reality-check-existing-tools.md)).
  - Relevance: a ready-made ground-truth and approval-timeline seed for large projects, and evidence that the sample is small. See [backtest and calibration](../methods/backtest-and-calibration.md).

## Hazards

- **Allegheny County Landslide Portal** ([landslide-portal-alcogis](https://landslide-portal-alcogis.opendata.arcgis.com/) `[skimmed]`). See [environmental constraints](../data/environmental-constraints.md).
- The only Pittsburgh landslide repo found on GitHub was a one-file map sample ([r3 sweep](../../sweeps/r3-reality-check-existing-tools.md) `[read]`, repo not named).

## Neighborhood and market typologies

- **Pittsburgh Neighborhood Project** ([blog post, 2021-03-01](https://pittsburghneighborhoodproject.blog/2021/03/01/gentrification-and-displacement-in-pittsburgh/) `[read]`): UDP-style gentrification analysis of Allegheny tracts from 2000 to 2015–19; found East End and Northside tracts gentrified, with poor Black residents most affected. An ArcGIS map exists; raw data download not confirmed.
- **Market Value Analysis 2021** (Reinvestment Fund) ([WPRDC dataset](https://data.wprdc.org/dataset/market-value-analysis-2021) `[skimmed]`): clusters block groups into 10 market types; open data. A market axis local stakeholders already recognize. See [indicators and data](../track3/indicators-and-data.md).

## Zoning atlas and academic work

- **National Zoning Atlas, Pennsylvania** ([zoningatlas.org/pennsylvania](https://www.zoningatlas.org/pennsylvania) `[read]`): actively mapping the Pittsburgh metro; "Zoning Report: Pittsburgh" due fall 2026.
- **Lenze, Hinojos and Grady (J. Urban Planning & Development, 2024)** ([ASCE](https://ascelibrary.com/doi/full/10.1061/JUPDDM.UPENG-4474) `[read]`): 210 Pittsburgh ZBA applications from 2020 against a social vulnerability index; no significant overall relationship, but significant links with pre-1940 housing share and multifamily share.
- CMU Remaking Cities Institute supported a "Residential Zoning by Race" project (round-1 sweep, `[skimmed]`, no URL).

## Open questions
- Does any Pittsburgh agency have an internal (non-public) parcel feasibility tool? None public was found.
- What exactly do Parcels n'at and the Property Dashboard expose, and can we link to them per parcel?
- Is Lots to Love's county count (45,000+) and the Toolkit's city count (28,000+) comparable? Different geographies and dates; not reconciled.
- ETHOS analysis date, method and whether its lot scores are downloadable.
- Is the Pittsburgh Neighborhood Project data downloadable?

## Connects to
- [Commercial tools](commercial-tools.md): the non-Pittsburgh equivalents and license table
- [Parcels and assessments](../data/parcels-and-assessments.md): WPRDC parcel data
- [Land availability and title](../data/land-availability-and-title.md): vacant and city-owned lots
- [Permits and outcomes](../data/permits-and-outcomes.md): OneStopPGH, PLI, IZ dataset
- [ZBA decisions](../data/zba-decisions.md): Board Explorer, Lenze et al.
- [Environmental constraints](../data/environmental-constraints.md): Landslide Portal
- [Inclusionary zoning and bonus](../policy/inclusionary-zoning-and-bonus.md): the IZ study's policy context
- [Displacement and equity](../track3/displacement-and-equity.md): Pittsburgh Neighborhood Project
- [Land Bank](../stakeholders/land-bank.md): vacant-lot disposition

## Sources
- [WPRDC Tools](https://tools.wprdc.org/) `[skimmed]` *(accessed 2026-09-26)*
- [WPRDC/wprdc-apps](https://github.com/WPRDC/wprdc-apps) `[read]` *(accessed 2026-09-26)*: license via GitHub API
- [WPRDC/SpaceRAT](https://github.com/WPRDC/SpaceRAT) `[read]` *(accessed 2026-09-26)*: license via GitHub API
- [Lots to Love](https://www.lotstolove.org/) `[skimmed]` *(accessed 2026-09-26)*
- [Lots to Love About](https://www.lotstolove.org/about/) `[skimmed]` *(accessed 2026-09-26)*
- [Lots to Love on WPRDC](https://data.wprdc.org/dataset/lots-to-love) `[skimmed]` *(accessed 2026-09-26)*
- [City Vacant Lot Toolkit](https://www.pittsburghpa.gov/Business-Development/City-Planning/Planning-Programs/Adopt-A-Lot/Vacant-Lot-Toolkit) `[skimmed]` *(accessed 2026-09-26)*
- [Pittsburgh Water, Rain Reclaim](https://www.pgh2o.com/news-events/news/press-release/2026-01-14-rain-reclaim-turning-vacant-lots-green-solutions) `[skimmed]` *(accessed 2026-09-26)*: ETHOS lot suitability
- [OneStopPGH Insights](https://experience.arcgis.com/experience/89d500285ecd4804ae9945d93d424569) `[skimmed]` *(accessed 2026-09-26)*
- [PublicSource Board Explorer, ZBA](https://boards.publicsource.org/board/zoning-board-of-adjustment/) `[skimmed]` *(accessed 2026-09-26)*
- [prohousingpgh/pittsburgh_iz](https://github.com/prohousingpgh/pittsburgh_iz) `[read]` *(accessed 2026-09-26)*: README and LICENSE
- [Allegheny County Landslide Portal](https://landslide-portal-alcogis.opendata.arcgis.com/) `[skimmed]` *(accessed 2026-09-26)*
- [Pittsburgh Neighborhood Project](https://pittsburghneighborhoodproject.blog/2021/03/01/gentrification-and-displacement-in-pittsburgh/) `[read]` *(accessed 2026-09-26)*
- [MVA 2021 on WPRDC](https://data.wprdc.org/dataset/market-value-analysis-2021) `[skimmed]` *(accessed 2026-09-26)*
- [National Zoning Atlas, Pennsylvania](https://www.zoningatlas.org/pennsylvania) `[read]` *(accessed 2026-09-26)*
- [Lenze, Hinojos & Grady 2024](https://ascelibrary.com/doi/full/10.1061/JUPDDM.UPENG-4474) `[read]` *(accessed 2026-09-26)*
- Sweep: [../../sweeps/r1-prior-art-proforma-and-practitioner-barriers.md](../../sweeps/r1-prior-art-proforma-and-practitioner-barriers.md)
- Sweep: [../../sweeps/r3-reality-check-existing-tools.md](../../sweeps/r3-reality-check-existing-tools.md)
- Sweep: [../../sweeps/r4-track3-prior-art-and-hackathons.md](../../sweeps/r4-track3-prior-art-and-hackathons.md)
