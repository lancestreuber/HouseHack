# Score design options

**Type:** method
**One line:** The structural choices for a per-parcel "development ease" score (gates, friction, opportunity, per-typology scoring, how to combine), and the literature each choice borrows from.
**Why we care:** The score is the product's core claim. How it is structured decides whether one fatal problem can be averaged away, whether it can be explained, and whether it can be checked against what actually got built.
**Last checked:** 2026-09-26

> These are options, not decisions. Where a sweep recommended one option, that recommendation is reported as the sweep's view, not as ours.

## The main structural choice: three kinds of factor

Both the scoring sweep and the working notes separate factors into three kinds ([scoring sweep](../../sweeps/r2-scoring-algorithm-and-validation.md), [working notes](../../archive/working-notes-2026-09-26/03-scoring-methods.md)):

| Kind | What it is | Examples proposed in the sweep |
|---|---|---|
| **Gates** | Hard blockers, per typology, with states PASS / CONDITIONAL / FAIL | Use not permitted by any pathway; parcel in the regulatory floodway; buildable area (after slope ≥ 40% and landslide exclusion) below the typology minimum; park or ROW; no street frontage and no assemblage option |
| **Friction** | Things that add cost, time or risk | Share of lot at 15–25% and 25–40% slope; 100-/500-year flood fringe; undermining and landslide-prone overlays; delinquent taxes or liens; demolition needed; irregular lot shape; approval-pathway time |
| **Opportunity** | Things that make a project easier to start or finance | City / Land Bank / URA ownership; QCT or DDA; within 1/4 mile of a frequent transit stop; Opportunity Zone; existing water/sewer mains; neighborhood sale-price percentile |

The principle both sources repeat: **never average a FAIL away.** A CONDITIONAL state covers gates that can be cured, for example an undersized lot that could be assembled with a neighbor.

A second distinction from the working notes: **"unknown" is a separate state from "bad".** Sewer capacity, for example, is unknown for most parcels, not failing. See [uncertainty and explainability](uncertainty-and-explainability.md).

## Per-typology scoring

Ease depends on what is being built, so the sweep proposes scoring each parcel once per typology: ADU, 2–3 unit, rowhouse/townhome, 4–19 multifamily, and 20+ (inclusionary zoning where it applies) ([scoring sweep](../../sweeps/r2-scoring-algorithm-and-validation.md)).

