# Sweep: Scoring literature, backtest feasibility against permits, algorithm options

**Round 2** · 2026-09-26 · single research subagent, web search and fetch plus live endpoint probes

> Archived at full fidelity, exactly as the agent reported it. Its tags are its own: some sweeps use [V]/[S]/[U] and some use [F]/[S]. The paper maps these onto `[read]` / `[skimmed]` / `[found]` / `[inaccessible]`. Local scratch paths have been replaced with `<scratch>`. Treat claims here as leads, and check the paper and the corrections log before citing.

---

## Recommended algorithm spec: Development Ease Score for Pittsburgh parcels (36-hour build)

### A. What I checked in the WPRDC permits data (live this session, resource f4d1177a…)
- The full CSV dump has 65,378 rows, with issue dates from **2019-06-03 to 2026-09-21**. Columns: permit_type, work_type, commercial_or_residential, work_description, parcel_num, total_project_value, issue_date, status, neighborhood, lat/lon.
- **How to find new residential construction:** permit_type ∈ {`BUILDING`, `Building & Development Application`} AND work_type = `NEW CONSTRUCTION`/`New Construction`. Then:
  - Residential rows (564): drop sheds, garages and retaining walls with a description regex (DWELLING|HOUSE|HOME|TOWN|MODULAR|FAMILY|UNIT).
  - Commercial rows: also keep them when the description matches APART|DWELLING|TOWN|UNITS|MULTIFAMILY|CONDO. Multifamily and townhome rows are often coded "Commercial" under the IBC (for example, "220 UNIT 5 STORY APARTMENT BUILDING").
  - Ignore ELECTRICAL/MECHANICAL "NEW CONSTRUCTION" rows. They duplicate the building permit.
- **Positives:** about 670 permits on **about 510 unique parcels**, or about **370 independent projects** after collapsing by owner + neighborhood + month.
  - Per year: 2019: 12 (partial year), 2020: 99, 2021: 112, 2022: 117, 2023: 93, 2024: 109, 2025: 67, 2026: 58 (to September).
  - Status: 351 Completed, 179 Issued, a few Revoked or Expired.
- **They cluster heavily:** Fairywood 47, Bedford Dwellings 38, Central Lawrenceville 34, Central Northside 30, Crawford-Roberts 26. Most of these are likely large HACP/URA subdivision projects, which is why you must dedupe by project.
- **Is there enough data?** Yes, for a small regularized logistic model. About 370 events supports roughly 15–30 parameters at 10–20 events per variable (Peduzzi 1996), and it is plenty to report an AUC for a rule-based score (a 95% CI of about ±0.03). The base rate is tiny: about 500 out of roughly 140k city parcels. I did not verify that parcel count this session. Report PR-AUC and lift in the top decile alongside ROC-AUC.
- **Blocking caveats. Say these out loud to judges:**
  1. **Positives measure demand × ease, not ease.** Include a market control (neighborhood median sale price or a neighborhood fixed effect) so the ease coefficients are conditional on the market.
  2. **Leakage.** The current assessment shows the new building, and "vacant" flips after construction. Only use features that are stable or dated before the permit: zoning, slope, flood, landslide, undermining, lot geometry, historic district, transit, and ownership as of before the permit. Whether WPRDC has historical assessment snapshots is unverified.
  3. **Missing earlier data.** Permits before June 2019 are not in this resource (legacy PLI data may be elsewhere; unverified).

### B. What the literature does, and which formulas to borrow
1. **GIS multi-criteria decision analysis (MCDA) and AHP** (Malczewski 2006, IJGIS 20(7); Saaty 1980). The pattern is: normalize criteria to 0–1, get weights from AHP pairwise comparisons (check consistency ratio < 0.1), compute S = Σ wᵢxᵢ, and apply Boolean constraint masks first. Its known weakness is that weights are subjective, so report sensitivity to them.
2. **California Housing Element sites inventory** (Gov. Code §65583.2; HCD Site Inventory Guidebook, 2020). Borrow these ideas:
   - Realistic capacity = max density × a haircut from past built-to-allowed ratios.
   - Nonvacant sites need "substantial evidence" that the existing use won't impede redevelopment. Evidence includes improvement-to-land value ratio, building age, lease terms, and past trends.
   - Lower-income sites under 0.5 acre or over 10 acres are presumed inadequate.
   - The post-2021 critique is that inventories overstate, because only a minority of listed sites got built in prior cycles. That motivated LA's 2021–29 Housing Element to use a **statistical likelihood-of-development model** trained on past permits. This is exactly your calibration idea.
