# Where Housing Can Be Built, and What Should Be Built There

**A survey for the Pittsburgh AI for Housing Hackathon: site feasibility, approval friction, housing typology, equity, and climate in the City of Pittsburgh and Allegheny County**

*Compiled 2026-09-26, during the build window. Entry point to the [knowledge brain](README.md)*

---

## How to read this

This survey has one job: to inform two decisions a 4–5 person team has to make in about 36 hours. Those decisions are **what to build** and **how to build it**. It covers:
- what the challenge actually asks
- what constrains housing construction in Pittsburgh
- what the agencies and practitioners who would use a tool say they need
- which data can be reached
- how scoring and typology matching have been done elsewhere
- what already exists
- what a build on our scaffolded stack would take

Every claim links to a node that carries its sources. Verification is marked source by source:
- `[read]`: fetched and read, or queried with the response inspected
- `[skimmed]`: partial or secondary
- `[found]`: known but not opened, or recalled from memory
- `[inaccessible]`: blocked, with the blocker logged in [`../admin/source-access.md`](../admin/source-access.md)

The base holds **234 unique external sources (136 `[read]`, 74 `[skimmed]`, 23 `[found]`, 1 `[inaccessible]`)** across 46 nodes. The raw evidence is **13 research sweeps** in [`../sweeps/`](../sweeps/), archived at full fidelity. Each sweep was run by a separate research agent on 2026-09-26, and most of them probed live data endpoints rather than only reading about them.

⚠ **This was a single day of research.** It is broad in one direction (public data endpoints and City documents) and thin elsewhere:
- We have spoken to **no practitioners**.
- Hackathon-project coverage is weak, because Devpost blocks scripted search.
- Several zoning chapters were read on a commercial mirror, not the code of record.

A dedicated critique pass is part of the method. See [`../docs/04-critique.md`](../docs/04-critique.md) when it exists, and [`../docs/03-open-questions.md`](../docs/03-open-questions.md) before treating anything here as settled.

**A standing rule for this domain, because the rules are changing while we work:**

> **A zoning or permitting rule is unverified until it has been read in the code text itself or in an official, dated City document. Every rule carries its code version or bill status.**

---

## Executive summary

1. **The challenge asks for one track, and Tracks 1 and 3 fit together as filter-then-rank.** The submission form asks *"Which of the three you're entering"* `[read]`. Track 1 asks *"can this be built here, and what stands in the way"*. Track 3 asks *"among what could be built, what fits need, equity and climate, under whose values"*. The two combine naturally, with Track 1's gates as the feasibility filter for Track 3's scenarios. But the combined entry has to be pitched as one primary track, and it risks showing judges two competing headline numbers.
   → [combining the tracks](track3/combining-with-track1.md) · [brief and judging](challenge/brief-and-judging.md)

2. ⭐ **The binding residential rules can be read and encoded, and they changed recently.** Since Ord. 10-2025 (effective 5/7/2025):
   - minimum lot sizes are VL 6,000 / L 3,000 / M 2,400 / H 1,200 sf, and VH has none
   - lot-area-per-unit is gone
   - residential districts have **no FAR**, so the building envelope is set by lot size, setbacks and height

   Among residential districts, the use table allows two-unit housing by right in R2 and above, three-unit in R3 and above, and multi-unit only in RM. Both tables were read on eCode360 and saved `[read]`.
   → [dimensional standards and use table](policy/dimensional-standards-and-use-table.md)

3. ⚠ **The rules are in flux, and any tool must say which version it scores against.**
   - **Bill 2025-1545** (ADUs by right citywide, no parking minimums, an optional affordable-housing bonus) had its Council hearing on 9/23/2026. **We could not confirm a vote.**
   - **Bill 2026-0834** (Phase I amendments to dimensional standards, height and compatibility) has its hearing on 10/13/2026.
   - A full code rewrite is planned. The 2050 comprehensive plan's consultant contracts were frozen by Council in Dec 2025 `[skimmed]`.
   - "Current code vs. proposed" is both a requirement for honesty and a possible feature.

   → [reforms in flux](policy/reforms-in-flux-2025-2026.md)

