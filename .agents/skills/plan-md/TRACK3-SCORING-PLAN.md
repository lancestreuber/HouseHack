# Track 3 scoring plan: click a parcel, rank the housing types

*Draft, 2026-09-26. Track 3 — Housing Typology, Equity & Climate Matchmaker. Scope: City of Pittsburgh.*

---

## 0. What we're building, and why it's shaped this way

A user clicks a parcel. The tool ranks 6 housing types for that parcel, shows why, and re-ranks instantly when the user moves weight sliders.

The Track 3 brief sets the success test. Each requirement maps to a part of the design:

| Brief says | Design answer |
|---|---|
| "compare at least two housing scenarios for a real place" | Every click ranks 6 types on one real parcel |
| "see why the tool ranked them differently" | A contribution breakdown plus a pairwise "why A beats B" (§7) |
| "change normative weights" | Sliders, computed in the browser, with no AI call (§6) |
| "understand which conclusions are data-driven versus value judgments" | Four layers kept apart: Facts / Gate / Ratings / Weights (§1) |
| "interpretable factors and confidence ranges" | Rating spread plus weight Monte Carlo (§8) |
| "present scenarios rather than declare a single correct answer" | A win probability across weight draws, never "the answer" |

Judging adds: **Data & AI Integrity** (cited sources, uncertainty, human in the loop) and the **"thin wrapper isn't a project"** rule. That rules out "ask the AI to rank it".

---

## 1. The core idea: four layers, each owned by a different thing

```
┌──────────────────────────────────────────────────────────────────────────┐
│ L1 FACTS    code, deterministic   "lot is 3,251 sf, zoned R2-L, 30% in    │  evidence
│                                    the 100-yr floodplain, bus stop 400 ft"│
├──────────────────────────────────────────────────────────────────────────┤
│ L2 GATE     code, deterministic   "fourplex: not permitted in R2"         │  law
├──────────────────────────────────────────────────────────────────────────┤
│ L3 RATINGS  data base + jev adj.  "duplex, access: 8/10 because [f12]"    │  evidence + judgment
├──────────────────────────────────────────────────────────────────────────┤
│ L4 WEIGHTS  the user              "I care about climate 2x demand"        │  values
└──────────────────────────────────────────────────────────────────────────┘
                     score = GATE × aggregate(WEIGHTS, RATINGS)
```

**Why four layers instead of one model:**

1. **Law must be exact.** An AI will confidently say ADUs are legal in Pittsburgh. They aren't: Bill 2025-1545 is Held In Council. Code owns legality.
2. **Values must belong to the user.** If jev saw the weights, its ratings would mix facts with preferences and we could no longer separate "data-driven" from "value judgment", which is the brief's central ask.
3. **Judgment is where AI earns its place.** "Does a fourplex physically work on this narrow hillside lot next to row houses?" is expensive to hand-code (setbacks, footprints, room sizes) and cheap for a model to reason about from the facts.
4. **Sliders must be instant and stable.** Moving a slider only re-multiplies cached numbers, so the same weights always give the same ranking.

