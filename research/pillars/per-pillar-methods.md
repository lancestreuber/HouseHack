# Per-pillar scoring methods: how agencies and the literature turn indicators into one number

**Type:** method research
**One line:** For each of our five pillars, the published methods that agencies and researchers use to combine low-level indicators into one score. Each entry gives the exact formula where one is published, a recommendation for our data, and citations with access tags.
**Last checked:** 2026-09-26
**Companion:** [pillars-and-open-weights](../knowledge/methods/pillars-and-open-weights.md), the draft pillar spec. This file supplies the citable precedent behind it.

**Access tags:**
- `[read]` I fetched the primary document this session and read the quoted passage.
- `[skimmed]` Only a secondary source or search snippet was seen.
- `[found]` The source is known to exist but was not opened.

Formulas in `code` blocks are transcribed from the source. Where a source uses an image for its formula, I rendered the page and read it. **Nothing marked "not published" was filled in from memory.**

---

## TL;DR

| Pillar | Recommended method (standard it copies) | How it makes one number | Key citation |
|---|---|---|---|
| **1 Demand** | Percentile-rank weighted mean of market-tightness indicators. The locally adopted **Reinvestment Fund MVA** market type is shown as a label, not averaged. HUD CHMA "demand" is county-level context only. | Percentile within Allegheny County → weighted mean. The MVA class is categorical (clustered), so it is displayed and not scored. | HUD PD&R, *CHMA Pittsburgh PA* (2024) `[read]`; Reinvestment Fund, *Allegheny County & City of Pittsburgh MVA 2021* `[read]` |
| **2 Site Feasibility** | **GIS multi-criteria suitability: Boolean constraints × weighted linear combination (WLC).** Constraints come from Oregon buildable-land rules, the FEMA floodway rule and zoning legality. | `V(x_i) = Σ w_j r_ij`, with each `r` rescaled over *feasible* parcels only. Hard constraints set the score to 0 or a cap. | Malczewski (2000) *Trans. in GIS* `[read]`; OAR 660-008-0005 `[read]`; 44 CFR 60.3 `[read]` |
| **3 Affordability & Displacement** | Two sub-scores, kept visible. **(a) Affordability:** H+T share of income against the 45% benchmark, plus CHAS cost-burden rates. **(b) Displacement:** a rule-based vulnerability count (Bates 2013 / UDP), compared with the county median. | (a) Percentile or threshold scoring. (b) Count how many of 4 vulnerability tests are met (0–4), then apply typology rules. | CNT *H+T Index Methods* (2022) `[read]`; HUD CHAS definitions `[read]`; Bates (2013) `[read]`; UDP Replication Project (2020) `[read]` |
| **4 Access to Opportunity** | Parcel-level **distance-decay access** (Walk Score / Hansen gravity) plus HUD's **Jobs Proximity gravity index**. A **CTCAC/HCD-style** count of area indicators above the regional median is an optional area layer. | Parcel: `Σ weight × decay(distance)`. Jobs: `A_i = Σ(E_j/d²)/Σ(L_j/d²)`. Area: +1 point per indicator above the regional median. | CTCAC/HCD *2025 Opportunity Map Methodology* `[read]`; HUD *AFFH-T Data Documentation* `[read]`; Walk Score methodology `[read]` |
| **5 Climate & Environment** | **EJI-style percentile-rank sums** within sub-components (air, local hazards, climate hazard, transport carbon), then re-rank. A **CTCAC-style top-5% burden flag** acts as a penalty. Use FEMA NRI **ratings**, not EAL dollars. | Sum each component's indicator percentiles → percentile-rank the sum → mean of the components → invert so 100 = better. | CDC/ATSDR *EJI 2024 Technical Documentation* `[read]`; OEHHA *CalEnviroScreen 4.0* `[read]`; FEMA NRI docs `[read]` |

**Cross-cutting rule (OECD/JRC Handbook `[read]`):** linear (weighted-mean) aggregation is fully compensatory, meaning a surplus in one indicator offsets a deficit in another. Geometric aggregation or hard constraints reduce that compensation. This is the published reason for our "gates": a floodway parcel must not be averaged back to "good".

---

## 0. Cross-cutting: the generic composite-indicator recipe

**OECD/JRC, *Handbook on Constructing Composite Indicators* (2008)** `[read]`
- The handbook lists ten steps: theoretical framework, data selection, imputation, multivariate analysis, normalisation, weighting, aggregation, sensitivity analysis, links to other measures, visualisation.
- Normalisation options it covers include Min-Max, z-score and percentile ranks.
- On aggregation, verbatim: "In both linear and geometric aggregations, weights express trade-offs between indicators. A deficit in one dimension can thus be offset (compensated) by a surplus in another."
- Also verbatim: "Geometric aggregations are better suited if the modeller wants some degree of non compensability between individual indicators or dimensions."
- Why it matters for us:
  - Our open-weights UI should call weights **trade-offs**, not "importance".
  - Hazards that must not be compensated should be gates (constraints), not weighted terms.
- Citation: OECD & European Commission JRC (2008). *Handbook on Constructing Composite Indicators: Methodology and User Guide.* OECD Publishing. ISBN 978-92-64-04345-9. https://www.oecd.org/content/dam/oecd/en/publications/reports/2008/08/handbook-on-constructing-composite-indicators-methodology-and-user-guide_g1gh9301/9789264043466-en.pdf

Every official index below uses one of three normalizations:

| Normalization | Used by (verified below) |
|---|---|
| Percentile rank | CalEnviroScreen, EJI, FEMA NRI scores, HUD AFFH final scaling, COI "Scores" |
| z-score, then percentile | HUD AFFH indices, COI 3.0 composites |
| Above/below a regional median (binary points) | CTCAC/HCD Opportunity Map, UDP typology, Bates typology |

---

## Pillar 1: Demand

### 1a. Standard methods

**M1.1 HUD PD&R Comprehensive Housing Market Analysis (CHMA): "demand" = production needed to reach a balanced market.**
- The Pittsburgh CHMA (as of May 1, 2024) defines demand verbatim:
  > "The demand estimates in the analysis are not a forecast of building activity. They are the estimates of the total housing production needed to achieve a balanced market at the end of the 3-year forecast period given conditions on the as-of date of the analysis, growth, losses, and excess vacancies. The estimates do not account for units currently under construction or units in the development pipeline."
