# Backtest and calibration

**Type:** method
**One line:** Checking a parcel score against where new residential construction was actually permitted in Pittsburgh from 2019 to 2026, and what that check can and cannot prove.
**Why we care:** A score nobody has tested is an opinion. Permit records give revealed outcomes, but they measure demand as well as ease, so the framing has to be honest.
**Last checked:** 2026-09-26

## Positives: two sources, two counts

The two permit sources give different counts because they filter differently. Neither is wrong; they need to be reconciled, not averaged.

⚠ **The counts are in different units and do not form a range** *(corrected 2026-09-26 per docs/04-critique.md row 22)*. ~370 is a *deduplicated residential project* count (one sweep's WPRDC filter). 592 is a *unique-parcel* count from OSPI_H that **includes the 370 Commercial permits** and **excludes the 583 recoded 2025+ records**. Say "roughly 370 deduplicated residential projects (one sweep's filter); the parcel-level counts differ by source and are not reconciled", not "370–590".

| Source | Filter | Count | Verified |
|---|---|---|---|
| **WPRDC PLI permits** (resource `f4d1177a…`), 65,378 rows, issue dates 2019-06-03 to 2026-09-21 | permit_type ∈ {`BUILDING`, `Building & Development Application`} AND work_type = `NEW CONSTRUCTION`/`New Construction`; residential rows filtered by description regex (DWELLING\|HOUSE\|HOME\|TOWN\|MODULAR\|FAMILY\|UNIT) to drop sheds, garages and walls; commercial rows kept when the description matches APART\|DWELLING\|TOWN\|UNITS\|MULTIFAMILY\|CONDO | **~670 permits on ~510 unique parcels; ~370 independent projects** after collapsing by owner + neighborhood + month | Full CSV dump inspected by the [scoring sweep](../../sweeps/r2-scoring-algorithm-and-validation.md) |
| **OneStopPGH OSPI_H**, 330,166 records | `source='pli_permits' AND type='BUILDING' AND type_work_desc='NEW CONSTRUCTION'` | **860 permits (490 Residential, 370 Commercial; 592 unique parcels)**, plus 583 records under the 2025+ recode `New Construction` | Queried by the [deeper data sweep](../../sweeps/r2-deeper-data-sources.md) |

Year-by-year, from the WPRDC filter: 2019: 12 (partial year), 2020: 99, 2021: 112, 2022: 117, 2023: 93, 2024: 109, 2025: 67, 2026: 58 (to September). Status: 351 Completed, 179 Issued, a few Revoked or Expired ([scoring sweep](../../sweeps/r2-scoring-algorithm-and-validation.md)).

From OSPI_H, Residential/Commercial by year: 2019 14/17, 2020 83/60, 2021 96/62, 2022 99/72, 2023 83/61, 2024 68/80, 2025 23/10, 2026 24/8 ([deeper data sweep](../../sweeps/r2-deeper-data-sources.md)).

**Gotchas both sweeps found:**
- **The 2025 recode.** The apparent 2025–26 drop in OSPI_H is a system change: new work moved to `type_work_desc='New Construction'`, mainly under "Building & Development Application". Union both values.
- **Multifamily is filed as "Commercial"** under the IBC (e.g. "220 UNIT 5 STORY APARTMENT BUILDING"; a 6-storey, 48-apartment building). Filter on the description, not the residential flag.
- **Ignore ELECTRICAL/MECHANICAL "NEW CONSTRUCTION" rows.** They duplicate the building permit.
- Other copies of the same data: `C/PLI_Permits/FeatureServer/0` (61,022 records, 2019-06 to 2026-01) and `C/Development_Construction_Projects_v2` (518 NEW CONSTRUCTION records with a NUMBEROFUNITS field) ([deeper data sweep](../../sweeps/r2-deeper-data-sources.md)).
- **No data before June 2019** in this resource. Legacy PLI data may exist elsewhere; unverified.

A third, narrower list: Pro-Housing Pittsburgh's hand-built CSV of 109 buildings with 20+ units since 2012, with zoning and CO dates, licensed CC BY-NC ([working notes](../../archive/working-notes-2026-09-26/01-data-sources.md)). It could check the 20+ typology, subject to its license.

