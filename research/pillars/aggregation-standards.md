# Aggregating indicators into pillars, and pillars into one score: the standards

Research date: 2026-09-26. Scope: how to build the five 0–100 parcel pillars (Demand, Site Feasibility, Affordability & Displacement, Access to Opportunity, Climate & Environment) and, if we want one, a single overall number, using methods we can cite, with weights that users can change.

Access tags: **[read]** = I fetched and read the primary source (for PDFs, the extracted text). **[skimmed]** = abstract, snippet, secondary summary, or a machine summary of the page. **[found]** = located but not opened. Formulas are only given where a source I read or skimmed states them. Where something is my own derivation or design proposal, it says so.

---

## TL;DR recommendations

**(a) Indicators inside a pillar.** Put every indicator on the same direction ("higher = better for a future resident") and the same 0–100 scale. Use percentile rank across Allegheny County, which the CEJST uses and explains, or min–max with winsorised tails. Never add raw units: that mistake reduced the ADI to "a weighted average of just 2 measures", with home value and income making up 98.8% of the score (Petterson 2023). Combine indicators with a **weighted arithmetic mean** and equal default weights, the way the OECD Better Life Index does. Indicators in one pillar are meant to be interchangeable proxies for one concept, so letting one offset another is intended there. Before shipping, run the JRC coherence check. An indicator that correlates with its pillar above 0.95 dominates it. One between −0.3 and 0.3 is barely represented. One below −0.3 pulls against it. Also make sure no variable appears in two pillars, since that counts it twice (OECD Handbook, §1.6).

**(b) The single overall number.** Always show the five pillar scores first, and label the overall number as one opinion about how to combine them. The OECD Better Life Index gives no default ranking at all ("Which country is #1? That's up to you!"). If we show an overall number:
- **Default: weighted geometric mean** of the pillars, with the arithmetic mean as a switch. The pillars are conceptually different areas: market demand, physical hazard, displacement risk. The OECD Handbook says full compensation is inappropriate when "highly different dimensions are aggregated". The HDI moved from arithmetic to geometric in 2010 for exactly this reason. The JRC's audit of the Global Innovation Index uses geometric-versus-arithmetic as a standard robustness test.
- The geometric mean needs a documented floor, because a 0 in any pillar sends the product to 0. The current code floors at 1 on the 0–100 scale.
- Caveat: percentile scores are ordinal, not ratio-scale. Ebert & Welsch (cited in the Handbook) show geometric aggregation is only strictly meaningful for positive ratio-scale data. So treat geometric-on-percentiles as a *policy choice* (penalise lopsided parcels), not as something measurement theory proves.
- The current `pillars.config.json` defaults to arithmetic. **Which default to use is a team decision.** Both are standard. What the standards require is that we state which one we use and why, and report how much the ranking changes when the other is used.

**(c) Hard constraints do not go into the weighted average.** Things that make a parcel unbuildable or legally excluded (for example a floodway, or a parcel that is not developable) should work as **Boolean masks or flags applied outside the weighted sum**. This is the "constraints vs. factors" split in GIS multicriteria evaluation (Eastman et al. 1995), and the "meets a threshold → flagged" logic of the CEJST. A strong Demand score must never be able to cancel a hard hazard. Soft hazards (graded exposure) stay inside the Climate pillar as normal indicators. The current code caps a pillar's score when a gate trips, which is a partially non-compensatory middle ground. That is defensible if it is documented, but the flag should also be shown on its own.

**(d) User-edited weights.** Copy the Better Life Index mechanism exactly, because OECD documents it:
- Each pillar gets a 0–5 importance rating. Weight = rating ÷ sum of ratings. Show the resulting percentage next to every slider.
- The default is equal weights, with the BLI's disclaimer that the defaults "do not represent [our] view on the relative importance".
- Named presets are fine if each one is labelled as a value judgement.
- Show each pillar's **actual contribution** to a parcel's overall score, not just its nominal weight. Paruolo, Saisana & Saltelli (2013) show that nominal weights and real importance "are very different" when indicators are correlated.
- Put the weights in the URL so a weighting can be shared and reproduced.

**(e) Sensitivity and uncertainty to show.**
1. **Per parcel:** the median and a p10–p90 (or p5–p95) band of the overall score *and of its county rank percentile*. Compute these over Monte Carlo draws of the weights centred on the user's weights. This is the same approach as the JRC audits: 4,000 draws, reporting median rank and a 90% interval.
2. **Per parcel, SMAA-style:** "in X% of plausible weightings this parcel is in the top 10%". This is a rank acceptability index (Lahdelma & Salminen 2001).
3. **Whole map:** the average rank shift R_S, or a Spearman correlation, between arithmetic and geometric aggregation and between presets (OECD Handbook eq. 38).
4. Map or flag parcels whose top-decile status is fragile. The National Academies' EJ-tools report recommends geographically mapping uncertainty in this way [skimmed].

Two ways to draw the weights:
- A **Dirichlet centred on the user's weights**, which is what `score.ts` does. The Dirichlet form is my design choice, not something taken from a source.
- **Uniform over the whole weight simplex.** This is SMAA's "no preference information" case, generated by sorting n−1 uniform random numbers (Tervonen 2008). It answers "is this parcel good under almost any weighting?"

