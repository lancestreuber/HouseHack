# Interactions: place exposure × household sensitivity × typology mitigation

*Researched 2026-09-26 by the evidence lane. This doc builds on `track3-methodology.md`: the four labels (EVIDENCE / ASSUMPTION / POLICY / VALUE), the sub-scores F D A C E I, and the Monte Carlo. It adds the "who lives here" dimension. Citations are keyed like [S3] and listed at the bottom. Magnitudes marked ASSUMPTION are our mapping of qualitative evidence onto numbers. Treat them as defaults to argue with, not findings.*

**One-line model:** a place carries **exposures** (dirty air, heat, flood, hills and stairs, lead, noise, distance, price pressure, energy cost). A household brings **sensitivity**: the same exposure hurts a 78-year-old with COPD more than a 30-year-old commuter. A typology brings **mitigation**: an elevator, MERV-13 ventilation, an elevated first floor or a new service line removes part of the exposure. The tool ranks what to build *for whom*, and not only *where*.

---

## 1. Pittsburgh baseline facts (EVIDENCE, dated)

| Fact | Value | Source |
|---|---|---|
| Air: ALA *State of the Air 2026*, Pittsburgh–Weirton–Steubenville | **11th worst** in the US for short-term PM (Allegheny **9.3 unhealthy days/yr, F**). **16th worst** for annual PM (F; 12th last year). Ozone 63rd worst (4.5 days, F) | [S1] |
| Guideline gap | WHO 2021 AQG: PM2.5 annual **5 µg/m³**, 24-h **15 µg/m³** | [S2] |
| Child asthma | ~**11%** of Allegheny children vs ~8% nationally. **22.5%** among 1,200+ schoolchildren living and studying near industrial or highway sources. Pediatric (<5) asthma ED visits in 2017: **153 vs 21 per 10k** for Black vs white children | [S3][S4] |
| Heat | ≈7 days/yr above ~90°F around 1990. Projected **~42 days/yr by 2050**; southwestern PA **41–62 days** by mid-century (state assessment; verify in the PA Climate Impacts Assessment before quoting) | [S5] |
| Lead lines | PWSA has replaced **27,000+** lead service lines since 2016 (15,700 public + 12,000 private). About **7,000 residential lead lines remain**, with a target of **late 2027** | [S6] |
| Steps and slope | "More public staircases than any US city". About 460 sets are on structures, and **about two-thirds of steps are in low/moderate-income areas**. They serve as transit access. The city layer has 739 sets | [S7], `access-amenities.md` |
| Mobility | **22.7%** of Pittsburgh residents 65+ and **31.0%** of those 75+ report an ambulatory difficulty (6.7% of all residents 5+). ACS 2024 1-yr B18105 via Census Reporter | [S8] |
| Zero-car | **19.1%** of city households have no vehicle, including **30.7% of renter households**. **28.4%** of households include someone 65+. ACS 2024 1-yr B25044/B11007 | [S8] |
| Energy burden (Pittsburgh metro, AHS 2019) | Median: all households **3.4%**; low-income **10.0%** (the national low-income median is 8.3%); low-income renters 8.7%. Upper quartile of low-income renters: **18.4%**. >6% = high, >10% = severe | [S9] |
| Flash flood | Washington Blvd, 2011: 4 deaths when 3 in/hr of rain overwhelmed 9-ft sewer pipes. Homewood/Larimer (Negley Run) have repeated street flooding | [S10] |

---

## 2. Sensitivity matrix S[household][exposure]

Scale: **1.0 = general population**, 1.5 = Medium, 2.0 = High, 3.0 = Critical. The **direction** of each cell (whether the group is more sensitive) is EVIDENCE when a source names the group. The **number** is ASSUMPTION unless a ratio is quoted.