4. ⭐ **Approval friction is mostly in discretionary steps, and some of it can be measured.**
   - City permit review got faster: Building/Development Application (BDA) review went from 27 to 11 days `[read]`.
   - We computed timelines from the OneStopPGH records:
     - Residential alterations: **median 8 days**.
     - Residential new construction: **median 153 days with about 5 revision cycles**. This is an underestimate, because 78 of 210 cases were still in revisions.
   - Relief from the Zoning Board of Adjustment (ZBA) runs on a statutory calendar (21-day notice, decision within 45 days, $400 fee).
   - **No ZBA approval rates are published anywhere we found.**

   → [approval pathway](policy/approval-pathway.md) · [permit timelines](policy/permit-timelines.md)

5. **Pittsburgh's environmental constraints are overlay districts with specific consequences.**
   - Steep slope ≥25% (SS-O) triggers Planning Commission review and a 50 ft ridge setback.
   - On undermined land (UM-O), anything heavier than a single-unit dwelling is prohibited until a site investigation clears it.
   - In the regulatory floodway (FP-O), new construction is effectively excluded.

   These rules were read on a mirror, so they are `[skimmed]` until re-read on eCode360. We earlier placed these rules in Chapter 915, which was wrong; they are in Chapter 906 (see the corrections log).
   → [environmental overlays](policy/environmental-overlays-ch906.md)

6. ⚠ **The people who would use a feasibility tool do not name "which site is easiest" as their bottleneck.** The obstacles they cite are:
   - acquisition and clearing title (2+ years historically, about 9 months since the Land Bank gained sheriff-sale authority)
   - the financing, subsidy or appraisal gap
   - loss of existing affordable units (the County counts 44,000+ sub-$1,000 apartments lost from 2019 to 2024)
   - the cost of inclusionary zoning
   - only then, zoning and variances

   Nonprofits often work parcels they already control. That does not make a feasibility tool useless. It does mean a tool that ignores **site control and title** misses what practitioners cite most.
   → [practitioners](stakeholders/practitioners.md) · [Land Bank](stakeholders/land-bank.md) · [County](stakeholders/allegheny-county.md)

7. **The City and the County want different things.**
   - **The City** is growth-first ("laser-focus on growth"). The only AI use it has named is checking permit applications for missing information.
   - **The County** is preservation-first and works across 130 municipalities through model ordinances.
   - A city-only parcel tool fits the City. A cross-municipal "zoning barrier" lens would fit the County.

   → [City](stakeholders/city-of-pittsburgh.md) · [County](stakeholders/allegheny-county.md)

8. ⭐ **Almost all the data a Track 1 or Track 3 tool needs is public and keyless, and the organizers have catalogued most of it.** Verified live:
   - parcels, assessments and sales (WPRDC, County GIS)
   - zoning and overlays (City ArcGIS)
   - FEMA flood; landslide, slope and undermined areas
   - PA DEP and EPA contamination layers
   - 1 m USGS elevation
   - permits and new-construction outcomes (OneStopPGH)
   - 5,786 city-owned vacant parcels, 3,260 of them "Available for Sale"
   - the Market Value Analysis (MVA) and a block-group Displacement Risk Ratio (WPRDC, CC0)
   - HUD CHAS
   - FEMA's National Risk Index
   - transit schedules (GTFS)
   - LODES jobs data

   The organizers' official catalog (60 datasets) already lists OneStopPGH, ZBA decisions, 3DEP, city-owned property and CHAS, and its "Brief Source Map" names starter datasets for each brief `[read]`. **So data access alone is unlikely to distinguish any entry.** The catalog's own quality rule is worth adopting as a design principle: *"Never let an AI-generated answer outrank an authoritative rule or source record."*
   → [organizer catalog](data/organizer-data-catalog.md) · [data index](data/README.md)

9. ⚠ **What is not public matters as much as what is.**
   - No sewer, water or electrical capacity data exists (PWSA, ALCOSAN, Duquesne Light). Sewer capacity is decided per project through the DEP planning-module process.
   - ZBA outcomes exist only as per-case PDFs behind a CDN that blocks scripts.
   - There is no countywide zoning layer. We found nine municipal layers.
   - Building condition is not public.

   For any of these, a responsible tool says **"unknown", not "bad"**.
   → [infrastructure](data/infrastructure.md) · [ZBA decisions](data/zba-decisions.md) · [municipal zoning](data/municipal-zoning-outside-city.md)

