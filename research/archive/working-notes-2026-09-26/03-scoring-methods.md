# Scoring methods: options, not decisions

## Literature and precedents

**How we checked:** we did not re-fetch these this session. Spot-check any of them before putting it on a slide.

| Approach | Core idea | Relevance |
|---|---|---|
| GIS MCDA / AHP (Malczewski 2006; Saaty 1980) | Normalize criteria, apply Boolean constraint masks, take a weighted sum. AHP pairwise weights, consistency ratio <0.1. | Standard, but the weights are subjective, so report sensitivity to them |
| CA Housing Element sites inventory (Gov. Code §65583.2; HCD guidebook) | Realistic capacity is trimmed down from allowed capacity. Nonvacant sites need evidence of likely redevelopment. | Post-2021 critique: listed sites mostly didn't get built. LA and SF moved to statistical likelihood models trained on permits. |
| Terner Center dashboard / SB 9 analysis | Per-typology prototype pro forma; residual land value vs current value | "Pro Forma" angle |
| Metro Portland Buildable Land Inventory | Gross acres minus constraints (floodplain, slope ≥25%) minus streets gives net buildable acres | Deduction logic |
| Seattle Development Capacity Report | Redevelopable when existing floor area is well below allowed | Not directly applicable. Pittsburgh residential districts have **no FAR**; the building envelope comes from setbacks plus height. |
| UrbanSim (Waddell 2002) | Pro forma per parcel × building form; logit choice among the forms that are profitable | |
| CalEnviroScreen | Published percentile indicators combined multiplicatively | Precedent for a transparent score that isn't a simple sum |

## Design options under consideration
- **Gates vs friction vs opportunity.** Hard blockers are one category. Frictions add cost, time or risk. Opportunities are things like public ownership, a QCT, or transit. Don't let one severe blocker get averaged away.
- **Per-typology scores.** ADU, 2–3 units, rowhouse, 4–19 units, 20+ units. Ease depends on what is being built. Use table: 2-unit needs R2+, 3-unit needs R3+, multi-unit is by right only in RM among residential districts.
- **Approval-pathway modeling.** The most demanding required pathway sets the time and uncertainty. See [02-approval-pathway.md](02-approval-pathway.md).
- **Envelope / yield.**
  - Buildable footprint = lot minus setbacks minus constrained area.
  - Floors come from the height limit.
  - Units are capped by the use table.
  - There is no lot-area-per-unit limit anymore (Ord. 10-2025).
- **Uncertainty.**
  - Per-factor confidence and data vintage.
  - Monte Carlo over weights and assumption ranges, shown as a P10–P90 band.
  - "Unknown" is a separate state from "bad". Example: sewer capacity is unknown, not failing.
- **Persona weight presets** plus a rank-stability check.
- **Path to yes (counterfactual).** The minimal set of variances, lot combinations or policy changes that turns a gate from fail to pass.
- **Lot assemblage.** A parcel adjacency graph. Candidates are neighbors with the same owner, or city/Land Bank-owned vacant lots.
- **LLM role.** Only (a) extracting rules from code text, with human sign-off, and (b) explaining the deterministic results with citations. The LLM never produces numbers.

## Calibration / backtest idea (feasibility checked, outcome unknown)
- **Positives.** New-construction residential permits, 2019–2026.
  - WPRDC PLI gives about 670 permits on about 510 parcels, about 370 projects after grouping by owner, neighborhood and month.
  - OSPI_H gives about 860 BUILDING/NEW CONSTRUCTION permits plus the 2025+ "New Construction" recode.
  - They cluster in a few large HACP/URA redevelopment sites (Fairywood, Bedford Dwellings, and others). **Dedupe by project.**
- **Enough for:** reporting AUC / PR-AUC and lift for a rule-based score, and possibly a small regularized logistic model.
- **Caveats. State these openly.**
  1. Being built reflects **demand × ease**, not ease alone. Control for market strength, e.g. neighborhood sale price.
  2. **Leakage.** Only use features dated before the permit. The current assessment and vacancy status change after construction.
  3. The data only goes back to 2019. Earlier records are elsewhere [U].
  4. Validating against past behavior partly measures the old code. Lot-size rules changed in May 2025.
- Precedents: LA and SF Housing Element likelihood models; `YIMBYdata/housing-elements` matches inventories to permits (no license).

## Explainability UX patterns
- Waterfall of contributions. For a multiplicative score, use a log decomposition.
- The top 3–4 adverse "reason codes", as in adverse-action notices.
- Interval bars instead of point scores.
- Per-factor source and date badges.
- An "I disagree / correct this" override with an audit trail.
- Separate labels for observed, derived, assumed, unverified, normative, and needs-professional-review.
  - A participant's public research doc ([het-sheth/ai-housing-hackathon-wiki](https://github.com/het-sheth/ai-housing-hackathon-wiki)) proposes a very similar taxonomy, so this idea is probably not unique to us.
