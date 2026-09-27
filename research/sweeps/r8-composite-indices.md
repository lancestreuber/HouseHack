# Sweep: Composite indices — how others combine low-level data into health, air, safety and livability scores

**Round 8** · 2026-09-26 · single research subagent

> Tags: **[read]** = fetched and read the primary source (or its extracted PDF text) this session; **[skimmed]** = search snippets or a secondary source only; **[found]** = known to exist, not opened. Formulas marked [skimmed] should be re-checked against the primary document before being quoted on a slide. Nothing here claims what other teams will build.

---

## TL;DR

- **Nearly every official composite does the same four things:** (1) turn each raw indicator into a **percentile rank** within a reference area, (2) **average or sum** the percentiles inside a theme or module, (3) **re-rank** the theme scores, and (4) combine themes by summing (SVI, EJI), multiplying (CalEnviroScreen, EJScreen, FEMA NRI), or averaging z-scores (HUD AFFH, COI, County Health Rankings, US News). CEJST is the main exception: it uses **threshold flags** (≥90th percentile burden AND ≥65th percentile low income) instead of a score.
- **"Max of pollutants" (the EPA AQI rule) only works because AQI breakpoints are health-anchored.** Our EJScreen air layers are *relative* PA percentiles of modeled annual exposure, not concentrations tied to health thresholds. Taking a max of percentiles is defensible as a "worst burden" flag. It is **not an AQI** and should not be called one.
- **Allegheny County already has a simple local precedent:** the ACHD Environmental Justice Index (2019). It uses 8 indicators (income, PM2.5, diesel PM, % minority, greenspace proximity, educational attainment, railroad miles, housing vacancy), each binned into **county deciles scored 1–10** (direction flipped where high is good), then a **simple unweighted mean**. The result is sorted into 5 need categories [read]. This is the easiest method to defend in a 24h build.
- **There is no established neighborhood-level "infrastructure quality" composite.** ASCE Report Cards are national/state letter grades from 8 equally weighted criteria [skimmed]. Pavement Condition Index is per road segment [skimmed]. We would be building a new index, and should say so plainly.
- **Biggest pitfalls that apply to our data:** (a) unstandardized inputs let one variable dominate. The Neighborhood Atlas ADI is ~99% driven by home value and income for this reason [read]. (b) FEMA NRI risk scales with exposed dollar value, so wealthy/downtown tracts score "Very High" (noted in Round 4). (c) Traffic, NO2 and diesel PM are correlated, so averaging all three triple-counts traffic. (d) Crime, vacancy and income-based "livability" scores can steer investment away from already disinvested neighborhoods.

---

## 1. Consumer products

**AccuWeather Air Quality** [skimmed]. Built on the Plume Labs AQI, not the EPA AQI. AccuWeather's stated rationale is that existing AQIs lack health-impact meaning. Their scale has six color categories with thresholds tied to newer WHO guideline levels, and each category is framed as **how long it is safe to be outside**. It is primarily a *forecast* product: weather-model dispersion blended with regulatory and satellite data. The practical consequence is that the same air can read "Moderate" on AirNow and worse on AccuWeather, because the WHO-based thresholds are stricter. The "Health & Activities" indices (e.g., running, allergies) are categorical good/fair/poor forecasts; I did not find a published formula. Sources: accuweather.com article (fetch returned 403); smogreport.com comparison.

**IQAir** [skimmed]. Reports the US AQI (and China AQI). It computes each pollutant's sub-index on **hourly** averages instead of the regulatory averaging periods and reports the highest one as the "dominant" AQI. It implemented EPA's 2024 PM2.5 breakpoint change. Its knowledge base covers how it computes AQI when some pollutants are missing.

**Google Air Quality API / BreezoMeter "Universal AQI"** [read]. A **0–100 scale where higher is better**, the opposite direction to the EPA AQI. Bands: 100–80 Excellent, 79–60 Good, 59–40 Moderate, 39–20 Low, 19–1 Poor, 0 Poor (dark red). It covers CO, NO2, O3, PM10, PM2.5 and SO2 at ~500 m resolution, returns a `dominantPollutant`, and supports 70+ local AQIs alongside the UAQI. **The documentation page does not publish the aggregation formula.** Lesson: even a big vendor publishes bands and a "dominant pollutant," not a formula.

**PurpleAir** [skimmed]. The issue here is sensor correction, not aggregation. Raw PurpleAir PM2.5 reads roughly 60% high. EPA's US-wide correction is `PM2.5 = 0.541·PA_cf1 − 0.0618·RH + 0.00534·T + 3.634`, after which NowCast AQI category agreement rises from ~75% to ~90%. Relevant only if we add live sensors.

**Walk Score / Transit Score / Bike Score** [read methodology page; Transit formula skimmed]. Walk Score gives amenities full points within a 5-minute walk (0.25 mi), applies a **distance decay** out to a 30-minute walk, then adjusts for **intersection density and block length**. Transit Score sums over nearby routes: `frequency (trips/week) × mode weight (rail 2×, ferry/cable 1.5×, bus 1×) × distance decay`, then normalizes to 0–100. Bike Score combines bike lanes, hills, destinations/connectivity and bike-commute share. All three are reported as 0–100 with named bands ("Walker's Paradise" 90–100 … "Car-Dependent" 0–24). **This is the closest ready-made template for an "Everyday Access" index built from our amenity points and PRT trip counts.** There is a known critique: Transit Score rewards many infrequent routes (humantransit.org) [found].

