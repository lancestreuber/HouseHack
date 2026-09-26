# Round 2 review: equity, value judgments and internal logic

Scope: the current build on branch `lance-pillars`. That covers config `2026-09-26.18` (`apps/web/src/lib/pillars/pillars.config.json`), `score.ts`, `phrases.ts`, `scripts/pillars/README.md` and the built `parcel-indicators.json` (142,365 parcels, built with the same config version). No code or config was edited.

Evidence tags:
- **[computed]**: computed this session from repo data. Scripts are in the session scratchpad (`dump.ts`, `equity.py`, `deep.py`, `ind.py`), not in the repo.
- **[read]**: I read the source passage.
- **[skimmed]**: I saw only a search snippet or abstract.
- **[unverified]**: from general knowledge, not checked this session.

Method:
- Every parcel was scored with `score.ts` at default weights, each preset, arithmetic aggregation, and eight candidate fixes.
- Parcels were joined to their 2020 tract through `parcel-centroids.csv` (142,199 City parcels matched).
- Race proxy: CDC SVI "racial & ethnic minority" county percentile (`equity-svi-coi.geojson`). It counts all people of color, not Black residents specifically. I tried to get % Black from the Census API, but it needs a key, so the SVI proxy stays.
- Poverty: tract `poverty_rate` from `food-access.geojson` (USDA atlas vintage).
- HOLC grade: point-in-polygon of parcel centroids against `holc-1937.geojson` (130,387 parcels fall inside a graded area).
- Correlations are Spearman ρ. A positive ρ means the score is higher in more-minority or poorer places.
- `bun test src/lib/pillars`: 12/12 pass.

---

## 0. Bottom line

1. **The round-1 fixes removed the overall racial gradient, but by cancellation, not by removal.**
   - Neighborhood ρ(minority, overall) went from **−0.37** (round 1) to **+0.07**. At parcel level it is **0.00**.
   - What remains is two pillars pulling hard in opposite directions:
     - **Demand** ρ = **−0.46** (parcel) / −0.51 (neighborhood).
     - **Housing Need** ρ = **+0.37** / +0.31.
   - Demand correlates **0.76** with the Reinvestment Fund MVA class. The config zeroes the MVA indicator *because* "rewarding strong markets steers housing away from distressed neighborhoods". Demand re-imports that same signal at weight 1 of 5. That is the largest internal inconsistency in the build.
2. **The default ranking does not steer away from HOLC-D or Black neighborhoods overall. It does concentrate top ranks on occupied homes in displacement-flagged areas.**
   - Share of top-decile parcels by type:

     | Parcels | Top decile | All City parcels |
     |---|---|---|
     | Carry a displacement flag | 78% | 37% |
     | Occupied homes | 70% | 69% |
     | Occupied homes *and* displacement-flagged | 58% | — |

   - Nothing in the score distinguishes a vacant lot from an occupied rowhouse. Round-1 R5 asked for an occupied-parcel flag; it was not implemented.
3. **Two indicators penalize places for being socially vulnerable, and their rationale says the opposite.**
   - `site_inland_flood_rating` and `climate_heat` read FEMA NRI `*_RISKS`. FEMA defines risk as Expected Annual Loss × a Community Risk Factor built from social vulnerability and community resilience [read, NRI FAQ Dec 2025]. The team's own `per-pillar-methods.md` §M5.3 quotes this.
   - The config rationale says the indicator is "not expected annual loss, which scales with property value". That is false.
   - Both indicators correlate negatively with minority share (ρ −0.22 and −0.28). They correlate with nothing parcel-level: r = 0.03 with floodplain share, 0.01 with surface heat.
4. **Logic is mostly sound in `score.ts`.** The problems are in the config and the phrases:
   - Double counting: location efficiency appears in Access and Climate; the same Zillow rent series appears with opposite signs; H+T and VMT come from the same model with opposite signs.
   - Two phrase families contradict their own sub-scores on 30k+ parcels.
   - Rationale text contradicts the numbers in three places.
   - "Neutral 50" imputation isn't neutral.
   - Modeled data is labelled "observed".

**Is it defensible now?** The overall equity result is defensible *as a number*. The mechanism behind it isn't yet: a market-strength pillar the config itself calls steering, offset by a need pillar that still under-reads subsidized Black neighborhoods and over-reads student areas. It becomes defensible with the logic fixes in §3. Those are all config-only except R2, R6 and part of R7. It also needs one explicit, labelled value call on Demand's weight (R1).

---

## 1. Equity gradient, re-measured

### 1.1 Correlations [computed]

