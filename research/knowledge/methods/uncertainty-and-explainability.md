# Uncertainty and explainability

**Type:** method
**One line:** How to carry confidence and data vintage through the score, show a range instead of a false-precise number, and explain each result in terms a user can check.
**Why we care:** Many inputs are derived or assumed (slope from a DEM, approval odds with no published rates). A score that hides that will mislead; one that shows it earns trust and tells the user what to verify.
**Last checked:** 2026-09-26

## Carrying uncertainty

**Per-factor confidence and vintage.** The scoring sweep proposes that each factor carries a confidence and a data-as-of date ([scoring sweep](../../sweeps/r2-scoring-algorithm-and-validation.md)):

| Confidence | Meaning | Example |
|---|---|---|
| 1.0 | Authoritative GIS layer | Zoning district, floodway |
| 0.7 | Derived | Slope computed from a DEM |
| 0.4 | Assumption | Approval probability |

These values are the sweep's proposal, not calibrated numbers.

**Label taxonomy.** The working notes propose separate labels for **observed, derived, assumed, unverified, normative, and needs-professional-review** ([working notes](../../archive/working-notes-2026-09-26/03-scoring-methods.md)). A participant's public research document proposes a very similar taxonomy ([public repo](https://github.com/het-sheth/ai-housing-hackathon-wiki)), so the idea is not unique to us.

**Unknown is not bad.** Sewer capacity, for example, is unknown for most parcels; no public PWSA/ALCOSAN capacity or tap-in figures were found ([prior-art sweep](../../sweeps/r1-prior-art-proforma-and-practitioner-barriers.md)). Options: show it as a separate "unknown" state; exclude it from the score and list it as an unknown; or include it at a neutral value with low confidence. Treating it as a penalty would punish parcels for missing data.

## Propagation options