- The inputs are named: household growth, inventory losses and excess vacancy relative to a "balanced" vacancy rate.
- **The arithmetic is not published as a formula.** It is an analyst estimate made at the housing-market-area (HMA) level.
- Pittsburgh HMA figures `[read]`:
  - Sales: 10,450 units demanded over 3 years; 1,425 under construction.
  - Rental: 8,975 units demanded; 3,350 under construction.
  - The sales and rental markets are both rated "Balanced". Apartment vacancy was 6.5% in 1Q 2024.
- Output: one number per HMA (metro). **It cannot be computed per parcel.**

**M1.2 Reinvestment Fund Market Value Analysis (MVA): cluster analysis of block groups.**
- The 2021 Allegheny County / City of Pittsburgh MVA indicators, verbatim list, all geocoded to block groups:
  - Residential sales price and variance (2017–2019)
  - Mortgage foreclosure filings
  - Parcel year built
  - Parcel condition
  - Vacant lot area
  - Building violations
  - Owner occupancy (ACS 2014–2018)
  - Subsidized housing units (HUD Picture of Subsidized Households)
- Method, verbatim: "a statistical cluster analysis was conducted to identify areas (i.e., block groups) that share a common data profile. The cluster analysis segments block groups into clusters (in this case, a total of ten) based on sharing like characteristics on the market indicators".
- Results are vetted by local experts.
- **The clustering algorithm (k-means, hierarchical, etc.) and any variable standardization are not stated** in the executive summary or on Reinvestment Fund's MVA page. Both only say "spatial and statistical analysis".
- Output: a categorical market type (letters A–J in 2021), not a continuous score. Thirteen of 1,110 block groups were unassigned for insufficient sales.

**M1.3 Zillow Market Heat Index (seller-vs-buyer tilt).** `[skimmed]`
- Search-snippet description only; the methodology page returned 403.
- Inputs: user engagement on listings, share of listings with a price cut, and share going pending within 21 days.
- Output: 0–100, higher = more seller-favored.
- **Weights and normalization were not verified.**
- It is published for metros, not neighborhoods, so it is of limited use per parcel.

**M1.4 Other leads, not verified this session:**
- Urban Institute household-growth projections `[found]`.
- State housing-needs-assessment guidance, e.g. Oregon OHNA `[found]`.

### 1b. Recommendation for our data

- **CHMA demand is metro-level.** Use it as the county context line, e.g. "HUD estimates the Pittsburgh HMA needs about 10,450 sales and 8,975 rental units by May 2027". It is not a per-parcel input.
- **Show the MVA market type as a categorical label.** Do not put it into a mean. Its letter classes are not ordinal on a single "demand" axis, and Reinvestment Fund publishes no scalar. This matches the open decision already flagged in the pillar spec, §4.
- **The P1 score is a percentile-rank weighted mean** of continuous market-tightness indicators that we already have:
  - lower residential vacancy (USPS)
  - rent growth (ZORI, ZIP)
  - jobs density (block group)
  - optionally, the sales-price trend from county assessment sales, the same source the MVA uses

  Each is percentile-ranked within Allegheny County, the same normalization as EJI and CalEnviroScreen.
- **Say plainly in the UI that no agency publishes a parcel-level "demand score".** This is our composite of market-tightness signals. It is the weakest-precedent pillar.

---

## Pillar 2: Site Feasibility (physical + infrastructure + legal pathway)

### 2a. Standard methods

**M2.1 GIS multi-criteria land suitability: Boolean constraints + weighted linear combination (WLC).** Malczewski (2000) `[read]`.

- WLC decision rule, eq. 3 as printed:
  ```
  V(x_i) = Σ_j w_j v_j(x_i) = Σ_j w_j r_ij ,   with Σ_j w_j = 1
  ```
  Here `v_j` is the value function for attribute `j` and `r_ij` is the attribute transformed to a comparable scale.
- The steps, verbatim sequence:
  1. define attributes
  2. identify the set of feasible alternatives
  3. derive commensurate attribute maps
  4. define the criterion weights
  5. combine by multiplication and addition overlay
  6. rank
- Standardization: "The most often used method is the score range procedure … subtracts the minimum attribute value … and then rescales them by dividing the results by the range. Values of standardized attributes range from 0 to 1."
- **Constraints.** Eastman et al.'s variant multiplies by binary constraint maps. Malczewski's eq. 4:
  ```
  V(x_i) = Σ_j w_j r_ij · Π_k r_ik   (r_ik = 1 feasible, 0 infeasible)
  ```
  Malczewski argues this ordering is incorrect: "The feasible cells (constraints maps) should be generated first, and then a procedure for deriving commensurate criterion maps should be performed." In other words, **min-max over feasible parcels only**.
- **Weights:** direct assignment or pairwise comparison. The latter is Saaty's AHP: "the weights are determined by normalizing the eigenvector associated with the maximum eigenvalue of the (reciprocal) ratio matrix".
- Lineage `[found]`:
  - McHarg (1969), *Design with Nature*: the overlay origin.
  - Saaty (1980), *The Analytic Hierarchy Process*.
  - Malczewski (2004), "GIS-based land-use suitability analysis: a critical overview", *Progress in Planning* 62(1):3–65.
  - Malczewski (2006), "GIS-based multicriteria decision analysis: a survey of the literature", *IJGIS* 20(7):703–726.

**M2.2 Buildable Land Inventory: Oregon OAR 660-008-0005.** Read via oregon.public.law, a republication of the official rule `[read]`.
- "Buildable Land" is "residentially designated land within the urban growth boundary, including both vacant and developed land likely to be redeveloped, that is suitable, available and necessary for residential uses".
- Land is generally unsuitable or unavailable if it is:
  - "severely constrained by natural hazards as determined under Statewide Planning Goal 7"
  - subject to natural resource protection measures (Goals 5, 6, 15–18)
  - on "slopes of 25 percent or greater"
  - "within the 100-year flood plain"
  - unable to be served by public facilities
- "Publicly owned land is generally not considered available."
- The method is **exclusionary**: pass/fail screens, not weights.
- Caveat: Oregon amended its housing rules in 2024–25 (OHNA). Check the current OAR text on the Secretary of State site before quoting it in the product.