10. **There is a way to check a score against reality, with honest limits.**
    - About 370–590 distinct new-construction projects since 2019 carry parcel IDs. That is enough to report how well a rule-based score ranks parcels that were actually built on, and to fit a small regularized model.
    - But being built reflects **demand × ease**, not ease alone.
    - Features that change after construction leak the outcome.
    - The lot-size rules changed in 2025, so past behavior reflects the old code.
    - The Housing Element "likelihood of development" models in LA and SF are the precedent.

    → [backtest and calibration](methods/backtest-and-calibration.md)

11. **Track 3's hardest requirement is epistemic, not computational.** The brief asks users to *"understand which conclusions are data-driven versus value judgments."* The carbon evidence makes the point concrete:
    - Per m², denser building types carry **more** embodied carbon (Dublin study: 316 / 396 / 437 kgCO2e/m² for house / duplex / apartment).
    - Per household, operational energy falls steeply with density (RECS 2020: 94.6 MMBtu for a detached house, 33.7 for an apartment in a 5+ unit building).
    - Which one "wins" depends on the unit of comparison. That is a normalization choice, which makes it a value judgment the tool has to expose.

    → [carbon by typology](track3/carbon-by-typology.md) · [Track 3 brief](track3/brief-and-requirements.md)

12. ⚠ **A "densify here" ranking is an equity hazard in this city.** A scenario that favors high need, good transit and cheap vacant land will tend to point at the Transitional and Stressed MVA markets, where displacement risk is highest. The MVA summary notes Black residents are more likely to live in Transitional markets. Options to reduce the risk:
    - Treat displacement as a **warning that cannot be traded away** rather than a weight.
    - Show who benefits and who bears risk under each scenario.
    - Route high-risk, high-fit cases to community consultation rather than to a recommendation.

    → [displacement and equity](track3/displacement-and-equity.md)

13. **Several of the ideas we considered most "differentiating" are established practice or already on other participants' minds.**
    - Permit-timeline prediction with confidence scores **won** Seattle's 2025 permitting hackathon.
    - Parcel "what can I build" tools, zoning envelopes, pro forma calculators and code chatbots are common.
    - A public participant research plan independently proposes sub-scores, "bad vs. unknown", historical-permit priors and three archetype parcels.
    - We found **no example** of a Pittsburgh-specific score, ZBA outcome prediction, a per-typology ease score, or place-specific marginal carbon by typology. **Absence of evidence here mostly reflects limited search reach.**

    → [landscape](landscape/README.md) · [other participants](landscape/other-participants.md) · [hackathon precedents](landscape/hackathon-precedents.md)

14. **The build is feasible on the team's stack if the geospatial work stays offline.** A static-first hybrid is the lowest-risk option we found:
    - a Python/DuckDB pipeline produces vector tiles (PMTiles) and JSON
    - the TypeScript scoring runs in the client, so weight sliders update instantly
    - the server handles only LLM explanation and a Neon audit table for human overrides

    The riskiest pieces are:
    - the MapLibre v6 worker under Vite/SSR
    - serving large PMTiles files from Vercel
    - hand-encoding zoning rules

    The login wall in the scaffold is a demo risk. These are recommendations from one feasibility sweep, not tested builds.
    → [architecture options](build-plan/architecture-options.md) · [timeline and workstreams](build-plan/timeline-and-workstreams.md)

---

## Part I — What the challenge asks

The hackathon has three tracks. The packet asks each team to pick one, and to demonstrate it on at least one Pittsburgh or Allegheny County case.

The Track 1 brief asks that a user be able to *"enter a parcel ID or compare multiple parcels and receive a source-grounded Development Ease Score, a plain-language explanation of the biggest barriers, and clear flags for zoning, environmental, infrastructure, or policy issues that require further review."* The landing page adds a pro forma angle ("grounded in public records and approved affordability assumptions") that the detailed brief does not repeat.

The organizers' Brief Source Map lists a **fourth brief, "Policy-to-Permit Navigator"**, which is not among the tracks on the site. Its core sources are the zoning code, PLI permits, OneStopPGH, ZBA decisions and municipal codes. Track 1's page lives at `challenges/policy-to-permit.html`, so we infer the brief was folded into Track 1, which would put permitting and ZBA work in scope. This is unconfirmed; ask the organizers. → [organizer catalog](data/organizer-data-catalog.md), [saved copy](../sources/organizers-2026-09-26-public-data-catalog-readme-and-brief-map.md)