**NeighborhoodScout** [skimmed]. Its Crime Index runs 1–100 where **100 = safest**, read as "safer than X% of US neighborhoods." That makes it a straight national percentile of crimes per 1,000 residents, with proprietary allocation of agency-level crime to neighborhoods ("80 proprietary formulas").

**AreaVibes Livability** [skimmed]. A 0–100 score from 9 categories: amenities, commute, cost of living, crime, employment, health & safety, housing, schools, user ratings. Crime weights violent crime above property crime, uses rates per 100k, and scores against the national average. Category weights are not published in what I saw.

**First Street (Risk Factor)** [skimmed]. Per-property **1–10** scores for each peril (flood, fire, wind, heat, and air). The flood score is based on *30-year cumulative probability × depth*. Scores are **not combined across perils**, and each score comes from a physical model.

**ClimateCheck** [skimmed]. Per-property **1–100** per hazard (heat, precipitation, drought, flood, fire), relative to the contiguous US through 2050. It blends current risk with projected change. Hazards are also not combined.

**Niche, Redfin, Zillow neighborhood scores** [found]. Not researched this round. Zillow displays Walk/Transit Score and First Street data. Redfin publishes a climate-risk methodology page that relies on First Street.

**Pattern across consumer products:** normalize to 0–100 or 1–10, show **named bands**, show the **dominant driver**, and usually **do not merge unlike hazards** into one number. None of them publish per-location uncertainty. They express uncertainty through coarse bins.

## 2. Official and government composites

**EPA AQI** [skimmed — AirNow fetch failed DNS]. For each pollutant, `I = (I_hi − I_lo)/(BP_hi − BP_lo) × (C − BP_lo) + I_lo`, a piecewise-linear function between health-based breakpoints. The **reported AQI is the maximum** sub-index, and that pollutant is "dominant." Since May 2024 the PM2.5 breakpoints are Good 0–9.0 µg/m³ and Moderate 9.1–35.4 (Good used to be 0–12.0). **NowCast:** take the last 12 h of PM; weight factor `w = 1 − (max−min)/max`, floored at 0.5; NowCast = Σ wⁱ·cᵢ / Σ wⁱ. The max rule means there is no compensation between pollutants: clean ozone cannot offset bad PM.

**EPA EJScreen EJ Index and Supplemental Index** [skimmed]. `EJ Index = EnvIndicator × (DemogIndex_BG − DemogIndex_US) × Pop_BG` (the classic form). `Demographic Index = (%low-income + %people of color)/2`. The Supplemental Index multiplies the environmental indicator by a 5-factor Supplemental Demographic Index (low income, disability, limited English, < high school, low life expectancy). Both are then reported as **percentiles** (national and state). **Status:** EPA removed EJScreen on 2025-02-05. The Public Environmental Data Partners reconstruction of v2.3 is online [skimmed]. Our layers are the PA-percentile environmental indicators, which are the *inputs* to these indices, not the EJ Indexes themselves.

**CDC/ATSDR Social Vulnerability Index (2022)** [read, documentation PDF]. 16 ACS variables in 4 themes. Each variable is percentile-ranked (Excel `PERCENTRANK.INC`, 0–1) → percentiles are **summed within each theme** → theme sums are re-ranked → the four theme sums are summed → re-ranked to give `RPL_THEMES`. **Flags:** a variable ≥90th percentile scores 1; theme flag = count of variable flags. **Missing values (−999) are excluded** from further calculation. Equal weights throughout. Rankings are computed separately for national and state databases, so a tract's rank differs between them.

**CDC/ATSDR Environmental Justice Index (2024)** [read fact sheet; formula skimmed]. Four modules: Social Vulnerability, Environmental Burden, Health Vulnerability, and (new in 2024) Climate Burden. The 2022 version has 36 indicators in 10 domains across 3 modules. Mechanics follow SVI: percentile-rank indicators → sum by domain/module → rank → **sum module ranks** → rank. Health vulnerability indicators are **binary** (tract has high estimated prevalence or not). The fact sheet says explicitly that the EJI is **not** "a representation of risk or exposure," not a definitive EJ label, and cannot tell whether individuals are at risk. That is a useful disclaimer to borrow.

**CEJST (v2.0)** [skimmed]. No continuous score. A tract is "disadvantaged" if it is **≥90th percentile on any burden** in 8 categories (climate, energy, health, housing, legacy pollution, transportation, water, workforce) **AND ≥65th percentile low income** (<200% FPL). Critics (WRI) note it does not count how many burdens stack up [skimmed].