| Household ↓ / Exposure → | PM2.5 & near-road | Heat | Flood | Slope/stairs | Lead | Noise | Access gap | Displacement | Energy cost |
|---|---|---|---|---|---|---|---|---|---|
| **Senior 65+** | **2.0** E [S11][S12] | **2.0** E [S13][S14] | **2.0** E [S15] | **2.0** E [S16][S8] | 1.0 | 1.5 A | 2.0 A (healthcare) | 2.0 A (fixed income) | 1.5 A |
| **Child <6** | **2.0** E [S1][S11] | **2.0** E [S13] | 1.5 A | 1.5 A (strollers) | **3.0** E [S17] | 1.5 E [S18] | 1.5 A (childcare) | 1.5 A | 1.0 |
| **School-age family** | 1.5 E [S1] | 1.5 E [S13] | 1.5 A | 1.0 | 1.5 A | 1.5 A | 2.0 A (schools) | 2.0 A (school moves) | 1.5 A (bigger units) |
| **Asthma / COPD** | **3.0** E [S3][S19] | **2.0** E [S13] | 1.5 A (mold) | 1.5 A (exertion) | 1.0 | 1.0 | 1.5 A | 1.5 A | 1.5 A (must run AC/filters) |
| **Mobility disability** | 1.5 A | **2.0** E [S13][S15] | **3.0** E [S15] | **3.0** E [S20][S21] | 1.0 | 1.0 | 2.0 A | 1.5 A | 1.5 A (powered equipment) |
| **Zero-car household** | 1.5 A (waits at roadside stops) | 1.5 A | 1.5 E [S22] | 2.0 A (walks the hills) | 1.0 | 1.0 | **3.0** A (defining need) | 1.5 A | 1.0 |
| **Low-income renter** | 1.5 E [S12] | 2.0 E [S13] (no AC) | 2.0 A (uninsured) | 1.0 | 1.5 A (older stock) | 1.5 A | 2.0 A | **3.0** E (DRR definition) | **3.0** E [S9] (10.0% ÷ 3.4% ≈ 2.9×) |
| **Shift worker** | 1.0 | 1.5 A (daytime sleep) | 1.0 | 1.0 | 1.0 | **2.0** E [S18][S23] | 2.0 A (off-peak service) | 1.5 A | 1.0 |
| **Pregnant person** | **2.0** E [S24] | **2.0** E [S13][S24] | 1.5 A | 1.5 A | **2.0** E [S17] | 1.5 A | 2.0 A (prenatal care) | 1.5 A | 1.0 |

*E = direction is EVIDENCE, A = ASSUMPTION.*

**Evidence notes behind the cells:**
- **PM2.5 × seniors.** In 61M Medicare beneficiaries, all-cause mortality rose **7.3% per +10 µg/m³** (HR 1.073). Below 12 µg/m³ it rose **13.6%** (HR 1.136), so the effect is steeper at Pittsburgh-like levels. Risks were higher for men, Black and Medicaid-eligible people, which supports the low-income multiplier [S12]. EPA's ISA names children, older adults, people with heart or lung disease and people of color as at-risk [S11].
- **PM × asthma.** HEI judged traffic pollution **causal** for asthma exacerbation and suggestive for asthma onset in children [S19]. The Pittsburgh 22.5% vs 11% prevalence near sources is roughly **2×**, which puts the 3.0 cell at the high end on purpose (exacerbation plus prevalence).
- **Heat.** CDC names 65+, infants and children, chronic conditions, people without AC, outdoor workers and pregnancy [S13]. For older adults, mortality rises **2–5% per 1°C** in hot periods, and the risk ratio is higher at 75+ (1.04) than at 65+ (1.02) [S14].
- **Disability × disasters.** People with disabilities are **2–4× more likely to die or be critically injured** in disasters, because of evacuation barriers and loss of powered equipment [S15]. This sets 3.0 for flood.
- **Hills.** Among 75–90-year-olds, a hilly 500 m road network predicted **new walking difficulty** (OR 1.66, 2-yr follow-up) [S16].
- **Lead.** There is no safe blood lead level. Children ≤6 absorb more lead, and exposure in pregnancy raises miscarriage, stillbirth and low-birth-weight risk [S17].
- **Pregnancy.** In 57 of 68 US studies (32M births), heat, ozone or PM2.5 were associated with preterm birth, low birth weight or stillbirth. PM/ozone were linked to preterm birth in 19 of 24 studies. Mothers with asthma and Black mothers were at highest risk [S24].
- **Noise.** WHO 2018: road traffic at night ≤ **45 dB Lnight**, and ≤53 dB Lden [S18]. People who are susceptible to awakening include children, shift workers, the elderly and the chronically ill [S23].

---

## 3. Mitigation matrix M[typology or feature][exposure]

Each cell is the **fraction of the place exposure removed for residents** (0 = none, 1 = eliminated), given as mid [low–high]. Features stack multiplicatively: `M = 1 − Π(1 − m_i)`.