For calibration, the JRC GII audit perturbed weights of 0.2 as U[0.1, 0.3], which has a standard deviation of about 0.058. My own derivation: a Dirichlet with total concentration α₀ gives a 0.2 weight a standard deviation of √(0.16/(α₀+1)). α₀ = 20 (the current code) gives about 0.087. Matching the GII spread needs α₀ ≈ 47. Choose α₀ on purpose and document it.

---

## 1. OECD/JRC Handbook on Constructing Composite Indicators (2008) and JRC COIN guidance

### 1.1 The 10-step checklist
The Handbook, Table 1 "Checklist for building a composite indicator" [read]:
1. Theoretical framework
2. Data selection
3. Imputation of missing data
4. Multivariate analysis
5. Normalisation
6. Weighting and aggregation
7. Uncertainty and sensitivity analysis
8. Back to the data
9. Links to other indicators
10. Visualisation of the results

The JRC COIN *10-Step Pocket Guide* [read] reorders the list slightly:
1. Define the concept
2. Select indicators
3. Analyse/treat data
4. Normalise
5. Weight
6. Aggregate
7. Statistical and conceptual coherence
8. Impact of uncertainties
9. Make sense of the data
10. Visualise

It adds rules of thumb:
- "5-7 indicators per dimension is a good practice. A minimum of 3 indicators by dimension is acceptable."
- "Aim for at least 65% of data coverage."
- Treat outliers if "absolute skewness > 2.0 and kurtosis > 3.5" or "kurtosis is very high > 10". Winsorisation is suggested.
- Coherence: an indicator may "dominate the framework: correlation > 0.95", is "under-represented: -0.3 < correlation < 0.3", or is "negatively related to the composite indicator: correlation < -0.3". Also check for bias, such as "a strong correlation with population (>0.6)".
- Uncertainty: "Provide the full ranks and index scores with confidence intervals."
- Aggregation: "Consider whether compensability among indicators should be allowed, i.e. a deficit in one indicator can be compensated by a surplus in another."

### 1.2 Normalisation options (Handbook §1.5, Table 3) [read]
- **Ranking**: "not affected by outliers … information on levels is lost."
- **Standardisation (z-scores)**: I = (x − mean)/σ. "Indicators with extreme values thus have a greater effect on the composite indicator."
- **Min–Max**: I = (x − min)/(max − min). "extreme values/or outliers could distort the transformed indicator … Min-Max normalisation could widen the range of indicators lying within a small interval."
- **Distance to a reference**, **categorical scales** (percentile bands), **above/below the mean**, cyclical indicators, and percentage differences over years.
- "The normalisation method should take into account the data properties, as well as the objectives of the composite indicator. Robustness tests might be needed to assess their impact on the outcomes."

### 1.3 Weighting (Handbook §1.6) [read]
- "Regardless of which method is used, weights are essentially value judgements." This backs the brief's requirement to separate evidence from judgement.
- "Equal weighting does not mean 'no weights', but implicitly implies that the weights are equal." Also: "if variables are grouped into dimensions … applying equal weighting to the variables may imply an unequal weighting of the dimension (the dimensions grouping the larger number of variables will have higher weight)." → **Weight pillars directly. Do not let a pillar's weight come from how many indicators it has.**
- Double counting: "if two collinear indicators are included in the composite index with a weight of w1 and w2, the unique dimension that the two indicators measure would have weight (w1 + w2)." The Handbook also warns that correlation alone does not settle redundancy. Judge it by concept too.
- Participatory methods: budget allocation "is optimal for a maximum of 10-12 indicators", because more than that causes "serious cognitive stress". Five pillars is well inside that.
- Table 4 footnote 4: "With both linear and geometric aggregations weights are trade-offs and not 'importance' coefficients."

### 1.4 Aggregation (Handbook §1.6, §6.10–6.14) [read]
- **Linear:** CI_c = Σ_q w_q I_qc with Σ w_q = 1 and 0 ≤ w_q ≤ 1 (eq. 31). It needs **mutual preferential independence**, which the Handbook calls "a very strong condition". Linear aggregation assumes "there are no synergies or conflicts" between dimensions.
- **Geometric:** CI_c = Π_q x_qc^{w_q}. The Handbook calls it "an in-between solution" between full and no compensability. Worked example: profiles (21,1,1,1) and (6,6,6,6) tie at 6 under an equal-weight arithmetic mean, but score 2.14 vs 6 under the geometric mean. "in a linear aggregation, the compensability is constant, while with geometric aggregations compensability is lower for the composite indicators with low values." A unit that scores low somewhere "would have a greater incentive to address those sectors … with low scores if the aggregation were geometric."
- **Non-compensatory multi-criteria (NCMC/Condorcet-type):** "To ensure that weights remain a measure of importance, other aggregation methods should be used … if different goals are equally legitimate and important, a non-compensatory logic might be necessary. This is usually the case when highly different dimensions are aggregated … If the analyst decides that an increase in economic performance cannot compensate for a loss in social cohesion or a worsening in environmental sustainability, then neither the linear nor the geometric aggregation is suitable." The cost: "computationally costly when the number of countries is high, as the number of permutations … increases exponentially."
- **Scale meaningfulness (Ebert & Welsch 2004, as summarised in §6.14):** linear aggregation is meaningful for interval-scale data on a comparable scale. Data "measured on a ratio scale … can only be meaningfully aggregated by using geometric functions, provided that x is strictly positive."

