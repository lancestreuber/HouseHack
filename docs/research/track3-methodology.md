# Track 3 methodology: typology matching, tradeoffs, confidence

*Researched 2026-09-26 by the methodology lane. This builds on `zoning-rules.md` (DES rubric, reform overrides), `data-sources.md` (every dataset named here), and `pro-forma.md` (gap and subsidy math). Where this doc and the spec disagree about Track 3 scoring, this doc is the proposal. Sources are listed at the bottom.*

**One-line thesis:** every number in the tool gets one of four labels. **EVIDENCE** is observed and dated. **ASSUMPTION** is our estimate or heuristic, which could be factually wrong. **POLICY** is a scenario input, such as a pending bill or a hypothetical investment. **VALUE** is a normative weight that the user sets. Scores are sums of labeled parts, so any result can be broken back into them.

---

## 1. Precedents and what each teaches about method

| Precedent | Method lesson we borrow |
|---|---|
| **CTCAC/HCD Opportunity Map** (Othering & Belonging Institute + Terner Center + CA Housing Partnership) | The 2024 overhaul replaced averaged z-scores with a **count of indicators above the regional median**: 9 indicators, +1 point each, −1 for a top-5% environmental hazard flag. The bins are 8–9 Highest, 6–7 High, 4–5 Moderate, ≤3 Low. The old version suppressed ACS values whose **coefficient of variation exceeded 30%**. Today a tract missing **more than 2 indicators** gets no category. It also runs a separate **"High Segregation & Poverty" filter** (≥30% poverty plus overrepresentation of people of color). The filter is shown as a category of its own, not blended into the score. Lesson: legible counting, a relative comparison within a region, and explicit rules for suppressing missing data. |
| **Child Opportunity Index 3.0** | 44 indicators in 3 domains and 14 subdomains, each z-scored. Indicator **weights come from how strongly each indicator predicts health and economic outcomes**, not from opinion. Lesson: we can't validate weights in 36 hours, so our defaults are *labeled* VALUE and are user-adjustable rather than presented as "empirical". |
| **Kirwan Institute opportunity mapping** | The original model: indicators grouped into opportunity structures (housing, education, health, employment, transportation), z-scored against the regional mean, and averaged. It prefers public 5-year ACS data. Lesson: group metrics into named domains that users recognize. |
| **HUD AFFH opportunity indices** | Seven single-purpose 0–100 percentile indices: low poverty, school proficiency, labor market, jobs proximity, transit trips, low transportation cost, environmental health. Lesson: keep sub-scores **single-purpose and percentile-ranked** so "72" means "better than 72% of the city". |
| **Enterprise Opportunity360** | Five outcome dimensions (housing stability, education, health, economic security, mobility), 150+ indicators, **compare up to 3 tracts side by side**. Lesson: the compare tray is a known pattern for this audience. |
| **Urban Institute Upward Mobility Framework** | 24 predictors in 5 pillars that include "opportunity-rich and inclusive neighborhoods". Lesson: pair *access* metrics with *inclusion* metrics. Access alone rewards exclusive places. |
| **CNT H+T Index** | Models household VMT, auto ownership and transit use by block group with OLS regressions (17 variables), and defines affordability as **H+T ≤ 45% of income** for a regional typical household. Lesson: location drives transport cost and emissions, so the climate and affordability of a typology depend on *where* it is built. |
| **Up for Growth, Housing Underproduction** | Underproduction = (existing + "missing" households) × target-vacancy factor − available units. Lesson: demand is a **gap**, not a level. We use it only as context for the citywide counter. |
| **Seattle 2035 Growth & Equity Analysis** | Two indices. The Displacement Risk Index uses communities of color, English ability, education, renters, cost burden, income, transit, proximity to jobs and amenities, development capacity and below-average rent. The Access to Opportunity Index uses schools, graduation, jobs within 2 mi, home-value change, transit and civic amenities. Crossing them gives a **2×2 of urban villages, each with its own growth strategy**. Lesson: our quadrant (section 2.6) comes from here. |
| **Portland Residential Infill Project, displacement risk analysis** | This is the closest precedent. It split risk into **severity** (count of vulnerable households: low-income renters in single-family homes, using Bates' gentrification typology) and **probability** (a redevelopment model driven by Buildable Lands Inventory capacity and FAR). It compared **baseline vs proposal**. Result: **28% less indirect displacement citywide** (≈680 vs 950 low-income renter households at risk through 2035) and 21% less in at-risk areas. The mechanism: more units per redevelopment means fewer lots get redeveloped. Three neighborhoods still saw increased risk, which led to targeted mitigation. Lesson: model displacement **per scenario and per typology**, and report the places where risk rises even when the citywide number improves. |
| **Minneapolis 2040** | The triplex upzoning produced little middle housing: about 1% of 2017–22 permitted units were in 2–4 unit buildings, and 87% were in 20+ unit buildings. Rents still rose 1% vs 14% statewide (Pew). Lesson: **legal permission ≠ feasibility**. That is why Feasibility and the pro forma sit beside the typology fit. |
| **Terner Center, SB 9 analysis** (with MapCraft) | For every parcel, checked physical eligibility **and** market feasibility (residual land value). Only ~110k of 7.5M single-family parcels (1.5%) became newly feasible, and duplexes dominated. Lesson: layer typology → legal → physical → financial filters, and report the *delta* the policy creates, not the total. |
| **NYC City of Yes for Housing Opportunity** (adopted 2024-12-05) and ZoLa | Packages policy levers by name: the Universal Affordability Preference (+20% FAR for permanently affordable units averaging 60% AMI), ADUs (excluded in flood-prone areas), parking mandates removed or reduced by transit zone, and Town Center zoning. ZoLa shows the rules for any lot. Lesson: **each lever is a named, toggleable rule with geographic exceptions**, and the parcel lookup is the entry point. |
| **Missing Middle Housing (Opticos)** | Defines house-scale types: duplex side-by-side or stacked, triplex, fourplex, cottage court, townhouse, multiplex medium, courtyard building, live-work. Most have 4–8 units, running from about 8 du/acre for a duplex to 44–55 du/acre for a large multiplex. Lesson: define typologies by **building form and lot need**, not just unit count. |
| **Strong Towns / Urban3 value-per-acre** | Tax value per acre shows how productive existing infrastructure is. Lesson: our Infrastructure sub-score rewards **more homes per foot of existing street and pipe**. |

---

## 2. Scoring framework

### 2.1 Two kinds of scores

- **Place scores** (parcel or block group, the same for every typology): Demand, Access & Opportunity, Displacement Risk, Hazard exposure.
- **Typology × place scores**, one per (parcel, typology):
  - Feasibility (DES)
  - Market support (pro forma gap)
  - Household match
  - Climate per unit
  - Affordability reach
  - Infrastructure efficiency

This split is what makes the tool legible. The place tells you *who is here and what is nearby*. The typology tells you *what this building would do there*.

### 2.2 Normalization

For each metric *j* measured over the N city units (parcels, or the 1,100 block groups for BG data):

```
P_j(i) = (rank(x_ij) − 1) / (N − 1)            // percentile within the City of Pittsburgh, 0..1
P_j(i) = 1 − P_j(i)   if lower-is-better         // orientation, so higher is always "better for the sub-score"
S_k(i) = Σ_j a_kj · P_j(i) / Σ_j∈observed a_kj   // a_kj = within-sub-score weights (default equal, ASSUMPTION)
coverage_k(i) = Σ_j∈observed a_kj / Σ_j a_kj
```

**Suppression rules (from CTCAC):**
- An ACS metric with CV > 30% is treated as missing. Compute CV as MOE / 1.645 / estimate.
- DRR with "Insufficient Data" is missing, not zero.
- If `coverage_k < 0.67`, the sub-score is **suppressed**. It shows "insufficient data", and in the confidence simulation it is drawn uniformly from its plausible range.

**Percentiles are within the city**, not national, because Pittsburgh's decision makers compare Pittsburgh places. We label this as a VALUE.

### 2.3 Sub-scores and metrics

| Sub-score | Metrics (source → label) | Level |
|---|---|---|
| **F: Feasibility / Ease** | DES 0–100 per typology from `zoning-rules.md` §5: zoning status, lot size, slope, landslide, undermined, flood, parking, process triggers, acquisition. District rules are EVIDENCE with confidence tags; thresholds are ASSUMPTION. `FRICTION_WEEKS` time to permit is ASSUMPTION. | typology × place |
| **D: Demand / Market** | Market support comes from MVA 2021 type A–J (EVIDENCE) and the pro forma gap per unit (ASSUMPTION inputs, EVIDENCE rents/FMR). Household match uses ACS B11016/B25009 household size, B11007 households with a 65+ member, and CHAS 2018–22 Table 7 household type (elderly family, small family, large family 5+, elderly non-family) (EVIDENCE). Context only: PLI permits within 400 m over 24 months and valid sales. | typology × place |
| **A: Access & Opportunity** | Jobs within 45 min by transit (SLD `D5BR`); distance to a frequent stop (`HighFrequencyTransit`, trips_wd); `NatWalkInd`; zero-car household share (`Pct_AO0`) as a *need* flag, not a score; distance to grocery, park and library (OSM/city, optional). All EVIDENCE. Schools are a known gap and are listed in "what we get wrong". | place |
| **C: Climate & Resilience** | Per-unit CO₂ = embodied + operational + transport (section 3). Hazard exposure: LST percentile, canopy %, impervious %, FEMA zone, landslide/undermined. Canopy loss if built = canopy % × footprint share of the typology. Intensities are EVIDENCE; per-unit sizes are ASSUMPTION. | typology × place |
| **E: Equity & Displacement** | Place risk R uses DRR 2021 (EVIDENCE), renter share, share under 80% AMI, cost burden B25070, and ownership-change / young in-migrant share (`Housing_Burden_v2`), all EVIDENCE. Affordability reach per typology comes from the pro forma (ASSUMPTION). Pressure_t is the typology's demolition and price-point pressure (ASSUMPTION). | both |
| **I: Infrastructure** | On an existing street (touches centerline): EVIDENCE. Units per 100 ft of frontage. Separated vs combined sewershed (`PGHWebSewersheds`): EVIDENCE. Sewage module or stormwater trigger for multi-unit: EVIDENCE rule, ASSUMPTION threshold. Frequent transit already present. | typology × place |

**Typology-specific formulas:**

```
E_{p,t} = 0.5 · AffReach_{p,t} + 0.5 · (1 − R_p · Pressure_t)
AffReach = clamp((120 − AMIneeded_t) / 90, 0, 1)        // AMIneeded = breakeven rent ×12 / 0.30 / AMI(hh size); 30% AMI → 1, 120% → 0
Pressure_t (ASSUMPTION): ADU-by-owner 0.1 · duplex 0.3 · townhome 0.4 · small MF 0.5 · mid-rise 0.7 · teardown detached 0.8
                         (×0.5 on vacant or city-owned lots, since nobody is displaced by the building itself)
D_{p,t} = 0.5 · MarketSupport_{p,t} + 0.5 · HouseholdMatch_{p,t}
MarketSupport = 1 if gap ≤ 0 · 1 − gap/150k (clamped to 0..1) otherwise · +0.25 if a named subsidy closes the gap
HouseholdMatch_{p,t} = Σ_h share_{p,h} · suit(t, h)       // h ∈ {1–2 person non-senior, family 3–4, large family 5+, senior 65+}
I_{p,t} = mean(onStreet, pct(units/100ft frontage), separatedSewer ? 1 : 0.6, 1 − 0.5·triggersSewageModule)
```

`suit(t,h)` is a VALUE/ASSUMPTION matrix that users can inspect. It rates, for example, the ADU high for 1–2 person and senior households, the townhome high for families, 3BR duplex units high for large families, and elevator mid-rise high for seniors (accessibility).

### 2.4 Weights (VALUE) and the combination

The user sets sliders s_k ∈ {0..5} for F, D, A, C, E, I. Normalize with w_k = s_k / Σ s. Then:

```
Fit_{p,t} = Cap_{p,t}( 100 · Σ_k w_k · S_{k,p,t} )
Cap = DES hard gates from zoning-rules §5 (not permitted → max 20; floodway → 15; ≥75% steep → 30)
```

Legal status (by right, variance, pending reform, not possible) is **always shown next to** the fit, never hidden inside it.

**Presets**, each a named VALUE stance the user can edit:
- **Balanced planner:** all weights 3.
- **Anti-displacement CDC:** E5 A3 F3 D2 C2 I2.
- **Climate first:** C5 A4 I4 F2 D2 E3.
- **Market reality:** F5 D5 I2 A2 C1 E1.

### 2.5 Confidence ranges

We run a Monte Carlo in the browser on parcel click: 300 draws × 6 typologies is under 5 ms. Each draw perturbs three things:
1. **Weights (VALUE uncertainty):** w ~ Dirichlet(α = 20·w_user). Roughly ±1 slider step.
2. **Data (EVIDENCE uncertainty):**
   - ACS metrics are drawn from N(est, MOE/1.645) and re-ranked.
   - Suppressed or missing metrics are drawn from U(0, 1).
   - Pro forma inputs are drawn from triangular(low, mid, high) in `PRO_FORMA_DEFAULTS`.
3. **Zoning interpretation (ASSUMPTION uncertainty):** rows tagged low confidence flip to their alternative status with p = 0.5. Example: R1D townhome as special exception vs not permitted. Medium-confidence rows flip with p = 0.2.

**Report:**
- `Fit median [P10–P90]`.
- **Rank stability:** "Townhomes rank #1 in 71% of plausible weightings and data draws."
- The single biggest driver of the width, found by rerunning with each source frozen: "Most uncertainty comes from: zoning interpretation".

A width over 25 points gets a "low confidence" chip. **Deterministic fallback** (for tests and print): min and max over the 2⁶ corners of w_user ± 25%.

### 2.6 Displacement risk × Access to opportunity quadrant (Seattle-style)

- x = A (place) percentile.
- y = R (place risk) percentile.
- Split at the city median, with a hatched "near median" band from P40 to P60 labeled "borderline".

The quadrant is **context and strategy**, not a score.

| Quadrant | Reading | Recommended strategy (POLICY/VALUE, shown as a suggestion) | Typologies to feature |
|---|---|---|---|
| **High opportunity, low risk** ("open the door") | High-access, often exclusionary areas. This is where CTCAC steers LIHTC family housing. | Add density by right; use the AHBP bonus for on-site affordable units; project-based vouchers; fight exclusion. | Mid-rise near frequent transit, small MF, townhomes for families, ADUs |
| **High opportunity, high risk** ("grow with protections") | Access is good, and so is the price pressure. | Pair every unit with anti-displacement tools: community land trust / affordable ownership, IZ/AHBP, right-to-return or preference policies, owner repair grants, tangled-title help. Prefer adding units over teardowns. | ADUs by existing owners (wealth-building, no demolition), CLT townhomes, small MF with URA Rental Gap |
| **Low opportunity, high risk** ("stabilize and invest first") | Vulnerable residents, weaker access. | Public investment first: transit, services, rehab. CDC-led for-sale infill on city-owned lots (URA FSDP), homeowner stabilization. Avoid speculative redevelopment. | Duplex/townhome for-sale infill, rehab, ADUs |
| **Low opportunity, low risk** ("invest in access") | Growth fits with little displacement, but residents lack access. | Couple housing with infrastructure investment: frequent transit, a grocery. Moderate density. | Duplex/triplex, small MF on corridors |

Pittsburgh caveat, stated in the UI: DRR is a *price-pressure* measure. In MVA types H–J, "risk" looks more like **vacancy, tax liens, tangled titles and disinvestment**. Our DRR is often "Insufficient Data" there because there are too few sales. So in weak markets we add a **disinvestment flag** (USPS vacancy, liens, foreclosures; EVIDENCE) and don't read low DRR as "safe".

---

## 3. Climate scoring by typology

**Per-unit annual CO₂e** (the functional unit is **per home**, and we also show **per bedroom**, since Rankin et al. 2024 find missing-middle forms lowest per bedroom):

```
CO2_{p,t} = Emb_t / 60 + Op_t + VMT_p · 0.000400      // t CO2e / home / yr; 60-yr service life (ASSUMPTION); 400 g CO2/mi (EPA)
ClimateScore_{p,t} = 0.5 · (1 − pct(CO2_{p,t})) + 0.3 · (1 − HazardExposure_p) + 0.2 · (1 − CanopyLoss_{p,t})
```

**Embodied carbon.** Cradle-to-gate intensity × gross sf per unit. Units are from `pro-forma.md`; detached is an ASSUMPTION.

| Typology | GSF/unit | Intensity kgCO₂e/m² (low–mid–high) | Emb t/unit (mid) | Operational site energy, NE (RECS 2020) | Op t CO₂/yr (mid) |
|---|---|---|---|---|---|
| Detached SF (teardown baseline) | 2,100 | 150–184–210 (RMI wood-frame) | **36** (29–41) | 120.7 MMBtu | **9.3** |
| ADU | 600 | 150–184–230 (small-unit penalty, ASSUMPTION) | **10** (8–13) | ~55 MMBtu (scaled from 2–4 unit apt, ASSUMPTION) | **4.2** |
| Duplex / triplex | 1,100–1,200 | 150–184–210 | **19–21** | 68.0 MMBtu (apt 2–4 units) | **5.2** |
| Townhome | 1,500 | 150–184–210 | **26** (21–29) | 85.4 MMBtu (SF attached) | **6.6** |
| Small MF (4–19, wood walk-up) | 1,000 | 150–184–250 | **17** (14–23) | 36.2 MMBtu (apt 5+) | **2.8** |
| Mid-rise (podium/concrete) | 1,050 | 250–350–500 (CLF MF median ≈390 whole-life; Toronto Green Standard caps MF at 500 vs 200 for SF/townhouse) | **34** (24–49) | 36.2 MMBtu (apt 5+) | **2.8** |

**Operational CO₂.** CO₂ = MMBtu × (0.65 × 53.06 kg/MMBtu gas + 0.35 × 121 kg/MMBtu electricity), which comes to ≈ 77 kg/MMBtu.
- The electricity factor comes from eGRID2023 RFCW, 911 lb CO₂e/MWh ≈ 0.413 kg/kWh.
- The 65/35 gas/electric split is an ASSUMPTION.
- An **"all-electric new build"** toggle sets the gas share to 0.
- RECS measures *existing* Northeast stock, so we use it for **relative** differences between typologies and label it that way. NREL ResStock is the upgrade path.

**Transport.** VMT_p is annual VMT per household for the block group from CNT H+T. The download needs a free account; check it in hour 1. Fallback: scale the regional mean by NatWalkInd and D4A deciles (ASSUMPTION). Typical spread:
- Car-dependent block group: ~15k mi/yr, **6.0 t/yr**.
- Walkable, frequent-transit block group: ~8k mi/yr, **3.2 t/yr**.

The takeaway: **for most Pittsburgh sites, location (VMT) and building form (shared walls) matter more than embodied carbon**, and mid-rise pays an embodied penalty that height amplifies. Pomponi et al. found +154% life-cycle GHG for tall vs low-rise at equal density. So the tool should say "dense and low-rise near frequent transit" rather than "taller is greener".

**Infrastructure extension.**
- Nearly every city parcel is infill on existing streets. Smart Growth America's review of 17 studies found compact infill saves **about 38% of up-front road, water and sewer costs**, roughly **$21k less per home**, and cuts ongoing maintenance about 50%.
- We don't model greenfield. We score how efficiently the **existing** network is used (units per frontage foot) and flag real extension triggers: no street frontage, a sewage planning module, the stormwater permit threshold, or a combined sewershed. A combined sewershed adds CSO load, so we flag it for multi-unit and impervious increase.

**Heat and flood exposure (site, EVIDENCE):**

```
HazardExposure = mean(pct(LST), 1 − pct(canopy), pct(impervious))·0.6 + floodPenalty·0.4
floodPenalty: floodway 1 · A/AE 0.6 · 0.2% 0.2 · X 0
```

Landslide and undermined zones already sit in F.

---

## 4. Policy levers (buildable in 36 h)

| Lever (label) | Input | What changes |
|---|---|---|
| **ADU by right**. POLICY, pending Bill 2025-1545 (hearing 2026-09-23, no vote). | Toggle | F: ADU zoning fit not-permitted → by-right on residential lots, up to 2 per lot, 1,000 sf. D: ADU market support recomputed. E: ADU pressure 0.1. I: +units on existing frontage. Counter: "+N parcels newly ADU-eligible". |
| **Parking minimums removed**. POLICY, same bill. | Toggle | F: parking factor → pass. Pro forma: remove the stall cost, surface ~$5–10k, structured ~$25–50k/stall (ASSUMPTION), and **free lot area** so small MF on small lots can fit more units → D, E. |
| **Affordable Housing Bonus** (+15 ft per point; 2–4 points in RM/NDO/LNC/UNC, 6 in RIV/UC-MU/R-MU). POLICY. | Toggle + set-aside 10–20% at 50% AMI, 20 yrs | Mid-rise height +30/+60 ft → units ↑. Pro forma: blended revenue with affordable rents; gap/unit recomputed. E: AffReach ↑. F: expedited review cuts friction weeks. |
| **Tax abatement (Ch. 265 enhanced 10-yr / LERTA)**. POLICY, existing program. | Toggle | Pro forma: property-tax opex ↓ for 10 yrs → NOI ↑ → gap ↓ → D ↑. If ≥10% of units ≤80% AMI, E ↑. |
| **URA subsidies**. POLICY, existing, discretionary. | Rental Gap $30k/$50k/$75k per unit at 60/50/30% AMI; For-Sale up to $130k/unit | Gap ↓ → D (MarketSupport +0.25 if closed). E: AffReach set by the targeted AMI. Label "competitive, not guaranteed". |
| **Infrastructure investment: frequent transit**. POLICY, hypothetical. Seed with a route from PRT's **Bus Line Refresh proposed final network** (19 routes at ≤20-min peak, up from 11; comments close 2026-09-30, board vote Nov 2026). | Pick a corridor | Recompute distance to a frequent stop for parcels within ½ mi → A ↑. VMT −10% within ¼ mi (ASSUMPTION) → C ↑. Mid-rise transit requirement may pass. Parking maximum tightens (walkshed). **Also R_p +0.05 within ¼ mi** (transit-induced price pressure, ASSUMPTION), which the harm panel surfaces. |
| **Missing-middle legalization in R1D/R1A**. POLICY, hypothetical, *not* in 2025-1545. | Toggle | F: duplex/triplex/townhome in R1D → by-right. This demonstrates the fact that the pending reform does **not** legalize the missing middle. |

Every lever writes a `ScenarioDelta` so the report can say "Under this scenario: Fit +18, gap −$42k/unit, Access unchanged, Risk +0.05".

---

## 5. Who benefits, who might be harmed, what the tool gets wrong

These statements are generated **deterministically from rules** (the AI only rephrases them), and each one cites fact IDs.

**Benefit rules:**
- AffReach ≥ 0.5 → "Households at ≤{AMI}% AMI ({$income} for 4 people) could afford these homes."
- ADU → "The existing owner builds wealth and gains rental income."
- Quadrant is high-opportunity → "New residents gain access to {jobs} transit-reachable jobs."
- Large-family share > P75 and the typology suits families → "Serves the area's {x}% large-family households."

**Harm rules:**
- R_p ≥ P60 and Pressure_t ≥ 0.4 on an occupied lot → "Existing renters in older homes nearby may face rising rents or non-renewal (DRR {v})."
- FEMA A/AE or LST ≥ P80 → "Future residents face {flood/heat} exposure."
- Mid-rise → "Neighbors bear construction and shading impacts; higher embodied carbon."
- Transit lever on → "Price pressure may rise near new stops."
- Gap > known subsidy → "Without subsidy, units likely serve only ≥{AMI}% AMI households."

**Always-on "what this tool gets wrong":**
- Zoning is a simplified reading of mirrors (verify with the Zoning Administrator).
- DRR is from 2021 and is blind in thin markets.
- No school quality data.
- No utility capacity data (PWSA pipes are not public).
- RECS reflects existing stock, not new code-built homes.
- Embodied carbon uses averages; variation within a form exceeds variation between forms.
- It doesn't model the regional effect of supply on rents.
- Percentiles are relative to Pittsburgh.
- Weights are values, not facts.
- It can't see title, liens, environmental contamination or community wishes.

**Methodology page outline** (`/methodology`):
1. What the tool does and doesn't do, and the four labels.
2. Sub-scores with metric tables (source, as-of date, level, label).
3. Normalization, suppression and missing data.
4. Weights, presets and how to read the sliders.
5. Typology definitions (Opticos-style form + lot need) and the `suit` matrix.
6. Climate math with the per-typology table.
7. Confidence (Monte Carlo, rank stability, deterministic fallback).
8. The quadrant and strategies.
9. Policy levers and their status (pending, existing, hypothetical).
10. Who benefits / harmed rules.
11. Known limitations.
12. Precedents we borrowed from.
13. Data refresh and version log.

---

## 6. Config shape

```ts
export type Label = "EVIDENCE" | "ASSUMPTION" | "POLICY" | "VALUE";
export type SubScore = "F" | "D" | "A" | "C" | "E" | "I";
export type Typology = "adu" | "duplex" | "triplex" | "townhome" | "smallMf" | "midRise";

export interface Metric {
  id: string; subScore: SubScore; label: Label; level: "parcel" | "bg" | "tract" | "hood";
  direction: "higher" | "lower"; source: string; asOf: string; withinWeight?: number; // default 1
  cvSuppress?: number; // 0.30 for ACS
}

export interface ScoringConfig {
  weights: Record<SubScore, number>;                 // VALUE, sliders 0..5
  presets: Record<"balanced" | "cdc" | "climate" | "market", Record<SubScore, number>>;
  coverageMin: 0.67;
  quadrantSplit: { median: 0.5; borderline: [0.4, 0.6] };
  typology: Record<Typology, {
    minLotSf: number; maxSlopeShare: number; needsFrequentTransitWithinFt?: number; // midRise: 1320
    mvaSupport: Partial<Record<"A"|"B"|"C"|"D"|"E"|"F"|"G"|"H"|"I"|"J", 1 | 0.5 | 0.2>>;
    pressure: number;                                 // ASSUMPTION
    embodiedT: [number, number, number];              // t CO2e/unit low-mid-high, ASSUMPTION built on EVIDENCE intensities
    siteMMBtu: number;                                // EVIDENCE (RECS 2020 NE)
    suit: Record<"small" | "family" | "largeFamily" | "senior", number>; // VALUE
  }>;
  confidence: { draws: 300; dirichletConcentration: 20; zoningFlipP: { low: 0.5; medium: 0.2 } };
}

export const DEFAULT_WEIGHTS = { F: 3, D: 3, A: 3, C: 3, E: 3, I: 3 } satisfies Record<SubScore, number>;
export const PRESETS = {
  balanced: DEFAULT_WEIGHTS,
  cdc:      { F: 3, D: 2, A: 3, C: 2, E: 5, I: 2 },
  climate:  { F: 2, D: 2, A: 4, C: 5, E: 3, I: 4 },
  market:   { F: 5, D: 5, A: 2, C: 1, E: 1, I: 2 },
};
```

---

## 7. Pitch framing and demo narrative

**Pitch (3–4 sentences):** "'Missing middle' is a slogan, not a plan. Our tool tells a Pittsburgh CDC, planner or resident *which* housing type fits *this* block: ADU, duplex, townhome, small apartment or mid-rise. It shows the tradeoffs across access, climate, displacement risk and cost, with confidence ranges. Every number is labeled as evidence, assumption, policy or value, and you set the values, so the tool never hides a judgment inside a score. Feasibility is the reality check: we learned from Minneapolis that legalizing a type isn't the same as it pencilling out, so each match comes with a zoning status, a time-to-permit estimate and a pro forma gap."

**Demo (about 3 min of the video):**
1. **The CDC, high displacement risk.** A Homewood-area CDC picks a city-owned lot. Before the demo, check with real DRR and MVA data which quadrant it lands in; it may show "insufficient data / disinvestment", which is itself the honest story.
   - The preset "Anti-displacement CDC" puts townhomes and duplexes for sale on top, with the URA For-Sale program closing the gap. ADUs are flagged "pending reform".
   - The harm panel reads: "vacant lot, no one displaced by this building; neighborhood price pressure low/unknown."
   - Toggle **2025-1545**: ADU fit jumps, and the counter shows "+N city-owned lots newly ADU-eligible".
2. **The planner, high opportunity.** A Squirrel Hill/Shadyside-type parcel near frequent transit (quadrant to be confirmed with data).
   - The "Climate first" preset ranks small MF and mid-rise on top. The climate card explains why: low VMT plus shared walls beat the embodied penalty.
   - The confidence band is wide because the R1D zoning status is uncertain. Rank stability: "small MF #1 in 58%".
   - Toggle **AHBP**: +30 ft, the gap shrinks, affordable units appear, and AffReach rises.
   - Toggle **missing-middle legalization (hypothetical)** to show the pending bill doesn't legalize it.
3. **Infrastructure lever.** Add a Bus Line Refresh frequent corridor. Access rises along it, the transport emissions line drops, and the harm panel adds "price pressure may rise near new stops". Close on the methodology page and "what this tool gets wrong".

---

## Sources

- CTCAC/HCD Opportunity Map methodology: [2025](https://www.treasurer.ca.gov/ctcac/opportunity/2025/opportunity-map-methodology.pdf), [2023](https://www.treasurer.ca.gov/sites/default/files/2025-12/methodology.pdf), [OBI page](https://belonging.berkeley.edu/ctcac-opportunity-mapping), [2026 memo](https://www.treasurer.ca.gov/CTCAC/opportunity/2026/CTCAC-HCD-2026-Opportunity-Map-Memo-10-20-25.pdf)
- [COI 3.0 technical documentation (Aug 2026)](https://www.diversitydatakids.org/sites/default/files/file/COI%203.0%20Technical%20Documentation%2020260803_0.pdf)
- Kirwan-style opportunity mapping: [PSRC](https://www.psrc.org/sites/default/files/2022-03/opportunity_mapping.pdf), [NHC](https://nhc.org/wp-content/uploads/2017/10/Opportunity-Mapping.pdf)
- HUD AFFH: [AFFH-T data documentation (Aug 2024)](https://docs.huduser.gov/archives/sites/default/files/datasets/affh/AFFH-T-Data-Documentation-AFFHT0007-August-2024.pdf), [Cityscape](https://www.huduser.gov/portal/periodicals/cityscpe/vol17num3/ch12.pdf)
- [Enterprise Opportunity360](https://opp360.enterprisecommunity.org/opportunity360/measure)
- [Urban Institute Upward Mobility Framework](https://upward-mobility.urban.org/framework)
- CNT H+T: [methods 2022](https://htaindex.cnt.org/about/method-2022.pdf), [about](https://htaindex.cnt.org/about/)
- Up for Growth: [HUP 2025](https://upforgrowth.org/news_insights/2025-hup/), [MARC method memo](https://www.marc.org/document/housing-production-methodology)
- [Seattle 2035 Equity Analysis summary](https://www.seattle.gov/documents/Departments/OPCD/OngoingInitiatives/SeattlesComprehensivePlan/2035EquityAnalysisSummary.pdf)
- [Portland RIP Appendix B: Displacement Risk and Mitigation](https://www.portland.gov/sites/default/files/2019-12/vol_3_appendix_b_displacement_risk_and_mitigation.pdf)
- Minneapolis 2040: [Pew 2024](https://www.pew.org/en/research-and-analysis/articles/2024/01/04/minneapolis-land-use-reforms-offer-a-blueprint-for-housing-affordability), [Minneapolis Fed 2025](https://www.minneapolisfed.org/article/2025/unpacking-supply-and-demand-in-rent-trends-since-the-minneapolis-2040-plan)
- [Terner Center SB 9 analysis](https://ternercenter.berkeley.edu/blog/duplexes-lot-split-sb-9/)
- NYC City of Yes: [Council press release](https://council.nyc.gov/press/2024/12/05/2761/), [Holland & Knight](https://www.hklaw.com/en/insights/publications/2024/12/affordable-housing-development-after-adoption-of-new-yorks-city-of-yes), [final plan](https://www.nyc.gov/assets/planning/download/pdf/plans-studies/city-of-yes/housing-opportunity/city-of-yes-for-housing-opportunity_final-plan.pdf)
- [Missing Middle Housing types (Opticos)](https://missingmiddlehousing.com/the-types/)
- Strong Towns: [value per acre](https://actionlab.strongtowns.org/hc/en-us/articles/360054326732-Conduct-a-Value-Per-Acre-Analysis)
- [Urban Displacement Project typologies](https://github.com/urban-displacement/displacement-typologies)
- [Reinvestment Fund, measuring displacement risk (DRR)](https://www.reinvestment.com/insights/measuring-displacement-risk-in-gentrifying-neighborhoods/)
- [EIA RECS 2020 Table CE3.2 (Northeast)](https://www.eia.gov/consumption/residential/data/2020/c&e/pdf/ce3.2.pdf): SFD 120.7, SFA 85.4, 2–4 units 68.0, 5+ units 36.2 MMBtu/household, verified
- [RMI, Hidden Climate Impact of Residential Construction (2023)](https://rmi.org/resources/hidden-climate-impact-of-residential-construction/): 150–210 kgCO₂e/m², ~184 average
- [CLF Embodied Carbon Benchmark Report (2025)](https://carbonleadershipforum.org/the-embodied-carbon-benchmark-report/) and [Benchmark Explorer](https://wblca-benchmark-explorer.carbonleadershipforum.org/). The MF median ≈390 and the Toronto 200/500 caps came from search snippets; **verify** in the Explorer before quoting on camera.
- [Rankin et al. 2024, Embodied GHG of missing middle, J. Industrial Ecology](https://onlinelibrary.wiley.com/doi/10.1111/jiec.13461)
- [Pomponi et al. 2021, Decoupling density from tallness, npj Urban Sustainability](https://www.nature.com/articles/s42949-021-00034-w)
- [EPA typical passenger vehicle (400 g CO₂/mi)](https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle), [EPA GHG equivalencies (natural gas factor)](https://www.epa.gov/energy/greenhouse-gas-equivalencies-calculator-calculations-and-references), [eGRID2023 summary tables](https://www.epa.gov/system/files/documents/2025-06/summary_tables_rev2.pdf) (RFCW 911 lb CO₂e/MWh via [aggregator](https://emission-factors.com/guides/egrid-subregion-emission-factors.html); verify in the EPA table)
- [Smart Growth America, Building Better Budgets](https://smartgrowthamerica.org/resources/building-better-budgets-a-national-examination-of-the-fiscal-benefits-of-smart-growth-development/)
- [PRT Bus Line Refresh, proposed final network](https://engage.rideprt.org/buslineredesign/BLR-proposed-final-network), [WESA 2026-07-24](https://www.wesanews.org/development-transportation/2026-07-24/pittsburgh-regional-transit-redesign-public-comment)
- Pittsburgh zoning, reform, pro forma and data: see `zoning-rules.md`, `pro-forma.md` and `data-sources.md` in this folder.