**M2.3 California Housing Element sites inventory: Gov. Code §65583.2.** Read via california.public.law `[read]`.
- The inventory must describe, among other items:
  - "(b)(4) A general description of any environmental constraints to the development of housing within the jurisdiction"
  - "(b)(5)(A) A description of existing or planned water, sewer, and other dry utilities supply, including the availability and access to distribution facilities". Parcels "must have sufficient water, sewer, and dry utilities supply available and accessible".
- Capacity is computed from zoning. (c)(1): "If local law or regulations require the development of a site at a minimum density, the department shall accept the planning agency's calculation of the total housing unit capacity on that site based on the established minimum density." (c)(2) then adjusts for land use controls and site improvements.
- Default densities deemed appropriate for lower-income housing:
  - 15 units/acre for nonmetropolitan incorporated cities
  - 20 units/acre for suburban jurisdictions
  - 30 units/acre for metropolitan jurisdictions
- Sites under 0.5 acre or over 10 acre need extra justification.
- The page notes the section's sunset on 31 Dec 2028.
- Method: **legal capacity × infrastructure availability × constraint screen**, not a weighted score.

**M2.4 FEMA NFIP floodplain rules: 44 CFR 60.3.** Via Cornell LII `[read]`.
- (c)(2): new or substantially improved residential structures in Zones A1-30, AE and AH must "have the lowest floor (including basement) elevated to or above the base flood level".
- (d)(3): communities must "Prohibit encroachments, including fill, new construction, substantial improvements, and other development within the adopted regulatory floodway unless it has been demonstrated through hydrologic and hydraulic analyses … that the proposed encroachment would not result in any increase in flood levels".
- This is the regulatory basis for a floodway **gate** (near-prohibition) versus an SFHA **penalty** (allowed, but it costs elevation).

**M2.5 Terner Center feasibility / pro-forma work.** `[found]`, not opened this session. No claims made.

### 2b. Recommendation for our data

Use **M2.1 as the algorithm and M2.2–M2.4 as the published sources of the constraints**:

1. **Constraints first (Boolean or capping gates):**

   | Gate | Rule |
   |---|---|
   | Regulatory floodway | Score capped or infeasible (44 CFR 60.3(d)(3)) |
   | Slope ≥ 25% share of parcel | Unsuitable per OAR 660-008-0005; use a share threshold |
   | Typology not legally permitted by zoning | Infeasible *for that typology* (the §65583.2 logic: capacity comes from zoning) |

