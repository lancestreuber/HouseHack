# Track 3 ideas and considerations, anchored to the brief

**Type:** track3
**One line:** A structured idea bank for Track 3, organized line by line against the brief, covering what to build, what each axis needs, what to watch out for, and what we already hold. These are options to discuss, not decisions.
**Why we care:** The team pivoted to Track 3 on 2026-09-26. This node turns the brief into a checklist of ideas and considerations, and each idea is tied to evidence we already have.
**Last checked:** 2026-09-26

> Quotes are from the [Track 3 brief](https://ai-horizons-2026-ai-for-housing-hackathon.brandon831577.chatgpt.site/challenges/typology-equity-climate) `[read]` *(accessed 2026-09-26)*. Items marked 💡 are our ideas, not evidence. Items marked 📎 point to evidence already in the base.

---

## 0. The brief in one table

| Brief element | Exact words | What it demands of the product |
|---|---|---|
| Core problem | "A simple label such as 'missing middle' does not tell a planner, nonprofit, or developer whether a particular neighborhood needs duplexes, apartments, townhomes, accessory units, senior housing, or another option, **or whether current zoning allows it**." | Two separate questions: **what does this place need**, and **what is legal here**. Both are required. |
| Build challenge | "compare demand, physical feasibility, affordability, displacement risk, infrastructure capacity, access to opportunity, and marginal carbon emissions" | **Seven axes**, all of them, even if some are shallow or say "unknown" |
| Core stance | "present scenarios rather than declare a single objectively correct neighborhood or housing type" | There is no single winner in the output. It shows comparisons. |
| Success | "compare **at least two** housing scenarios for **a real place**, see **why** the tool ranked them differently, **change normative weights**, and understand which conclusions are **data-driven versus value judgments**" | Four acceptance tests. The demo must visibly pass all four. |
| Owner / input | "Housing-policy and planning leads **with community-stakeholder input**" | There has to be a place for community input, not only planner input. |
| Users | planners "testing zoning and infrastructure scenarios"; CDCs "choosing projects that meet local needs"; developers "evaluating product type and likely market demand"; residents and officials "comparing alternative growth patterns" | Four personas with **different questions**. Presets or lenses could serve each. |
| Prototype possibilities | typology match with "confidence ranges"; typology scenario tool; climate score ("building form, embodied carbon, transportation, and infrastructure extension"); equity dashboard ("jobs, schools, transit, and services"); policy simulator ("zoning, tax incentives, density bonuses, or infrastructure investments") | A menu. We probably pick 2–3 and build them well. |
| Useful data | HUD CHAS; land-use; transit accessibility; demographic indicators; environmental resilience layers | The organizers' expected data spine |
| Closing | "separate **observed evidence** from **policy choices**, **assumptions**, and **value judgments**" | A **four-category labeling scheme**, taken directly from the brief |

💡 **A candidate design principle, lifted from the closing line:** label every number, flag and ranking input with one of

| Label | Example |
|---|---|
| **Observed evidence** | 38% of renters in this tract are cost-burdened (CHAS 2018–22) |
| **Assumption** | Hard cost of $150–375/sf for a duplex, shown as a range: SME practitioner estimates of about $150 (production builder), $200–250 (city infill) and $325–375 (vertical, excluding site), plus $25–50k site work per unit ([gap analysis](../build-plan/sme-feedback-gap-analysis.md) S6–S8). *Corrected 2026-09-27: was a point value of $250/sf from a builder blog.* |
| **Policy choice** | "Assume Bill 2025-1545 passes" |
| **Value judgment** | Carbon measured per household, not per m²; displacement weighted at 30% |
| **Unknown** *(our addition)* | Sewer capacity, which is not public |

The labels stay visible in the UI, the memo and the README.

---

## 1. Framing ideas: what is a "place", and what is a "scenario"?

### What counts as a "real place"
| Option | Pros | Cons | Data fit |
|---|---|---|---|
| **A neighborhood** (90 City neighborhoods) | Matches how residents, RCOs and plans talk; the City has a neighborhood layer | Uneven sizes; most statistics are tract or block group | Good. Tracts nest roughly. 📎 [indicators](indicators-and-data.md) |
| **A census tract** | CHAS, ACS and NRI are native at this level | Not how people think about place | Best |
| **A block group** | MVA and DRR are native at this level | ACS margins of error are huge | Mixed |
| **A site** (a parcel or a cluster of city-owned lots) | Concrete; reuses all the Track 1 work; developers and CDCs think this way | Inherits area-level data (ecological fallacy) | Strong for feasibility, weak for demand |
| **A user-drawn area** | Flexible | Scope and complexity | Needs aggregation logic |

💡 A hybrid: **a place is a neighborhood, and a scenario can optionally be anchored to real sites inside it.** For example: "these 12 city-owned lots in X".

### What a "scenario" could mean (all four are defensible, and they answer different users)
1. **Typology vs typology on the same land.** "Duplexes vs townhomes vs a small apartment on these lots." This fits CDCs and developers, and it is the brief's "scenario tool comparing duplexes, townhomes…".
2. **Growth pattern vs growth pattern for the same number of homes.** "200 new homes as scattered ADUs and duplexes vs one apartment building near the busway." This fits residents and officials "comparing alternative growth patterns".
3. **Policy vs policy.** "Current code vs Bill 2025-1545 (ADUs by right, no parking minimums)." This fits planners "testing zoning … scenarios" and the policy simulator. 📎 [reforms](../policy/reforms-in-flux-2025-2026.md): the bill is Held In Council, so it must be labeled **"policy choice / proposed"**.
4. **Place vs place.** "A triplex in neighborhood A vs neighborhood B." This fits CDCs choosing where to invest. ⚠ It is the riskiest for equity framing (see §4).

💡 One data model covers all four: `Scenario = {place, sites?, typology mix, unit count, policy settings, assumption set}`, scored under a `Weight profile`. **Comparing two scenarios = two scored objects plus a diff.**

---

## 2. The seven axes: ideas, data, and traps for each

### 2.1 Demand ("household demand")
- 💡 **Need-based demand:** who lives here or can't afford to, and which types would serve them.
  - Elderly small households who are cost-burdened point to accessible 1–2BR or senior housing.
  - Large families who are cost-burdened or overcrowded point to 3BR+ townhomes.
  - Young singles and couples point to small apartments and ADUs.
  - Data: CHAS cost burden by household type and income 📎 [indicators](indicators-and-data.md); ACS household size, age 65+, overcrowding, bedrooms (tables to confirm; the Census API needs a free key).
- 💡 **Stock-mismatch demand:** compare the existing typology mix (ACS units-in-structure) with the household mix. A neighborhood that is 90% detached houses with mostly 1–2-person households has an unmet need for smaller types. This speaks directly to the brief's "missing middle label doesn't tell you" point.
- 💡 **Market demand, for the developer persona:** price and rent signals. Zillow ZORI/ZHVI by ZIP 📎; MVA market type by block group 📎 [displacement](displacement-and-equity.md); new-construction sale prices (county sales `SALECODE 16`) 📎 [market](../data/market-and-affordability.md).
- ⚠ **Value judgment hidden here:** *need-based* and *market-based* demand point to different types and different places. Choosing between them, or how to blend them, is a value judgment and must be labeled as one.
- ⚠ **Small-area ACS has large margins of error.** Show ranges, not points (the brief asks for "confidence ranges").

### 2.2 Physical feasibility (and "whether current zoning allows it")
Here the Track 1 work is reused directly. 📎
- **Legal gate by typology** (§911.02, verified): two-unit needs R2+, three-unit needs R3+, multi-unit is by right only in RM. ADUs depend on the pending bill. → [use table](../policy/dimensional-standards-and-use-table.md)
- **Lot fit:** §903.03 minimum lots (VL 6,000 / L 3,000 / M 2,400 / H 1,200 / VH none), setbacks and heights. The residential lot-dimension layer (width and depth) tests whether a townhouse row or cottage court physically fits. → [parcels](../data/parcels-and-assessments.md)
- **Undersized lots:** §921.04 gives one house via an Administrator Exception if the lot is in separate ownership from its neighbors. Two or more units need a ZBA special exception. Same-owner abutting lots have no stated path. → [r6 sweep](../../sweeps/r6-ch921-hillside-916.md)
- **Hazards:** steep slope (Planning Commission review), undermined land (single-unit only with more than 100 ft of cover), floodway (effectively excluded), landslide. → [overlays](../policy/environmental-overlays-ch906.md)
- 💡 **Three-level feasibility instead of pass/fail:** *by right* / *needs relief (likely)* / *needs relief (uncertain)* / *not allowed*. 📎 Our 2026 ZBA sample found **81% of relief requests approved**, with setbacks the most common variance. "Needs a variance" is therefore mostly a time cost, not a veto, though the sample is biased upward, twice: withdrawals are missing, and only projects that already pencil reach the ZBA (SMEs, 2026-09-27). The time cost is also a money cost (S11). → [ZBA](../data/zba-decisions.md)
- 💡 **Buildable sites:** the 3,260 city-owned lots marked "Available for Sale" give real sites for CDC scenarios. Half are under 2,400 sf. → [land](../data/land-availability-and-title.md)

### 2.3 Affordability
- 💡 **Two sides of the gap:**
  - What a typology costs to build per unit. Practitioner testimony put it at $350k–$568k per unit. PHFA caps are $320k (9%) and $380k (4%) basis per unit. → [testimony](../../sweeps/r6-council-testimony-practitioner-voice.md), [pro forma](../methods/pro-forma.md)
  - What local households can pay. The FY2026 AMI is $110,400, and a 4-person household at 80% AMI earns $88,300. CHAS shows who is cost-burdened. → [market](../data/market-and-affordability.md)
- 💡 **Affordability gap per scenario**, in dollars per unit, framed as "subsidy needed to reach X% AMI". Which AMI target to use is a **policy choice**.
- 💡 Rent or price by typology from ZORI and new-construction comps. Label these **assumptions**.
- ⚠ Hard-cost data is the weak link. Show ranges and make the cost assumptions editable.

### 2.4 Displacement risk
- 📎 Data: MVA 2021 market types and the Displacement Risk Ratio by block group. ⚠ **The DRR flags Robust markets, not Transitional or Stressed ones**, and its base year is unconfirmed. → [displacement](displacement-and-equity.md)
- 💡 **Treat displacement as a guardrail, not only a weight.** High-risk plus high-fit scenarios get a visible warning and a "consult the community / anti-displacement tools" panel (community land trust, affordability set-asides, the Affordable Housing Bonus).
  - Choosing warning vs weight is itself a **value judgment**. Show both modes.
- 💡 **A "who benefits / who bears risk" panel per scenario:** renters vs owners, income bands, existing residents vs newcomers. This comes from the brief's equity framing and the packet's "explicit about who benefits, who might be harmed".
- ⚠ Never output "this neighborhood should get X". 45% of Black residents live in Transitional markets (MVA summary), so **place-vs-place scenarios need special care.**
- 💡 Tenure (renter share) and recent sale-price change as additional displacement-pressure indicators, labeled observed.

### 2.5 Infrastructure capacity
- ⚠ **Not public.** Sewer, water and power capacity are decided per project. PWSA tests capacity in dry weather, five years out, at the tightest downstream sewer; the sign-off takes 3–6 months. → [infrastructure](../data/infrastructure.md)
- 💡 **Proxies, clearly labeled:**
  - **Infill vs extension:** a lot fronting an existing street with sewer lines needs no extension.
  - **Combined-sewer stress:** the PWSA sewershed's CSO rank (a stress proxy).
  - **Lead service line areas.**
  - **Transit capacity:** high-frequency stops.
- 💡 This is the axis where "**unknown**" earns points. The packet scores *"We don't have good data on X"* as a strength.
- 💡 This axis ties to "infrastructure extension" in the brief's climate score (§2.7) and to "infrastructure investments" in its policy simulator.

### 2.6 Access to opportunity ("jobs, schools, transit, and services")
- 📎 Available:
  - The City's `Tracts2020_Pgh_CommunityNeed` layer (keyless ACS 2022 plus an Opportunity Atlas field)
  - `HighFrequencyTransit` (742 stops)
  - PRT GTFS
  - LODES jobs
  - EPA Smart Location (jobs within 45 minutes by transit)

  → [indicators](indicators-and-data.md)
- 💡 **Schools:** NCES locations (in the organizer catalog). **Services:** grocery, clinics and parks from OSM.
- ⚠ **Value judgment:** *which* destinations count, and the travel-time threshold (30 vs 45 min).
- 💡 Opportunity for *whom*: transit access matters most for zero-car households (ACS).

### 2.7 Marginal carbon, and climate resilience (two different things)
- 💡 **The brief's own recipe:** "building form, embodied carbon, transportation, and infrastructure extension". The four components:

  | Component | What we have | Status |
  |---|---|---|
  | **Embodied** | Dublin study, per m²: house 316 / duplex 396 / apartment 437 kgCO2e | Foreign data; show ranges 📎 |
  | **Operational** | RECS 2020 per household: 94.6 MMBtu detached vs 33.7 for 5+ unit apartments | National cross-section, not a density effect 📎. Better, not yet pulled: ResStock for IECC climate zone 5A and PA grid factors. |
  | **Transportation** | Location VMT; TRB range: doubling density cuts VMT 5–12% | Regional effect 📎 |
  | **Infrastructure extension** | ≈0 for infill on existing streets | Our inference |

- ⚠ **Normalization is a value judgment.** BfCA shows the per-m² ranking flips with the floor-area definition. Per unit vs per person vs per m² changes the winner. Offer a toggle labeled **value judgment**. → [carbon](carbon-by-typology.md)
- 💡 **A reuse scenario:** rehab of a vacant structure vs new construction, since Pittsburgh has more than 20k vacant units. Embodied carbon favors reuse, though a practitioner notes rehab can cost more per square foot. This fits Pittsburgh especially well.
- 💡 **Resilience** (the brief's "environmental resilience layers") is *adaptation*, not *mitigation*. Keep it as a separate sub-axis: FEMA NRI heat, flood and landslide by tract (⚠ its resilience score looks county-level), the City flood, landslide and undermined layers, and tree canopy.

---

## 3. Meeting the four success tests

| Test | Ideas |
|---|---|
| **"compare at least two housing scenarios for a real place"** | 💡 Side-by-side **consequence table**: axes as rows, scenarios as columns, each cell showing a value, a range, a label and a source. 💡 Up to 3–4 scenarios. 💡 Shareable URL per comparison. |
| **"see why the tool ranked them differently"** | 💡 **Contribution bars**: how much each axis added or subtracted under the current weights. 💡 A **diff sentence**, e.g. "B ranks higher mainly because of carbon (+12) and opportunity (+8); it loses on displacement (−9)". An LLM can write this sentence from the deterministic numbers, with citations; it never computes them. |
| **"change normative weights"** | 💡 Sliders plus **persona lenses**: planner, CDC, developer, resident, and "climate-first" and "anti-displacement-first". 💡 **Tipping points**: "A overtakes B if carbon weight > 0.35". 💡 **Robustness**: "B wins in 78% of random weight draws". 💡 A plain-language mode where the LLM turns "I care most about seniors staying" into proposed weights that the user confirms. |
| **"understand which conclusions are data-driven versus value judgments"** | 💡 The four label categories on everything (see §0). 💡 A "What's a value judgment here?" panel listing every normative choice: weights, normalization, demand definition, AMI target, displacement mode, travel-time threshold. 💡 A "**robust vs contested**" verdict: conclusions that hold under all lenses are data-driven; conclusions that flip are value-driven. |

💡 **The robust vs contested split may be the most direct answer to the brief's hardest line.** If B beats A under every persona lens, the ranking is driven by the data. If it depends on the lens, the ranking is a value judgment, and the tool can say so explicitly.

---

## 4. Equity and responsibility considerations

- **Community input.** The owner line says "with community-stakeholder input". 💡 Residents save their own weight profile, and the tool shows **disagreement between stakeholder profiles** instead of averaging them. 💡 Contested scenarios route to "discuss with the RCO or the community". 💡 A printable one-page scenario memo for a community meeting.
- **Harm framing:** see §2.4. Don't rank neighborhoods for "densification". Present options with who-benefits and who-bears-risk.
- **Ecological fallacy:** tract and block-group values applied to a site describe the area, not the site.
- **Privacy:** no owner names. The RCO layer contains contact details, so request only the organization name and geometry. → [indicators](indicators-and-data.md)
- **Decision support, not advice:** state it in the UI and the README.

---

## 5. The prototype menu, assessed

| Brief prototype | What we'd reuse | Effort guess | Watch out |
|---|---|---|---|
| Neighborhood-to-typology match with interpretable factors and confidence ranges | Track 1 gates, CHAS/ACS, MVA | Medium | Must show ranges |
| Scenario tool: duplex / townhome / apartment / ADU / detached | Use table, lot rules, prototype parameters 📎 [typology prototypes](typology-prototypes.md) | Medium | ADUs are not law yet |
| Climate score: form, embodied, transport, infrastructure extension | RECS, Dublin, TRB, infill proxy | Medium | Foreign numbers; normalization |
| Equity dashboard: affordability gaps plus access to jobs, schools, transit, services | CHAS, Community Need layer, transit, LODES | Medium | Displacement framing |
| Policy simulator: zoning, tax incentives, density bonuses, infrastructure | Bill 2025-1545 / 2026-0834 toggles; affordable-housing bonus (15 ft per point) 📎 [IZ](../policy/inclusionary-zoning-and-bonus.md) | Medium–High | Label "proposed" |

💡 A natural combination: **scenario tool + policy toggle + equity panel**, all in one consequence table, with a climate sub-score inside it.

---

## 6. Personas: what each one needs to see

| Persona (brief) | Their question | Default lens idea | Key axes |
|---|---|---|---|
| Municipal planner "testing zoning and infrastructure scenarios" | What changes if we allow X here? | Policy toggle on, balanced weights | Feasibility, infrastructure, opportunity |
| CDC "choosing projects that meet local needs" | Which type on our lots serves our residents? | Need-based demand, anti-displacement guardrail | Demand (need), affordability, displacement |
| Developer "evaluating product type and likely market demand" | What will lease or sell and is buildable? | Market demand, feasibility-first | Demand (market), feasibility, affordability (cost) |
| Residents and officials "comparing alternative growth patterns" | What does growth here look like, and who wins? | Community lens, growth-pattern scenarios | Displacement, opportunity, carbon, "who benefits" |

---

## 7. Risks and traps

- **Seven axes done shallowly** risks judges seeing a dashboard of weak numbers. Option: fewer indicators per axis, each with a strong source, and "unknown" where it's honest.
- **False precision.** ACS margins of error, foreign carbon data, and assumed costs all call for ranges and labels.
- **Arbitrary weights.** That's why presets, tipping points and robustness matter.
- **Equity harm.** See §4.
- **Stale or pending rules.** ADUs and parking depend on the pending bill (Held In Council), and 2026-0834 would amend overlays and nonconformities.
- **Geography mismatches:** 2010 vs 2020 tracts (Opportunity Atlas uses 2010), block groups vs tracts, city-only vs county data.
- **One-track form:** Track 3 is now primary. Track 1 becomes the feasibility axis, not a second headline number.

---

## 8. Open questions for mentors (Track 3 specific)

1. Which place makes the most useful demo? For example, a neighborhood with an active neighborhood plan, city-owned lots, and mixed market types.
2. Should displacement be a weight, a guardrail, or both?
3. Which carbon normalization should be the default, if any?
4. Do judges expect all seven axes, or depth on some?
5. Would planners use "robust vs contested" as a concept? Is there a City process, such as the 2050 comprehensive plan or neighborhood plans, it could feed?
6. Which Track 3 users matter most to the City and County partners?

## Connects to
- [Brief and requirements](brief-and-requirements.md): the verbatim brief and success criteria
- [Indicators and data](indicators-and-data.md): every indicator's source and access
- [Typology prototypes](typology-prototypes.md): per-type parameters and legal gates
- [Displacement and equity](displacement-and-equity.md) · [Carbon by typology](carbon-by-typology.md) · [Combining with Track 1](combining-with-track1.md)
- [Uncertainty and explainability](../methods/uncertainty-and-explainability.md) · [LLM role](../methods/llm-role.md)
- [ZBA decisions](../data/zba-decisions.md) · [Land availability](../data/land-availability-and-title.md) · [Reforms in flux](../policy/reforms-in-flux-2025-2026.md)

## Sources
- [Track 3 brief: Housing Typology, Equity & Climate Matchmaker](https://ai-horizons-2026-ai-for-housing-hackathon.brandon831577.chatgpt.site/challenges/typology-equity-climate) `[read]` *(accessed 2026-09-26)*: every quote in this node
- [Participant packet](https://docs.google.com/document/d/1L-UYid6Q0JDRH3iy4cpqGIDlZNpJspok_rPxIsILbLQ/edit) `[read]` *(accessed 2026-09-26)*: judging criteria; "who benefits, who might be harmed"; "We don't have good data on X" as a strength
- [Organizer data catalog: Brief Source Map](../../sources/organizers-2026-09-26-public-data-catalog-readme-and-brief-map.md) `[read]` *(accessed 2026-09-26)*: Track 3 core sources (ACS; CHAS; parcels/land use/zoning; PRT GTFS; LAI; FEMA; slopes; ResStock) and additions (Opportunity Atlas; EPA EJScreen; NLCD; NOAA; schools; market-demand datasets)
- All other evidence is cited in the linked nodes and sweeps.