### 1.5 Uncertainty and sensitivity (Handbook §1.7, ch. 7) [read]
- Things to vary: "Inclusion and exclusion of individual indicators … alternative data normalisation schemes … different weighting schemes … different aggregation systems … different plausible values for the weights."
- "The results of the robustness analysis are generally reported as country rankings with their related uncertainty bounds."
- Method: "a single Monte Carlo experiment … exploring all uncertainty sources simultaneously." Outputs are Rank(CI_c) for each unit, and the **average shift in ranks**:
  R_S = (1/M) Σ_c |Rank_ref(CI_c) − Rank(CI_c)| (eq. 38).
  Variance-based (Sobol') first-order and total sensitivity indices then attribute the output variance to each choice. The TAI case study shows each country's median rank with 5th–95th percentile bounds.

### 1.6 A JRC audit in practice: the Global Innovation Index 2023 [read]
- "The Monte Carlo simulation comprised 4,000 runs of different sets of weights for the seven GII pillars. Weights were assigned to the pillars based on random perturbations centered on the reference values." Input pillars (reference 0.2) were drawn from U[0.1,0.3]. Output pillars (reference 0.5) were drawn from U[0.4,0.6].
- Other uncertain factors were imputation (none vs EM) and the aggregation formula (arithmetic vs geometric at the pillar level). They are toggled at random in each run.
- Geometric is described as "a partially compensatory approach that rewards economies with balanced profiles and motivates economies to improve in the GII pillars in which they perform poorly, and not just in any GII pillar."
- Reporting: "median ranks and 90 percent confidence intervals computed across the 4,000 Monte Carlo simulations". The audit also reports how many units shift more than a given number of positions, for example "a shift of 10 or fewer positions for 89 of the 132 economies". For efficiency ratios it concluded they "have to be approached with care" because the intervals were "too wide to allow meaningful inferences".

**What we take from this.** The 10 steps are a checklist our methodology page can follow heading by heading. The two decisions the standards insist we state openly are **compensability** and **weights**. The JRC audit gives a concrete sensitivity design we can copy: weights perturbed around a reference, arithmetic vs geometric toggled, then median plus a 90% interval.

---

## 2. UN Human Development Index: the 2010 arithmetic → geometric switch

**Formula (HDR 2023/24 Technical Note 1) [read]:**
- Dimension index = (actual − min) / (max − min). The goalposts are:
  - life expectancy: 20–85
  - expected years of schooling: 0–18
  - mean years of schooling: 0–15
  - GNI per capita (2017 PPP$): 100–75,000
- The education index is the *arithmetic* mean of its two sub-indices. That "allows perfect substitutability between expected years of schooling and mean years of schooling".
- Income uses natural logs: (ln x − ln 100)/(ln 75,000 − ln 100), because the move from income to capabilities "is likely to be concave".
- **HDI = (I_Health · I_Education · I_Income)^{1/3}.** Worked example, Nigeria 2022: (0.517 · 0.545 · 0.583)^{1/3} = 0.548.

The structure is the same as ours. Inside a dimension, sub-indicators are averaged arithmetically because they are substitutes. Across dimensions, the mean is geometric because the dimensions are not substitutes.

**Why they switched (Klugman, Rodríguez & Choi 2011, UNDP HDRP 2011/01) [read]:**
- "The shift to the geometric mean addresses the issue of perfect substitutability … This was a problematic assumption of the old formula, because it implied that the level of priority to be given to a dimension was invariant to the level of attainments."
- "The implied elasticity of substitution of 1 in the geometric mean lies between the extremes of 0 for the Leontief function and infinity for the linear formula of the old HDI."
- The geometric mean also makes rankings "invariant to the scale in which each variable is measured".
- The known downside: "if any of the indicators is at the minimum, then the value of the whole index collapses to zero", so the minima (the "natural zeros") must be chosen carefully.
- Criticism: Ravallion (2010b, "Troubling Tradeoffs in the Human Development Index", World Bank Policy Research WP) [found, via Klugman et al.] argued that the implied trade-off between longevity and income varies hugely across countries, from $0.53 per year of life in Zimbabwe to about $9,000 in the richest countries. Klugman et al. rebut this.

**What we take from this.** The HDI is the most-cited precedent for a geometric mean across dimensions. Its zero-collapse problem applies directly to us: percentile scores reach 0 by construction, so we need a documented floor. The current code uses `max(score, 1)`. The Ravallion debate is a reminder that any aggregation formula has hidden trade-off rates. Showing contributions and sensitivity is how we make them visible.

---

## 3. Precedents for user-set weights

### 3.1 OECD Better Life Index [read, archived FAQ, Jan 2023 snapshot; the live oecd.org page returned 403]
- "The OECD has not assigned rankings to countries. Instead, Your Better Life Index is designed to let you, the user, investigate how each of the 11 topics can contribute to well-being."
- **Weights:** "users have to rate each topic from 0 ('not important') to 5 ('very important'). The score given to each topic is converted into a weight, by dividing the grade given to each topic by the sum of the grades given to all topics." The worked example uses ratings of 5, 5, 3×9: the weights come out as 5/37 ≈ 13.5% and 3/37 ≈ 8.1%.
- **Default:** "these weights have been set equal … These default weights do not represent the OECD's view on the relative importance of each topic."
- **Normalisation:** min–max to 0 (worst) to 1 (best), with 1 − (…) for negative indicators.
- **Within-topic aggregation:** "After normalisation, indicators are averaged with equal weights."
- **Display:** each country is drawn as a "flower" whose petals are topics. Submitted indexes go into "a publicly accessible database", so users can compare their weights with others'.

### 3.2 AARP Livability Index [skimmed]
- The index has 7 categories and 61 indicators (40 metrics, 21 policies).
- Scores are relative: "We score neighborhoods by comparing them to one another, so the average neighborhood gets a score of 50." They run 0–100.
- Users can customise, "allowing users to customize their scores, which may impact the overall score based on what the user thinks is more or less important".
- Secondary pages say the total is the average of the seven category scores.
- I did not find the metric-level scoring formula on the pages I fetched. Treat the details as unverified.

### 3.3 CTCAC/HCD Opportunity Map (California LIHTC siting) [read, 2025 methodology memo]
- In 2024 the map moved from a composite index to "a threshold-based scoring system using a more limited set of indicators". High-poverty and segregated areas were moved to "a separate layer", "in an effort to increase transparency and legibility".
- 2025 added three-year rolling averages for the education indicators to reduce "instability in annual updates".
- This is a housing-siting precedent for (i) keeping a non-compensatory screen separate from the score, and (ii) caring about year-to-year stability.

### 3.4 Not verified
I did not verify how Walk Score's customisation works. It is excluded here.

**What we take from this.** The BLI is the cleanest precedent for our weight UI:
- 0–5 importance ratings, normalised to percentages.
- Explicit neutral defaults with a disclaimer.
- No official single ranking.
- Per-unit multi-part glyphs (the flowers).
- Shareable, comparable user weightings.

---

## 4. MCDA methods used in planning

**Survey evidence: Malczewski (2006), 363 GIS-MCDA articles from 1990–2004 [read]**

| Combination rule | Articles | Share |
|---|---|---|
| Weighted summation / Boolean overlay | 143 | 39.3% |
| Ideal/reference point (TOPSIS, MOLA) | 35 | 9.6% |
| AHP | 34 | 9.4% |
| Outranking (ELECTRE, PROMETHEE) | 17 | 4.7% |

- Weighted summation is popular because it is "very easy to implement within the GIS environment using map algebra … easy-to-understand and intuitively appealing".
- It is "often used without full understanding of the assumptions … the weights assigned to attribute maps and the procedures for deriving commensurate attribute maps."
- Ordered weighted averaging (OWA) "provides an extension and generalization of the Boolean operations and the weighted summation procedures".

| Method | Formula / mechanics (source) | Fit for us |
|---|---|---|
| **Weighted linear combination (WLC / SAW)** | Σ w_j x_ij, Σw = 1 (Handbook eq. 31) [read] | **Use within pillars.** Transparent, and the contributions can be decomposed. The weights are trade-off rates. |
| **Weighted geometric / product** | Π x_ij^{w_j} (Handbook §6.11) [read] | **Candidate across pillars.** Partially compensatory. Still transparent: log contributions add up. |
| **AHP** (Saaty 1980 [found]; Saaty 1990 EJOR 48:9–26 [read]) | Pairwise comparisons on a 1–9 scale, with weights from the principal eigenvector. CI = (λ_max − n)/(n − 1). CR = CI / (the same index averaged over random reciprocal matrices). Accept if CR is "about 10% or less" (Saaty 1990). The Handbook also notes "0.2 is often cited". The Handbook warns AHP weights are trade-offs, not importance coefficients. | Good as an *optional* way for a stakeholder panel to derive default pillar weights (5 pillars = 10 comparisons). Too heavy for casual sliders. I did not open the random-index (RI) table itself, so no RI values are given here. |
| **TOPSIS** (Hwang & Yoon 1981 [found]; formula via Wikipedia [skimmed]) | Vector-normalise r_ij = x_ij/√Σ_k x_kj². Weight t_ij = w_j r_ij. Find the ideal and anti-ideal points and the Euclidean distances d⁺ and d⁻. Closeness = d⁻/(d⁺ + d⁻). | Scores depend on which alternatives are in the set (ideal and anti-ideal move), so it is prone to rank reversal. It is compensatory and harder to explain as contributions. **Not recommended.** |
| **Outranking: ELECTRE (Roy [found]), PROMETHEE (Brans 1982 [found]; formula via Wikipedia [skimmed])** | Pairwise preference functions with thresholds. π(a,b) = Σ w_k P_k(a,b). Flows φ⁺, φ⁻, and net φ = φ⁺ − φ⁻, each normalised by 1/(n−1). | The weights really mean importance, and compensation is limited. But the pairwise comparisons scale with n² over all parcels. The Handbook flags the cost of NCMC with many units. **Not practical for a live slider over every parcel.** Possibly usable on a shortlist. |
| **SMAA** (Lahdelma, Hokkanen & Salminen 1998 [found]; SMAA-2, Lahdelma & Salminen 2001 [skimmed]) | Explores the weight space by Monte Carlo and reports rank acceptability indices, central weight vectors and confidence factors. | **Use as the sensitivity layer (§6)**, not as the scorer. |

**Which ones make user-adjustable weights transparent:** WLC and weighted geometric do. Each parcel's score is a sum (or a sum of logs) of weight × value that can be shown term by term, and it updates instantly on the client. AHP is a way to *elicit* weights, not a way to aggregate. TOPSIS and outranking make the weight-to-score link opaque.

---

## 5. Non-compensatory handling of hazards and gates

- **GIS-MCDA constraints vs. factors** (Eastman, Jin, Kyem & Toledano 1995, *PE&RS* 61:539–547) [skimmed, via snippets and course notes]. Criteria are either **constraints** (Boolean 0/1 masks that "constrain or limit the analysis") or **factors** (continuous, rescaled, then weighted). The suitability surface is the WLC of the factors, "masked by one or more Boolean constraints", which in effect is S = (Σ w_j f_j) × Π c_k. I did not open the paper itself.
- **Munda & Nardo (2009), "Noncompensatory/nonlinear composite indicators for ranking countries: a defensible setting", *Applied Economics* 41(12):1513–1523** [skimmed, abstract]. It builds a framework "based on noncompensatory/nonlinear aggregation rules" with an explicit set of axioms. The Handbook's summary [read]: weights are only real *importance* coefficients in non-compensatory aggregation. In linear or geometric aggregation they are trade-off rates.
- **CEJST v2.0 Technical Support Document** [read]:
  - A tract is disadvantaged if it is "at or above the 90th percentile" on at least one burden indicator in any of the 8 categories **and** at or above the 65th percentile for low income. Workforce development uses a high-school-education condition instead.
  - It is a pure threshold (OR within burdens, AND with income) with no composite and "no explicit weighting".
  - "Each threshold is measured independently. The thresholds do not work against each other."
  - A tract "completely surrounded" by disadvantaged tracts qualifies at the ≥ 50th low-income percentile.
- **Criticism of pure thresholds (NASEM 2024, *Constructing Valid Geospatial Tools for Environmental Justice*, ch. 6) [skimmed]:**
  - A tract "at the 89th percentile is not considered any more disadvantaged than one at the 0th percentile."
  - A tract could exceed the environmental threshold on every indicator yet not be designated, because it narrowly misses the income cutoff.
  - CEJST "stops short of reflecting" cumulative burden.
  - Categories with more indicators get implicit extra weight: climate, housing and legacy pollution each hold 5 of 30 indicators, energy and water only 2.
- **CalEnviroScreen 4.0 (OEHHA 2021)** [read]. Score = Pollution Burden × Population Characteristics, each scaled to a maximum of 10, so the maximum score is 100. Multiplication "was selected" for three reasons:
  - effect-modifier evidence from the literature;
  - risk assessment principles;
  - "Risk = Threat × Vulnerability (Brody et al., 2012)".

  Inside each group, indicator percentiles are averaged. Environmental Effects is "weighted half as much as the Exposures score". This is a housing-adjacent, government precedent for a **multiplicative combination of conceptually different groups**.

**What we take from this.** Use three tiers:
1. **Hard constraints.** These are legal or physical infeasibility: not buildable, floodway, and so on. Mask the parcel or put it in its own status, and do not score it into the average.
2. **Gates / flags.** These are serious but not disqualifying. Show them as their own badge, CEJST-style. They may also cap the pillar score, as the current `gates` config does. If so, document the cap as a value judgement and include it in the sensitivity analysis.
3. **Graded hazards.** These are ordinary indicators inside Climate & Environment. Across pillars, the geometric mean then gives partial non-compensation: a very low Climate score drags the overall down more than a linear mean would.

---

## 6. Weight sensitivity and uncertainty

- **Saisana, Saltelli & Tarantola (2005), "Uncertainty and sensitivity analysis techniques as tools for the quality assessment of composite indicators", *JRSS-A* 168(2):307–323** [skimmed, abstract]. It proposes uncertainty analysis (UA) and sensitivity analysis (SA) "to gain useful insights during the process of building composite indicators, including … an assessment of the reliability of countries' rankings". It is demonstrated on the UN Technology Achievement Index. The same TAI case study is worked through in full in Handbook ch. 7 [read]. See §1.5 for R_S, median rank with 5th–95th bounds, and Sobol' indices.
- **Paruolo, Saisana & Saltelli (2013), "Ratings and rankings: voodoo or science?", *JRSS-A* 176:609–634** [skimmed, abstract]. It measures each variable's real importance with Pearson's correlation ratio (the "main effect") and finds that "the declared importance of single indicators and their main effect are very different, and … the data correlation structure often prevents developers from obtaining the stated importance, even when modifying the nominal weights." Follow-up: Becker, Saisana, Paruolo & Vandecasteele (2017), "Weights and importance in composite indicators: Closing the gap", *Ecological Indicators* 80:12–22 [found].
- **SMAA:**
  - Lahdelma, Hokkanen & Salminen (1998), *EJOR* 106:137–143 [found].
  - Lahdelma & Salminen (2001), "SMAA-2", *Operations Research* 49(3):444–454 [skimmed, abstract]: "based on exploring the weight space in order to describe the valuations that would make each alternative the preferred one … SMAA-2 … extends the original SMAA by considering all ranks."
  - Tervonen (2008), PhD thesis, *New directions in SMAA* [read]:
    - No preference information means a uniform density on the weight simplex, f_W(w) = 1/vol(W).
    - The **rank acceptability index** b_i^r is the share of weight (and data) space that gives alternative i rank r.
    - The **central weight vector** is the "expected center of gravity of the favourable weight space".
    - The **confidence factor** is the probability that i is best under its central weights.
    - Sampling: generate n−1 uniform numbers, sort them, add 0 and 1 at the ends, and use the gaps as weights.
    - A caution: "Scaling of the criteria affects the rank acceptability indices", and min–max scaling points move when alternatives are added.
- **Dirichlet sampling.** Sorted-uniform spacings are the same as a flat Dirichlet(1,…,1) distribution. That is a standard probability result, stated here without a separate source. Centring the Dirichlet on the user's weights, with α_i = α₀·w_i, is **our design choice**. Its spread is set by α₀, via Var(w_i) = w_i(1−w_i)/(α₀+1), which is the standard Dirichlet variance. The TL;DR shows how α₀ compares with the JRC GII's ±0.1 perturbations.

**What we take from this.** The per-parcel band over weight draws is the standard JRC approach. The "top-X% in Y% of weightings" statistic is the SMAA rank acceptability index. The nominal-weight vs. contribution display follows Paruolo et al.

---

## 7. Normalisation pitfalls

- **ADI (Petterson 2023, *Health Affairs Scholar* 1(5):qxad063, doi:10.1093/haschl/qxad063, PMC10986280)** [read, via Europe PMC full text]:
  - The Neighborhood Atlas ADI multiplies factor-score coefficients by **unstandardised** values. So the dollar-denominated measures dominate. "Just 2 measures—median income and median home value—account for 98.8% (34.7% + 64.1%) of the unstandardized ADI score … The remaining 13 measures combined contribute less than 0.01%."
  - Across all 236,136 block groups, income plus home value make up a mean of 98.98% of the score.
  - The standardised ADI correlates with the published ADI at r = 0.7245.
  - A "simple" ADI built from only home value and income reproduces the published percentiles at r = 0.999995.
  - Lesson: **normalise every indicator before weighting, and check each one's real contribution.**
- **Percentile rank** (CEJST TSD [read]):
  - For: easy to interpret, puts disparate units on one scale, robust to skew and outliers.
  - Against, in CEJST's own words: "there is no measurement of orders of non-linear magnitude … The difference in impact … between the 50th and 51st percentile may be a lot smaller than the difference … between the 90th and 91st percentile. However … z-scores are often inappropriate for data that is not normally distributed."
  - NASEM [skimmed] adds that percentiles "can mask or amplify the magnitude of difference between values".
  - Percentiles are also *relative*. A county-percentile score says where a parcel sits among Allegheny County units, not whether it is good in absolute terms. AARP's "average = 50" has the same property.
- **Z-scores** (Handbook [read]): outliers get more influence. The result is unbounded, so it would need rescaling to 0–100.
- **Min–max** (Handbook, BLI, HDI goalposts [read]): keeps magnitudes, but is outlier-sensitive unless the goalposts are fixed or the data winsorised. The HDI avoids the problem with fixed "natural zero / aspirational" goalposts. Fixed goalposts also keep scores stable when data updates.
- **Correlated indicators and double counting** (Handbook §1.6 [read]; JRC thresholds [read]; NASEM [skimmed]):
  - Two collinear indicators with weights w1 and w2 put weight (w1 + w2) on one underlying thing.
  - Screen with a correlation matrix inside and across pillars.
  - Judge redundancy by concept, not by correlation alone.
  - NASEM notes that CEJST's documentation "does not mention any correlation analysis".
- **Mixing parcel-level fixed thresholds with area-level percentiles** in one pillar is allowed, since everything ends up on 0–100, "higher = better". But the two scales mean different things, and the methodology page should say so. This is my note, not from a source.

---

## Consolidated recommendation for our tool

| Decision | Recommendation | Basis |
|---|---|---|
| Direction and scale | All indicators on 0–100, 100 = better for a future resident | Handbook step 5; JRC step 4; BLI 1 − (…) for negatives |
| Normalisation | County percentile rank for skewed area indicators. Fixed thresholds or goalposts where a meaningful absolute level exists. Never raw units. | CEJST TSD; HDI goalposts; Petterson 2023 |
| Within-pillar aggregation | Weighted arithmetic mean, equal default weights, drop missing and renormalise with a minimum coverage | BLI; HDI education sub-index; Handbook eq. 31 |
| Coherence checks | Indicator–pillar correlations: flag > 0.95, between −0.3 and 0.3, or < −0.3. Cross-pillar correlation matrix. No variable used twice. | JRC pocket guide; Handbook §1.6 |
| Hard constraints | Boolean mask or status, outside the average | Eastman et al. 1995; CEJST; CTCAC separate layer |
| Gates | Separate badge. A cap is optional but must be documented and included in the sensitivity analysis. | Handbook on compensability; NASEM on thresholds |
| Across pillars | Show the 5 pillars first. Overall = weighted geometric mean by default (floor 1), arithmetic as a toggle. **Team to confirm the default.** | HDI 2010; Handbook §6.11; JRC GII audit; CalEnviroScreen (multiplicative) |
| Weight UI | 0–5 rating per pillar, weight = rating / Σ ratings, shown as %. Equal default with a "not our view" disclaimer. Presets labelled as value judgements. Weights in the URL. | OECD BLI FAQ |
| Explainability | Per parcel: each pillar's contribution to the overall. For geometric, use the w_j·ln(P_j) terms. Show nominal weight next to contribution. | Paruolo et al. 2013; Handbook step 8 |
| Sensitivity (parcel) | Median and p10–p90 of score and county rank percentile over about 200–4,000 weight draws around the user's weights. Plus P(top 10%). | JRC GII audit; Handbook ch. 7; SMAA-2 |
| Sensitivity (global) | R_S or Spearman between arithmetic and geometric, and across presets. Flag or map fragile top-decile parcels. | Handbook eq. 38; NASEM ch. 6 |

---

## Sources

1. OECD & JRC (2008). *Handbook on Constructing Composite Indicators: Methodology and User Guide.* OECD Publishing. ISBN 978-92-64-04345-9. https://www.oecd.org/content/dam/oecd/en/publications/reports/2008/08/handbook-on-constructing-composite-indicators-methodology-and-user-guide_g1gh9301/9789264043466-en.pdf **[read]**
2. European Commission JRC-COIN. *Your 10-Step Pocket Guide to Composite Indicators & Scoreboards.* https://knowledge4policy.ec.europa.eu/sites/default/files/10-step-pocket-guide-to-composite-indicators-and-scoreboards.pdf **[read]**
3. JRC-COIN (2023). *JRC Statistical Audit of the 2023 Global Innovation Index* (GII 2023, Appendix II). WIPO. https://www.wipo.int/edocs/pubdocs/en/wipo-pub-2000-2023-appendix3-en-%C3%A2-appendix-ii-full-version-%C3%A2-statistical-audit-of-the-gii-global-innovation-index-2023-16th-edition.pdf **[read]**
4. UNDP (2024). *Human Development Report 2023/2024 Technical Notes*, Technical Note 1. https://hdr.undp.org/sites/default/files/2023-24_HDR/hdr2023-24_technical_notes.pdf **[read]**
5. Klugman, J., Rodríguez, F., & Choi, H.-J. (2011). *The HDI 2010: New Controversies, Old Critiques.* UNDP Human Development Research Paper 2011/01. https://hdr.undp.org/system/files/documents/hdrp201101.pdf **[read]**
6. Ravallion, M. (2010). *Troubling Tradeoffs in the Human Development Index.* World Bank Policy Research Working Paper. **[found]** (known only through source 5)
7. OECD. *Better Life Index: FAQ* (archived snapshot 2023-01-21 of https://www.oecdbetterlifeindex.org/about/better-life-initiative/): https://web.archive.org/web/20230121150044/https://www.oecdbetterlifeindex.org/about/better-life-initiative/ **[read]**. The current page, https://www.oecd.org/en/data/tools/oecd-better-life-index.html, returned 403 **[found]**.
8. AARP Public Policy Institute. *AARP Livability Index: FAQs* https://livabilityindex.aarp.org/faqs **[skimmed]**. *Methods and Sources* https://livabilityindex.aarp.org/methods-sources **[skimmed]**.
9. California Tax Credit Allocation Committee / HCD (2025). *Draft 2025 CTCAC/HCD Opportunity Map memo.* https://www.treasurer.ca.gov/ctcac/opportunity/2025/CTCAC-HCD-2025.pdf **[read]**
10. Malczewski, J. (2006). GIS-based multicriteria decision analysis: a survey of the literature. *International Journal of Geographical Information Science* 20(7):703–726. doi:10.1080/13658810600661508. PDF copy: https://eclass.hua.gr/modules/document/file.php/GEO151/%CE%92%CE%99%CE%92%CE%9B%CE%99%CE%9F%CE%93%CE%A1%CE%91%CE%A6%CE%99%CE%91%20%CE%A3%CE%A7%CE%95%CE%A4%CE%99%CE%9A%CE%97%20%CE%9C%CE%95%20%CE%A4%CE%97%CE%9D%20%CE%91%CE%A3%CE%9A%CE%97%CE%A3%CE%97%20-%20Recommended%20references/12.GIS%20based%20multicriteria%20decision%20analysis%20a%20survey%20of%20the%20literature.pdf **[read]**
11. Saaty, T. L. (1990). How to make a decision: The analytic hierarchy process. *European Journal of Operational Research* 48(1):9–26. https://vpp.sbuf.se/Public/Documents/ProjectDocuments/06F167EF-B243-48ED-8C45-F7466B3136EB/WebPublishings/How%20to%20make%20decision%20AHP.pdf **[read]**
12. Saaty, T. L. (1980). *The Analytic Hierarchy Process.* McGraw-Hill. **[found]**
13. Hwang, C.-L., & Yoon, K. (1981). *Multiple Attribute Decision Making: Methods and Applications.* Springer. **[found]**. TOPSIS formula from https://en.wikipedia.org/wiki/TOPSIS **[skimmed]**.
14. Brans, J.-P. (1982) (PROMETHEE); Roy, B. (ELECTRE). **[found]**. PROMETHEE formula from https://en.wikipedia.org/wiki/PROMETHEE **[skimmed]**.
15. Eastman, J. R., Jin, W., Kyem, P. A. K., & Toledano, J. (1995). Raster procedures for multi-criteria/multi-objective decisions. *Photogrammetric Engineering & Remote Sensing* 61(5):539–547. https://www.asprs.org/wp-content/uploads/pers/1995journal/may/1995_may_539-547.pdf **[skimmed]** (constraints/factors via search snippets, not the paper text)
16. Munda, G., & Nardo, M. (2009). Noncompensatory/nonlinear composite indicators for ranking countries: a defensible setting. *Applied Economics* 41(12):1513–1523. doi:10.1080/00036840601019364. https://ideas.repec.org/a/taf/applec/v41y2009i12p1513-1523.html **[skimmed]** (abstract)
17. Council on Environmental Quality (2024). *Climate and Economic Justice Screening Tool Version 2.0: Technical Support Document.* Mirror: https://climateprogramportal.org/wp-content/uploads/2025/02/cejst-technical-support-document.pdf **[read]**
18. OEHHA (2021). *CalEnviroScreen 4.0.* https://oehha.ca.gov/sites/default/files/media/downloads/calenviroscreen/report/calenviroscreen40reportf2021.pdf **[read]**
19. National Academies of Sciences, Engineering, and Medicine (2024). *Constructing Valid Geospatial Tools for Environmental Justice*, ch. 6 "Indicator Integration". https://www.nationalacademies.org/read/27317/chapter/8 **[skimmed]** (machine summary; confirm exact wording before quoting)
20. Saisana, M., Saltelli, A., & Tarantola, S. (2005). Uncertainty and sensitivity analysis techniques as tools for the quality assessment of composite indicators. *JRSS-A* 168(2):307–323. doi:10.1111/j.1467-985X.2005.00350.x. https://ideas.repec.org/a/bla/jorssa/v168y2005i2p307-323.html **[skimmed]** (abstract; its method is covered in source 1, ch. 7, [read])
21. Paruolo, P., Saisana, M., & Saltelli, A. (2013). Ratings and rankings: voodoo or science? *JRSS-A* 176:609–634. doi:10.1111/j.1467-985X.2012.01059.x. https://arxiv.org/abs/1104.3009 **[skimmed]** (abstract)
22. Becker, W., Saisana, M., Paruolo, P., & Vandecasteele, I. (2017). Weights and importance in composite indicators: Closing the gap. *Ecological Indicators* 80:12–22. doi:10.1016/j.ecolind.2017.03.056 **[found]**
23. Greco, S., Ishizaka, A., Tasiou, M., & Torrisi, G. (2019). On the methodological framework of composite indices: a review of the issues of weighting, aggregation, and robustness. *Social Indicators Research* 141:61–94. doi:10.1007/s11205-017-1832-9 **[found]**
24. Lahdelma, R., Hokkanen, J., & Salminen, P. (1998). SMAA – Stochastic multiobjective acceptability analysis. *EJOR* 106:137–143. doi:10.1016/S0377-2217(97)00163-X **[found]**
25. Lahdelma, R., & Salminen, P. (2001). SMAA-2: Stochastic multicriteria acceptability analysis for group decision making. *Operations Research* 49(3):444–454. doi:10.1287/opre.49.3.444.11220 **[skimmed]** (abstract)
26. Tervonen, T. (2008). *New directions in Stochastic Multicriteria Acceptability Analysis.* PhD thesis, University of Turku. http://smaa.fi/static/other/tervonen-phd.pdf **[read]** (ch. 3)
27. Petterson, S. (2023). Deciphering the Neighborhood Atlas Area Deprivation Index: the consequences of not standardizing. *Health Affairs Scholar* 1(5):qxad063. doi:10.1093/haschl/qxad063. https://pmc.ncbi.nlm.nih.gov/articles/PMC10986280/ (read via Europe PMC full text) **[read]**