| Option | How | Tradeoff |
|---|---|---|
| **Monte Carlo** (sweep's proposal) | About 200 draws: weights from persona Dirichlet(α·w), pathway p_approve from Beta distributions, uncertain gates as Bernoulli. Show P10–P90. | Honest about compounded assumptions; the Beta and Dirichlet parameters are themselves assumptions; about 4 hours of build by the sweep's estimate |
| **Scenario bounds** | Compute the score under optimistic and pessimistic settings of each assumed input | Simple and explainable; wider than a probabilistic band |
| **Confidence only** | Show a High/Med/Low chip derived from the lowest-confidence input that matters | Cheapest; gives no range |

**Human-review flag.** The sweep proposes flagging a parcel "needs human verification" when the band is wider than 30 points or a gate rests on an inferred layer. The 30-point threshold is a proposal.

**Persona sensitivity.** Presets (homeowner ADU, small builder, nonprofit/LIHTC, city planner) change weights. Report rank stability: the Spearman ρ of rankings across personas, and "stays in the top 20% under X% of weight draws" ([scoring sweep](../../sweeps/r2-scoring-algorithm-and-validation.md)).

## Explaining a result

**Waterfall of contributions.** Start at 100, show the gate outcome, then each friction and opportunity contribution. For a multiplicative score, additive contributions come from a log decomposition, in the style of a SHAP waterfall (Lundberg & Lee 2017, cited from memory). For an additive score, contributions are the weighted terms directly ([scoring sweep](../../sweeps/r2-scoring-algorithm-and-validation.md)).

**Reason codes.** The top 3–4 adverse reasons, in the style of FICO / ECOA Reg B adverse-action notices, each linked to its data source and date.

**Path to yes.** The minimal set of curable items (a variance, an assemblage, a policy toggle) that changes the result, with each item linked to a code section. See [score design](score-design-options.md).

**Human in the loop.** An "I disagree / correct this" button that writes an override, with an audit trail. Storage options are in [architecture options](../build-plan/architecture-options.md).

**Published precedents (from memory, not re-fetched):** CalEnviroScreen and Allegheny County's Family Screening Tool published their indicators, weights and validation ([scoring sweep](../../sweeps/r2-scoring-algorithm-and-validation.md)).

## Displaying uncertainty

From the [UX sweep](../../sweeps/r2-ux-and-map-stack.md); more in [UX patterns](../build-plan/ux-patterns.md):

- **Map:** reduce saturation (a value-suppressing palette) or hatch low-confidence parcels.
- **Card:** a point with an interval bar ("62, likely 55–70"), a High/Med/Low confidence chip with an "unknowns" list, and a data-as-of date per source.
- **Compare view:** dot-and-interval plots, so overlapping ranges read as "not meaningfully different."
- **Never color alone:** always a number and a word label ("Easy / Moderate / Hard").
- **Weights are a modeling choice:** show them and let users adjust them.
- **"This is not a legal determination"** note.

## Open questions
- What the Beta parameters for approval probability would rest on. No published ZBA approval rates were found ([approval sweep](../../sweeps/r2-approval-pathway-and-timelines.md)).
- Whether the confidence values (1.0 / 0.7 / 0.4) should be ordinal labels rather than numbers, since nobody has calibrated them.
- Whether 200 Monte Carlo draws per parcel per typology is fast enough in the browser for ~140k parcels. Not tested.

## Connects to
- [Score design options](score-design-options.md): what is being explained
- [Backtest and calibration](backtest-and-calibration.md): reliability plot as calibration evidence
- [LLM role](llm-role.md): prose explanations built from the deterministic contribution vector
- [UX patterns](../build-plan/ux-patterns.md): how bands and chips look
- [Architecture options](../build-plan/architecture-options.md): where overrides are stored
- [Approval pathway](../policy/approval-pathway.md): the most assumption-heavy input
- [LiDAR slope](../data/lidar-slope.md): a derived input

## Sources
- Sweep: [../../sweeps/r2-scoring-algorithm-and-validation.md](../../sweeps/r2-scoring-algorithm-and-validation.md) `[read]` *(accessed 2026-09-26)*: confidence tiers, Monte Carlo, personas, waterfall, reason codes
- Sweep: [../../sweeps/r2-ux-and-map-stack.md](../../sweeps/r2-ux-and-map-stack.md) `[read]` *(accessed 2026-09-26)*: display patterns for uncertainty
- Sweep: [../../sweeps/r2-approval-pathway-and-timelines.md](../../sweeps/r2-approval-pathway-and-timelines.md) `[read]` *(accessed 2026-09-26)*: no published ZBA approval rates
- Sweep: [../../sweeps/r1-prior-art-proforma-and-practitioner-barriers.md](../../sweeps/r1-prior-art-proforma-and-practitioner-barriers.md) `[read]` *(accessed 2026-09-26)*: no public PWSA/ALCOSAN capacity data
- Working notes: [../../archive/working-notes-2026-09-26/03-scoring-methods.md](../../archive/working-notes-2026-09-26/03-scoring-methods.md) `[read]` *(accessed 2026-09-26)*: label taxonomy, unknown-vs-bad
- [het-sheth/ai-housing-hackathon-wiki](https://github.com/het-sheth/ai-housing-hackathon-wiki) `[skimmed]` *(accessed 2026-09-26)*: public research doc with a similar label taxonomy
- [Wilke, *Fundamentals of Data Visualization*: visualizing uncertainty](https://clauswilke.com/dataviz/visualizing-uncertainty.html) `[skimmed]` *(accessed 2026-09-26)*: listed as a source by the UX sweep
- Lundberg & Lee 2017 (NeurIPS), SHAP. Link: citation only, in the [scoring sweep](../../sweeps/r2-scoring-algorithm-and-validation.md) `[found]` *(accessed 2026-09-26)*: from memory, not re-fetched
- CalEnviroScreen 4.0 and Allegheny Family Screening Tool publication practice. Link: citation only, in the [scoring sweep](../../sweeps/r2-scoring-algorithm-and-validation.md) `[found]` *(accessed 2026-09-26)*: from memory, not re-fetched