| Feature / typology | Exposure | M (mid [range]) | Basis |
|---|---|---|---|
| **Balanced ventilation + MERV-13** (new MF/townhome) | PM2.5 (outdoor-origin, indoors) | **0.35** [0.2–0.55] A | With a MERV-13 central system in a leaky 1928 house during wildfire smoke, measured indoor/outdoor ratio was **0.55**; adding a portable HEPA dropped it to **0.22** [S25]. A Korean apartment test found indoor PM fell to **72–76%** of its starting value in 60 min [S26]. Modeled HEPA vs MERV-5 in older homes gives ~40% lower indoor PM of outdoor origin [S27]. |
| + portable HEPA in bedrooms (program add-on) | PM2.5 | +0.4 [0.35–0.6] E | RCT: **60%** lower bedroom and 42% lower living-area PM2.5 in homes of children with asthma. Urban trials: 35–55% [S28] |
| **All-electric (no gas stove)** | Indoor NO₂ → child asthma | 0.13 [0.06–0.19] E | 12.7% of US childhood asthma is attributable to gas stoves (**13.5% in PA**) [S29]. Applies to children and asthma rows only. |
| **Siting ≥500 ft from a freeway / 100k AADT road** (site rule, not typology) | Near-road pollution | 0.7 [0.5–0.8] E | CARB: about a 70% drop by 500 ft, and up to 80% exposure reduction [S30]. HEI zone is 300–500 m, with background reached only 300–500 m downwind [S19]. |
| **Elevator mid-rise (FHA-covered)** | Unit step access | **0.9** E | Fair Housing Act: in a 4+ unit building with an elevator, **100% of units** must be accessible [S21]. Street slope remains, so it mitigates terrain slope only 0.2 (A). |
| **Walk-up small MF (4+ units, no elevator)** | Unit step access | 0.3 A | Only ground-floor units must be accessible [S21]. That is about 25–33% of units. |
| **Ground-level backyard ADU / visitable duplex** | Unit step access | 0.6 [0.3–0.8] A | Depends on grade. A 60% chance that a new house will have a disabled resident in its lifetime [S20] argues for zero-step entries by default. HUD: <5% of US homes are livable for people with moderate mobility difficulty and <1% are wheelchair-accessible [S31]. |
| **Townhome (3-story)** | Unit step access | 0.0 A | Stairs are part of the form. It needs a ground-floor bedroom/bath variant to score higher. |
| **High-performance envelope + heat pump AC** | Heat (indoor, incl. outages) | **0.6** [0.4–0.9] A | Best envelopes raised "Days of Safety" in outages from 1.1 to 6.8 (Portland) and **cut cumulative thermal exposure by >90%** in several climates [S32]. Plain new-code AC gives less during outages. |
| **Street trees / canopy to ≥40% within ~60–90 m** | Local air temp | ~2.5°C (≈4.5°F) max E | Canopy >40% gives the biggest daytime cooling, up to ~2.5°C going from 0 to 100% [S33]. Evapotranspiration cuts peak air temps by 2–9°F, and shaded surfaces run **20–45°F cooler** [S34]. |
| **Lowest floor ≥ BFE + 1 ft, no below-grade units** | Flood (life-safety + damage) | 0.8 [0.6–0.9] E/A | NFIP requires residential lowest floors, **including basements**, at or above BFE in the SFHA [S35]. ASCE 24 minimum is BFE + 1 ft [S36]. 11 people drowned in NYC basement apartments in Ida (2021), most of them illegal conversions [S37]. In Pittsburgh most flooding is pluvial/sewer, so apply "no habitable basement" citywide as a feature. |
| **New water service line (new build)** | Lead in water | **1.0** E | Since 1986 the SDWA bans non-lead-free pipe in new installations [S38]. Rehab of pre-1986 homes gets 0 unless PWSA replaces the line (≈7,000 left [S6]). New build also removes pre-1978 lead paint (A). |
| **Acoustic glazing (Rw ≈35 dB) + bedrooms on the quiet side + mechanical ventilation** | Night noise | 0.6 [0.4–0.8] A | A 75 dB street needs Rw 35 to reach 40 dB indoors [S39]. **Works only if windows can stay shut**, which needs balanced ventilation (the MERV-13 row). |
| **Attached / multifamily form** | Energy cost (per household) | townhome 0.29 · 2–4 unit 0.44 · 5+ unit 0.70 E | RECS 2020 Northeast site energy: detached 120.7, attached 85.4, 2–4 unit 68.0, 5+ unit 36.2 MMBtu (from `track3-methodology.md` §3; confounded by unit size). ACEEE: raising low-income homes to average efficiency removes **35%** of their energy burden [S40]. |
| **Affordability covenant / CLT / ADU-by-owner** | Displacement | 1 − Pressure_t (see methodology) + 0.3 POLICY | Reuse `Pressure_t`. Deed-restricted units are a POLICY lever. |
| **Any typology** | Access gap | 0 | A building does not move a bus stop. Only the transit POLICY lever changes access. |