- The working notes record a use-table reading: a 2-unit building needs R2 or higher, a 3-unit building needs R3 or higher, and multi-unit is by right only in RM among residential districts ([working notes](../../archive/working-notes-2026-09-26/03-scoring-methods.md)). Check this against the code text in [dimensional standards and use table](../policy/dimensional-standards-and-use-table.md) before relying on it.
- The ADU typology depends on Bill 2025-1545, which was **pending** when checked ([prior-art sweep](../../sweeps/r1-prior-art-proforma-and-practitioner-barriers.md)). Any ADU score is conditional on that bill; model it as a toggle.
- Headline options: show the **maximum over typologies** with the typology named (the sweep's example: "Easiest: duplex, by-right, 72 [61–80]"), or show a small grid of typology × score and let the user pick.

## Envelope and yield (deterministic)

The scoring sweep's draft formula was:

- Buildable area = lot area − setbacks − constrained area.
- GFA_max = min(FAR × lot area, footprint × floors allowed by height).
- Units_max = min(GFA_max / unit size, lot area / min lot area per unit).

⚠ **Two parts of that draft do not apply to Pittsburgh residential districts:**

1. **No FAR.** §903.03 residential districts have no floor-area ratio. The envelope comes from lot size, setbacks and height only. This is logged in the [corrections log](../README.md#corrections-log). For residential districts, GFA_max = buildable footprint × floors allowed by the height limit.
2. **No lot-area-per-unit limit.** The May 2025 lot-size reform removed lot-size-per-unit requirements everywhere ([prior-art sweep](../../sweeps/r1-prior-art-proforma-and-practitioner-barriers.md); [working notes](../../archive/working-notes-2026-09-26/03-scoring-methods.md), citing Ord. 10-2025). Units are capped by the use table and by the envelope, not by lot area per unit.

The current minimum lot sizes (VL 6,000 / L 3,000 / M 2,400 / H 1,200 sf / VH none) are in the [corrections log](../README.md#corrections-log) and [dimensional standards](../policy/dimensional-standards-and-use-table.md). Nonconformity flags must use the post-May-2025 values.

Parking: the sweep proposes a code-table lookup with a toggle for pending Bill 2025-1545. See [parking](../policy/parking.md).

## Approval pathway as a factor

Map each failed requirement to the pathway that cures it (by right, Administrator Exception, Special Exception, Variance, Conditional Use, plus Historic Review if in a historic district). The **most demanding required pathway** sets the time and uncertainty ([scoring sweep](../../sweeps/r2-scoring-algorithm-and-validation.md)). The approval-pathway sweep gives realistic durations (for example ZBA 2–4 months, Conditional Use at least about 3–5 months) and found **no published ZBA approval rates** ([approval sweep](../../sweeps/r2-approval-pathway-and-timelines.md)). Any approval probability used in the score is therefore an assumption and must be labeled as one. Details: [approval pathway](../policy/approval-pathway.md), [permit timelines](../policy/permit-timelines.md).

## How to combine: multiplicative vs additive

| Option | Form | Strength | Weakness |
|---|---|---|---|
| **Additive weighted sum (MCDA)** | Normalize criteria to 0–1, apply Boolean constraint masks first, then S = Σ wᵢxᵢ | Standard, easy to explain, easy to decompose | Weights are subjective; without masks, a severe problem can be offset by amenities |
| **Multiplicative (sweep's proposal)** | Ease = 0 if FAIL, else 100 × P_approve × (1 − F)^α × (0.5 + 0.5·O) | One severe problem cannot be offset by amenities (the logic the sweep attributes to CalEnviroScreen and Metro Portland) | Harder to explain as contributions; needs a log decomposition for a waterfall; P_approve has no Pittsburgh data behind it |
| **Gates + separate subscores, no composite** | Show gate state, F and O side by side | Most honest; avoids a single number built on assumed weights | Harder to rank or map; judges may want one number |
| **Fitted model as the score** | Logistic model trained on permits | Weights come from data | Learns demand × ease, not ease; small sample; see [backtest](backtest-and-calibration.md) |

Whichever form is chosen, the sweep recommends reporting sensitivity to weights (persona presets and rank stability, see [uncertainty](uncertainty-and-explainability.md)).

## Literature and precedents

**How we checked:** the scoring sweep lists these as **"from memory, not re-fetched."** They are tagged `[found]` below. Their exact thresholds should be spot-checked before they go on a slide. The one exception is the Terner Center dashboard, which a different sweep did fetch.

| Approach | Core idea (as the sweep summarizes it) | What to borrow |
|---|---|---|
| **GIS MCDA / AHP** (Malczewski 2006; Saaty 1980) | Normalize criteria, constraint masks first, weights from AHP pairwise comparisons with consistency ratio < 0.1, weighted sum | Masks-then-weights structure; report weight sensitivity |
| **California Housing Element sites inventory** (Gov. Code §65583.2; HCD guidebook, 2020) | Realistic capacity = max density × a haircut from past built-to-allowed ratios; nonvacant sites need "substantial evidence" (improvement-to-land ratio, building age, trends); lower-income sites under 0.5 acre or over 10 acres presumed inadequate | The post-2021 critique that listed sites mostly didn't get built, which pushed LA's 2021–29 element toward a statistical likelihood model trained on past permits. The working notes add SF. This is the precedent for [calibration](backtest-and-calibration.md). |
| **Terner Center** Housing Development Dashboard; SB 9 parcel analysis (2021) | Per-typology prototype pro forma: residual land value vs current value; eligibility filter first, then feasibility | Eligibility-then-feasibility order; see [pro forma](pro-forma.md). The dashboard itself was fetched by the prior-art sweep: a free beta calculator estimating probability of being built via IRR, with defaults set for north Oakland, CA. |
| **Metro Portland Buildable Land Inventory** (2018 Urban Growth Report) | Gross acres − constrained land (floodplain, slope ≥ 25%, resource land) − future-streets allowance = net buildable; "redevelopable" set by a pro forma threshold, not vacancy alone | Deduction logic for buildable area |
| **Seattle Development Capacity Report** | Redevelopable when existing development is well below allowed capacity (roughly under 50%) | **Not directly applicable:** it is floor-area based, and Pittsburgh residential districts have no FAR |
| **UrbanSim** (Waddell 2002) | Pro forma per parcel × building form, then a logit choice among profitable forms | Per-typology feasibility then choice |
| **CalEnviroScreen 4.0** (OEHHA 2021) | Percentile indicators combined multiplicatively (burden × vulnerability), all components published | Precedent for a transparent, non-additive civic score |

## Other design options in the sources

- **Persona presets** (homeowner ADU, small builder, nonprofit/LIHTC, city planner) that change F/O weights and the typology set.
- **Path to yes:** greedy search for the minimal set of curable items (a variance, an assemblage, a policy toggle, a utility extension) that moves a gate to PASS or raises the score by 15+.
- **Assemblage:** a parcel adjacency graph; candidates are same-owner neighbors or city/Land Bank/URA-owned vacant neighbors; recompute envelope and gates on the union.
- **Policy-lever re-runs:** re-score the city under a toggle (e.g. Bill 2025-1545) and report how many parcels change band.

All from the [scoring sweep](../../sweeps/r2-scoring-algorithm-and-validation.md). The sweep estimated about 10 hours for gates, envelope, pathway lookup and per-typology scoring; that is an estimate, not a measurement.

## Open questions
- Which combination form to use. Nothing in the sources settles it; it is a judgment call to make with the backtest results in hand.
- Where approval probabilities would come from. No published ZBA approval rates were found ([approval sweep](../../sweeps/r2-approval-pathway-and-timelines.md)); scraping ZBA decisions is the only lead ([ZBA decisions](../data/zba-decisions.md)).
- Whether the use-table reading (R2+ for 2 units, R3+ for 3 units, RM for multi-unit) holds in the current code text.
- Exact thresholds in every literature item above; none were re-fetched.
- Whether the city's ~140k parcel count is right. The scoring sweep did not verify it; a separate layer (ETHOS Lot Suitability, a stormwater/green-infrastructure analysis; ⚠ "2024" date unverified *(corrected 2026-09-26 per docs/04-critique.md row 31)*) has 142,806 city parcels ([deeper data sweep](../../sweeps/r2-deeper-data-sources.md)).

## Connects to
- [Backtest and calibration](backtest-and-calibration.md): how a chosen structure can be checked against permits
- [Uncertainty and explainability](uncertainty-and-explainability.md): confidence, Monte Carlo bands, waterfalls
- [Pro forma](pro-forma.md): the optional feasibility layer
- [LLM role](llm-role.md): the LLM explains the score, it never computes it
- [Dimensional standards and use table](../policy/dimensional-standards-and-use-table.md): envelope inputs, no FAR
- [Environmental overlays (Ch. 906)](../policy/environmental-overlays-ch906.md): gates and friction from slope, landslide, undermining, flood
- [Approval pathway](../policy/approval-pathway.md): the pathway factor
- [Parking](../policy/parking.md) and [reforms in flux](../policy/reforms-in-flux-2025-2026.md): toggles for pending bills
- [LiDAR slope](../data/lidar-slope.md): slope inputs
- [Land availability and title](../data/land-availability-and-title.md): opportunity inputs
- [Combining with Track 1](../track3/combining-with-track1.md): typology matching across tracks
- [Commercial tools](../landscape/commercial-tools.md): what existing products score

## Sources
- Sweep: [../../sweeps/r2-scoring-algorithm-and-validation.md](../../sweeps/r2-scoring-algorithm-and-validation.md) `[read]` *(accessed 2026-09-26)*: the gates/friction/opportunity spec, composite formula, literature list
- Sweep: [../../sweeps/r1-prior-art-proforma-and-practitioner-barriers.md](../../sweeps/r1-prior-art-proforma-and-practitioner-barriers.md) `[read]` *(accessed 2026-09-26)*: lot-size reform, Bill 2025-1545 status, Terner dashboard fetch
- Sweep: [../../sweeps/r2-approval-pathway-and-timelines.md](../../sweeps/r2-approval-pathway-and-timelines.md) `[read]` *(accessed 2026-09-26)*: pathway durations; no published ZBA approval rates
- Sweep: [../../sweeps/r2-deeper-data-sources.md](../../sweeps/r2-deeper-data-sources.md) `[read]` *(accessed 2026-09-26)*: ETHOS parcel count
- Working notes: [../../archive/working-notes-2026-09-26/03-scoring-methods.md](../../archive/working-notes-2026-09-26/03-scoring-methods.md) `[read]` *(accessed 2026-09-26)*: no-FAR note, use-table reading, unknown-vs-bad
- [Terner Center Housing Development Dashboard](https://ternercenter.berkeley.edu/development-calculator-dashboard/) `[read]` *(accessed 2026-09-26)*: fetched by the prior-art sweep; IRR-based probability-of-build calculator
- Malczewski 2006, *IJGIS* 20(7), GIS-based MCDA survey. Link: citation only, recorded in the [scoring sweep](../../sweeps/r2-scoring-algorithm-and-validation.md) `[found]` *(accessed 2026-09-26)*: from memory, not re-fetched
- Saaty 1980, Analytic Hierarchy Process. Link: citation only, in the [scoring sweep](../../sweeps/r2-scoring-algorithm-and-validation.md) `[found]` *(accessed 2026-09-26)*: from memory, not re-fetched
- Cal. Gov. Code §65583.2 and HCD Housing Element Sites Inventory Guidebook (2020). Link: citation only, in the [scoring sweep](../../sweeps/r2-scoring-algorithm-and-validation.md) `[found]` *(accessed 2026-09-26)*: from memory, not re-fetched
- City of LA 2021–2029 Housing Element sites methodology. Link: citation only, in the [scoring sweep](../../sweeps/r2-scoring-algorithm-and-validation.md) `[found]` *(accessed 2026-09-26)*: from memory, not re-fetched
- Terner Center SB 9 parcel analysis (Metcalf et al. 2021). Link: citation only, in the [scoring sweep](../../sweeps/r2-scoring-algorithm-and-validation.md) `[found]` *(accessed 2026-09-26)*: from memory, not re-fetched
- Metro Portland 2018 Urban Growth Report / Buildable Land Inventory. Link: citation only, in the [scoring sweep](../../sweeps/r2-scoring-algorithm-and-validation.md) `[found]` *(accessed 2026-09-26)*: from memory, not re-fetched
- Seattle OPCD Development Capacity Report. Link: citation only, in the [scoring sweep](../../sweeps/r2-scoring-algorithm-and-validation.md) `[found]` *(accessed 2026-09-26)*: from memory, not re-fetched
- Waddell 2002, *JAPA* 68(3), UrbanSim. Link: citation only, in the [scoring sweep](../../sweeps/r2-scoring-algorithm-and-validation.md) `[found]` *(accessed 2026-09-26)*: from memory, not re-fetched
- CalEnviroScreen 4.0 (OEHHA 2021). Link: citation only, in the [scoring sweep](../../sweeps/r2-scoring-algorithm-and-validation.md) `[found]` *(accessed 2026-09-26)*: from memory, not re-fetched