## Dedupe by project, not by permit

Positives cluster heavily: Fairywood 47, Bedford Dwellings 38, Central Lawrenceville 34, Central Northside 30, Crawford-Roberts 26. The sweep says most of these are **likely** large HACP/URA subdivision projects (not confirmed). Counting each permit as an independent event would let a few redevelopment sites dominate the fit. Options:

- Collapse by owner + neighborhood + month (the sweep's method, giving ~370 projects).
- Collapse by owner + contiguous parcels.
- Hold large public redevelopment sites out as a separate class, since their ease is not a zoning-map property.

## Is there enough data?

⚠ **Power is uncomputed** *(corrected 2026-09-26 per docs/04-critique.md row 22)*. Heavy clustering (47 in one neighborhood, 38 in another) shrinks the effective sample below ~370. The figures below are one sweep's estimate, not a finding.

The scoring sweep's assessment: about 370 events supports roughly 15–30 parameters at 10–20 events per variable (Peduzzi 1996, cited from memory), and is plenty to report an AUC for a rule-based score (it estimates a 95% CI of about ±0.03; that is the sweep's estimate, not a computed interval). The base rate is tiny, about 500 of roughly 140k city parcels, so report **PR-AUC and top-decile lift** alongside ROC-AUC. The 140k figure was not verified by that sweep.

## The confounds: say these out loud