"Parcel" = 142k parcels. "Tract" = median parcel score per tract (about 123 tracts with SVI data). "Hood" = neighborhood means (about 90 neighborhoods). The last four columns are the mean score by HOLC grade.

| Score | ρ minority (parcel) | ρ poverty (parcel) | ρ HOLC (A=1…D=4) | ρ minority (tract) | ρ poverty (tract) | ρ minority (hood) | A | B | C | D |
|---|---|---|---|---|---|---|---|---|---|---|
| Demand | **−0.46** | −0.35 | +0.01 | −0.39 | −0.29 | **−0.51** | 56.2 | 44.2 | 43.0 | 47.2 |
| Site | +0.03 | −0.04 | −0.04 | +0.01 | −0.03 | +0.02 | 89.3 | 82.7 | 79.7 | 79.3 |
| Housing Need | **+0.37** | +0.47 | 0.00 | +0.29 | +0.47 | +0.31 | 60.4 | 52.3 | 52.7 | 54.4 |
| (displacement sub, weight 0) | +0.17 | +0.14 | +0.02 | +0.22 | +0.16 | +0.26 | | | | |
| Access | +0.09 | +0.13 | +0.21 | +0.11 | +0.11 | +0.07 | 73.4 | 66.9 | 70.1 | 75.1 |
| Climate | +0.13 | +0.17 | +0.13 | +0.19 | +0.23 | +0.19 | 61.0 | 59.2 | 62.3 | 61.1 |
| **Overall, default** | **0.00** | +0.05 | +0.06 | +0.06 | +0.13 | **+0.07** | 61.7 | 55.8 | 56.4 | 57.5 |
| Overall, arithmetic | +0.06 | +0.09 | +0.08 | +0.11 | +0.17 | +0.16 | 63.2 | 58.2 | 59.1 | 60.1 |
| Overall, family | +0.02 | +0.05 | +0.08 | +0.08 | +0.12 | +0.10 | | | | |
| Overall, older_adult | +0.02 | +0.04 | +0.07 | +0.09 | +0.12 | +0.10 | | | | |
| Overall, climate_first | +0.04 | +0.08 | +0.10 | +0.11 | +0.14 | +0.18 | | | | |
| Overall, affordability_first | +0.18 | +0.26 | +0.05 | +0.20 | +0.31 | +0.21 | | | | |
| **Overall, market_first** | **−0.27** | −0.23 | +0.02 | −0.20 | −0.13 | **−0.27** | 60.7 | 52.7 | 52.5 | 54.6 |
| Overall, displacement sub weight 1 (round-1 state) | −0.05 | −0.02 | +0.07 | +0.05 | +0.08 | +0.08 | | | | |
| Overall, Demand weight 0 | +0.26 | +0.27 | +0.06 | +0.30 | +0.32 | +0.37 | | | | |

**Did round 1 help?** Yes.
- The Need pillar flipped from ρ −0.29 to +0.37.
- The overall score went from −0.37 to about 0 (neighborhood level).
- Mean need in HOLC-D areas (54.4) is no longer below HOLC-B/C, though HOLC-A (60.4) is still highest. A-grade areas include student-heavy Squirrel Hill North; see §2.4.

### 1.2 Who lands at the top and the bottom [computed]

The first line of each group is the share of all parcels, or all vacant land, in that category. The "Top 10%" and "Bottom 10%" rows are the share of the top and bottom decile of overall scores. "High-minority" = SVI minority percentile ≥ 80; "low-minority" = below 40.

**All parcels (n = 142,199)**

| | High-minority | Low-minority | Poverty ≥ 30% | Displacement-flagged | HOLC D |
|---|---|---|---|---|---|
| All parcels | 14.3% | 36.2% | 23.9% | 36.6% | 25.8% |
| Top 10%, default | 8.7% | 20.1% | 22.6% | **78.3%** | 45.3% |
| Bottom 10%, default | 8.3% | 35.0% | 14.1% | 34.7% | |
| Top 10%, market_first | 6.4% | 30.8% | 14.0% | 84.7% | 39.3% |
| Bottom 10%, market_first | **19.0%** | 24.9% | 20.8% | | |
| Top 10%, affordability_first | 14.3% | 18.1% | 33.7% | 69.9% | 51.8% |

**Vacant land (n = 31,718)**

| | High-minority | Low-minority | Poverty ≥ 30% | Displacement-flagged |
|---|---|---|---|---|
| All vacant land | 28.8% | 23.9% | 41.1% | 29.0% |
| Top 10%, default | 37.8% | 13.8% | 48.4% | 50.6% |
| Top 10%, market_first | 21.8% | 28.8% | 29.7% | 64.3% |

