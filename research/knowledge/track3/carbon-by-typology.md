# Carbon by typology

**Type:** track3
**One line:** The published numbers we have for operational energy, embodied carbon and driving by housing type, and why the normalization choice decides which typology "wins".
**Why we care:** The brief asks the tool to compare "marginal carbon emissions" and suggests a "Climate score based on building form, embodied carbon, transportation, and infrastructure extension". The cited numbers are few, come from different places, and rank typologies differently depending on the denominator.
**Last checked:** 2026-09-26

## Operational energy: EIA RECS 2020, Table CE1.1

Site energy **per household**, read from the PDF by the data-sweep agent `[read]`:

| Housing type | Site energy per household (MMBtu) |
|---|---|
| Single-family detached | 94.6 |
| Single-family attached | 67.1 |
| Apartment in a 2–4 unit building | 53.5 |
| Apartment in a 5+ unit building | 33.7 |
| Middle Atlantic average (all types) | 89.0 |

Notes:
- These are **per household, site energy**, not per m² and not emissions. Converting to CO2e needs a fuel mix and emission factors we have not sourced.
- National by type; only the all-types Middle Atlantic figure is regional.
- A search-engine summary quoted different figures (79.6, 54.1, and so on). **Those were wrong.** Do not copy RECS numbers from search summaries.
- RECS has no ADU category (our observation from the table's rows). Mapping ADU to a row is an assumption.
- NREL ResStock per-type numbers were **not pulled**.

## Embodied carbon: Dublin study (Buildings & Cities, bc.668)

Stages A1–A5, Dublin, Ireland `[read]`:

| Type | Embodied carbon per m² (kgCO2e) | Site works add |
|---|---|---|
| House | 316 | +32% |
| Duplex | 396 | +19% |
| Apartment | 437 | +12% |

- **Per m², denser buildings carry more embodied carbon.** Per unit or per bedroom the order can flip, because units are smaller and site works are shared (the sweep's reading of the paper).
- Irish construction; applying it to Pittsburgh is an assumption.

## Embodied carbon: BfCA EMBARC report (Toronto/Hamilton)

`[read]` (report PDF fetched and text extracted by the prior-art sweep):
- 503 as-built homes in the Greater Toronto/Hamilton area.
- Materials-only (A1–A3) carbon averaged **40 t CO2e per unit**.
- **Townhouses are lowest per unit, mostly because they are smaller.**
- **Which typology ranks best per m² flips with how floor area is defined.** By heated floor area, semi-detached homes are lowest; by a municipal gross-area definition, townhouses are lowest. The report says policymakers "must weigh" which metric to use.
- BEAM, the associated estimator, is free.

## Embodied carbon: Rankin et al. 2024 — inaccessible

"Embodied GHG of missing middle", *Journal of Industrial Ecology* `[inaccessible]`: the publisher paywall returned 403. A **search snippet only** says 5,540–39,600 kgCO2e per bedroom, and that multi-unit missing-middle buildings are lower per bedroom than single-family and mid/high-rise. That snippet is `[skimmed]`-grade evidence; do not cite its numbers as read.

## Driving: TRB Special Report 298 (2009)

`[read]` per the data sweep: doubling metro-wide residential density "might lower household VMT by about 5 to 12 percent," and possibly by 25% when combined with jobs and transit.
- **This is a regional effect, not a per-parcel one.** Present it as a range, not a point estimate attached to a lot.

## Other carbon sources noted

- **CoolClimate** household carbon by ZIP, including transport; free API key, rate-limited `[skimmed]`.
- **Anthill / PreVu** (AEC Tech 2025): AI-assisted embodied-carbon analysis per building, not per typology per place `[read]` (archive page).
- **Infrastructure extension** (named in the brief's climate prototype): **no source found** by either sweep.

## The normalization choice is a value judgment

Per m², per unit, per bedroom, or per resident: the BfCA flip and the Dublin per-m² vs. per-unit note both show the choice changes the ranking. That makes it one of the "value judgments" the brief says users must be able to distinguish from data. Options, not a pick:

| Option | What it favors (per the sources above) | Tradeoff |
|---|---|---|
| Per m² | Detached/house (Dublin) | Rewards large floor area; ignores how many households are housed |
| Per unit | Smaller units: townhouses (BfCA), apartments on operational energy (RECS) | Treats a studio and a 4-bed as equal |
| Per bedroom | Missing-middle multi-unit (Rankin snippet, unread) | Only snippet evidence |
| Per resident | Not computed by any source we hold | Needs occupancy assumptions |
| Let the user choose, and show the flip | Makes the value judgment explicit | More UI; the prior-art sweep's open question suggests presenting carbon as a choice of metric |

## Cut line

If Track 3 is behind at hour 16, the build sweep suggests dropping carbon or making it **a static per-typology factor stated in limitations** ([build sweep](../../sweeps/r4-build-feasibility-on-team-stack.md)). The data sweep suggests limiting carbon to the three cited sources (RECS, Dublin, TRB) rather than modelling it.

## Open questions

- Emission factors to turn RECS site energy into CO2e for Pittsburgh. Not sourced.
- Whether Rankin 2024 can be reached through a library or preprint.
- ResStock per-type numbers for a Pittsburgh-climate cut.
- Any source for "infrastructure extension" carbon.
- How to express TRB's regional range next to parcel-scale results without implying per-parcel precision.

## Connects to

- [Typology prototypes](typology-prototypes.md): carbon parameters per typology
- [Brief and requirements](brief-and-requirements.md): "marginal carbon emissions" axis and the data/value split
- [Indicators and data](indicators-and-data.md): transit and place data for the driving term
- [Uncertainty and explainability](../methods/uncertainty-and-explainability.md): presenting ranges and metric choice
- [Score design options](../methods/score-design-options.md)
- [Infrastructure](../data/infrastructure.md): infrastructure-extension term

## Sources

- [EIA RECS 2020 Table CE1.1 (PDF)](https://www.eia.gov/consumption/residential/data/2020/c&e/pdf/ce1.1.pdf) `[read]` *(accessed 2026-09-26)*: site energy per household by type
- [Buildings & Cities bc.668 (Dublin embodied carbon)](https://journal-buildingscities.org/articles/10.5334/bc.668) `[read]` *(accessed 2026-09-26)*: A1–A5 per m² and site works
- [BfCA EMBARC report (PDF)](https://www.buildersforclimateaction.org/uploads/1/5/9/3/15931000/bfca_pbc-embarc_report-web.pdf) `[read]` *(accessed 2026-09-26)*: per-unit averages; floor-area definition flip
- [Rankin et al. 2024, J. Industrial Ecology](https://onlinelibrary.wiley.com/doi/10.1111/jiec.13461) `[inaccessible]` *(accessed 2026-09-26)*: blocker is publisher paywall (HTTP 403); snippet figures only
- [TRB Special Report 298](https://nap.nationalacademies.org/catalog/12747) `[read]` *(accessed 2026-09-26)*: VMT range for density doubling
- [CoolClimate API](https://coolclimate.berkeley.edu/api) `[skimmed]` *(accessed 2026-09-26)*: search summary only
- [AEC Tech hackathon archive](https://www.aectech.us/hackathon-archive) `[read]` *(accessed 2026-09-26)*: Anthill / PreVu
- Sweep: [../../sweeps/r4-track3-data-methods-and-combination.md](../../sweeps/r4-track3-data-methods-and-combination.md) `[read]` *(accessed 2026-09-26)*: RECS, Dublin, TRB, Rankin status
- Sweep: [../../sweeps/r4-track3-prior-art-and-hackathons.md](../../sweeps/r4-track3-prior-art-and-hackathons.md) `[read]` *(accessed 2026-09-26)*: BfCA flip, carbon-as-metric-choice question
- Sweep: [../../sweeps/r4-build-feasibility-on-team-stack.md](../../sweeps/r4-build-feasibility-on-team-stack.md) `[read]` *(accessed 2026-09-26)*: H16 cut line