**Why jev adjusts a data baseline instead of rating from scratch (key choice):**
For each area-level pillar, we compute a **baseline from real data**, and jev may only move it by a bounded amount for typology-specific reasons. This:
- keeps the ranking anchored to measured evidence (auditable, repeatable);
- leaves a working fallback when the AI is down or slow (adjustment = 0);
- confines hallucination damage: a wrong adjustment is bounded and has a written, cited reason;
- follows the LLM-as-judge finding that anchored rubrics give more consistent scores than open-ended rating ([G-Eval, Liu et al. 2023](https://arxiv.org/abs/2303.16634); [Zheng et al. 2023, "Judging LLM-as-a-Judge"](https://arxiv.org/abs/2306.05685)).

---

## 2. Notation

| Symbol | Meaning |
|---|---|
| `p` | the clicked parcel |
| `t ∈ T` | a housing type (§3) |
| `k ∈ K` | a pillar (§4) |
| `F(p)` | the fact set for `p`, each fact with an id (§5) |
| `G(p,t) ∈ [0,1]` | gate multiplier (§6.1) |
| `b_k(p) ∈ [0,10]` | data baseline for pillar `k` at the parcel's place |
| `δ(p,t,k) ∈ [−3,+3]` | jev's typology adjustment, with a cited reason |
| `m(t,k)` | deterministic typology modifier where we have real numbers (carbon) |
| `r(p,t,k) ∈ [0,10]` | final rating = `clip(b + m + δ, 0, 10)` |
| `w_k ≥ 0, Σw = 1` | user weights |
| `S(p,t) ∈ [0,100]` | final score |

---

## 3. Housing types (T)

| id | Type | Use-table row (§911.02) | Why included |
|---|---|---|---|
| `detached` | Detached single-family | Single-Unit Detached | The baseline everyone compares against |
| `adu` | Detached house + ADU | *not in current code* | Named in the brief; the showcase for the policy toggle |
| `duplex` | Duplex | Two-Unit | Smallest middle-housing step |
| `triplex` | Triplex / fourplex | Three-Unit (4 = Multi-Unit) | Classic missing middle |
| `townhomes` | Townhomes (row) | Single-Unit Attached | Pittsburgh's traditional form; ownership product |
| `small_apt` | Small apartment (5–19) | Multi-Unit | The density end of the scale |

**Reasoning:** these are the brief's own list ("duplexes, townhomes, apartments, accessory units, detached homes"), and each maps to a use-table row, so the gate is exact. Senior housing is left out because it's Special Exception everywhere and would clutter the demo. Mention it in limitations.

**Cut line if we run late:** `detached`, `adu`, `duplex`, `small_apt`.

---

## 4. Pillars (K)

| Pillar | Question it answers | Baseline `b_k` from data | What can shift it by typology |
|---|---|---|---|
| **Demand** | Will this type sell or rent here? | MVA 2021 market type → ordinal; rent/income from the Community Need layer | jev: rental vs ownership fit for the market (e.g. townhomes in owner-heavy markets) |
| **Access** | Do residents reach transit, jobs and services? | High-frequency transit within ¼ mi (trips/hr), jobs within reach (LODES) | jev: small (±1). Access is mostly about place; more units mean more people benefit, shown via units |
| **Equity** | Does it add affordable options without pushing people out? | CHAS cost burden, MVA tier, displacement risk ratio (as an *affordability* signal), Community Need | jev: affordability reach of the type (ADU/duplex rents vs AMI), displacement pressure of larger new builds in Transitional markets |
| **Climate** | Is it low-carbon and safe from hazards? | Hazard exposure: flood zone class, FEMA NRI heat/landslide/inland flood (tract), air burden (block group) | **`m(t,k)` from real numbers**: operational energy (RECS 2020) + embodied carbon by type; jev: small site-specific adjustments |
| **Site fit** | Does this type physically work on *this* lot? | none (no data baseline) | **jev rates fully**, from lot area, estimated width, slope/flood share, neighbors' form, zoning minimums |

**Reasoning:**
- **Five pillars** is the most a slider panel can carry without confusing users, and each maps to words in the brief (demand, access to opportunity, affordability + displacement, carbon + resilience, physical feasibility).
- **Infrastructure capacity** (named in the brief) has no public data. It becomes a visible "unknown" chip on every result, not a pillar. That's honest, and the packet says judges reward it.
- **Correlated indicators get merged before becoming a baseline.** We compute a Spearman correlation matrix across all block-group indicators. Indicators with ρ > 0.7 (e.g. PM2.5, NO2, diesel, traffic) collapse into one sub-index so no concept is counted twice. The heatmap goes on the methodology page.

### 4.1 Baseline construction (deterministic)

For each raw indicator `x_i` at the parcel's block group or tract:

```
pct_i   = percentile rank of x_i among Pittsburgh block groups (0–100), oriented so higher = better
sub_j   = mean of pct_i within correlated cluster j          (de-duplication)
b_k(p)  = (1/10) × mean of sub_j in pillar k                 (0–10)
```

- **Percentiles** (EJScreen / CalEnviroScreen practice) make incomparable units comparable, resist skew and outliers, and read in plain language ("better than 80% of the city").
- **Equal weights inside a pillar** keep the only subjective weights in the user's hands.
- **Direction of each indicator is written down** in a table on the methodology page, e.g. "more cost-burdened renters → higher Equity *need*", which raises the value of adding affordable units there.

### 4.2 Climate typology modifier `m(t, climate)` (deterministic)

Built from sourced numbers so jev isn't guessing carbon:

| Type | Operational site energy / household (RECS 2020, MMBtu) | Embodied carbon (Dublin, kgCO2e/m²) |
|---|---|---|
| Detached | 94.6 | 316 |
| Townhomes | 67.1 | 316 (house) |
| Duplex / triplex | 53.5 | 396 |
| Small apartment | 33.7 | 437 |
| ADU | *assumption:* ≈ attached | *assumption* |

- **Normalisation toggle (a value choice): per unit vs per m².** The research shows the ranking can flip with the denominator (BfCA). Showing that flip live is a strong demo of "value judgment vs data".
- `m` = scaled position in this table, ±2 points. Labelled "national/overseas data applied to Pittsburgh: assumption".

---

## 5. Layer 1: Facts

Every fact has an id, a value, a source, an as-of date, a geography and a confidence. Jev may only cite these ids.

```ts
type Fact = {
  id: string;            // "f.lot_area"
  label: string;         // "Lot area"
  value: number | string | boolean | null;
  unit?: string;         // "sf"
  source: string;        // "Allegheny County parcels (WPRDC), Sep 2026"
  asOf: string;
  geography: "parcel" | "block_group" | "tract" | "stop" | "citywide";
  inherited: boolean;    // true if an area value applied to this parcel
  status: "known" | "unknown" | "insufficient";
};
```

| Fact | How we get it | Have it? |
|---|---|---|
| Lot area (sf) | Neon `parcel.properties.Shape_Area` (sq ft; matches `CALCACREAG`) | ✅ |
| Approx. lot width / depth | Minimum rotated rectangle of the polygon (PostGIS `ST_OrientedEnvelope` or turf, offline) | ✅ computable |
| Zoning district + density suffix | Parcel centroid in `pittsburgh-zoning.geojson` (`zon_new`, e.g. `R2-L`) | ✅ |
| Non-housing zone flag | `non_housing` in the zoning file | ✅ |
| District min lot size | Suffix → VL 6,000 / L 3,000 / M 2,400 / H 1,200 / VH none (post-May-2025, §903.03) | ✅ table |
| Use-table permission per type | §911.02 transcription (R1D–RM reliable) | ✅ table |
| Flood class on the parcel | Overlap with `flood-zones.geojson` → floodway / SFHA / moderate / none, plus % of lot | ✅ |
| NRI heat / landslide / inland flood | `weather-risk.geojson`, tract | ✅ (inherited) |
| Air burden | `air-quality.geojson`, block group | ✅ (inherited) |
| Lead service lines nearby | `lead-service-lines.geojson`, count within 150 m | ✅ (context only) |
| Market type, displacement risk ratio | WPRDC MVA 2021 | ❌ fetch |
| Rent, income, no-vehicle rate, Opportunity Atlas | City `Tracts2020_Pgh_CommunityNeed` | ❌ fetch |
| Transit frequency within ¼ mi | City `HighFrequencyTransit` or PRT GTFS | ❌ fetch |
| Cost burden | HUD CHAS | ⚠ optional (manual download) |
| Slope ≥ 25% / landslide-prone / undermined | City overlay layers | ⚠ nice to have |
| Sewer/water capacity | none public | 🚫 always "unknown" |

**Unknown is not bad.** A missing fact gives `status: "unknown"`. It never becomes zero (§6.3).

---

## 6. The formulation

### 6.1 Layer 2: Gate `G(p,t)`

A gate is **multiplicative and applied first**, so no amount of good transit can buy back an illegal or physically impossible option. This is the constraint-mask-then-weight order used in GIS multi-criteria suitability analysis ([Malczewski-style MCDA for housing sites](https://www.researchgate.net/publication/228705365_GIS_based_multicriteria_approaches_to_housing_site_suitability_assessment)).

Each type gets a status from rules, then a multiplier:

| Status | Rule examples | `G` |
|---|---|---|
| `allowed` | Use permitted by right (P) and lot ≥ district min | 1 |
| `conditional` | Administrator Exception (undersized lot, one house, separate ownership); Special Exception (2+ units on an undersized lot); SFHA fringe (floodplain permit) | `γ_c` (user setting, default 0.7) |
| `reform_only` | Allowed only under Bill 2025-1545 as proposed (ADUs) | 0 when toggle off; `γ_r` when on (default 0.8, labelled "proposed, not law") |
| `blocked` | Use not permitted in the district; parcel in the regulatory floodway; `non_housing` zone | 0 |

```
G(p,t) = min over all rules of the rule's multiplier
```

**Reasoning:**
- `min`, not a product: two conditional hurdles don't make a site worse than one blocker, and one blocker is decisive.
- `γ_c` is **a value choice**: "how much approval risk will you accept?" So it's exposed as a "Risk tolerance" setting instead of a number we pretend is measured. The research found no published approval probability; the ZBA sample (81% of posted relief requests approved) is biased upward and is quoted as context, not used as `γ_c`.
- Blocked types stay on screen, greyed, with the reason. Seeing "fourplex blocked: R2 allows at most 2 units" is useful information.

### 6.2 Layer 3: Ratings `r(p,t,k)`

```
r(p,t,k) = clip( b_k(p) + m(t,k) + δ(p,t,k), 0, 10 )      for k ∈ {demand, access, equity, climate}
r(p,t,site_fit) = jev rating ∈ [0,10]                        (no baseline exists)
```

- `b_k(p)` is identical for every type at this parcel: the place's measured quality.
- `m(t,k)` is deterministic, only where real numbers exist (climate).
- `δ` is jev's bounded, cited adjustment. **|δ| ≤ 3**, and `|δ| ≤ 1` for Access.

**Why bounded:** it forces "place quality" to come from data and lets jev only explain *how this type interacts with this place*. If jev says a fourplex's Equity is +3 because "4 rental units at roughly 80% AMI rents in a market where 45% of renters are cost-burdened [f.chas_burden]", that's a checkable claim. If it tried to rate Equity from nothing, the number would be unfalsifiable.

**Units estimate `u(p,t)`:** jev also returns an estimated unit count, capped by the use table (duplex = 2, etc.) and by lot area ÷ an assumed land-per-unit floor. It's shown as a range and labelled an estimate. It's used for display and for per-unit carbon.

### 6.3 Missing data

If pillar `k` has no known facts for this parcel:
- mark `r(p,t,k) = unknown` for all types;
- **renormalise the weights** over known pillars: `w'_k = w_k / Σ_{known} w`;
- show a chip: "Equity not scored: no data for this block group".

**Why:** setting unknown to 0 would punish data-poor neighborhoods, which are often the lowest-income ones. That's a real equity harm, and exactly what the brief warns about.

### 6.4 Layer 4: Aggregation `S(p,t)`

The user picks the aggregation rule, and the choice is labelled a value judgment:

**Compensatory (default): weighted arithmetic mean**
```
S(p,t) = 10 · G(p,t) · Σ_k w_k · r(p,t,k)
```
A strength can make up for a weakness. It's easy to explain, and contributions add up exactly.

**Non-compensatory: weighted geometric mean**
```
S(p,t) = 100 · G(p,t) · Π_k ( max(r(p,t,k), 0.5) / 10 ) ^ w_k
```
A very poor pillar drags the whole score down; you can't buy back a flood-exposed site with good transit. This is CalEnviroScreen's reasoning for multiplying its components ([OEHHA model & scoring](https://oehha.ca.gov/calenviroscreen/model-scoring)). The 0.5 floor prevents one zero from wiping out everything, since zeros belong to the gate, not the ratings.

**Weight presets** (starting points only; the user can always drag): Planner (balanced), CDC (Equity + Demand), Small developer (Demand + Site fit), Climate-first (Climate + Access), Resident (Equity + Site fit). Presets turn the abstract "value judgment" into recognisable viewpoints, which reads well in the demo video.

---

## 7. Explaining the ranking ("why A beats B")

**Per type, contribution bars** (arithmetic mode):
```
contrib(t,k) = 10 · G · w_k · r(p,t,k)          sums exactly to S(p,t)
```
Geometric mode uses log contributions: `w_k · ln(r/10)`.

**Pairwise explanation for the top two types A and B:**
```
Δ = S(A) − S(B) = 10 · Σ_k w_k · [G_A r_A,k − G_B r_B,k]
```
Sort the terms and show the top 2–3 drivers in plain language: "Duplex beats small apartment mainly on Site fit (+14) and Equity (+6); the apartment wins on Climate (−9)."

**Flip point (the "what would change my mind" feature):** for each slider, solve for the weight at which A and B tie. In arithmetic mode it's linear:
```
Moving weight k by Δw (others rescaled proportionally) changes Δ linearly → solve Δ(Δw) = 0
```
Show "Small apartment would rank first if Climate weight rises above 34%." This speaks directly to the brief's "see why the tool ranked them differently", and it makes the tradeoff tangible.

---

## 8. Uncertainty and confidence

Two separate sources, shown separately:

**(a) Judgment uncertainty (jev):** call jev **3 times** (temperature ≈ 0.7) and take the median `δ` per cell. The min–max spread becomes each rating's range. Self-consistency sampling is a standard way to get a stability signal from a model ([Wang et al. 2022](https://arxiv.org/abs/2203.11171)).

**(b) Preference uncertainty (weights):** in the browser, draw N = 1,000 weight vectors from a Dirichlet centred on the user's weights (`α = 50·w`, so draws stay near the user's choice), sample each rating within its range, and re-rank.
```
P(t is #1) = share of draws where t ranks first
```
Display: "Duplex ranks first in 78% of nearby weightings; triplex 19%." This is the Monte Carlo rank-stability approach from the MCDA sensitivity literature ([spatial sensitivity of MCDA weights](https://www.sciencedirect.com/science/article/abs/pii/S1364815210001842); [systematic review](https://www.sciencedirect.com/science/article/pii/S156849462300933X)). It runs in well under 100 ms in JS.

**(c) Data confidence badge per parcel:** High / Medium / Low, from the share of facts that are `inherited` (tract value applied to a parcel), `insufficient`, or stale (e.g. MVA sales end 2019).

**Why show both (a) and (b):** they answer different questions. (a): "how sure is the tool about this site?" (b): "how much does the answer depend on what you value?" Judges asked for both uncertainty and value-vs-data separation; this delivers both.

---

## 9. The jev contract

### Input (one call per parcel per scenario)
```json
{
  "parcel": { "pin": "0102P00193000000", "neighborhood": "…" },
  "facts": [ { "id": "f.lot_area", "label": "Lot area", "value": 3251, "unit": "sf", … } ],
  "types": [ { "id": "duplex", "gate": "allowed", "gate_reason": "R2 permits Two-Unit by right" }, … ],
  "baselines": { "demand": 6.2, "access": 8.1, "equity": 5.5, "climate": 4.0 },
  "climate_modifier": { "detached": -1.5, "small_apt": 1.8, … },
  "rubric": { "site_fit": { "0": "cannot fit", "5": "fits with compromises", "10": "comfortable fit" }, … }
}
```

### Output (structured, validated with zod)
```json
{
  "types": [
    {
      "id": "duplex",
      "site_fit": { "rating": 8, "reasons": [ { "text": "…", "facts": ["f.lot_area","f.lot_width"], "kind": "evidence" } ] },
      "adjustments": {
        "demand": { "delta": 1, "reasons": [ … ] },
        "equity": { "delta": 2, "reasons": [ … ] },
        "access": { "delta": 0, "reasons": [] },
        "climate": { "delta": 0, "reasons": [] }
      },
      "units": { "low": 2, "high": 2 },
      "unsure_about": ["actual lot frontage", "whether the existing structure is being reused"]
    }
  ],
  "cannot_tell": ["sewer capacity", "…"]
}
```

### Rules in the prompt, enforced in code
1. **Never see the weights.** Ratings describe the site, not preferences.
2. **Every reason cites at least one fact id.** Code drops any reason whose ids aren't in the input.
3. **Reason kinds are `evidence` (restates a fact) or `assumption` (infers beyond it).** No `value` kind: value judgments belong to the user. Anything that reads like "should" is flagged in review.
4. **Can't change a gate.** A blocked type gets no ratings, only the gate reason.
5. **Clamp** `δ` to its bounds in code, whatever the model returns.
6. **No legal claims beyond the facts.** Any rule not in the input must be phrased "verify with the Zoning Administrator".

### Performance and cost
- Cache key: `hash(pin, scenario, facts, model, prompt version)`. Precompute the 3 demo parcels.
- 3 samples × 1 call per parcel. If jev fails, fall back to `δ = 0`, site fit = "not rated", and show a banner. Scores still work.

---

## 10. Policy scenario toggle

**Current code ↔ Bill 2025-1545 as proposed** (Held In Council; labelled "proposed, not law" everywhere).

What flips:
- `adu`: `blocked` → `reform_only` (G = γ_r).
- Parking minimums removed → jev re-rates Site fit, since parking eats less lot. This is a new jev call with a `scenario` field, cached separately.

Show a delta: "Under the proposed reform, ADU moves from blocked to #2 on this parcel."

---

## 11. Validation (what we test before the video)

| Check | How | Pass bar |
|---|---|---|
| Gate logic | `bun test` golden cases: R1D-L steep lot, RM-M flat lot near frequent transit, floodway parcel, undersized R2 lot | All exact |
| Baselines | Spot-check 5 block groups against source layers by hand | Match |
| Jev grounding | Validator: all cited ids exist; δ within bounds | 100% after clamp/drop |
| Jev consistency | 3 samples on 5 parcels: median δ spread | ≤ 2 points on most cells; report the rest |
| Rank sanity | Hand review by the teammate who knows housing: do the 3 demo rankings make sense? | Agreed, or the reason is written into limitations |
| Backtest (optional, weak) | Correlate block-group mean top score with new-construction permits since 2019 | Reported honestly either way; mostly measures demand |
| Offline | Remove the API key: tool still ranks on data only | Works |

**Human in the loop (a judging criterion):** a "Flag this rating" button on each rating stores `{pin, type, pillar, rating, user note}` (no PII). It's the planner-override log the research proposed and a credible pilot path for City Planning.

---

## 12. Build order

| # | Task | Output | Depends on |
|---|---|---|---|
| 1 | Fetch MVA/displacement ratio, Community Need, high-frequency transit | 3 GeoJSONs in `public/data/` (existing script pattern) | — |
| 2 | Block-group table: join all indicators, percentiles, correlation clusters | `bg-metrics.json` + correlation heatmap PNG | 1 |
| 3 | Rules tables: use table, min lot sizes, gate function | `packages/scoring` + tests | — |
| 4 | Facts builder: parcel → facts (Neon read-only query + static layers) | `site.facts` API | 2, 3 |
| 5 | Jev call: prompt, zod schema, validator, cache, 3-sample median | `site.ratings` API | 4 |
| 6 | Aggregation + explanations + Monte Carlo (pure TS, browser) | `packages/scoring` | 3 |
| 7 | UI: parcel click → ranked cards, sliders, presets, why-panel, flip point, reform toggle | map route | 5, 6 |
| 8 | Methodology page + limitations + README sources | page | 2 |
| 9 | Demo parcels chosen, cached, rehearsed; record video | video | 7 |

Steps 1–3 and 6 can run in parallel with mock data. **Critical path: 4 → 5 → 7.**

---

## 13. Limitations statement (draft, goes in repo + form)

- Decision support only; not legal, zoning, financial or engineering advice. Verify with the Zoning Administrator.
- Zoning rules are a simplified transcription of §903.03 and §911.02 for residential districts; other districts and overlays are partly covered.
- Area data (market type, cost burden, hazards, air) is at block-group or tract level and applied to every parcel inside; it doesn't describe the individual lot.
- The market and displacement data end in 2019–20. The displacement risk ratio measures affordability to original residents, not displacement probability.
- Carbon figures are national (RECS) and Irish (embodied) averages applied to Pittsburgh.
- Infrastructure capacity (sewer, water, power) is unknown for every parcel; the tool doesn't score it.
- AI ratings are judgments, bounded around measured data, shown with their reasons and spread, and can be flagged.
- Bill 2025-1545 is pending; the reform scenario shows proposed text, not law.
- Who might be harmed: ranking tools can steer investment away from data-poor or hazard-exposed neighborhoods; we renormalise instead of zero-filling for that reason, but the risk remains.

---

## 14. Open questions for the team

1. What exactly is "jev"? (Model/provider affects the structured-output code and cost.)
2. Default aggregation: arithmetic (easier to explain) or geometric (safer)? I recommend arithmetic by default, geometric as a toggle.
3. Default `γ_c` (conditional approval multiplier): 0.7 proposed.
4. Which 3 demo parcels? Suggested: a city-owned vacant lot in Homewood (Transitional market), a Lawrenceville lot (Robust market, IZ overlay), a Beechview hillside lot (Site fit and climate tradeoffs).
5. Do we fetch CHAS by hand for cost burden, or rely on the Community Need layer?