Track 3 asks for a tool that *"should present scenarios rather than declare a single objectively correct neighborhood or housing type."* → [brief and judging](challenge/brief-and-judging.md), [Track 3 brief](track3/brief-and-requirements.md)

Judging has six criteria:
1. Problem value
2. User fit
3. Technical execution
4. Data & AI integrity
5. Actionability
6. Continuation potential

On data and AI integrity, the packet rewards honesty explicitly: *"We don't have good data on X, so our tool doesn't claim to answer it"* is scored as a strength.

Mandatory checks:
- a limitations statement
- decision-support framing, not legal, financial or zoning advice
- a public repo whose history starts at kickoff
- AI-tool disclosure
- a 3–5 minute demo video that states what is mocked

→ [rules and deliverables](challenge/rules-and-deliverables.md)

## Part II — What constrains building in Pittsburgh

**Dimensional rules.**
- Residential districts combine a use subdistrict (R1D, R1A, R2, R3, RM) with a density subdistrict (VL, L, M, H, VH).
- After Ord. 10-2025, minimum lot size ranges from 6,000 sf (VL) to none (VH). Setbacks and height limits vary by combination; for example, RM-H allows 85 ft and 9 stories, and RM-VH allows 180 ft.
- Party-wall construction sets the interior side yard to zero.
- Contextual setbacks and heights (§925.06–.07) and residential compatibility standards (Ch. 916) can modify these.

→ [dimensional standards and use table](policy/dimensional-standards-and-use-table.md)

**Uses.** Among residential districts:
- single-unit detached is permitted everywhere
- two-unit requires R2+
- three-unit requires R3+
- multi-unit is permitted by right only in RM

Above a district's ceiling, relief means a use variance. The use table was read on eCode360 `[read]`. Our transcription's column alignment beyond RM needs re-checking.

**Overlays and environmental rules.** SS-O, LS-O, UM-O and FP-O each attach specific review, study or prohibition consequences. → [environmental overlays](policy/environmental-overlays-ch906.md), [environmental constraint data](data/environmental-constraints.md)

**The approval pathway.** A project's path is set by the most demanding step it triggers:

| Step | What triggers it or what it involves |
|---|---|
| By-right zoning review | The default |
| Site Plan Review | ≥4 units, or any construction in the H district |
| Administrator Exception | 21-day decision |
| Special Exception or Variance (ZBA) | See Summary §4 for the statutory calendar |
| Conditional Use | Planning Commission, then Council |
| Historic Review Commission | Parcel in a historic district |
| RCO meeting | Hearing-bound projects meeting size thresholds |
| Stormwater | Thresholds ≥10,000 sf disturbance or ≥5,000 sf impervious |
| PWSA and the DEP sewage planning module | Most net-new units |

→ [approval pathway](policy/approval-pathway.md), [parking](policy/parking.md), [inclusionary zoning](policy/inclusionary-zoning-and-bonus.md)

**Measured timelines.** Computed from OneStopPGH workflow timestamps `[read]`:
- zoning development review, 2019–24: median 25 days
- residential alterations: median 8 days
- residential new construction: median 153 days and about 5 revision rounds, right-censored

→ [permit timelines](policy/permit-timelines.md)

## Part III — What the people who would use this say

- **City.** Permitting reform is under way (EO 2026-01; March 2026 plan). The plan includes *"investigating AI technologies to review applications for missing info"*. No vendor is named and no RFP was found. → [City](stakeholders/city-of-pittsburgh.md)
- **County.** A February 2026 executive order commissions a housing needs assessment, a land-bank review, a housing fund and incentives for municipal zoning reform. Its framing is preservation-first.
  - ⚠ **Contradiction, unresolved:** the organizer catalog lists an existing "Allegheny County Housing Needs Assessment", while the executive order calls for the County's *first*.
  → [County](stakeholders/allegheny-county.md)
- **State.** The PA Housing Action Plan projects a 185k-unit shortfall by 2035 and emphasizes regulatory modernization, repair of older stock and land banks. A 2026 PHFA policy fellow is studying Pittsburgh and Wilkinsburg's roughly 27,000 vacant lots. That is the closest match to Track 1 we found, and a possible validator. → [State](stakeholders/state-dced-phfa.md)
- **Land Bank.**
  - About 5,000 tax-delinquent vacant lots and about 270 condemned buildings.
  - Federal funding ends after 2027.
  - Sheriff-sale authority cut title-clearing to about 9 months.
  - A rehab pilot is expanding.
  → [Land Bank](stakeholders/land-bank.md)