1. **Positives measure demand × ease, not ease.** A parcel in a hot market with moderate friction gets built; an easy parcel in a weak market may not. Options: add a market control (neighborhood median sale price, or a neighborhood fixed effect) so ease coefficients are conditional on market; or report results within market-strength bands.
2. **Leakage.** The current assessment shows the new building, and "vacant" flips after construction. Only use features that are stable or dated before the permit: zoning, slope, flood, landslide, undermining, lot geometry, historic district, transit, and ownership as of before the permit. Whether WPRDC has historical assessment snapshots is **unverified**.
3. **The rules changed during the window.** Minimum lot sizes changed in May 2025 ([corrections log](../README.md#corrections-log)). Validating against 2019–2024 behavior partly measures the old code ([working notes](../../archive/working-notes-2026-09-26/03-scoring-methods.md)).
4. **Public-sector sites.** HACP/URA redevelopment reflects public decisions, not parcel-level ease.

## Design options

**Sampling.** The sweep proposes a case-control set: the ~370 positive projects plus about 10 negative parcels per positive, drawn from residential-capable zones and weighted back to the full population.

**Models.**
- Use permits only to **evaluate** a hand-built rule score (AUC, PR-AUC, lift, reliability plot).
- Fit a small L2-regularized logistic model, logit(P(permit)) = β·[friction components, opportunity components, pathway dummies, log lot size] + market control, and use β signs and magnitudes to sanity-check or re-set rule weights.
- Use the fitted model as the score itself (see the tradeoffs in [score design](score-design-options.md)).

**Validation.**
- **Temporal holdout:** train 2019–2022, test 2023–2026.
- **Neighborhood-blocked cross-validation**, so clustered projects can't leak across folds.
- **Reliability plot:** score decile vs observed build rate.

The sweep estimated about 5 hours for the backtest AUC and reliability plot. That is an estimate.

## What it can and cannot show

| It can show | It cannot show |
|---|---|
| Whether higher-scored parcels were more often built on, conditional on the market control | That the score measures ease rather than demand, or that a low score means "hard" rather than "unwanted" |
| Whether rule weights point in the same direction as revealed behavior | Anything about parcels under rules that changed after the training window (the 2025 lot-size reform, pending Bill 2025-1545) |
| Rank quality (AUC, PR-AUC, lift) on held-out years and neighborhoods | Causal effects of any single factor |

The sweep's suggested honest framing: **"validated against revealed development behavior, not against ease itself."**

Precedents from memory, not re-fetched: LA and SF Housing Element likelihood models trained on permits. The working notes also point to a public repo, `YIMBYdata/housing-elements`, that matches inventories to permits (no license).

## Other uses of the permit data

- Show "N new homes built within 500 m since 2019" on a parcel card ([deeper data sweep](../../sweeps/r2-deeper-data-sources.md)).
- **Demolitions:** 1,297 in OSPI_H (`type='Demolition Permit'`; 662 complete, 533 city-funded, 102 partial). Also in OSPI_H: condemned (1,946) and dead-end (966).

## Open questions
- Whether historical assessment snapshots exist, which decides how much leakage can be avoided.
- Where pre-2019 permits live, if anywhere.
- How much WPRDC and OSPI_H positives overlap after dedupe. Nobody has joined them yet.
- Whether the Fairywood / Bedford Dwellings clusters are in fact HACP/URA projects.
- Whether the city parcel universe is ~140k (unverified in the scoring sweep; 142,806 in the ETHOS layer, ⚠ whose "2024" date is unverified *(corrected 2026-09-26 per docs/04-critique.md row 31)*).

## Connects to
- [Permits and outcomes](../data/permits-and-outcomes.md): the data behind the positives
- [Score design options](score-design-options.md): what is being tested
- [Uncertainty and explainability](uncertainty-and-explainability.md): the reliability plot and bands
- [Market and affordability](../data/market-and-affordability.md): the market control
- [Parcels and assessments](../data/parcels-and-assessments.md): leakage risk in current assessments
- [Dimensional standards](../policy/dimensional-standards-and-use-table.md) and [reforms in flux](../policy/reforms-in-flux-2025-2026.md): why old behavior partly measures old rules
- [ZBA decisions](../data/zba-decisions.md): a possible second outcome label (approvals)

## Sources
- [WPRDC PLI permits, resource f4d1177a-f597-4c32-8cbf-7885f56253f6 (bulk dump)](https://data.wprdc.org/datastore/dump/f4d1177a-f597-4c32-8cbf-7885f56253f6) `[read]` *(accessed 2026-09-26)*: full CSV inspected in the scoring sweep; source of the ~670 / ~510 / ~370 counts
- [OneStopPGH OSPI_H FeatureServer](https://pghbridgis.pittsburghpa.gov/hosting/rest/services/Hosted/OSPI_H/FeatureServer/0) `[read]` *(accessed 2026-09-26)*: queried; source of the 860 / 592 counts, the recode, demolitions
- [Pro-Housing Pittsburgh IZ dataset](https://github.com/prohousingpgh/pittsburgh_iz) `[read]` *(accessed 2026-09-26)*: 109 buildings with 20+ units; marked verified in the working notes; CC BY-NC
- [YIMBYdata/housing-elements](https://github.com/YIMBYdata/housing-elements) `[found]` *(accessed 2026-09-26)*: precedent for matching inventories to permits; named in working notes, not opened
- Peduzzi et al. 1996, *J Clin Epidemiol*, events per variable. Link: citation only, in the [scoring sweep](../../sweeps/r2-scoring-algorithm-and-validation.md) `[found]` *(accessed 2026-09-26)*: from memory, not re-fetched
- LA / SF Housing Element likelihood-of-development models. Link: citation only, in the [scoring sweep](../../sweeps/r2-scoring-algorithm-and-validation.md) `[found]` *(accessed 2026-09-26)*: from memory, not re-fetched
- Sweep: [../../sweeps/r2-scoring-algorithm-and-validation.md](../../sweeps/r2-scoring-algorithm-and-validation.md) `[read]` *(accessed 2026-09-26)*: section A counts, caveats, calibration spec
- Sweep: [../../sweeps/r2-deeper-data-sources.md](../../sweeps/r2-deeper-data-sources.md) `[read]` *(accessed 2026-09-26)*: OSPI_H counts, recode, other permit copies
- Working notes: [../../archive/working-notes-2026-09-26/03-scoring-methods.md](../../archive/working-notes-2026-09-26/03-scoring-methods.md) `[read]` *(accessed 2026-09-26)*: rule-change caveat
- Working notes: [../../archive/working-notes-2026-09-26/01-data-sources.md](../../archive/working-notes-2026-09-26/01-data-sources.md) `[read]` *(accessed 2026-09-26)*: Pro-Housing Pittsburgh CSV
- [Adversarial critique](../../docs/04-critique.md) — rows 22, 31