**CalEnviroScreen 4.0** [read, OEHHA report PDF]. 21 indicators (13 pollution burden, 8 population characteristics), each converted to a statewide percentile. Component score = **mean of indicator percentiles**. Pollution Burden = Exposures and Environmental Effects combined with **Environmental Effects at half weight**, because effects measure *presence* of pollution rather than *exposure*. Population Characteristics = mean of Sensitive Populations and Socioeconomic Factors. Each group score is **divided by the statewide max and × 10** (range 0–10). **CES score = Pollution Burden × Population Characteristics** (max 100), then re-expressed as a statewide percentile. OEHHA's stated reason for multiplying: population characteristics act as "effect modifiers" of pollution risk. The report's own worked example: (68.43 ÷ 81.9) × 10.

**FEMA National Risk Index (Dec 2025)** [read, EAL section; risk equation skimmed]. `EAL = Exposure × Annualized Frequency × Historic Loss Ratio`, computed per hazard for buildings, population and agriculture. Population losses are monetized at **$13.7M per fatality (or per 10 injuries)**. `Risk = EAL × Community Risk Factor`, where the CRF is a function of the ratio Social Vulnerability ÷ Community Resilience (the older form was EAL × SoVI ÷ Resilience). Scores are national percentiles, and ratings run Very Low to Very High. Because EAL is in dollars, **more valuable places score higher risk.**

**Heat vulnerability (NYC HVI)** [skimmed]. Five inputs: surface temperature (ECOSTRESS), % vegetative cover, % households with AC, median income, % non-Hispanic Black. Inputs are **summed and assigned to quintiles 1–5**. It was derived from a statistical model of heat mortality. A CDC Heat & Health Tracker exists [found].

**AARP Livability Index** [read methods page, partially; indicator counts skimmed]. 61 indicators (40 metrics and 21 policies) in 7 categories (housing, neighborhood, transportation, environment, health, engagement, opportunity). Scores run 0–100 with **the average location at 50**, relative to other communities. The page acknowledges trade-offs between categories, e.g., amenities raise housing costs. The exact metric-to-category math and how policy points are added were **not on the page I read**.

**Child Opportunity Index 3.0** [skimmed; diversitydatakids.org returned 403]. 44 indicators in 3 domains and 14 subdomains. Each indicator is **z-scored**. Weights come from **bivariate regression of an outcome index** on each indicator. The outcome index uses Opportunity Atlas income rank and low-poverty residence plus PLACES mental and physical health. It is reported as 1–100 Child Opportunity Scores and 5 Child Opportunity Levels, normed nationally, by state, or by metro. This is the best-known example of **outcome-validated weights**.

**Opportunity Atlas** [skimmed]. Not a composite. It is an *outcome* (adult income rank of children raised at the 25th parental percentile) estimated per tract and published with standard errors, and it applies shrinkage for noisy tracts. It is useful as a **validation target**: does our index correlate with it? It uses 2010 tracts (per Round 4).

**US News Healthiest Communities** [skimmed]. 10 categories with **expert-set weights** (population health 14.15%, equity 12.23%, education 12.15%, …). Metric z-scores are averaged into subcategories, then **min–max rescaled to 0–100** so the top county gets 100.

**County Health Rankings** [skimmed]. Weighted z-scores. Health Outcomes = 50% length of life, 50% quality of life. Health Factors = 30% behaviors, 20% clinical care, 40% social & economic, 10% physical environment. The weights are **explicitly expert/literature-derived**.

**HUD AFFH Opportunity Indices (AFFHT0007, Aug 2024)** [read, documentation PDF]. All are **percentile-ranked 0–100, higher = better**:
- *Low Poverty*: z-score of tract poverty rate, inverted, national percentile.
- *School Proficiency*: enrollment-weighted 4th-grade reading and math proficiency of up to 3 schools within 4 mi of the block group centroid; state percentile.
- *Jobs Proximity*: **gravity model** at block-group level within the CBSA, jobs (E) and workers (L) weighted by crow-flies distance with d<1 mi set to 1. The equation image did not extract; the text implies `A_i = Σ_j (E_j/d_ij²) / Σ_j (L_j/d_ij²)`, with an "alternative" version using 1/d. CBSA percentile.
- *Labor Market Engagement*: `−z(unemployment) + z(LFPR) + z(%BA+)`; national percentile.
- *Environmental Health*: `z(cancer) + z(respiratory) + z(neuro)` air-toxics hazard, **inverted**, national percentile.
- *Low Transportation Cost* and *Transit Trips*: **not provided in AFFHT0007** "due to lack of reliable source data." A useful honesty marker.

**Area Deprivation Index** [method skimmed; critique read]. 17 ACS indicators weighted by Singh's factor-score coefficients, block-group national percentiles 1–100, plus state deciles. **Critique (Health Affairs Scholar, 2023) [read]:** because the Neighborhood Atlas **did not standardize** the indicators, median home value and median income account for **98.8%** of the score (r = −0.98 with home value alone). Standardized, the index becomes genuinely multidimensional. **This is the single most important implementation warning for us.**

## 3. Municipal and regional examples