---

## 4. Tradeoff cards (for the explainer)

Each card fires on a rule, shows its plain text, and links to its citations.

1. **"Close to the bus, close to the exhaust."** When `nearMajorRoad && household ∈ {child, asthma, senior}`: Corridors with the most transit often sit next to the busiest roads. Traffic pollution stays high for about 300–500 m downwind of highways [S19]. California even recommends against homes within 500 ft of freeways, while admitting that infill near transit cuts driving [S30]. *What helps:* sealed, filtered ventilation, air intakes and bedrooms facing away from the road, and street trees.
2. **"Cheap lot, steep climb."** When `slope ≥ P75 && household ∈ {senior, mobility, zeroCar}`: Pittsburgh's steep lots are often its cheapest, and its ~800 sets of city steps are mostly in lower-income areas [S7]. For older adults, hilly streets predict new walking difficulty within two years [S16], and about 1 in 4 Pittsburghers 65+ already has trouble walking [S8]. An elevator fixes the door, not the hill.
3. **"The flood-zone discount."** When `flood ≠ X || pluvialHotspot`: Low prices in flood-prone places can trap the people least able to evacuate. People with disabilities are 2–4× likelier to die in disasters [S15]. Basement homes are the deadliest in a flash flood [S37]. Pittsburgh's worst floods come from storm sewers, not rivers [S10]. *Rule:* no habitable basements, and first floor above BFE + 1 ft [S35][S36].
4. **"More homes, fewer trees."** When `canopy < 40% && LST ≥ P75 && typology footprint large`: Adding homes on a hot, paved block can remove the shade that keeps it livable. Blocks cool noticeably only once canopy passes about 40% [S33]. *What helps:* replacement planting and cool roofs. Denser, efficient homes also cut per-home energy use.
5. **"Greening can raise the rent."** When the tree or park lever is on in a high-DRR area: New parks and trees can raise property values and displace the residents they were meant to help ("green gentrification") [S41]. Pair greening with anti-displacement tools.
6. **"New access brings new price pressure."** When the transit lever is on or the quadrant is high-opportunity/high-risk: Rents near new rail stations have risen measurably [S42]. The tool adds +0.05 risk within ¼ mi (ASSUMPTION, methodology §4). Access and stability both matter to zero-car renters, who are 31% of Pittsburgh renters [S8].
7. **"Accessible means elevator, and elevators mean scale."** When `household ∈ {senior, mobility}`: Only elevator buildings make every unit accessible under the Fair Housing Act. Walk-ups only make the ground floor accessible, and townhomes are all stairs [S21]. Mid-rise also brings more embodied carbon and more price pressure (methodology §3). Small alternatives: ground-level ADUs and visitable duplexes.
8. **"Clean indoor air costs electricity."** When the MERV-13 feature is on and `household = lowIncomeRenter`: Fans and filters help lungs but add to bills in a city where low-income households already spend a median 10% of income on energy [S9]. Resolve it with an efficient envelope and heat-pump system in the same building [S40].
9. **"Quiet enough to sleep by day."** When `household = shiftWorker && (nearMajorRoad || nightBus)`: Shift workers need late-night transit and daytime quiet, and the busiest corridors offer the first but not the second. WHO sets night road noise at ≤45 dB [S18]. Acoustic windows only work if the unit can be ventilated with windows closed [S39].
10. **"Old, cheap and possibly lead."** When `yearBuilt < 1986 && household ∈ {child, pregnant}`: Keeping older homes avoids displacement, but lead lines (≈7,000 left in PWSA's area [S6]) and pre-1978 paint put young children at risk, and no level of lead is safe [S17]. New construction removes both, but it costs more and brings more pressure.
11. **"AC keeps grandma safe and raises the bill."** When `heat ≥ P75 && household = senior && lowIncome`: Air conditioning is the main protection from heat [S13]. Attached and multifamily homes use 30–70% less energy per household than detached ones (RECS), so an efficient attached building protects both health and budget.

---

## 5. The math

**Per household h (a persona chosen from a picker), place p and typology t:**

```
Risk_{p,t,h} = Σ_e E_{p,e} · S_{h,e} · (1 − M_{t,e})  /  Σ_e S_{h,e}          // 0..1; E = place exposure percentile, oriented so 1 = worst
H_{p,t,h}    = 1 − Risk_{p,t,h}                                                 // new sub-score "H: Health & Hazard fit"
Fit_{p,t,h}  = Cap_{p,t}( 100 · Σ_k w_k · S_{k,p,t,(h)} )    k ∈ {F, D, A, C, E, I, H}
```

- **A (Access) becomes household-weighted:** `A_h = Σ_d wd_{h,d} · P_d`. For example, a zero-car household weights transit at 3 and schools at 1, and a school-age family weights schools at 2. The access gap is the benefit side, and nothing about it is mitigated by typology.
- **Place mode (no persona)** mixes over residents: `S_{p,e} = Σ_h share_{p,h} · S_{h,e}`. Shares come from ACS (B11007 65+, B09001 <6, B18105 ambulatory, B25044 zero-car, CHAS low-income renters) and CDC PLACES `casthma`/`copd`. Groups overlap, so normalize by Σ share (ASSUMPTION).
- **The denominator Σ_e S_{h,e}** makes Risk comparable across personas. Without it, seniors would always look "worse".
- **Red-flag gate (not averaged away):** when `S_{h,e} ≥ 3 && E_{p,e} ≥ 0.9 && M_{t,e} < 0.5`, show "Not recommended for {household}: {exposure}". An example is a basement unit in a flood hotspot for a wheelchair user. This is shown beside the Fit like legal status, following the methodology's "never hidden".

```ts
export type Household = "senior65" | "child0_5" | "schoolFamily" | "respiratory" | "mobility"
  | "zeroCar" | "lowIncomeRenter" | "shiftWorker" | "pregnant";
export type Exposure = "pm25" | "heat" | "flood" | "slope" | "stepAccess" | "lead" | "noise"
  | "accessGap" | "displacement" | "energy";
export type Feature = "merv13Balanced" | "hepaProgram" | "allElectric" | "elevatorFHA" | "visitable"
  | "highPerfEnvelope" | "floodElevated" | "newServiceLine" | "acousticGlazing" | "streetTrees";

export interface Cell {
  mid: number; low: number; high: number;            // triangular for Monte Carlo
  label: "EVIDENCE" | "ASSUMPTION" | "POLICY";        // EVIDENCE only if the magnitude is sourced
  strength: "strong" | "moderate" | "weak";           // causal/RCT · cohort/observational · expert
  src?: string[];                                     // e.g. ["S12"]
}
export const SENSITIVITY: Record<Household, Partial<Record<Exposure, Cell>>> = {
  senior65: {
    pm25:  { mid: 2.0, low: 1.5, high: 2.5, label: "ASSUMPTION", strength: "strong",   src: ["S11", "S12"] },
    slope: { mid: 2.0, low: 1.5, high: 3.0, label: "ASSUMPTION", strength: "moderate", src: ["S16", "S8"] },
    // ...
  },
  mobility: { flood: { mid: 3.0, low: 2.0, high: 4.0, label: "EVIDENCE", strength: "moderate", src: ["S15"] } },
  lowIncomeRenter: { energy: { mid: 2.9, low: 2.5, high: 3.3, label: "EVIDENCE", strength: "moderate", src: ["S9"] } },
  // default for any missing cell: { mid: 1, low: 1, high: 1 }
};
export const MITIGATION: Record<Typology | Feature, Partial<Record<Exposure, Cell>>> = {
  midRise:        { stepAccess: { mid: 0.9, low: 0.8, high: 1.0, label: "EVIDENCE", strength: "strong", src: ["S21"] },
                    slope: { mid: 0.2, low: 0, high: 0.4, label: "ASSUMPTION", strength: "weak" } },
  merv13Balanced: { pm25: { mid: 0.35, low: 0.2, high: 0.55, label: "ASSUMPTION", strength: "moderate", src: ["S25", "S26", "S27"] },
                    noise: { mid: 0.1, low: 0, high: 0.2, label: "ASSUMPTION", strength: "weak" } }, // enables windows-closed
  newServiceLine: { lead: { mid: 1.0, low: 0.9, high: 1.0, label: "EVIDENCE", strength: "strong", src: ["S38"] } },
  floodElevated:  { flood: { mid: 0.8, low: 0.6, high: 0.9, label: "ASSUMPTION", strength: "moderate", src: ["S35", "S36", "S37"] } },
  // typologies inherit default features (e.g. midRise ⊇ elevatorFHA, merv13Balanced if new MF), and users toggle others
};
export const RED_FLAG = { sensitivityMin: 3, exposurePctMin: 0.9, mitigationMax: 0.5 };
```

**Uncertainty (extends methodology §2.5):**
- Every S and M cell is drawn from `triangular(low, mid, high)` in the existing 300-draw Monte Carlo.
- Report `H median [P10–P90]` and persona rank stability ("For a senior with COPD, the elevator mid-rise ranks #1 in 64% of draws").
- Add a **"most uncertain assumption"** readout by freezing each cell group: "sensitivity of seniors to slope".
- Every cell shows an **evidence-strength dot** (●●● strong / ●● moderate / ● weak) beside its label. Magnitude and certainty are different things: lead × child is 3.0 and strong, while access × shift worker is 2.0 and weak.
- Never display S or M values as relative risks. Label them "relative weight informed by…".

---

## 6. What we borrow from the AARP Livability Index

AARP scores **block groups** 0–100 relative to other places, with the **average at 50** [S43][S44]. It has **7 categories** (housing, neighborhood, transportation, environment, health, engagement, opportunity) that are averaged, built from **61 indicators: 40 metrics plus 21 policies**. Policies add points, for example +1 for Age-Friendly network membership [S44]. The Environment category includes **near-roadway pollution** and regional air quality, and Housing includes **zero-step-entrance multifamily supply** [S45]. Users can **"Customize Your Score"** by reweighting categories. The FAQ **names tradeoffs explicitly**: good schools and transit can raise housing costs, which lowers the Housing score [S44].

What we take from each:
- Relative 0–100 scoring. We already use within-city percentiles.
- Metrics vs policies, which maps to our EVIDENCE vs POLICY labels.
- User reweighting, which is our VALUE sliders.
- Stated tradeoffs, which become our cards.

**Where we go further:** AARP is built for **one persona** (people 50+). The sensitivity matrix makes the persona a parameter, and the mitigation matrix makes the **building** a parameter, which AARP cannot do.

---

## 7. The "one engine" pitch

Track 3 asks for five things: typology, equity, climate, demand and transit. Tools usually answer them on five separate maps. We answer them with one equation: **Fit = benefits − exposure × sensitivity × (1 − mitigation)**. *Place* provides the climate and environmental exposures (heat, flood, PM2.5, lead, slope) and the transit and amenity access. *Household* provides equity and demand: who actually lives here or needs a home, whether seniors, young kids, zero-car renters or people with asthma, taken from ACS, CHAS and CDC PLACES. *Typology* is the decision variable, and each housing type carries measurable mitigation: an elevator, filtered ventilation, an elevated first floor, a new service line, shared walls. So a single parcel click answers "what should be built here, and for whom". The answer might be: "a visitable duplex with MERV-13 for this block's many seniors, not a walk-up; and here's the near-road tradeoff". Every number carries an evidence label and a confidence band, and every tension is stated in plain language instead of being averaged away.

---

## Sources

- [S1] ALA, *State of the Air 2026*, Pittsburgh release: https://www.lung.org/media/press-releases/fy26-sota-pittsburgh · report PDF: https://www.lung.org/getmedia/32f0646d-c5de-4501-b0ac-07cd63c974d4/State-of-the-Air-2026-Report.pdf
- [S2] WHO Global Air Quality Guidelines (2021): https://www.who.int/publications/i/item/9789240034228
- [S3] Pittsburgh schoolchildren near pollution sources, 22.5% asthma (PubMed 33104451): https://pubmed.ncbi.nlm.nih.gov/33104451/ · coverage: https://www.alleghenyfront.org/study-pittsburgh-kids-near-polluting-sites-have-higher-asthma-rates/
- [S4] ACHD 2019 Asthma Task Force Report: https://www.alleghenycounty.us/files/assets/county/v/1/government/health/documents/2019-asthma-task-force-report.pdf
- [S5] Heat projections: https://climatecheck.com/pennsylvania/pittsburgh · https://www.alleghenyfront.org/heatwave-climate-change-pennsylvania/ (verify in the PA Climate Impacts Assessment)
- [S6] Pittsburgh Water, PENNVEST release 2026-07-16: https://www.pgh2o.com/news-events/news/press-release/2026-07-16-pittsburgh-water-announces-335-million-new-pennvest · 14,000th public line (2026-01-08): https://www.pgh2o.com/news-events/news/press-release/2026-01-08-pittsburgh-water-replaces-14000th-lead-service-line
- [S7] City of Pittsburgh, City Steps: https://www.pittsburghpa.gov/Business-Development/Mobility-and-Infrastructure/Plans/City-Steps · https://en.wikipedia.org/wiki/Steps_of_Pittsburgh
- [S8] ACS 2024 1-yr via Census Reporter (`B25044`, `B11007`, `B18105`, geo `16000US4261000`), pulled 2026-09-26: https://api.censusreporter.org/1.0/data/show/latest?table_ids=B25044,B11007,B18105&geo_ids=16000US4261000
- [S9] ACEEE, *Data Update: City Energy Burdens* (Sept 2024, AHS 2019 data): https://www.aceee.org/sites/default/files/pdfs/data_update_-_city_energy_burdens_0.pdf
- [S10] 2011 Washington Blvd flood: https://www.post-gazette.com/local/city/2011/08/21/Four-lives-lost-in-Washington-Boulevard-flash-flood-are-mourned/stories/201108210184 · Negley Run: https://www.rand.org/pubs/commentary/2024/05/rising-waters-hidden-threats-exploring-the-unseen-risks.html (403 to fetch; content per search snippet)
- [S11] EPA, 2019 PM ISA and 2022 Supplement, at-risk populations: https://www.ncbi.nlm.nih.gov/books/NBK588510/
- [S12] Di et al. 2017, *NEJM*, "Air Pollution and Mortality in the Medicare Population": https://www.nejm.org/doi/full/10.1056/NEJMoa1702747
- [S13] CDC, People at Increased Risk for Heat-Related Illness: https://www.cdc.gov/heat-health/risk-factors/ · older adults: https://www.cdc.gov/heat-health/risk-factors/heat-and-older-adults-aged-65.html
- [S14] Vulnerability to heat-related mortality meta-analysis (PubMed 26332052): https://pubmed.ncbi.nlm.nih.gov/26332052/
- [S15] Harvard Center for the Environment, "Disability in a Time of Climate Disaster": https://www.environment.harvard.edu/news/disability-time-climate-disaster · NCD 2023: https://www.ncd.gov/assets/uploads/reports/2023/ncd-extreme-weather-2023.pdf
- [S16] Keskinen et al. 2020, "Hilliness and the Development of Walking Difficulties": https://pubmed.ncbi.nlm.nih.gov/30587067/
- [S17] CDC, About Childhood Lead Poisoning Prevention: https://www.cdc.gov/lead-prevention/about/index.html · BLRV 3.5 µg/dL: https://www.cdc.gov/lead-prevention/php/news-features/updates-blood-lead-reference-value.html
- [S18] WHO Europe noise fact sheet and 2018 Environmental Noise Guidelines: https://www.who.int/europe/news-room/fact-sheets/item/noise · compendium: https://cdn.who.int/media/docs/default-source/who-compendium-on-health-and-environment/who_compendium_noise_01042022.pdf
- [S19] HEI Special Report 17, *Traffic-Related Air Pollution*: https://www.healtheffects.org/system/files/SR17TrafficReview.pdf
- [S20] Smith, Rayer & Smith 2008, *JAPA*, "Aging and Disability: Implications for the Housing Industry": https://www.tandfonline.com/doi/full/10.1080/01944360802197132
- [S21] HUD, Fair Housing Act Design Manual (covered multifamily dwellings): https://www.huduser.gov/portal/publications/pdf/fairhousing/fairch1.pdf · https://www.equalhousing.org/fair-housing-topics/new-construction-fair-housing-accessibility-requirements/
- [S22] Evacuation and transportation barriers among vulnerable populations, scoping review: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12652914/
- [S23] AASM, traffic noise and susceptible groups: https://sleepeducation.org/traffic-noise-disturb-sleep-harm-morning-work-performance/
- [S24] Bekkar et al. 2020, *JAMA Netw Open*: https://pmc.ncbi.nlm.nih.gov/articles/PMC7303808/
- [S25] Wildfire residence interventions, MERV-13 CFA I/O 0.55 → 0.22 with PAC: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10863606/
- [S26] Mechanical ventilation with MERV-13 in Korean apartments: https://pmc.ncbi.nlm.nih.gov/articles/PMC10675534/
- [S27] Zhao, Azimi & Stephens 2015, central residential filtration: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4515730/
- [S28] Portable HEPA RCT, children with asthma: https://pmc.ncbi.nlm.nih.gov/articles/PMC8641645/ · https://ehjournal.biomedcentral.com/articles/10.1186/s12940-021-00816-w
- [S29] Gruenwald et al. 2022, gas stoves and childhood asthma PAF: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9819315/
- [S30] CARB, Strategies to Reduce Air Pollution Exposure Near High-Volume Roadways: https://ww2.arb.ca.gov/resources/fact-sheets/strategies-reduce-air-pollution-exposure-near-high-volume-roadways · 500 ft / 70–80%: https://www.ourair.org/wp-content/uploads/sbcapcd-near-roadway-June2017-final.pdf
- [S31] HUD/NYU Furman, Accessibility of America's Housing Stock (AHS 2011): https://www.huduser.gov/portal/publications/mdrt/accessibility-america-housingStock.html
- [S32] Hotchkiss, Sandoval & Bazilian, thermal resilience and passive survivability: https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6945155 · PNNL: https://www.energycodes.gov/sites/default/files/2023-07/Efficiency_for_Building_Resilience_PNNL-32727_Rev1.pdf
- [S33] Ziter et al. 2019, *PNAS*: https://www.pnas.org/doi/10.1073/pnas.1817561116
- [S34] EPA, Using Trees and Vegetation to Reduce Heat Islands: https://19january2017snapshot.epa.gov/heat-islands/using-trees-and-vegetation-reduce-heat-islands_.html
- [S35] FEMA, Residential Buildings with Basements: https://www.fema.gov/floodplain-management/manage-risk/residential-buildings-basements
- [S36] FEMA, Highlights of ASCE 24-14: https://www.fema.gov/sites/default/files/2020-07/asce24-14_highlights_jan2015.pdf · freeboard: https://www.fema.gov/about/glossary/freeboard
- [S37] Hurricane Ida basement deaths: https://gothamist.com/news/2-years-after-hurricane-ida-deaths-are-nycs-basement-apartments-any-safer
- [S38] EPA, SDWA limits on lead in pipes: https://www.epa.gov/lead/how-does-safe-drinking-water-act-limit-lead-pipes-plumbing-fittings-fixtures-faucets-solder
- [S39] Window acoustic performance (Rw 35 for a 75 dB street): https://velfac.co.uk/professionals/architects-designers/advice/acoustic-control/facts-and-advice/ · BS 8233:2014: https://www.omegawestdocuments.com/media/documents/43/43.20%20BS%2082332014%20Guidance%20on%20Sound%20Insulation%20and%20Noise%20Reduction%20for%20Buildings.%20London%20BSi.pdf
- [S40] ACEEE 2016, "Lifting the High Energy Burden" (Pittsburgh among the highest; efficiency removes 35%): https://www.aceee.org/press/2016/04/report-energy-burden-low-income
- [S41] Anguelovski et al. 2019, green gentrification: https://journals.sagepub.com/doi/abs/10.1177/0309132518803799
- [S42] Padeiro et al. 2019, TOD and gentrification systematic review: https://www.tandfonline.com/doi/full/10.1080/01441647.2019.1649316 · https://phys.org/news/2021-02-transit-oriented-displacement.html
- [S43] AARP Livability Index, Methods & Sources: https://livabilityindex.aarp.org/methods-sources
- [S44] AARP Livability Index, FAQs: https://livabilityindex.aarp.org/faqs
- [S45] AARP, "What are the Most Livable Communities" (environment and housing indicators): https://www.aarp.org/home-living/most-livable-communities/
- DOE LEAD Tool (tract energy burden by AMI band, ACS 2018–22), for the data engineer: https://www.energy.gov/cmei/scep/low-income-energy-affordability-data-lead-tool · https://data.openei.org/submissions/6219