- **Practitioners** cite title, financing and preservation ahead of site selection. One CEO notes rehab often costs more per square foot than new construction. → [practitioners](stakeholders/practitioners.md)

## Part IV — The data

The organizer catalog is the common starting kit → [organizer catalog](data/organizer-data-catalog.md). Beyond it, sources we verified live:

- [parcels and assessments](data/parcels-and-assessments.md)
  - 585k assessment rows
  - parcel polygons
  - address-to-parcel lookup via the Census geocoder
  - the County portal is the only source of owner names
- [zoning GIS](data/zoning-gis.md) and [zoning code text](data/zoning-code-text.md): browser-only for the code text
- [environmental constraints](data/environmental-constraints.md) and [LiDAR slope](data/lidar-slope.md)
  - per-parcel slope classes come from 3DEP
  - the City's ETHOS layer has a precomputed steep-slope fraction
- [permits and outcomes](data/permits-and-outcomes.md)
  - new-construction labels
  - a 2025 recode to handle
  - demolitions
- [land availability and title](data/land-availability-and-title.md): city-owned vacant parcels, liens, delinquency, conservatorship
- [market and affordability](data/market-and-affordability.md): sales (code 16 marks new construction), HUD FY2026 limits, QCT/DDA
- [infrastructure](data/infrastructure.md): sewersheds with CSO ranking as a stress proxy; capacity not public

**Freshness.** Many City layers were last edited in 2023. Every UI element should show a data-as-of date.

## Part V — Methods