**Allegheny County Health Department EJ Index (2017, updated 2019)** [read, 2019 report PDF]. It started as 10 community-identified metrics at tract level (2017). The 2019 update uses 8 metrics at **municipality/neighborhood** level: median household income, diesel PM, PM2.5 (2014 NATA), % minority, greenspace within 0.25 mi, educational attainment, railroad track miles, USPS vacancy. Tract data were aggregated to municipalities by **summing numerators and denominators** for percentages and averaging tracts for PM and income. Each metric was converted to **deciles scored 1–10** (reversed for income, greenspace and HS attainment), and the overall score is a **simple mean** ("assumes each indicator is equally important"). Scores were cut into 5 need categories; the county median was 5.38 and the range 2–8.63. High-scoring areas also showed higher elevated blood lead, infant mortality and asthma ED visits, which is a light external check. The report's own limitations include tracts that straddle municipalities, one-quarter vacancy data, and the fact that a 0.25-mile greenspace radius ignores hills and rivers. **Close fit to our stack and local, so a judge from the county may recognize it.**

**Pennsylvania DEP EJ areas (as hosted on WPRDC)** [read]. Binary: tract ≥20% poverty and/or ≥30% minority. A threshold rule, not an index.

**City of Pittsburgh Equity Indicators (2017 and later)** [skimmed; city PDF refused connection]. 80 indicators in 4 domains. It follows the CUNY ISLG method: each indicator scores 1–100 on the **ratio between advantaged and disadvantaged groups**, then rolls up to a citywide 55/100. It measures *disparity between groups*, not *place quality*, which is a different design question from ours. The city also has an ArcGIS tract layer `Tracts2020_Pgh_CommunityNeed` with a **z-scored "Level of Need"** (found in Round 4) [found].

**GASP / CDC EJI in Allegheny** [read]. A GASP post walks the EJI through Clairton's tracts: an EJI of 0.97 means worse cumulative impacts than 97% of tracts nationally. This is a local example of communicating a percentile to the public.

**Chicago Hardship Index (UIC Great Cities Institute)** [skimmed]. 6 ACS indicators (crowding, poverty, unemployment, <HS education, dependency, per-capita income), each **min–max scaled 0–100** across community areas and then **averaged**. The approach descends from Nathan & Adams (1976).

**Seattle Racial & Social Equity Index** [skimmed]. Three sub-indices. The first is Race/ELL/Origins, with **explicit weights** (persons of color 1.0, ELL 0.5, foreign-born 0.5). The second is Socioeconomic Disadvantage. The third is Health Disadvantage & Disability (life expectancy plus PLACES measures). Sub-indices are percentile-ranked and combined into a tract composite. There is also a separate "countywide comparison" version, which is a clean example of **choosing the reference population explicitly**.

**LA City Equity Index (Catalyst California / LA Controller)** [skimmed]. Indicator percentiles are averaged within domains, and the domain score is re-ranked to a percentile. Asset-based indicators are flipped by multiplying by −1. The index is the mean of domains. **Missing-data rule: a ZIP needs ≥50% of indicators in every domain to get a score.** The Controller's version maps tracts 1–10.

**Not researched this round** [found]: Boston heat vulnerability and Climate Ready Boston, Philadelphia HVI, Baltimore Neighborhood Indicators Alliance Vital Signs, Minneapolis, Detroit, Allegheny DHS indices, PCRG.

**Infrastructure composites** [skimmed]. ASCE Report Card grades each sector on 8 **equally weighted** criteria (capacity, condition, funding, future need, O&M, public safety, resilience, innovation), summed to an A–F grade. That is state/national scale. The Pavement Condition Index (0–100) is per road segment. Searches turned up no standard neighborhood "utility condition" composite that combines lead lines, sewers and mains.

## 4. Methods synthesis for a ~24h build

**Normalization**

| Choice | Used by | Pros | Cons for us |
|---|---|---|---|
| Percentile rank | SVI, EJI, CES, EJScreen, HUD, ADI | Unit-free, robust to outliers, easy to explain ("worse than 80% of block groups") | **Compression/expansion:** tiny raw gaps become big rank gaps in dense parts of the distribution, and big gaps shrink in the tails. Ties. Depends on the reference set (PA vs county). |
| z-score | COI, CHR, HUD LMEI, US News | Preserves distance, and z-scores add naturally | Skewed data (crime, jobs) lets outliers dominate. Needs log or winsorize first. |
| Min–max 0–100 | Chicago Hardship, US News (final step) | Simple | One outlier sets the scale. |
| Health-anchored breakpoints | EPA AQI, First Street | Meaningful absolute levels | We have no breakpoints for modeled annual percentiles. |
| Threshold flags | CEJST, SVI flags, PA DEP | Transparent and non-compensatory | Cliff effects at the cut-off. |
| Deciles 1–10 | ACHD EJ Index | Very explainable, local precedent | Coarse. |

Our EJScreen layers are already **PA** percentiles. Re-ranking them **within Allegheny County** gives the local contrast a county audience expects. Whichever is used, label the reference population on screen.

**Aggregation**
- *Arithmetic mean/sum* (SVI, ACHD, LA): fully compensatory, so good transit can offset bad air.
- *Geometric mean*: partially compensatory. The OECD/JRC Handbook recommends it when you don't want trade-offs [skimmed].
- *Max* (AQI): no compensation. Honest for "worst exposure," but it saturates, so everyone near a highway ends up at ~95.
- *Multiplicative* (CES, NRI, EJScreen): encodes "vulnerability amplifies burden." Needs both factors on a fixed 0–10 scale.
- *Threshold counts* (CEJST, SVI flags): "how many burdens ≥90th percentile." Good as a companion number.