3. **Terner Center** Housing Development Dashboard / "Making It Pencil" and the SB 9 parcel analysis (Metcalf et al. 2021). These run a per-typology prototype pro forma: residual land value = (NOI / cap rate − hard − soft − financing costs) versus land value, and a parcel is market-feasible if RLV > current value. They filter each parcel for eligibility first, then check feasibility.
4. **Metro Portland Buildable Land Inventory / Urban Growth Report.** Steps: gross acres − constrained land (floodplain, slope ≥ 25%, Title 3/13 resource land) − a future-streets allowance = net buildable acres. "Redevelopable" is set by a strike-price/pro forma threshold, not only by vacancy.
5. **Seattle Development Capacity Report.** A parcel counts as redevelopable when existing development is well below allowed capacity (roughly under 50%) and it is not an excluded use. Capacity = allowed floor area − existing floor area.
6. **UrbanSim** (Waddell 2002, JAPA). A developer model runs a pro forma per parcel × building form, then a logit choice among the profitable forms.
7. **CalEnviroScreen 4.0.** This is a civic score built from percentile indicators, combined multiplicatively (burden × vulnerability), with every component published. It is a good precedent for a structure that isn't a flat sum.

### C. Recommended spec (per parcel p, per typology t)

**Typologies:** ADU, 2–3 unit, rowhouse/townhome, 4–19 multifamily, 20+ (inclusionary zoning where it applies).

**1. Gates (hard blockers, per typology), giving G_{p,t} ∈ {PASS, CONDITIONAL, FAIL}.**
FAIL applies when any of these hold:
- Use not permitted in the zoning district by any pathway
- Parcel is inside the regulatory floodway
- Buildable area after slope ≥ 40% and landslide exclusion is below the typology minimum
- Parcel is a park or ROW
- No street frontage and no assemblage option exists

CONDITIONAL applies when a gate can be cured, for example undersized for the typology but assemblable. Never average a FAIL away.

**2. Envelope and yield (deterministic).**
- Buildable area = lot area − setbacks − constrained area.
- GFA_max = min(FAR × lot area, footprint × floors allowed by height).
- Units_max = min(GFA_max / unit size_t, lot area / min lot area per unit).
- Parking required comes from a code table, with a toggle for the pending Bill 2025-1545.

**3. Approval pathway, P_{p,t}.** Map each requirement check to a pathway: by-right/Zoning Administrator, Administrator Exception, Special Exception (ZBA), Variance (ZBA), Conditional Use (Planning Commission + Council), plus Historic Review Commission if the parcel is in a historic district. The worst required pathway determines the result. Look up a (time_months, p_approve, cost) tuple for that pathway, and cite where the numbers came from: ZBA/OneStopPGH case outcomes if you can scrape them. Otherwise use stated assumptions with wide ranges, and label them that way.

**4. Friction subscore, F ∈ [0, 1].** A penalty-weighted mean of:
- Slope (share of lot 15–25% / 25–40%)
- 100-/500-year flood fringe
- Undermining and landslide-prone overlays
- Delinquent taxes or liens (a title-clearing burden)
- Demolition needed (a structure is present), which adds cost and time
- Irregular lot shape (frontage/depth ratio)
- Pathway time from step 3

**5. Opportunity subscore, O ∈ [0, 1].**
- City, Land Bank, or URA owned (acquisition path)
- In a QCT or DDA (LIHTC basis boost)
- Within 1/4 mile of a frequent PRT transit stop
- Opportunity Zone
- Existing water/sewer mains (PWSA)
- Market strength (neighborhood sale price percentile)

**6. Feasibility (optional stretch goal).** RLV_t = Units × (rent × 12 × (1 − vacancy/opex)) / cap rate − (hard cost/sf × GFA + soft cost % + time cost from step 3). Feasibility gap = RLV − assessed land value. Put every input on screen with its source.

**7. Composite:**
- Ease_{p,t} = 0 if G = FAIL. Otherwise Ease = 100 × P_approve × (1 − F)^α × (0.5 + 0.5·O).
- This is multiplicative, so one severe problem can't be offset by amenities. That is the CalEnviroScreen/Metro logic.
- Headline number = max over t, with the typology named ("Easiest: duplex, by-right, 72 [61–80]").