- **Score structure.** The options, with no pick yet:
  - hard gates vs. friction vs. opportunity (multiplicative, so a blocker can't be averaged away)
  - per-typology scores
  - pathway-driven time and uncertainty
  - persona weight presets with a rank-stability check

  Precedents include GIS multi-criteria analysis (MCDA), CA Housing Element site inventories, Portland's Buildable Land Inventory, UrbanSim and CalEnviroScreen, most recalled rather than re-read `[found]`.
  → [score design options](methods/score-design-options.md)
- **Calibration.** Covered in Summary §10. → [backtest and calibration](methods/backtest-and-calibration.md)
- **Uncertainty and explanation.**
  - interval bands rather than point scores
  - per-factor confidence and data vintage
  - labels that separate observed, derived, assumed, unverified and normative
  - reason codes
  - planner override with an audit trail

  → [uncertainty and explainability](methods/uncertainty-and-explainability.md)
- **The LLM's role.** It explains and cites deterministic results, and extracts rules from code text with human sign-off. It never produces a number. It must fall back to the deterministic reasons list if unavailable. → [LLM role](methods/llm-role.md)
- **Pro forma.** The inputs available: PHFA 2025–26 QAP caps and cost limits, HUD FY2026 limits, sales comps. The weak link is local hard-cost data. → [pro forma](methods/pro-forma.md)

## Part VI — Track 3: typology, equity and climate

- **Indicators and their geographies.**
  - Parcel level: zoning and constraints.
  - Block-group level: MVA and the Displacement Risk Ratio (DRR).
  - Tract level: CHAS 2018–22, NRI, the City's Community Need layer, Opportunity Atlas.
  - Stop level: transit.
  - Known traps:
    - the Census API needs a key
    - CHAS needs browser headers
    - the Opportunity Atlas uses 2010 tracts
    - NRI's resilience score looks county-level
    - the RCO layer contains PII, so request only the organization name and geometry

  → [indicators and data](track3/indicators-and-data.md)
- **Typology prototypes.** This is the standard method (Envision Tomorrow and similar). Each type is defined by its lot needs, units, floor area, parking, cost, rent and carbon. Zoning filters which types are possible. The survivors are then scored with user weights, and each criterion is labeled "data" or "value judgment". → [typology prototypes](track3/typology-prototypes.md)
- **Displacement and equity.**
  - MVA 2021 has 10 market types.
  - The DRR exists per block group, but its formula is not documented.
  - The Urban Displacement Project has no Pittsburgh output in its repo.

  → [displacement and equity](track3/displacement-and-equity.md)
- **Carbon.** The metric choice is a value judgment (see Summary §11). → [carbon by typology](track3/carbon-by-typology.md)

## Part VII — Combining Tracks 1 and 3

Three shapes emerged. None is recommended here.

- **A. Buildable → Fit, per parcel.** Track 1 decides which typologies are possible and how hard each is. Track 3 ranks the survivors under adjustable weights.
- **B. A policy what-if across both.** Current code vs. Bill 2025-1545 as proposed, showing which typologies unlock and how the fit rankings shift. It must be labeled "proposed, not law".
- **C. Area-level scenarios.** Tract or neighborhood typology mixes, with Track 1 feasibility rolled up as a supply constraint.

Risks common to all three:
- one track on the form
- two headline numbers
- scope
- geography mismatches (2010 vs. 2020 tracts, block groups vs. tracts, city-only vs. countywide)

→ [combining with Track 1](track3/combining-with-track1.md), [framings](landscape/framings.md)

## Part VIII — What already exists

- **Common:** parcel lookup with a plain-language zoning report, 3D envelopes, pro forma calculators, RAG chat over code.
- **Less common, but with precedents:**
  - permit backtesting (LA/SF Housing Elements)
  - timeline prediction (Seattle's winner)
  - policy-lever simulators (Terner; an MIT-licensed El Paso tool)
  - typology-to-place painting (UrbanFootprint, Envision Tomorrow)
  - displacement at tract level (the Urban Displacement Project)
- **No example found:** see Summary §13.

Pittsburgh's own tools are data explorers, not scorers: WPRDC tools, ETHOS lot suitability, OneStopPGH Insights and the Landslide portal. → [commercial tools](landscape/commercial-tools.md), [hackathon precedents](landscape/hackathon-precedents.md), [Pittsburgh civic tools](landscape/pittsburgh-civic-tools.md)

## Part IX — Building it

See Summary §14 for the options and risks. → [architecture options](build-plan/architecture-options.md), [data pipeline](build-plan/data-pipeline.md), [timeline and workstreams](build-plan/timeline-and-workstreams.md), [UX patterns](build-plan/ux-patterns.md)

The proposed plan:
- **By hour 4:** a vertical slice, meaning one parcel working end to end on the deployed URL.
- **By hour 12:** the full-city Track 1 layer.
- **Overnight:** the Track 3 layers.
- **Sunday morning:** feature freeze.
- **Sunday afternoon:** video.
- **About 9–10pm:** submit, ahead of the deadline.

Cut lines are defined at hours 8, 12, 16, 18 and 20.

---

## What this survey does not establish

- **That any user wants the tool.** No practitioner, planner or Land Bank staffer has been asked. The office-hours questions in [`../docs/03-open-questions.md`](../docs/03-open-questions.md) are the fastest available test.
- **That our reading of the code is complete or current.** Only §903.03 and §911.02 were read on the code of record. Chapters 906, 914, 915 and 922 came from a mirror. Two bills could change the rules within weeks.
- **How often variances are granted, or for what.** No approval-rate data was found.
- **Infrastructure capacity for any parcel.** It is not public.
- **Anything about other teams' plans.** We saw a handful of public repos. Private and unpushed work is invisible.
- **That any time estimate in the build plan holds.** They are estimates from one feasibility sweep, and none has been tested.

## Method and provenance

- **Sweeps** (full-fidelity agent reports) in [`../sweeps/`](../sweeps/):
  - **r1:** prior art and pro forma inputs; parcel, environmental and infrastructure data; zoning data and reforms.
  - **r2:** deeper data; scoring and validation; approval pathway and timelines; UX and stack.
  - **r3:** a deliberate reality check, run after an overclaim (see the corrections log): existing tools, stakeholder needs, alternative framings.
  - **r4:** Track 3 data and methods, Track 3 prior art, build feasibility on the team's stack.
- **Primary text saved in [`../sources/`](../sources/):** eCode360 §903.03 and §911.02.
- **Access blockers:** [`../admin/source-access.md`](../admin/source-access.md).
- **Bibliography:** [`../docs/02-bibliography.md`](../docs/02-bibliography.md).
- **Open questions:** [`../docs/03-open-questions.md`](../docs/03-open-questions.md).
- **Corrections:** [`README.md#corrections-log`](README.md#corrections-log).