Neighborhood examples: mean pillar scores, and the mean City rank of the overall score at default weights and under market_first [computed].

| Neighborhood | Minority pctile | Demand | Need | Overall | Rank, default | Rank, market_first |
|---|---|---|---|---|---|---|
| East Liberty | 65 | 67 | 52 | 68.4 | 87 | 90 |
| Central Lawrenceville | 28 | 63 | 53 | 67.0 | 83 | 89 |
| Larimer | 88 | 42 | 82 | 66.0 | 80 | 63 |
| Crawford-Roberts | 83 | 70 | 54 | 62.8 | 75 | 77 |
| Middle Hill | 95 | 37 | 48 | 60.9 | 67 | 50 |
| Homewood South | 94 | 27 | 61 | 58.5 | 56 | 31 |
| Lincoln-Lemington | 96 | 27 | 75 | 56.7 | 52 | 27 |
| Homewood West | 96 | 29 | 48 | 55.0 | 44 | 31 |
| East Hills | 92 | 26 | 71 | 55.2 | 40 | 23 |
| Homewood North | 93 | 26 | 56 | 54.7 | 40 | 23 |
| Knoxville | 73 | 21 | 60 | 54.7 | 37 | 17 |
| Sheraden | 73 | 19 | 55 | 45.6 | 16 | 8 |

Answers to the two questions:
- **Does the default steer housing away from historically disinvested Black neighborhoods?**
  - Not across the board. HOLC-D is *over*-represented in the default top decile (45% vs 26% of parcels). High-minority vacant land is over-represented among the top-scoring vacant land (38% vs 29%).
  - But the interior disinvested neighborhoods (Homewood, East Hills, Lincoln-Lemington, Knoxville, Sheraden) sit at ranks 16–56. That is mostly because Demand scores them 19–29.
  - `market_first` is clearly steering: ρ −0.27, and high-minority parcels are 19% of its bottom decile vs 14% of all parcels. It is a user-chosen preset, but it carries no equity note.
- **Does it pile market-rate pressure onto displacement hotspots?**
  - Yes, by construction. The Demand pillar rewards the same market heat that the displacement flags warn about. Demand vs normalized DRR: r = −0.71, meaning high demand goes with high DRR pressure. Sales turnover vs price growth: +0.42.
  - The top decile is 78% flagged. Most of those parcels are occupied homes (§2.2).
  - The supply evidence says new market-rate buildings lower nearby rents on average, by about 6% in Asquith, Mast & Reed, REStat 2023 [skimmed, abstract]. So ranking pressured areas high isn't wrong in itself.
  - What is missing: (a) the flag is buried inside the Housing Need card, not on the overall score; (b) there is no protection against demolishing occupied housing, the one displacement channel the supply literature doesn't dispute [unverified as a literature-wide claim; Pennington 2021 also finds a hyperlocal demand effect, per round 1].

---

## 2. Findings ranked by impact

### 2.1 Demand is the MVA the config says it rejects (high: equity and internal logic)

**Evidence [computed]:**
- ρ(Demand, `demand_market_strength`) = **0.76**.
- The main anti-minority drivers:

  | Indicator | ρ with minority share |
  |---|---|
  | `demand_market_strength` (MVA, weight 0) | −0.58 |
  | `demand_sales_turnover` (weight 1.5) | −0.52 |
  | `demand_low_vacancy` (weight 2) | −0.42 |

- Demand < 35, which shows the phrase "Weak market signals… will likely need public or nonprofit support", falls on high-minority tracts 2.65× as often as their share of parcels (38% vs 14%).
- Under the geometric mean, a Demand of about 20–30 lowers the overall score by about 10–15% relative to the other pillars.

**Why it matters:**
- The MVA rationale ("rewarding strong markets steers housing away from distressed neighborhoods") applies word for word to Demand.
- Either the steering concern is real, and Demand's weight needs the same scrutiny, or it isn't, and the MVA exclusion is cosmetic.
- The zero overall gradient comes from Need offsetting Demand. That is a fragile balance: any user who raises Demand, or lowers Need, brings the gradient straight back (see market_first).

**What's defensible:** Demand *is* real information. Weak markets need subsidy, and the phrase says so honestly. The fix is to label the value call, not to hide the pillar.

### 2.2 No distinction between vacant land and occupied homes (high: direct displacement)