**8. Calibration (the differentiator).**
- **Data:** a case-control set of 370 positive projects, plus about 10 negative parcels per positive, drawn from residential-capable zones (weighted back to the full population).
- **Model:** logit(P(permit)) = β·[F components, O components, pathway dummies, log lot size] + market control. Use L2 regularization.
- **Validation:** temporal holdout (train 2019–2022, test 2023–2026) plus neighborhood-blocked CV.
- **Uses:**
  - Report the rule-based score's AUC and PR-AUC against the fitted model.
  - Use the fitted β signs and magnitudes to sanity-check or re-set the rule weights.
  - Show a reliability plot of score decile versus observed build rate.
- **Honest framing:** "validated against revealed development behavior, not against ease itself."

**9. Uncertainty.**
- Each factor carries a confidence (1.0 = authoritative GIS layer; 0.7 = derived, e.g. slope from DEM; 0.4 = assumption, e.g. approval probability) and a data vintage date.
- Propagate with Monte Carlo (about 200 draws): sample weights from persona Dirichlet(α·w), sample pathway p_approve from Beta distributions, and sample uncertain gates as Bernoulli.
- Show the P10–P90 band. Flag the parcel "needs human verification" when the band is wider than 30 points or a gate rests on an inferred layer.

**10. Personas and sensitivity.** Presets (homeowner ADU, small builder, nonprofit/LIHTC, city planner) change the weights on F and O and the typology set. Show rank stability: the Spearman ρ of rankings across personas, and "stays in the top 20% under X% of weight draws."

**11. Path to yes (counterfactual).**
- Enumerate curable items (each variance, assemblage with an adjacent city/Land Bank vacant parcel or same-owner parcel, policy toggles such as Bill 2025-1545 parking/ADU, a PWSA extension).
- Search greedily for the minimal set that moves G to PASS, or raises Ease by 15 or more.
- Output something like: "Needs 1 variance (side setback, about 4–6 months) OR combine with 123-X-45 (Land Bank, vacant) → by-right 3-unit."
- For policy levers, re-run the city-wide scores and report how many parcels change band.

**12. Assemblage.** Build a parcel adjacency graph (shared-boundary touches). Candidate merges are neighbors that share the same owner_name, or that are city/Land Bank/URA-owned and vacant. Recompute envelope and gates on the union.

**13. LLM role (keep it narrow).**
- (a) Extract dimensional standards from zoning code text into a JSON table, with a human reviewing and signing off (store section citations).
- (b) Turn the deterministic contribution vector into a plain-language explanation with citations.
- It never produces or adjusts a number. Log the prompt/output alongside data vintages.

### D. Explainability UX
- **Waterfall chart:** start at 100, show the gate outcome, then each friction and opportunity contribution. Additive contributions come from log-decomposing the multiplicative score, the SHAP-waterfall style (Lundberg & Lee 2017).
- **Reason codes:** the top 3–4 adverse reasons, in the style of FICO / ECOA Reg B adverse-action notices, each linked to its data source and date.
- **Displays:**
  - Confidence band as a bullet/interval bar, not a single number.
  - Per-factor source-and-vintage badges.
  - An "I disagree / correct this" button that writes an override, which is the human-in-the-loop element.
  - Persona toggle with a rank-stability indicator.
  - Precedent: CalEnviroScreen and Allegheny County's Family Screening Tool published indicators, weights, and validation.

### E. Build order for 36 hours
1. Gates, envelope, pathway lookup, per-typology score (about 10h).
2. Backtest AUC and reliability plot from the positive set above (about 5h).
3. Monte Carlo band and persona presets (about 4h).
4. Waterfall and reason codes (about 5h).
5. Path to yes plus the Bill 2025-1545 toggle (about 6h).
6. Assemblage (stretch).
7. Pro forma (stretch).

### Citations and verification status
- **Verified this session:** everything in section A (WPRDC dump for resource f4d1177a-f597-4c32-8cbf-7885f56253f6).
- **From memory, not re-fetched:** Malczewski 2006, IJGIS 20(7); Saaty 1980; Cal. Gov. Code §65583.2 and HCD Housing Element Sites Inventory Guidebook (2020); City of LA 2021–2029 Housing Element sites methodology; Terner Center Housing Development Dashboard and SB 9 analysis (2021); Metro Portland 2018 Urban Growth Report BLI; Seattle OPCD Development Capacity Report; Waddell 2002, JAPA 68(3); CalEnviroScreen 4.0 (OEHHA 2021); Lundberg & Lee 2017 (NeurIPS); Peduzzi et al. 1996, J Clin Epidemiol. Their exact thresholds should be spot-checked before they go on a slide.
- **Unverified:** Pittsburgh pathway definitions and any approval-rate data. Pull them from Pittsburgh Code Title Nine and OneStopPGH ZBA records.

Scratch data: <scratch>/permits.csv