2. **Standardize the remaining factors over the feasible set** (Malczewski's correction):
   - landslide susceptibility class
   - undermined areas
   - lead service line status
   - sewer presence
   - SFHA (100-yr) penalty
   - NRI hazard ratings
3. **WLC with open weights.** Default to equal weights; AHP is optional. Report the weights as trade-offs (OECD).
4. **Disclose** that sewer and water *capacity* is not public. We score presence only, which is weaker than the "sufficient supply" test in §65583.2(b)(5)(B).

---

## Pillar 3: Affordability & Displacement

### 3a. Standard methods

**M3.1 HUD cost burden (CHAS).** HUD USER CHAS background page `[read]`.
- "Cost burden – Monthly housing costs (including utilities) exceeding 30% of monthly income."
- "Severe cost burden – Monthly housing costs (including utilities) exceeding 50% of monthly income."
- CHAS counts four housing problems: incomplete kitchen, incomplete plumbing, overcrowding, cost burden.
- The indicator is a **share of households over a threshold**. It is used as-is or percentile-ranked.

**M3.2 CNT Housing + Transportation (H+T) Affordability Index.** CNT, *H+T Index Methods* (Nov 2022) `[read]`.
- Benchmark, verbatim: "By combining this 15 percent level with the 30 percent housing affordability standard, the H+T Index recommends a new view of affordability defined as combined housing and transportation costs consuming no more than 45 percent of household income."
- Housing cost (H): measured from ACS, "selected monthly ownership cost and the gross rent", combined by the relative number of owner and renter households.
- Transportation cost (T), Equation 1:
  ```
  Household T Costs = [C_AO * F_AO(X)] + [C_AU * F_AU(X)] + [C_TU * F_TU(X)]
  ```
  - `C` = cost factor per component.
  - `F` = regression-modeled auto ownership, auto use (VMT) and transit use as functions of 16 built-environment and household variables.
- Household characteristics are fixed at a "Regional Typical Household": regional AMI, average household size and average commuters. That way, variation reflects place only.
- Output: (H+T) ÷ income, compared with 45%.

**M3.3 HUD Location Affordability Index (LAI).** `[read]`, indirectly.
- HUD's AFFH-T documentation says its Low Transportation Cost and Transit Trips indices came from the LAI.
- It also says: "In AFFHT0007, due to lack of reliable source data, no Low Transportation Cost Index is provided."
- **Treat LAI transport estimates as dated.** If we use them, cite the vintage.

**M3.4 Bates (2013) Portland Gentrification & Displacement typology.** Bates, *Gentrification and Displacement Study*, City of Portland BPS, Appendix A `[read]`.

- **Vulnerability score, 0–4, verbatim:** "Census tracts were assigned a 'vulnerability score' between 0 and 4, with a weight of 1 for each of the following that is true":
  - renters > 44.2%
  - communities of color > 26.7%
  - adults 25+ without a bachelor's > 58.2%
  - households ≤ 80% HUD MFI > 47.0%

  "We defined vulnerable tracts as those with a vulnerability score of at least 3 out of 4."
- **Thresholds** are the citywide rate "adjusted by the margin of error (MOE) to the lower bound for a more sensitive cutoff".
- **Demographic change** is met by "at least 3 of the following 4" or a specified 2 of 4:
  - homeowner share
  - white share
  - bachelor's share
  - median household income

  Each is compared with citywide change.
- **Housing market:**
  - The tract median home value ÷ citywide median is placed into quintiles: low/moderate = bottom three, high = top two.
  - Appreciation is placed into quintiles the same way.
  - Tracts are then typed Adjacent, Accelerating or Appreciated.
- **Final:** six types (Susceptible, Early Type 1, Early Type 2, Dynamic, Late, Continued Loss) from combinations of the three designations.
- Bates says the approach follows Freeman (2005), *Urban Affairs Review* `[found]`.

**M3.5 Urban Displacement Project (UDP) typology (Chapple, Zuk et al.).** *The Urban Displacement Replication Project* methodology (Oct 2020), GitHub copy `[read]`.
- **Vulnerable to gentrification** in the base year requires:
  - "Below regional median housing values or rents", and
  - "Two or more of the following":
    - above regional median % low income
    - above regional median % non-white
    - above regional median % renters
    - below regional median % college educated
- **Gentrified** requires, in addition to vulnerability:
  - above-median change in % college educated
  - above-median % change in median income
  - above-median % change in home values or rents ("hot market")
  - for non-urban tracts, an above-median absolute loss of low-income households
- **Income groups:**
  - low < 80% of regional median income; moderate 80–120%; high > 120%
  - a tract is "predominantly" one group at ≥ 55%, otherwise "mixed"
- **Housing-cost change classes:**
  - decreased < −5%
  - marginal −5% to 5%
  - increased > 5% but below the regional median
  - rapid > regional median
- Output: eight or nine categorical types, e.g. Low-Income/Susceptible, Ongoing Displacement, At Risk of Gentrification, Early/Ongoing, Advanced, Becoming Exclusive.
- The code is public: github.com/urban-displacement/displacement-typologies `[read]` (README).
- Origin paper: Chapple & Zuk (2016), "Forewarned: The Use of Neighborhood Early Warning Systems for Gentrification and Displacement", *Cityscape* 18(3) `[found]`, cited in the UDP report.

**M3.6 Reinvestment Fund Displacement Risk Ratio (DRR).** Dowdall, Reinvestment Fund (24 May 2016) `[read]`.
- The DRR "compares changing residential sales prices over time with the inflation-adjusted median income of residents at a fixed starting point". It tests "whether the typical household living there at the outset could afford to buy a home there at a later time".
- "A score over 3.0 is considered unaffordable".
- **The numerator/denominator formula and mortgage assumptions are not on that page.** They are in the Pew Philadelphia report it links, which I did not open. Do not implement the DRR from memory.

### 3b. Recommendation for our data

Keep **two sub-scores**. They answer different questions, and the direction problem in the pillar spec §4 disappears if they are not blended.

**(a) Affordability for a resident (higher = more affordable):**
- The H+T ratio mapped against the published benchmark, e.g. 100 at ≤ 45%, declining above it. The threshold is published; **the slope of any decline is our choice** and must be labeled as such.
- CHAS renter cost-burden and severe-burden shares, percentile-ranked within the county and inverted.

**(b) Displacement pressure (the "Bates/UDP count"):**
- Run the four-part vulnerability count (renters, people of color, no BA, ≤ 80% AMI) against the **Allegheny County median**, as UDP does against the regional median.
- Add a market-pressure flag: above-median rent or value change plus low or moderate value level.
- Publish the type label, not a fake continuous number. If a number is required, report the 0–4 vulnerability count.
- **Race appears only as a UDP/Bates vulnerability criterion that describes existing residents.** It must never lower a parcel's score. Match the "never a penalty" rule in the pillar spec.
- If a DRR is wanted, it can be built from county assessment sales **after** reading the Pew/Reinvestment Fund method report.

---

## Pillar 4: Access to Opportunity

### 4a. Standard methods

**M4.1 CTCAC/HCD Opportunity Map, the method built for siting affordable housing.** *2025 Methodology for Opportunity and High-Poverty & Segregated Area Mapping Tools* (Dec 2024) `[read]`. The 2026 memo `[read]` says: "No methodological updates are proposed for either mapping tool".

- **Scoring, verbatim:** "A neighborhood's score for each economic and educational indicator … is determined by whether it falls above or below the median (50th percentile) tract or block group value within each region. Each indicator that falls above the regional median adds 1 point to the final score."
- **Indicators:**

  | Domain | Indicators |
  |---|---|
  | Economic (4) | % above 200% of poverty; % adults with a BA+; employment rate for ages 20–64; median home value |
  | Education (4) | 4th-grade math proficiency; 4th-grade reading proficiency; HS on-time graduation; % students *not* receiving free/reduced lunch (3-year rolling average) |

- **Environmental penalty:** the mean of four CalEnviroScreen 4.0 site-based percentiles (solid waste, groundwater threats, cleanup sites, hazardous waste). "The top 5% of tracts regionally are flagged … The flagged geographies receive a one point deduction".
- **Categories, verbatim:** "8 or 9 = 'Highest Resource'", "6 or 7 = 'High Resource'", "4 or 5 = 'Moderate Resource'", "3 or lower = 'Low Resource'".
  - Note: the document calls these "nine … indicators", but only the eight economic and education indicators add points. My reading is that the maximum is 8.
- **Exclusions:** "tracts or rural block groups for which more than 2 of the indicators are missing are removed". Also excluded are areas that are ≥ 75% institutionalized, very low density, or ≥ 50% armed forces.
- **Overlay:** "High-Poverty & Segregated". This means ≥ 30% of the population below the federal poverty line **and** racial overrepresentation relative to the county.
- Stated purpose: the map "identifies areas … whose characteristics have been shown by research to be associated with positive economic, educational, and health outcomes for low-income families—particularly long-term outcomes for children".

**M4.2 HUD AFFH opportunity indices.** HUD, *AFFH-T Data Documentation*, AFFHT0007 (Aug 2024) `[read]`. The formulas were read in AFFHT0004 (Nov 2017) `[read]`, which uses the same specification.

- **Jobs Proximity Index (block group), gravity model:**
  ```
  A_i = ( Σ_{j=1..n} E_j / d_ij² ) / ( Σ_{j=1..n} L_j / d_ij² )
  ```
  - "i indexes a given residential block group, and j indexes all n block groups within a CBSA. Distance, d, is measured as 'as the crow flies' … with distances less than 1 mile set equal to 1. E represents the number of jobs in block group j, and L is the number of workers in block group j."
  - "Values are percentile ranked at the CBSA level". An alternative version uses 1/d instead of 1/d².
- **Labor Market Engagement (tract):**
  ```
  LBM_i = [((u_i − μ_u)/σ_u) * −1] + ((l_i − μ_l)/σ_l) + ((b_i − μ_b)/σ_b)
  ```
  where u = unemployment rate, l = labor-force participation rate, b = % with a BA+. The result is national z-scores, then a national percentile rank.
- **Low Poverty:**
  ```
  Pov_i = [((pv_i − μ_pv)/σ_pv) * −1]
  ```
  then a national percentile rank.
- **School Proficiency (block group):**
  ```
  School_i = Σ_{i=1..3} ( s_i / Σ_n s_n ) * [ ½ r_i + ½ m_i ]
  ```
  This is an enrollment-weighted average over up to 3 nearby schools, then a state percentile rank.
- **Environmental Health:**
  ```
  EnvHealth_i = [((c_i − μ_c)/σ_c) + ((r_i − μ_r)/σ_r) + ((n_i − μ_n)/σ_n)] * −1
  ```
  where c, r, n are the air-toxics carcinogenic, respiratory and neurological hazards. The result is a national percentile rank.
- **Low Transportation Cost and Transit Trips:** from the LAI. Not provided in AFFHT0007.

**M4.3 Gravity / potential accessibility (Hansen 1959) and two-step floating catchment (2SFCA).**
- **Hansen potential**, as written in Geurs & van Wee's chapter `[read]` with a negative exponential cost function:
  ```
  A_i = Σ_{j=1..n} D_j e^(−β c_ij)
  ```
  "where A_i is a measure of accessibility in zone i to all opportunities D … c_ij the impedance or costs of travel between i and j, and β the cost sensitivity parameter".
  The chapter credits Hansen (1959) with defining accessibility as "potential of opportunities for interaction". Hansen, W.G. (1959), "How accessibility shapes land use", *J. American Institute of Planners* 25:73–76 `[found]`.
- **2SFCA (Luo & Wang 2003)**, as given in Wang (2012), *Annals AAG*, PMC3547595 `[read]`, Eq. 2:
  ```
  A_i = Σ_{j ∈ {d_ij ≤ d0}} R_j = Σ_{j ∈ {d_ij ≤ d0}} ( S_j / Σ_{k ∈ {d_kj ≤ d0}} P_k )
  ```
- **Generalized form**, Eq. 3:
  ```
  A_i = Σ_j [ S_j f(d_ij) / Σ_k P_k f(d_kj) ]
  ```
  The gravity form, Eq. 1, uses `f(d) = d^−β` (Joseph & Bantock 1982).
- HUD's Jobs Proximity Index is this supply-over-competing-demand gravity form with β = 2, using jobs versus workers.
- Originals `[found]`:
  - Luo, W. & Wang, F. (2003), *Environment and Planning B* 30(6):865–884.
  - Luo, W. & Qi, Y. (2009), E2SFCA, *Health & Place* 15(4):1100–1107.

**M4.4 Walk Score and Transit Score.** walkscore.com methodology pages `[read]`.
- **Walk Score:** "analyzes hundreds of walking routes to nearby amenities".
  - Maximum points for amenities "within a 5 minute walk (.25 miles)". A decay function applies, with "no points given after a 30 minute walk".
  - It adjusts for "population density and road metrics such as block length and intersection density".
  - Bands: 90–100 Walker's Paradise, 70–89, 50–69, 25–49, 0–24.
  - **Category weights and the exact decay curve are not published** on the page (the patent is `[found]`).
- **Transit Score:** "The value of a route is defined as the service level (frequency per week) multiplied by the mode weight".
  - Mode weights: rail 2×, ferry/cable car/other 1.5×, bus 1×.
  - The result is then multiplied by a distance penalty using the Walk Score decay.
  - Routes are summed and log-normalized so that an average of five big-city scores = 100.

**M4.5 EPA National Walkability Index.** EPA, *National Walkability Index Methodology and User Guide* (June 2021) `[read]`. The formula image was rendered and read.
- Each block group gets a 1–20 ranked score (20 national quantiles) for each of 4 Smart Location Database variables.
- Formula:
  ```
  Final National Walkability Index score = (w/3) + (x/3) + (y/6) + (z/6)
  ```
  - w = intersection density
  - x = proximity to transit stops
  - y = employment mix
  - z = employment and household mix
- Bands: 1–5.75 least, 5.76–10.5 below average, 10.51–15.25 above average, 15.26–20 most walkable.
- Weights justified by Ewing & Cervero (2010), footnote 16: the elasticities for the three categories "were all significant and similar in magnitude".

**M4.6 Child Opportunity Index 3.0.** diversitydatakids.org, *COI 3.0 Technical Documentation* (last updated 3 Aug 2026) `[read]`.
- Indicators are "standardized using the common z-score transformation". They are combined into 14 subdomains, then 3 domains (education; health & environment; social & economic), then one overall index.
- **Weights come from outcomes, not judgment.** From a bivariate OLS of an outcome index on each standardized indicator:
  - Outcome index: Opportunity Atlas income rank, probability of living in a low-poverty tract, and PLACES mental and physical health.
  - Weight processing: bottom-code at 0.05; shrink when max/min > c = 5 using `m = β_max − (c × β_min)/(c − 1)` as printed; then "rescaling so that they sum to one within each subdomain".
- Missing indicators: the weights are "rescaled to sum up to one" over the available indicators.
- Output: Child Opportunity Scores 1–100 (percentile groups) and 5 Levels. Versions are nationally, state- and metro-normed.
- COI 3.0-2024 point-density indicators use a distance weight that is "constant within two miles (=1) and then declines linearly to a minimum of 0.2 at the 20-mile" limit.

**M4.7 Kirwan Institute opportunity mapping** `[found]`, not opened this session. No method claims are made here.

### 4b. Recommendation for our data

Our access inputs are parcel-level distances to points of interest, plus block-group jobs.

1. **Parcel access sub-score (Walk Score / Hansen pattern):**
   ```
   access_parcel = Σ_categories w_c · decay(d_nearest,c)
   ```
   - Use the Walk Score rule: full credit ≤ 0.25 mi (400 m), zero at a 30-minute walk. The existing spec uses 2,400 m.
   - **Our category weights are our choice.** Walk Score does not publish its weights.
   - For transit, use the Transit Score form: Σ over routes of frequency × mode weight (rail 2×) × distance decay.
2. **Jobs access:** compute HUD's **Jobs Proximity gravity** exactly as published: `A_i = Σ(E_j/d²)/Σ(L_j/d²)`, from LEHD WAC (E) and RAC (L) at block groups, with d < 1 mi set to 1. Percentile-rank it within the Pittsburgh CBSA, as HUD does. This one is directly citable and reproducible.
3. **Optional area-opportunity layer (the CTCAC/HCD method).** For Allegheny block groups or tracts, give +1 point for each of these above the **county median**:
   - % above 200% poverty
   - % BA+
   - employment rate for ages 20–64
   - median home value
   - school proficiency (if PA data exist)

   Subtract 1 if the tract is in the county's top 5% environmental burden. Report the resulting category, not a percentile.

   This is the only method in this file built specifically for **siting affordable family housing**. Its median-split design is robust to noisy ACS estimates.
4. **Combine 1 and 2** (optionally 3) as a weighted mean of percentiles, with open weights.

---

## Pillar 5: Climate & Environment

### 5a. Standard methods

**M5.1 CalEnviroScreen 4.0 (OEHHA, Oct 2021).** `[read]`, report PDF.
- Steps, verbatim sequence:
  - "First, the percentiles for all the individual indicators in a component are averaged. This becomes the score for that component."
  - "the Environmental Effects score was weighted half as much as the Exposures score."
  - "The Population Characteristics score is the average of the Sensitive Population score and Socioeconomic Factors score."
  - "Each average was divided by the maximum value observed in the state and then multiplied by 10."
  - "The overall CalEnviroScreen score is calculated by multiplying the Pollution Burden and Population Characteristics scores. Since each group has a maximum score of 10, the maximum CalEnviroScreen Score is 100." Tracts are then percentile-ranked.
- Written as a formula (my transcription of the prose):
  ```
  PollutionBurden = (Exposures + 0.5·EnvEffects) / 1.5 ,  scaled to max 10
  PopChar         = (Sensitive + Socioeconomic) / 2 ,    scaled to max 10
  CES             = PollutionBurden × PopChar          (0–100)
  ```
  The ÷1.5 is my reading of "weighted half as much", so it is not a quote. The report's worked example should be checked before coding.
- The rationale for multiplication is Risk = Threat × Vulnerability, with population characteristics as "effect modifiers".

**M5.2 CDC/ATSDR Environmental Justice Index 2024.** *EJI 2024 Technical Documentation* `[read]`.
- Ranking method, verbatim: "Percentile ranks for all individual indicators in each module were summed, producing a module score. Module scores were then ranked, producing a module ranking between 0-1".
- Overall score:
  ```
  SVM rank (0–1) + EBM rank (0–1) + HVM flag score (0–1)  = Overall EJI Score (0–3) → percentile rank → Final EJI (0–1)
  ```
- HVM: "multiplying the sum of Health Vulnerability flags (n = 5) by 0.2". A flag is the top tertile.
- "Due to a lack of scientific evidence supporting a specific weighting scheme, all modules are weighted equally".
- The optional **EJI + Climate Burden** adds a Climate Burden Module (heat, extreme events, wildfire), built as a percentile-ranked sum, to the three.
- The **Social-Environmental Ranking (SER)** = SVM + EBM only.

**M5.3 FEMA National Risk Index.**
- Sources: NRI *Methodology and Hazards Overview* (Dec 2025) `[read]`, and NRI *Technical Documentation* (Mar 2023), ch. 3, read from a copy hosted at missionknox.org `[read]`. The v1.20 technical documentation (Dec 2025) is `[found]`; FEMA's server blocked automated download.
- Formula, verbatim:
  ```
  Risk = Expected Annual Loss × Community Risk Factor ,  where Community Risk Factor = f(Social Vulnerability / Community Resilience)
  ```
- "Expected Annual Loss is calculated using a multiplicative equation that includes exposure, annualized frequency, and historic loss ratio risk factors for 18 natural hazards".
- `Annualized Frequency = Number of Recorded Events or Event-Days / Period of Record`.
- Population loss is monetized at "$13.7 million" per fatality or ten injuries (Dec 2025 VSL).
- Scores: "national percentile ranking … (rounded to the nearest hundredth)".
- Risk and EAL **ratings** use k-means with 5 clusters (scikit-learn, n_init 20, random_state 42). SV and CR ratings use quintiles.
- **The exact transform f(·) is in §4.3, which I did not retrieve. It is not quoted here.**

**M5.4 EPA Air Quality Index (40 CFR Part 58, App. G).** Via Cornell LII `[read]`.
- Formula:
  ```
  I_p = ((I_Hi − I_Lo)/(BP_Hi − BP_Lo)) × (C_p − BP_Lo) + I_Lo
  ```
- "The reported AQI corresponds to the pollutant with the highest calculated AQI". This is a **max** aggregation, not a mean.
- The 2024 PM2.5 revision moved the Good/Moderate breakpoint to 9.0 µg/m³ `[skimmed]`. The breakpoint table on the LII page did not extract cleanly, so no table is reproduced here.
- The AQI is for **daily reporting**. It is not a long-term exposure metric.

**M5.5 Transportation carbon via VMT elasticities.**
- Ewing & Cervero (2010), "Travel and the Built Environment: A Meta-Analysis", *JAPA* 76(3):265–294 `[skimmed]`. The values below are as reported in Boarnet et al. (2011), ch. 7 of Lincoln Institute's *Climate Change and Land Policies* `[read]`:
  - meta-analyses "found elasticities of VMT with respect to population density and land use mix in the range of −0.04 to −0.09 and an elasticity of VMT with respect to regional access to jobs in the range of −0.20 to −0.22"
  - "the VMT elasticity of the street network … is −0.12"
- Implication: **regional job accessibility is the strongest built-environment predictor of household VMT**. Modeled household VMT (H+T / LAI) already embeds these relationships, so it is the defensible carbon proxy.

**M5.6 Heat Vulnerability Index.** Reid et al. (2009), *Environmental Health Perspectives* 117(11):1730–1736, PMC2801183 `[read]`.
- Factor analysis of 10 variables gives 4 factors:
  - social/environmental vulnerability
  - social isolation
  - no AC
  - elderly/diabetes
- "we divided each factor into six categories based on standard deviations … with 1 corresponding to the lowest vulnerability and 6 to the highest"
- "summed the assigned factor values for the four factors"

**M5.7 Embodied carbon by typology.**
- Carbon Leadership Forum, *The Embodied Carbon Benchmark Report* (Benke, Jensen, Lewis, Chafart, Simonen; April 2025), 292 buildings `[read]` (landing page only).
- A search snippet gives the multifamily median as 390 kgCO2e/m² (A–C) `[skimmed]`. **That value is not verified** and is not used here until the PDF is read.
- This belongs to typology comparison, not the parcel score (see the existing spec).

### 5b. Recommendation for our data

- **Use the EJI construction:** sum of indicator percentiles within a module → percentile-rank → equal-weight modules. It is the most transparent published rule and is fully percentile-based. It fits our block-group and tract layers. Modules:

  | Module | Contents |
  |---|---|
  | Air | PM2.5; the traffic-combustion trio averaged first; RSEI air toxics |
  | Local hazard sites | the CalEnviroScreen / CTCAC four-indicator pattern, if we have site data |
  | Climate hazard | NRI heat-wave, inland-flood and winter **ratings or scores**, not EAL dollars |
  | Transport carbon | modeled household VMT, lower = better, justified by Ewing & Cervero |

- **Invert** so that 100 = cleaner, safer and lower carbon.
- **Add a CTCAC-style penalty:** parcels in the county's **top 5%** of the combined burden get a visible flag and a fixed deduction. This follows CTCAC's reasoning that environmental data should matter most "when environmental burden is most severe".
- **Do not multiply by population vulnerability, as CalEnviroScreen does.** CES answers "which *community* is most burdened". Our pillar answers "what will a *future resident* be exposed to". Social vulnerability already sits in P3. Multiplying it in here would double-count and would lower scores in low-income areas for demographic reasons.
- **Use NRI ratings or percentile scores, not EAL.** EAL scales with building value, as the NRI docs say ("dollar value of the buildings … exposed").

---

## Full citation list

### Cross-cutting
- OECD & EC-JRC (2008). *Handbook on Constructing Composite Indicators: Methodology and User Guide.* https://www.oecd.org/content/dam/oecd/en/publications/reports/2008/08/handbook-on-constructing-composite-indicators-methodology-and-user-guide_g1gh9301/9789264043466-en.pdf `[read]`

### Pillar 1: Demand
- HUD PD&R (2024). *Comprehensive Housing Market Analysis: Pittsburgh, Pennsylvania*, as of May 1, 2024. https://www.huduser.gov/portal/publications/pdf/PittsburghPA-CHMA-24.pdf `[read]`
- Reinvestment Fund (2021). *Allegheny County and City of Pittsburgh Market Value Analysis (MVA): Executive Summary.* https://www.alleghenycounty.us/files/assets/county/v/1/government/economic-development/documents/housing/2021-mva-executive-summary.pdf `[read]`
- Reinvestment Fund. *Market Value Analysis* (method page). https://www.reinvestment.com/policy-solutions/market-value-analysis/ `[read]`
- WPRDC. *Housing Market Value Analysis 2021* (dataset). https://data.wprdc.org/dataset/market-value-analysis-2021 `[found]`
- Zillow Research. *Market Heat Index Methodology.* https://www.zillow.com/research/market-heat-index-methodology-34057/ `[skimmed]` (403 on fetch)

### Pillar 2: Site Feasibility
- Malczewski, J. (2000). "On the Use of Weighted Linear Combination Method in GIS: Common and Best Practice Approaches." *Transactions in GIS* 4(1):5–22. http://www.yorku.ca/gis/es7189/docs/malczewski00.pdf `[read]`
- Malczewski, J. (2004). "GIS-based land-use suitability analysis: a critical overview." *Progress in Planning* 62(1):3–65. `[found]`
- Malczewski, J. (2006). "GIS-based multicriteria decision analysis: a survey of the literature." *IJGIS* 20(7):703–726. `[found]`
- McHarg, I. (1969). *Design with Nature.* Natural History Press. `[found]`
- Saaty, T.L. (1980). *The Analytic Hierarchy Process.* McGraw-Hill. `[found]`
- Oregon Administrative Rules 660-008-0005 (Definitions). https://oregon.public.law/rules/oar_660-008-0005 `[read]` (republication; verify against the current official OAR)
- California Government Code §65583.2. https://california.public.law/codes/government_code_section_65583.2 `[read]` (official: https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=GOV&sectionNum=65583.2 `[found]`, which did not render)
- 44 CFR §60.3, Flood plain management criteria. https://www.law.cornell.edu/cfr/text/44/60.3 `[read]`

### Pillar 3: Affordability & Displacement
- HUD USER. *CHAS: Background.* https://www.huduser.gov/portal/datasets/cp/CHAS/bg_chas.html `[read]`
- Center for Neighborhood Technology (2022). *H+T Index Methods*, November 2022. https://htaindex.cnt.org/about/method-2022.pdf `[read]`
- Bates, L.K. (2013). *Gentrification and Displacement Study: Implementing an Equitable Inclusive Development Strategy in the Context of Gentrification.* City of Portland BPS. https://www.portland.gov/bps/planning/adap/documents/2013-gentrification-and-displacement-study/download `[read]`
- City of Portland BPS (2018). *Gentrification and Displacement Neighborhood Typology Assessment.* https://www.portland.gov/sites/default/files/2020-01/gentrification_displacement_typology_analysis_2018_10222018.pdf `[found]` (downloaded; not read)
- Urban Displacement Project (2020). *The Urban Displacement Replication Project* (methodology, Oct 16 2020). https://github.com/urban-displacement/displacement-typologies/raw/main/.assets/udp_replication_project_methodology_10.16.2020-converted.pdf `[read]`
- Thomas, T., et al. *urban-displacement/displacement-typologies* (Release 1.1). doi:10.5281/zenodo.4356684. https://github.com/urban-displacement/displacement-typologies `[read]` (README)
- Chapple, K. & Zuk, M. (2016). "Forewarned: The Use of Neighborhood Early Warning Systems for Gentrification and Displacement." *Cityscape* 18(3). `[found]`
- Freeman, L. (2005). "Displacement or Succession? Residential Mobility in Gentrifying Neighborhoods." *Urban Affairs Review* 40(4). `[found]`
- Dowdall, E. (2016). "Measuring displacement risk in gentrifying neighborhoods." Reinvestment Fund. https://www.reinvestment.com/insights/measuring-displacement-risk-in-gentrifying-neighborhoods/ `[read]`

### Pillar 4: Access to Opportunity
- CTCAC/HCD (Dec 2024). *2025 Methodology for Opportunity and High-Poverty & Segregated Area Mapping Tools.* https://www.treasurer.ca.gov/ctcac/opportunity/2025/opportunity-map-methodology.pdf `[read]`
- CTCAC (Oct 20 2025). *CTCAC-HCD 2026 Opportunity Map Memo.* https://www.treasurer.ca.gov/CTCAC/opportunity/2026/CTCAC-HCD-2026-Opportunity-Map-Memo-10-20-25.pdf `[read]`
- HUD (2024). *AFFH-T Data Documentation, Data Version AFFHT0007*, August 2024. https://docs.huduser.gov/archives/sites/default/files/datasets/affh/AFFH-T-Data-Documentation-AFFHT0007-August-2024.pdf `[read]`
- HUD (2017). *AFFH-T Data Documentation, AFFHT0004*, November 2017 (text-extractable formulas). https://docs.huduser.gov/archives/sites/default/files/datasets/affh/AFFH-T-Data-Documentation-AFFHT0004-November-2017.pdf `[read]`
- Geurs, K. & van Wee, B. "Accessibility: perspectives, measures and applications" (book chapter 9, Edward Elgar). https://ris.utwente.nl/ws/portalfiles/portal/331101214/Geurs-accessibility.pdf `[read]`
- Hansen, W.G. (1959). "How accessibility shapes land use." *J. American Institute of Planners* 25:73–76. `[found]`
- Wang, F. (2012). "Measurement, Optimization, and Impact of Health Care Accessibility: A Methodological Review." *Annals of the AAG* 102(5). https://pmc.ncbi.nlm.nih.gov/articles/PMC3547595/ `[read]`
- Luo, W. & Wang, F. (2003). "Measures of spatial accessibility to health care in a GIS environment." *Environment and Planning B* 30(6):865–884. `[found]`
- Luo, W. & Qi, Y. (2009). "An enhanced two-step floating catchment area (E2SFCA) method." *Health & Place* 15(4):1100–1107. `[found]`
- Walk Score. *Walk Score Methodology.* https://www.walkscore.com/methodology.shtml `[read]`
- Walk Score. *Transit Score Methodology.* https://www.walkscore.com/transit-score-methodology.shtml `[read]`
- US EPA (2021). *National Walkability Index: Methodology and User Guide*, June 2021. https://www.epa.gov/sites/default/files/2021-06/documents/national_walkability_index_methodology_and_user_guide_june2021.pdf `[read]`
- diversitydatakids.org (2026). *Child Opportunity Index 3.0 Technical Documentation*, updated Aug 3 2026. https://www.diversitydatakids.org/sites/default/files/file/COI%203.0%20Technical%20Documentation%2020260803_0.pdf `[read]`

### Pillar 5: Climate & Environment
- OEHHA (2021). *CalEnviroScreen 4.0* report. https://oehha.ca.gov/sites/default/files/media/downloads/calenviroscreen/report/calenviroscreen40reportf2021.pdf `[read]`
- CDC/ATSDR (2024). *Technical Documentation for the 2024 Environmental Justice Index.* https://www.atsdr.cdc.gov/place-health/media/pdfs/2024/10/EJI_2024_Technical_Documentation.pdf `[read]`
- FEMA (Dec 2025). *National Risk Index Data: Methodology and Hazards Overview.* https://www.fema.gov/sites/default/files/documents/fema_national-risk-index_methodology-hazards-overview.pdf `[read]`
- FEMA (Mar 2023). *National Risk Index Technical Documentation*, ch. 3 (copy hosted by a third party). https://missionknox.org/wp-content/uploads/2025/05/Appendix_4.3-FEMA_Scoring_Matrix-1.pdf `[read]`
- FEMA (Dec 2025). *National Risk Index Data Technical Documentation v1.20.* https://www.fema.gov/sites/default/files/documents/fema_national-risk-index_technical-documentation.pdf `[found]` (blocked or too large)
- 40 CFR Part 58, Appendix G: Uniform Air Quality Index. https://www.law.cornell.edu/cfr/text/40/appendix-G_to_part_58 `[read]`
- US EPA. *Technical Assistance Document for the Reporting of Daily Air Quality – the AQI.* https://www.airnow.gov/publications/air-quality-index/technical-assistance-document-for-reporting-the-daily-aqi/ `[found]` (DNS failure)
- Ewing, R. & Cervero, R. (2010). "Travel and the Built Environment: A Meta-Analysis." *JAPA* 76(3):265–294. https://www.tandfonline.com/doi/full/10.1080/01944361003766766 `[skimmed]`
- Boarnet, M.G., Houston, D., Ferguson, G. & Spears, S. (2011). "Land Use and Vehicle Miles of Travel in the Climate Change Debate." In Ingram & Hong (eds.), *Climate Change and Land Policies*, Lincoln Institute. https://www.lincolninst.edu/app/uploads/legacy-files/pubfiles/2038_1360_LP2010-ch07-Land-Use-and-Vehicle-Miles-of-Travel-in-the-Climate-Change-Debate_0.pdf `[read]`
- Reid, C.E., et al. (2009). "Mapping Community Determinants of Heat Vulnerability." *EHP* 117(11):1730–1736. https://pmc.ncbi.nlm.nih.gov/articles/PMC2801183/ `[read]`
- Benke, B., Jensen, A., Lewis, M., Chafart, M. & Simonen, K. (2025). *The Embodied Carbon Benchmark Report.* Carbon Leadership Forum. https://carbonleadershipforum.org/the-embodied-carbon-benchmark-report/ `[read]` (landing page only; values `[skimmed]`)

## Gaps and things not verified

- **NRI Community Risk Factor transform f(·)** (Tech Doc §4.3): not retrieved.
- **MVA clustering algorithm:** not stated in the Pittsburgh summary.
- **Walk Score category weights and decay curve:** not published on the page.
- **Reinvestment Fund DRR formula:** it is in the Pew Philadelphia report, which was not opened.
- **CLF multifamily embodied-carbon value:** not verified.
- **Zillow Heat Index weights:** the page returned 403.
- **Terner Center feasibility work and Urban Institute demand projections:** not opened. No claims are made about them.
- **Kirwan opportunity-mapping method:** not opened.