**Evidence [computed]:**
- 69% of City parcels, and 70% of the default top decile, are occupied residential (assessor `classdesc` RESIDENTIAL, `Vacant` = "Not Vacant", `usedesc` not VACANT*).
- 58% of the top decile are occupied homes in displacement-flagged tracts.
- Example: `0083B00066000000`, an occupied three-family house in East Liberty, gets "Among the stronger places in the City to build new housing" (better than 83% of parcels). Its displacement flag appears only inside the Housing Need card.
- Simulation: an availability multiplier on occupied residential parcels changes who reaches the top decile:

  | Multiplier on occupied homes | Vacant land in top decile | Displacement-flagged in top decile | High-minority in top decile |
  |---|---|---|---|
  | ×1 (now) | 11% | 78% | 9% |
  | ×0.8 | 51% | 49% | 25% |
  | ×0.6 | 54% | 47% | 26% |

**Caveat:** this shifts top ranks toward vacant land, which is concentrated in Black neighborhoods (Hill, Homewood, Larimer). That is a value call: infill on vacant land, with its own gentrification and community-control questions, versus redevelopment of occupied stock. Present it as a choice, not a correction.

### 2.3 NRI "risk" scores embed social vulnerability (high: correctness; medium: equity)

**Evidence:**
- `scripts/data/weather-risk.ts` stores `IFLD_RISKS` and `HWAV_RISKS` [read].
- FEMA: "National Risk Index values are determined by multiplying Expected Annual Loss by the Community Risk Factor… higher social vulnerability and lower community resilience… result in higher National Risk Index data values" [read, [NRI FAQ Dec 2025](https://www.fema.gov/sites/default/files/documents/fema_national-risk-index_faq-page-documentation.pdf)].
- So the config rationale for `site_inland_flood_rating` ("Uses the NRI hazard score, not expected annual loss, which scales with property value") is factually wrong. The score contains EAL (which scales with exposure) *and* social vulnerability.

**Effect [computed]:**

| Indicator | ρ with minority share | ρ with poverty | Correlation with the parcel-level measure it should track |
|---|---|---|---|
| `site_inland_flood_rating` | −0.22 | −0.10 | 0.03 with floodplain share |
| `climate_heat` | −0.28 | −0.16 | 0.01 with Landsat surface heat |

A Site Feasibility pillar that is lower because residents are vulnerable is not measuring feasibility.

### 2.4 The Need pillar's heaviest indicator is flat on race and student-inflated (medium-high)

**Evidence [computed]:**
- `afford_lowinc_renter_burden` (weight 3, the heaviest in the pillar) has ρ −0.02 with minority share. `afford_eli_renter_share` (weight 2) has ρ +0.57.
- Neighborhood means of `lowinc_renter_burden` show the subsidy-masking effect round 1 described (subsidized tenants pay about 30% of income, so they don't show as burdened):

  | Neighborhood | Low-income renter burden (pctile) |
  |---|---|
  | Middle Hill | 17 |
  | Homewood West | 23 |
  | Bedford Dwellings | 24 |
  | Squirrel Hill North | 91 |
  | West Oakland | 89 |

- `afford_housing_transport` (weight 0.5) has ρ −0.36 with minority share and r −0.71 with `climate_household_vmt`. It raises "need" where driving is high, while Climate lowers the score for the same fact. It is the same HUD LAI model with opposite signs.
- The student issue is noted in the ELI rationale ("not yet corrected"), but it drives the top band: 3 of the 5 neighborhoods with the most Need ≥ 75 parcels are Oakland or the South Side.

### 2.5 Displacement flags fire on 37% of the City, including affluent areas (medium)

**Evidence [computed]:**
- The DRR flag (normalized value below 20) fires on 38,024 parcels. The price-growth flag fires on 16,807.
- Share of parcels flagged: Squirrel Hill South 87%, Squirrel Hill North 75%, Shadyside 70%.
- Round-1 R4's vulnerability screen was not implemented.
- A flag that covers a third of the City, including its richest areas, carries little information.
- The DRR flag text has no vintage, although the data are 2019/20.

**What I tested:**
- Using ELI share ≥ 50 as the vulnerability screen is a *bad* proxy. It drops Knoxville and Lower/Upper Lawrenceville to 0% flagged and keeps Squirrel Hill North at 62%.
- Tightening DRR to below 10 (about DRR > 3, Reinvestment Fund's "unaffordable" line per round 1) cuts City coverage to 28% and Squirrel Hill North to 30%. Lawrenceville, East Liberty (77%) and Garfield stay flagged.

### 2.6 Double counting and sign conflicts across pillars (medium)

| Concept | Where | Evidence [computed] | Effect |
|---|---|---|---|
| Location efficiency (urban centrality) | Access (transit w3, jobs by transit w2, …) and Climate/carbon (`climate_household_vmt`, sole indicator, half of Climate) | ρ(carbon sub, Access) = 0.78; with `access_jobs_transit` 0.78 | Centrality effectively carries about 1.5 of 5 pillar weights. Defensible (carbon *is* location efficiency) but undisclosed. |
| Zillow ZORI rent | `demand_rent_growth` (+, w0.5) and `afford_rent_growth_5yr` (−, displacement sub) | r = −0.71 after normalization | Inert while displacement weight is 0. They cancel if a user turns it on. `demand_rent_growth` also correlates −0.23 with its own pillar and +0.32 with minority, and its rationale concedes it is "lowest exactly where new supply lands". |
| HUD LAI | `afford_housing_transport` (+ need when high) and `climate_household_vmt` (− when high) | r = −0.71 | Contradiction (§2.4). |
| Market heat | Demand (turnover, rent growth, permits) and displacement flags (DRR, price growth) | Demand vs DRR (normalized) r = −0.71 | A high score and a warning come from the same fact; see §1.2. |
| Flooding | `site_sfha_share` (parcel, w3, plus gate) and `site_inland_flood_rating` (tract NRI, w1) | r = 0.03 | Not a double count; the NRI one is a bad signal (§2.3). |

### 2.7 Phrases that contradict the numbers (medium: accuracy and stigma)

[computed]

| Phrase key / band | Problem | Scale |
|---|---|---|
| `site` < 35: "Hard to build here: serious physical hazards." | Shown on sliver lots capped at 30 that have no hazard. Example: `0174K00352000000`, a 535 sq ft City-owned lot in Homewood South, reads "serious physical hazards". | 1,582 parcels have Site < 35 with no hazard over 25% of the lot; 1,362 of them are slivers. |
| `climate` 55–70: "Mostly good on carbon and environment." | Shown while the parcel's own `local_env` sub-score is below 35 ("Worse air, heat or tree cover than most of the county"). | **30,388 parcels (21% of the City)** |
| `climate` ≥ 70: "Low driving and a healthy local environment." | `local_env` below 55 | 6,128 of 13,751 parcels |
| `climate` < 40: "High driving emissions and a poor local environment." | Accurate: no parcel in this band has a sub-score ≥ 55. | — |
| `afford` ≥ 75: "Very high need: many renters here are struggling with housing costs." | Accurate as a CHAS statement, but mostly student areas in Oakland and the South Side. The lowest band already warns that "subsidized housing… can hide need"; the top band has no student caveat. | about 5k parcels in student tracts |
| `demand` < 35: "Weak market signals right now (few sales, more empty homes). New homes here will likely need public or nonprofit support." | Accurate and not stigmatizing. It describes data, not preference, which fixes round-1's "Not many people are looking to move here". | Falls on high-minority tracts at 2.65× their share; fine as long as it stays descriptive. |
| `overall` < 25th pct: "One of the harder places in the City to build new housing right now." | Fine, except where the Site sliver phrase is driving it (the Homewood example lands at the 13th percentile). | — |
| `displacement` ≥ 75: "Prices flat or falling. That can mean stability, or disinvestment." | Good: honest about ambiguity. | — |
| Flag: "Sale prices have outpaced local incomes (DRR)…" | No vintage (2019/20). Fires in affluent areas (§2.5). | 38,024 parcels |

### 2.8 Value-judgment labelling (`evidence` field) (medium-low)

- **"Observed" is used for modeled estimates.**
  - `climate_household_vmt`: HUD LAI model.
  - `afford_energy_burden`: its own rationale says "Modeled from ACS 2022 PUMS".
  - `climate_pm25`, `climate_traffic_combustion`, `climate_air_toxics`: EJScreen/RSEI models.
  - `site_inland_flood_rating`, `climate_heat`: NRI risk models.
  - `access_jobs_transit`: a modeled travel-time surface [unverified which model; the rationale says "EPA SLD style"].
  - `climate_industrial_emissions`: reported emissions, but spread by an assumed 1–10 km decay.

  An "observed" tag tells a user the value was measured. Recommend adding `"modeled"`.
- **MVA is tagged "value" while Demand's inputs are "observed".** The tag is really about the weight, not the data. Tag the data "modeled" (MVA is a cluster model), and put the value judgment on Demand's pillar weight (see R1).
- **Unlabelled value judgments.**
  - Gate caps (5, 40, 50, 55, 45, 30) have no `evidence` or `rationale` fields.
  - `missing_pillar.impute: 50` and `overall.floor: 1` have rationales but no tag.
  - Availability and legal multipliers are labelled value judgments (good).
  - The Housing Need `direction_note` says "Value judgment" (good).
- **Presets have no equity disclosure.** `market_first` measurably reproduces the round-1 gradient (ρ −0.27).

### 2.9 Internal inconsistencies in rationale and doc text (low impact, high embarrassment risk)

| Where | Says | Actually |
|---|---|---|
| `site_floodway_share.rationale` | "caps the pillar at 20" | Gates cap at **5** (≥ half the lot) and **40** (any part) |
| `legal.rationale` | "…especially where a parcel borders a district that already allows housing (×0.5)" | `not_permitted_border.multiplier` is **0.35** (README says 0.35) |
| `legal.rationale` vs `not_permitted_border.note` | "use variances (73% of posted decisions, n=30) do get approved" | The note says "few housing use variances are in districts that don't allow housing", and the special-exception note cites 90% with the same n=30. The 73% needs a source line, or should come out. |
| `site_inland_flood_rating.rationale` | "not expected annual loss" | It is EAL × social-vulnerability factor (§2.3) |
| Housing Need panel coverage ("X% of indicator weight has data") | — | `score.ts` adds weight-0-sub-score indicators (displacement: 4 of 11.5 weight) to `totalWeight`, so the displayed coverage is understated even when all *scored* inputs are present. |

### 2.10 Scorer mechanics (`score.ts`), checked

Sound:
- Renormalization over present weights.
- Per-sub-score `min_coverage` (Demand overrides it to 0.75).
- Weight-≤0 indicators are excluded from totals.
- A sub-score with weight 0 is computed, displayed and gated, but excluded from the pillar and from contributions.
- Gates cap after aggregation, and the smallest cap wins.
- `conditionHolds` returns false on missing values. Checked: `site_parcel_use` is never null, so the sliver gate's `notEquals: 3` is safe.
- Geometric floor 1.
- Legal and availability multipliers apply after the blend.
- Sensitivity draws use a Dirichlet.

Issues:
1. **"Neutral 50" isn't neutral.**
   - City medians are Demand 46, Site 89, Need 52, Access 69, Climate 61. A missing Demand (2,714 parcels: Oakland, North Shore, Bedford Dwellings, Terrace Village) gets an above-median value. A missing Site would get about the 10th percentile.
   - Measured effect is small: overall ρ changes by ≤ 0.02 and HOLC means by ≤ 0.2 when imputation is removed [computed].
   - Recommend imputing each pillar's City median from `index.json` quantiles (p50). Then "neutral" means neutral.
2. **Pillars with sub-scores have no pillar-level coverage floor.** If Climate/carbon (VMT only) is missing, Climate = `local_env` alone, silently. Low incidence (VMT present on 141,852 of 142,199).
3. **Integer rounding at gate thresholds.** Indicators are stored as uint8, so floodway share < 0.5% rounds to 100 and never trips the "Part of the lot is in the floodway" gate (`below: 100`). Similarly, "Half or more" (`below: 51`) actually means share > 49%. Cosmetic; document it or use `below: 99.5` on unrounded values.
4. **Contribution "pts" don't sum to a capped score.** This is documented in code comments; the panel should say "before cap" next to capped pillars.
5. **The overall rank distribution includes about 8k non-sites.** Parks, rail and rights-of-way (×0.05) and condo units (×0.5) are in the quantiles, which inflates every real site's percentile by a few points. Consider computing quantiles over `availability = site` only.
6. **`household_growth` is near-constant.** Only 35 of 394 tracts exceed the ACS margin of error; the rest are set to 0 change and share one percentile. At weight 1 of 7 this mildly compresses Demand toward the middle. It is honest, but its `r = 0.02` with the pillar says it contributes almost nothing.

---

## 3. Recommended changes, with expected effect

Simulated effects are Spearman ρ with SVI minority percentile [computed]:
- Baseline: parcel **0.00**, tract +0.06, neighborhood **+0.07**. HOLC means A/B/C/D 61.7/55.8/56.4/57.5.

**R1. Label Demand's weight as the value judgment it is.** Choose explicitly between two options.
- **(a) Keep weight 1 and disclose it.** Add to `pillars[demand]`:
  `"direction_note": "Value judgment: strong markets score high. Demand correlates 0.76 with the MVA, which is not scored on its own for steering reasons; this pillar is kept because weak markets need subsidy to build. Lower its weight to prioritize need over market strength."`
  Rename the label to "Market Demand".
- **(b) Default `pillars[demand].weight: 1 → 0.5`.**
  - Effect: parcel ρ **+0.11**, tract +0.16, neighborhood +0.22. HOLC D mean 57.5 → 59.4.
  - Homewood, East Hills and Knoxville move up. The top decile shifts toward need.
- Either way, add `"equity_note"` to `presets.market_first`: "Reproduces a racial gradient (ρ −0.27 with minority share)." The panel should show it.
- My recommendation: **(a) plus a visible toggle**, because (b) builds a need preference into "neutral" defaults. The team should decide; do not claim either choice is objective.

**R2. Add an occupied-home signal (direct displacement).** Needs a build change: a new indicator from fields already in `parcels.geojson`.
- New indicator `site_occupied_home`: code 1 when `classdesc = RESIDENTIAL`, `Vacant ≠ "Vacant"` and `usedesc` doesn't start with VACANT; weight 0.
- Default: a flag-only gate on `site`: `{"when":[{"indicator":"site_occupied_home","equals":1}],"cap":100,"flag":"Existing occupied home: new housing here means replacing homes people live in"}`.
- Surface this flag, and the displacement flags (R5), on the **Overall** card, not only inside pillar cards. That is a `pillars-panel.tsx` change.
- Optional value toggle: an `availability` level `occupied_home` with multiplier 0.8. That needs `levelStatus` to read a second indicator, or `site_parcel_use` code 5 set at build time.
  - Effect: vacant land in the top decile goes 11% → 51%, displacement-flagged 78% → 49%, high-minority 9% → 25%.
  - State the trade-off in its rationale: it moves top ranks onto vacant land in Black neighborhoods.

**R3. Remove the NRI risk scores.** Config only.
- `site_inland_flood_rating.weight: 1 → 0` and `climate_heat.weight: 0.5 → 0`. Correct both rationales: "NRI RISKS = EAL × community risk factor (social vulnerability ÷ resilience); it would score vulnerable places lower for being vulnerable."
- If the team wants a tract flood or heat signal, rebuild from `IFLD_AFREQ` / `HWAV_AFREQ` (annualized frequency) instead. That is a `weather-risk.ts` field change.
- Effect: parcel ρ 0.00 → +0.01, neighborhood +0.07 → +0.09. HOLC D 57.5 → 58.1. Small on the overall score, but it removes an indefensible mechanism, and the `site` and `local_env` phrases stop reflecting social vulnerability.

**R4. Re-weight Need toward household poverty; drop the modeled H+T.** Config only.
- `afford_eli_renter_share.weight: 2 → 3`, `afford_lowinc_renter_burden.weight: 3 → 2`, `afford_housing_transport.weight: 0.5 → 0` (keep as context).
- Need effect (neighborhood mean, before → after):

  | Neighborhood | Before | After |
  |---|---|---|
  | Homewood West | 48 | 60 |
  | Middle Hill | 48 | 61 |
  | Bedford Dwellings | 58 | 72 |
  | Homewood North | 56 | 68 |
  | East Hills | 71 | 82 |
  | Squirrel Hill North | 65 | 61 |
  | Lower Lawrenceville | 38 | 32 |

- Overall effect: parcel ρ +0.06, tract +0.14, neighborhood +0.17.
- Oakland still tops the pillar (West Oakland 93). The student correction is still needed: blank or halve ELI and low-income burden where the ACS B14007 college-enrolled share of adults is above about 40%, or add the student caveat to the `afford` ≥ 75 phrase until then.

**R5. Make the displacement flags discriminating and honest.** Config only.
- `afford.gates[0].below: 20 → 10` (about DRR > 3).
- Flag text: "Sale prices outpaced local incomes by 2019/20 (Reinvestment Fund DRR): income-restricted homes and tenant protections matter most here".
- Effect: City coverage 37% → 28%. Squirrel Hill North 75% → 30%, Point Breeze 39% → 25%. Lawrenceville, Garfield and Knoxville stay flagged.
- Do **not** use ELI share as the vulnerability screen: tested, it unflags Knoxville and Lawrenceville.
- The real fix is round-1 R4's UDP-style composite (low-income share, renters, no BA, people of color), which needs one ACS pull.

**R6. Remove the cross-pillar sign conflicts.**
- `demand_rent_growth.weight: 0.5 → 0`. It conflicts with its own pillar (r −0.23), with `afford_rent_growth_5yr` (r −0.71), and with its own rationale.
  - Effect alone: parcel ρ −0.03, neighborhood +0.04. Slightly more anti-minority, because ZIP rent growth is highest on the Hilltop. So pair it with R4.
- Disclose the location-efficiency overlap in `pillars[climate].description`: "Carbon here is modeled household driving, which largely tracks the transit and jobs access scored in Access to Opportunity (r ≈ 0.78)." Optionally set `climate.subscores[carbon].weight: 1 → 0.5`.
- Add a cross-pillar check to `diagnostics.ts`: flag any indicator or sub-score pair in *different* pillars with |r| > 0.7. Round 1's R9 (same-sub-score sign conflicts) is still worth adding too.

**R7. Fix the phrases.** Config, plus one small code change.
- `phrases.site[3].text` (min 0): "Hard to build here: serious physical hazards or a very small lot."
  - Better: add `phrase_guards.site.bottom_band_if_sliver` → "Very small lot: usually buildable only combined with a neighbor." That needs a `phrases.ts` change.
- `phrases.climate`:
  - min 70: "Low-carbon location; see local environment below."
  - min 55: "Better than average on carbon or local environment; see the two sub-scores."
  - min 40: "Trade-offs between low driving and local air, heat or tree cover."
  - Or (code) extend `phraseFor` guards to sub-score values, so the top two bands require `local_env ≥ 55`. Passing `{...norm, carbon, local_env}` from the panel would do it.
- `phrases.afford[0]` (min 75): append "In student areas, need may be overstated."
- Displacement flag text: see R5.

**R8. Honest evidence tags and doc consistency.** Config only.
- Add `"modeled"` to the evidence vocabulary and apply it to: `climate_household_vmt`, `afford_energy_burden`, `afford_housing_transport`, `climate_pm25`, `climate_traffic_combustion`, `climate_air_toxics`, `site_inland_flood_rating`, `climate_heat`, `access_jobs_transit`, `demand_market_strength`.
- Add `"evidence": "value"` plus a one-line rationale to each gate cap, `missing_pillar` and `floor`.
- Fix the §2.9 text:
  - Floodway "caps at 20" → "caps at 5 (≥ half) or 40 (any part)".
  - Legal rationale "(×0.5)" → "(×0.35)".
  - Source or remove the "73% (n=30)" claim.
- `score.ts`: compute pillar `coverage` only over sub-scores with weight > 0. Change `totalWeight += total` / `availableWeight += available` to run only when `(overrides.subscores?.[sub.id] ?? sub.weight) > 0`.

**R9. Impute the pillar median, not 50.** Needs code, because the config lacks per-pillar medians.
- Set `overall.missing_pillar.impute: "median"`. `overallScore` then reads `quantiles[pillar][50]` from a `pillar_medians` block written into the config or `index.json` at build time.
- Effect: small (≤ 0.02 on ρ), but "neutral" becomes true.

**R10. Rank quantiles over real sites only.** In `build-indicators.ts`, push to `dist.overall` only when `s.availability?.id === "site"`, or also include condos, as the team chooses.

**Combined logic-only package (R3 + R4 + `demand_rent_growth` 0, Demand weight kept at 1):**
- Parcel ρ **+0.04**, tract +0.12, neighborhood **+0.14**.
- HOLC means 62.5 / 56.3 / 57.2 / 59.4.

**With R1(b) added:**
- Parcel **+0.18**, tract +0.25, neighborhood **+0.30**.
- HOLC means 63.9 / 58.6 / 59.7 / 61.5.
- The HOLC A-vs-D gap stays about 2–4 points in every variant. It comes from Site (A 89 vs D 79: hills and hazards in D-graded areas) and Demand, not from Need.

---

## 4. Limits

- The race proxy is SVI minority percentile (all people of color), not % Black. A Census API key would allow a proper % Black test (ACS B03002).
- Poverty comes from the USDA food-access atlas and is an older vintage than SVI.
- HOLC assignment uses parcel centroids.
- Tract- and block-group-level inputs mean parcel-level ρ overstates the effective sample size. The tract-median and neighborhood columns are the more honest units.
- "Occupied" uses the assessor `Vacant` field and `classdesc`, not USPS occupancy.
- Simulations change only config weights through `WeightOverrides`, or post-hoc multipliers in Python. They do not rebuild indicators.
- Web sources:
  - NRI FAQ (Dec 2025): [read] (risk formula passage).
  - [Asquith, Mast & Reed 2023](https://direct.mit.edu/rest/article-abstract/105/2/359/100977/Local-Effects-of-Large-New-Apartment-Buildings-in): [skimmed] (about 6% nearby rent decrease).
  - Pennington 2021: cited via round 1, not re-checked.