**Weighting**
- *Equal*: SVI, ACHD, CES within components. The default, and the easiest to defend.
- *Expert*: CHR, US News, Seattle, CES's half weight.
- *Data-driven PCA/factor*: ADI. Risky if unstandardized (see the ADI finding).
- *Outcome-correlated*: COI. Needs an outcome. At tract level we could validate against Opportunity Atlas or PLACES, but that is probably out of scope for 24h. Correlating the finished index against them as a check is feasible.
- *User-set*: already proposed in Round 4 (preset weight profiles plus sliders).

**Correlated indicators.** Diesel PM, NO2 and traffic proximity move together. Group them into a "traffic/combustion" subgroup and average them first so the subgroup counts once, the way CES puts effects at half weight. Crime and homicide, and ACS burden and income, need the same treatment.

**Missing data.** Follow SVI (exclude, don't zero-fill) and LA (require ≥50% coverage per domain). Display "n of m indicators available."

**Mixed geographies.** Keep three kinds of attribute separate:
- *Parcel-native*: flood zone, slope, landslide, lead line, sewer, distance to amenities, canopy/LST sampled at the parcel.
- *Area-inherited*: EJScreen at block group, ACS at BG/tract, NRI at tract, crime by neighborhood.
- *Aggregated up*: parcel values rolled up to BG.

Tag each component in the UI as "this parcel" or "this block group/tract." When aggregating percentages up, sum numerators and denominators (ACHD). Do not average percentages.

**Uncertainty and robustness.**
- ACS margins of error: SVI flags this and COI uses 5-year data.
- Small-number instability in crime and homicide rates: use multi-year pooling or empirical-Bayes shrinkage, as the Opportunity Atlas shrinks noisy tracts.
- Weight sensitivity: a cheap Monte Carlo that re-draws weights ±50%, or Dirichlet draws, gives each area a **rank range**. Report "stable" or "sensitive." The JRC Handbook treats this as a required step [skimmed].
- Communicate with **bins** (quintiles or 1–5, 1–10) rather than false-precision decimals, as COI levels, NYC HVI and First Street do.

**Transparency.** Show a per-area bar of component contributions and name the dominant driver, as Google UAQI does with its `dominantPollutant`. Publish the formula on a methods pop-over. Borrow the EJI's "not a measure of individual risk" disclaimer.

**Pitfalls, specific to our layers**
1. **Unstandardized inputs**: dollar-scaled fields (income, rent, EAL) swamp everything (ADI).
2. **NRI risk ∝ property value**: use per-hazard *ratings* or EAL *rate*, not composite risk, as a "climate hazard" input (Round 4 saw downtown rated Very High).
3. **Ecological fallacy**: a block-group air percentile is not a parcel's exposure. Label it as area-level.
4. **Percentile compression**: Allegheny's PM2.5 may vary little across block groups, so large percentile differences can reflect tiny concentration differences. Show the raw value beside the percentile.
5. **Direction confusion**: the EPA AQI puts high = bad, the Google UAQI and HUD indices put high = good. Pick one convention per index and label the scale ends.
6. **Entrenching disinvestment**: a "livability" or "safety" score that goes down with crime, vacancy and poverty mirrors the logic of HOLC-era grading and can steer capital *away* from places that need it. Mitigations:
   - separate **conditions** (what a resident experiences) from **need/priority** (where investment should go);
   - report burdens as flags, not as a reason to rank a place lower for housing;
   - avoid race as a *penalty*. ACHD, SVI and Seattle use race to identify **need**, not to lower quality.
7. **Crime data bias**: reported crime reflects policing intensity. Serious crashes and homicides are less reporting-biased than total crime.
8. **Stale vintages**: ACHD's report itself flags a single-quarter vacancy snapshot. EJScreen v2.3 is frozen as of 2025.

## 5. Candidate index designs for our datasets (options, not decisions)

**Option A: "Air Burden" (don't call it AQI)**
- *Inputs:* EJScreen PM2.5, ozone, NO2, diesel PM, traffic proximity, RSEI air (block group).
- *Normalization:* re-rank each within Allegheny block groups (0–100). Keep the PA percentile as a tooltip.
- *Aggregation variants:*
  - **A1** (CES/SVI style): mean of three sub-scores (particulate = PM2.5; combustion/traffic = mean of NO2, diesel PM, traffic; industrial = RSEI; ozone optional since it is regional and flat), then re-rank. Mirrors CalEnviroScreen Exposures.
  - **A2** (AQI style): max of the component percentiles plus a "dominant burden" label. Non-compensatory, but saturates.
  - **A3** (CEJST style): count of components ≥90th percentile, shown next to A1.
- *Weights:* equal across sub-groups.
- *Trade-off:* A1 is smoother and explainable. A2 better matches the consumer AQI mental model but overstates near-highway uniformity. A1 + A3 together covers both "overall" and "stacked burdens."

**Option B: "Health & Safety"**
- *Inputs:*
  - (i) physical hazards: FEMA flood zone (parcel, binary/SFHA), landslide susceptibility, slope, NRI heat-wave and inland-flood *ratings*, LST;
  - (ii) public safety: homicide rate, crime rate (pooled multi-year), serious crashes per road-mile;
  - (iii) health infrastructure: lead service line (parcel), drive or transit time to the nearest hospital or EMS.
- *Normalization:* hazards as **flags/categories** (in SFHA; landslide high; slope >25% or whatever threshold the city code uses). Rates as county percentiles after shrinkage.
- *Aggregation:* two layers. Hazard flags are **non-compensatory warnings** (Round 4's "separate warning, not a weight"). The safety and health-access sub-score is the mean of percentiles.
- *Mirrors:* CEJST (flags) + ACHD/SVI (mean of percentiles) + First Street (per-peril, not merged).
- *Trade-off:* honest but not a single number. A single-number version (geometric mean) is possible, but it lets a flood zone be averaged away.

**Option C: "Everyday Access" (opportunity/livability)**
- *Inputs:* network or crow-flies distance from the parcel to grocery, pharmacy, school, park, hospital (Walk Score-style decay: 1.0 within 0.25 mi, falling to 0 at ~1.5 mi / 30 min walk); transit = Σ over nearby stops of trips × decay (Transit Score, all PRT bus 1×, T/incline 2×/1.5× if present); jobs = HUD gravity model on LODES (`Σ E_j/d² ÷ Σ L_j/d²`), or "jobs reachable by transit."
- *Normalization:* each decayed sum rescaled to 0–100 (county percentile, or Walk Score-style fixed max).
- *Aggregation:* weighted mean, with amenity weights either equal or user-set. Optional geometric mean so that zero grocery access can't be fully offset.
- *Mirrors:* Walk Score/Transit Score + HUD AFFH Jobs Proximity + AARP Neighborhood/Transportation categories.
- *Trade-off:* all parcel-native, so no ecological fallacy. Straight-line distance ignores hills and rivers, the same caveat ACHD raised, and a network distance fixes that at compute cost.

**Option D (secondary): "Infrastructure Condition" (new, no established precedent)**
- *Inputs:* lead service line (parcel), sewer type or condition, transit frequency, sidewalk/crash data if available.
- *Method:* ASCE-style checklist, e.g., 0/1/2 points per system summed to an A–F style grade, with each input shown.
- *Trade-off:* it has to be presented as the team's own construct. It should not be called a standard index.

**Across all options:** show components, name the reference population and the direction, show a coverage count, give a rank range under ±50% weight changes, and correlate the Access and Health & Safety indices against Opportunity Atlas and CDC PLACES at tract level as a sanity check (not a validation claim).

---

## Comparison table

| Index | Publisher | Geography | Inputs | Normalization | Aggregation | Weighting | Link | Tag |
|---|---|---|---|---|---|---|---|---|
| US AQI | EPA | Monitor/reporting area | O3, PM2.5, PM10, CO, NO2, SO2 | Health breakpoints, piecewise linear 0–500 | Max of sub-indices | n/a (max) | airnow.gov/aqi/aqi-basics | skimmed |
| AccuWeather AQ scale | AccuWeather / Plume Labs | Point/forecast grid | Major pollutants, forecast | WHO-based thresholds, 6 bands | Not published | Not published | accuweather.com (article) | skimmed |
| Universal AQI | Google / BreezoMeter | 500 m grid | CO, NO2, O3, PM10, PM2.5, SO2 | 0–100, high = good | Not published; dominant pollutant | Not published | developers.google.com/maps/documentation/air-quality/laqis | read |
| Walk/Transit Score | Walk Score (Redfin) | Address | Amenities; routes × frequency × mode | Distance decay → 0–100 | Weighted sum | Amenity/mode weights (rail 2×) | walkscore.com/methodology.shtml | read / skimmed |
| Crime Index | NeighborhoodScout | Neighborhood | Crimes per 1,000 | National percentile, 100 = safest | Rate-based | Proprietary | neighborhoodscout.com | skimmed |
| Livability Score | AreaVibes | City/neighborhood | 9 categories | vs national average, 0–100 | Weighted | Not published | areavibes.com/methodology | skimmed |
| Risk Factor | First Street | Property | Physical hazard models | 1–10 per peril | Not combined | n/a | firststreet.org/methodology | skimmed |
| ClimateCheck | ClimateCheck | Property | 5 hazards to 2050 | 1–100 per hazard | Not combined | n/a | climatecheck.com/our-methodologies | skimmed |
| EJ / Supplemental Index | EPA EJScreen (offline; PEDP rebuild) | Block group | Env indicator × demographic index | Percentile | Multiplicative | Implicit | envirodatagov.org (removal notice) | skimmed |
| SVI 2022 | CDC/ATSDR | Tract | 16 ACS vars, 4 themes | Percentile rank | Sum → rank → sum → rank; ≥90th flags | Equal | atsdr.cdc.gov SVI2022Documentation.pdf | read |
| EJI 2024 | CDC/ATSDR | Tract | ~36+ indicators, 4 modules | Percentile rank; binary health flags | Sum of module ranks → rank | Equal | atsdr.cdc.gov/place-health/php/eji | read / skimmed |
| CEJST v2 | CEQ | Tract | 8 burden categories + low income | Percentile thresholds | ≥90th burden AND ≥65th low income | n/a | climateprogramportal.org (TSD) | skimmed |
| CalEnviroScreen 4.0 | CA OEHHA | Tract | 13 burden + 8 population | Percentile; scaled to max 10 | Pollution Burden × Pop Char | Env effects ½ weight | oehha.ca.gov (CES 4.0 report) | read |
| National Risk Index | FEMA | Tract/county | EAL, SoVI, resilience | $ EAL → national percentile | EAL × Community Risk Factor | n/a | fema.gov NRI methodology | read / skimmed |
| NYC HVI | NYC DOHMH | NTA | LST, veg, AC, income, % Black | Model-based | Sum → quintiles 1–5 | Model-derived | a816-dohbesp.nyc.gov (HVI) | skimmed |
| AARP Livability | AARP PPI | Neighborhood → state | 61 (40 metrics, 21 policies), 7 categories | Relative, 0–100, avg 50 | Category mean (not detailed) | Not detailed | livabilityindex.aarp.org/methods-sources | read / skimmed |
| COI 3.0 | diversitydatakids.org | Tract | 44 indicators, 3 domains | z-score | Weighted sum → 1–100, 5 levels | Outcome-regression weights | diversitydatakids.org COI 3.0 tech doc | skimmed |
| Healthiest Communities | US News | County | 10 categories | z → min–max 0–100 | Weighted mean | Expert (e.g., 14.15%) | usnews.com/.../methodology | skimmed |
| County Health Rankings | UWPHI | County | ~30+ measures | z-score | Weighted sum | Expert (40/30/20/10) | countyhealthrankings.org | skimmed |
| AFFH Opportunity Indices | HUD | BG/tract | Poverty, schools, jobs, LMEI, env health | z → percentile 0–100 | Linear combos; gravity model | Equal within index | docs.huduser.gov AFFH-T documentation | read |
| ADI | UW Neighborhood Atlas | Block group | 17 ACS | Factor weights, **unstandardized** | Weighted sum → percentile | Factor scores | pmc.ncbi.nlm.nih.gov/articles/PMC10986280 | read (critique) |
| ACHD EJ Index 2019 | Allegheny County Health Dept | Municipality/neighborhood | 8 (income, PM2.5, DPM, minority, greenspace, education, rail, vacancy) | County deciles 1–10 | Simple mean → 5 categories | Equal | alleghenycounty.us 2019 EJ report | read |
| Chicago Hardship Index | UIC Great Cities Inst. | Community area | 6 ACS | Min–max 0–100 | Mean | Equal | greatcities.uic.edu | skimmed |
| Seattle RSE Index | City of Seattle OPCD | Tract | 3 sub-indices | Percentile | Composite of sub-indices | Explicit (1.0 / 0.5 / 0.5) | data-seattlecitygis.opendata.arcgis.com | skimmed |
| LA City Equity Index | Catalyst CA / LA Controller | ZIP / tract | 4 domains | Percentile, assets × −1 | Domain mean → rank → mean | Equal; ≥50% coverage rule | github.com/catalystcalifornia/mlaw | skimmed |
| Pittsburgh Equity Indicators | City of Pittsburgh (ISLG method) | City, by group | 80 indicators | Group-disparity ratio → 1–100 | Mean up the hierarchy | Equal | apps.pittsburghpa.gov (PDF) | skimmed |
| ASCE Report Card | ASCE | Nation/state | 8 criteria per sector | Graded | Sum → A–F | Equal | infrastructurereportcard.org/making-the-grade | skimmed |

---

## Sources (accessed 2026-09-26)

- [read] Google Air Quality API, AQ Indexes: https://developers.google.com/maps/documentation/air-quality/laqis
- [read] Walk Score methodology: https://www.walkscore.com/methodology.shtml
- [skimmed] Transit Score methodology: https://www.walkscore.com/transit-score-methodology.shtml
- [found] Human Transit, "The Trouble with Transit Score": https://humantransit.org/2017/03/the-trouble-with-transit-score.html
- [skimmed] AccuWeather, air quality article (403 on fetch): https://www.accuweather.com/en/accuweather-ready/how-to-know-when-air-quality-is-poor/693924
- [skimmed] IQAir vs AccuWeather: https://www.smogreport.com/guides/iqair-vs-accuweather
- [skimmed] IQAir 2024 AQI update: https://www.iqair.com/support/knowledge-base/iqair-implements-2024-update-to-u-s-epa-air-quality-index-aqi
- [skimmed] EPA PurpleAir US correction: https://cfpub.epa.gov/si/si_public_record_Report.cfm?dirEntryId=349513&Lab=CEMM
- [skimmed] NeighborhoodScout Crime Index: https://help.neighborhoodscout.com/support/solutions/articles/25000001997-what-is-the-crime-index-
- [skimmed] AreaVibes methodology: https://www.areavibes.com/methodology/
- [skimmed] First Street methodology: https://firststreet.org/methodology
- [skimmed] ClimateCheck methodologies: https://climatecheck.com/our-methodologies
- [skimmed] AirNow AQI basics: https://www.airnow.gov/aqi/aqi-basics/
- [skimmed] AQI Technical Assistance Document (DNS failed on fetch): https://document.airnow.gov/technical-assistance-document-for-the-reporting-of-daily-air-quailty.pdf
- [skimmed] EPA NowCast fact sheet: https://www.epa.gov/sites/default/files/2018-01/documents/nowcastfactsheet.pdf
- [skimmed] EPA PM NAAQS AQI fact sheet (2024): https://www.epa.gov/system/files/documents/2024-02/pm-naaqs-air-quality-index-fact-sheet.pdf
- [skimmed] EJScreen EJ Indexes (2017 snapshot): https://19january2017snapshot.epa.gov/ejscreen/environmental-justice-indexes-ejscreen_.html
- [skimmed] EDGI, EPA removes EJScreen: https://envirodatagov.org/epa-removes-ejscreen-from-its-website/
- [read] CDC/ATSDR SVI 2022 Documentation: https://www.atsdr.cdc.gov/place-health/media/pdfs/2025/01/SVI2022Documentation.pdf
- [read] CDC/ATSDR EJI Fact Sheet 2024: https://www.atsdr.cdc.gov/place-health/media/pdfs/2024/10/EJI-Fact-Sheet-2024-v9-2.pdf
- [skimmed] EJI Technical Documentation page: https://www.atsdr.cdc.gov/place-health/php/eji/eji-technical-documentation.html
- [skimmed] CEJST v2.0 Technical Support Document: https://climateprogramportal.org/wp-content/uploads/2025/02/cejst-technical-support-document.pdf
- [skimmed] WRI on CEJST cumulative burdens: https://www.wri.org/technical-perspectives/ceq-climate-and-economic-justice-screening-tool-cumulative-burdens
- [read] CalEnviroScreen 4.0 report: https://oehha.ca.gov/sites/default/files/media/downloads/calenviroscreen/report/calenviroscreen40reportf2021.pdf
- [read] FEMA NRI Methodology and Hazards Overview (Dec 2025): https://www.fema.gov/sites/default/files/documents/fema_national-risk-index_methodology-hazards-overview.pdf
- [skimmed] NYC HVI: https://a816-dohbesp.nyc.gov/IndicatorPublic/data-features/hvi/
- [read] AARP Livability Index methods: https://livabilityindex.aarp.org/methods-sources
- [skimmed] COI 3.0 Technical Documentation: https://www.diversitydatakids.org/sites/default/files/2025-08/COI30_TechDoc_20241004.pdf
- [skimmed] Opportunity Atlas paper: https://opportunityinsights.org/paper/the-opportunity-atlas/
- [skimmed] US News Healthiest Communities methodology: https://www.usnews.com/news/healthiest-communities/articles/methodology
- [skimmed] County Health Rankings technical documentation: https://www.countyhealthrankings.org/sites/default/files/media/document/2024%20CHRR%20Technical%20Document_1.pdf
- [read] HUD AFFH-T Data Documentation AFFHT0007 (Aug 2024): https://docs.huduser.gov/archives/sites/default/files/datasets/affh/AFFH-T-Data-Documentation-AFFHT0007-August-2024.pdf
- [read] "Deciphering the Neighborhood Atlas ADI: the consequences of not standardizing": https://pmc.ncbi.nlm.nih.gov/articles/PMC10986280/
- [read] ACHD 2019 Environmental Justice Index report: https://www.alleghenycounty.us/files/assets/county/v/1/government/health/documents/resources-reports-and-publications/2019-environmental-justice-report.pdf
- [read] WPRDC Allegheny County EJ Areas: https://data.wprdc.org/dataset/environmental-justice-census-tracts
- [read] GASP on EJI in Allegheny: https://www.gasp-pgh.org/tool-measuring-health-impacts-of-environmental-burdens-unveiled-how-does-your-community-stack-up
- [skimmed] Pittsburgh Equity Indicators (connection refused): https://apps.pittsburghpa.gov/redtail/images/3171_PGH_Equity_Indicators_Final.pdf
- [skimmed] Chicago Hardship Index fact sheet: https://greatcities.uic.edu/wp-content/uploads/sites/942/2025/08/GCI-Hardship-Index-Fact-SheetV2.pdf
- [skimmed] Seattle RSE Index: https://data-seattlecitygis.opendata.arcgis.com/datasets/SeattleCityGIS::racial-and-social-equity-composite-index-current/about
- [skimmed] LA City Equity Index README: https://github.com/catalystcalifornia/mlaw/blob/main/README.md
- [skimmed] ASCE, Making the Grade: https://infrastructurereportcard.org/making-the-grade/
- [skimmed] OECD/JRC Handbook on Constructing Composite Indicators (2008): https://www.oecd.org/en/publications/handbook-on-constructing-composite-indicators-methodology-and-user-guide_9789264043466-en.html
