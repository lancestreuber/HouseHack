# What Should Be Built Where: Housing Typology, Equity and Climate in Pittsburgh

**A survey for the Pittsburgh AI for Housing Hackathon, Track 3 ("Housing Typology, Equity & Climate Matchmaker"), including the site-feasibility research that feeds it**

*Compiled 2026-09-26, during the build window. Entry point to the [knowledge brain](README.md).*

*Revision history:*
- *Revised after an adversarial audit ([`../docs/04-critique.md`](../docs/04-critique.md)) that disputed 34 claims.*
- *Re-centered on Track 3 when the team pivoted on 2026-09-26. The earlier Track 1 findings are kept below as **supporting findings**, because they supply Track 3's "physical feasibility" and "does current zoning allow it" inputs.*

**Brief:** [Track 3 challenge page](https://ai-horizons-2026-ai-for-housing-hackathon.brandon831577.chatgpt.site/challenges/typology-equity-climate) `[read]`. **Idea bank:** [track3/ideas-and-considerations.md](track3/ideas-and-considerations.md).

---

## How to read this

This survey exists to inform two decisions a 4–5 person team has to make in about 36 hours: **what to build for Track 3** and **how to build it**. It covers:
- what the challenge actually asks
- what constrains housing construction in Pittsburgh
- what agencies and practitioners say they need
- what data can be reached
- how scoring and typology matching have been done elsewhere
- what already exists
- what a build on our scaffolded stack would take

Every claim links to a node that carries its sources. Verification is marked source by source:
- `[read]` means fetched and read, or queried with the response inspected.
- `[skimmed]` means partial or secondary.
- `[found]` means known but not opened, or recalled from memory.
- `[inaccessible]` means blocked. The blocker is logged in [`../admin/source-access.md`](../admin/source-access.md).

⚠ **How to weigh the tags.** Most `[read]` tags are **agent-reported**: the research agent that ran a sweep says it read the source, and nobody independently re-opened it. The claims that *were* independently re-checked are listed in the critique's §6 (live checks). Those are mainly the data counts, §903.03, SS-O/UM-O on eCode360, Legistar bill status, and the DRR×MVA join. Where nodes disagree on a tag, the weakest tag applies unless the node names the artefact it read. Source counts are in the [bibliography](../docs/02-bibliography.md).

The raw evidence is the **research sweeps** in [`../sweeps/`](../sweeps/), archived at full fidelity.

⚠ **This was a single day of research, and it leans heavily on one kind of source.** Most of the evidence is public GIS/data endpoints, City web pages, and local journalism. Two further kinds carry load-bearing claims and are weaker than they look:
- an automated meeting-summary site (citizenportal.ai)
- a commercial code mirror (zoneomics)

What the base does not have:
- **no practitioner interviews**
- **no meeting minutes**
- **no full academic papers**
- **only a handful of ZBA decisions**

Read [`../docs/04-critique.md`](../docs/04-critique.md) and [`../docs/03-open-questions.md`](../docs/03-open-questions.md) before treating anything here as settled.

**A standing rule for this domain, because the rules are changing while we work:**

> **A zoning or permitting rule is unverified until it has been read in the code text itself or in an official, dated City document. Every rule carries its code version or bill status.**

---

## Track 3 summary: what the brief asks, and what we have for each part

The brief sets **four acceptance tests**. A user can:
1. *"compare at least two housing scenarios for a real place"*
2. *"see why the tool ranked them differently"*
3. *"change normative weights"*
4. *"understand which conclusions are data-driven versus value judgments"*

It names **seven axes**: demand, physical feasibility, affordability, displacement risk, infrastructure capacity, access to opportunity, marginal carbon. It closes by asking submissions to *"separate observed evidence from policy choices, assumptions, and value judgments"*. That gives a four-category labeling scheme we can use directly.

The full idea bank, organized line by line against the brief, is in → [ideas and considerations](track3/ideas-and-considerations.md).

**Where each axis stands:**

| Axis | What we hold | Strength | Main caveat | Node |
|---|---|---|---|---|
| **Physical feasibility and "does current zoning allow it"** | Use table (§911.02, verified); lot, setback and height rules (§903.03); undersized-lot relief (§921.04); overlays (Ch. 906); slope, flood, landslide, undermining layers; 3,260 city lots for sale; ZBA sample (81% of relief requests approved) | **Strong.** This is the Track 1 work. | ADUs depend on Bill 2025-1545, which is Held In Council | [typology prototypes](track3/typology-prototypes.md), supporting findings below |
| **Demand** | Market proxies (Zillow ZORI/ZHVI by ZIP; MVA market types; new-construction sale prices); CHAS cost burden by household type; ACS household composition (tables to confirm; the Census API needs a key) | **Weakest** | Need-based and market-based demand point to different answers. Choosing between them is a value judgment. | [indicators](track3/indicators-and-data.md) |
| **Affordability** | CHAS 2018–22 by tract; HUD FY2026 AMI $110,400; practitioner cost testimony ($350k–$568k per unit); PHFA per-unit caps | Good | Hard-cost data is thin; the AMI target is a policy choice | [pro forma](methods/pro-forma.md) |
| **Displacement risk** | MVA 2021 (10 market types); block-group Displacement Risk Ratio (DRR) | Usable with care | The DRR flags *Robust* markets, not Transitional or Stressed ones, and its base year is unconfirmed. Placement is an equity hazard (Summary §12 below). | [displacement](track3/displacement-and-equity.md) |
| **Infrastructure capacity** | Not public. Proxies: infill vs extension, sewershed CSO rank, lead-line areas. PWSA capacity process documented. | **Unknown** | Say "unknown", not "bad"; the packet scores that honesty | [infrastructure](data/infrastructure.md) |
| **Access to opportunity** | City Community Need layer (ACS 2022 plus Opportunity Atlas, keyless); high-frequency transit (742 stops); GTFS; LODES; EPA Smart Location | Good | Which destinations count, and the travel-time threshold, are value judgments | [indicators](track3/indicators-and-data.md) |
| **Marginal carbon** (building form, embodied, transport, infrastructure extension) | Dublin embodied carbon per m²; RECS 2020 per household; TRB VMT range; BfCA metric-flip study | Thin | The data is national or foreign. **Normalization (per unit / person / m²) is a value judgment.** | [carbon](track3/carbon-by-typology.md) |
| *Resilience* (the brief's "environmental resilience layers") | FEMA NRI by tract; City flood, landslide and undermining layers; tree canopy | Good | NRI's resilience score looks county-level | [indicators](track3/indicators-and-data.md) |

**Considerations that cut across the axes** (details in the idea bank):
- **"Robust vs contested" may be the most direct answer to the brief's hardest test.** A ranking that holds under every weight lens is data-driven. A ranking that flips between lenses is a value judgment, and the tool can say so.
- **"Scenario" has four defensible meanings,** and each serves a different persona:
  - typology vs typology on the same land
  - growth pattern vs growth pattern
  - policy vs policy
  - place vs place, the riskiest for equity
- **The owner line asks for "community-stakeholder input".** Stakeholder weight profiles can be shown side by side instead of averaged.
- **Track 1 becomes the feasibility axis, not a second headline number.** The form takes one track.

---

## Supporting findings (from the Track 1 phase; these feed Track 3's feasibility axis)


1. **The challenge asks for one track, and Tracks 1 and 3 fit together as filter-then-rank.**
   - The submission form asks *"Which of the three you're entering"* `[read]`.
   - Track 1 asks *"can this be built here, and what stands in the way"*. Track 3 asks *"among what could be built, what fits need, equity and climate, under whose values"*. Track 1's gates can serve as the feasibility filter for Track 3's scenarios.
   - The combined entry has to be pitched as one primary track, and it risks showing judges two competing headline numbers.
   - Track 1 is also described inconsistently across the organizers' materials: "Pro Forma Navigator", "Development Feasibility Navigator", and a URL slug `policy-to-permit`. There is also a fourth "Policy-to-Permit Navigator" brief in the organizers' source map. Scope should be confirmed with the organizers.
   → [combining the tracks](track3/combining-with-track1.md) · [brief and judging](challenge/brief-and-judging.md)

2. **The core residential rules can be read and encoded.** §903.03 on eCode360 (read 2026-09-26; independently re-checked) sets these minimum lot sizes:

   | District density | Minimum lot size |
   |---|---|
   | VL | 6,000 sf |
   | L | 3,000 sf |
   | M | 2,400 sf |
   | H | 1,200 sf |
   | VH | none |

   §903.03 has **no lot-area-per-unit row and no FAR row**, so the building envelope comes from lot size, setbacks and height. Whether any per-unit requirement survives elsewhere in Title Nine is unchecked.

   The §911.02 use table (transcribed once, residential columns not re-verified) puts two-unit housing by right in R2 and above, three-unit in R3 and above, and multi-unit only in RM among residential districts. Our saved copies are reformatted transcriptions, not page captures.
   → [dimensional standards and use table](policy/dimensional-standards-and-use-table.md)

3. ⚠ **The rules are in flux, and the pending changes reach further than the headlines suggest.** From City Council's own records (Legistar, checked 2026-09-26):
   - **Bill 2025-1545** covers ADUs by right, parking minimums, and an affordable-housing bonus.
     - Status: **"Held In Council"**, with no final vote.
     - Public hearings were held 9/10/25 and 9/23/26.
     - A committee substitute and a Planning Commission referral followed on 10/15/25.
     - The Planning Commission report was received 6/12/26.
   - **Bill 2026-0834** amends most of Title Nine, including the **Ch. 906 environmental overlays, Ch. 921 nonconformities and Ch. 922 review procedures**. Its hearing is 10/13/26.
   - **Bill 2024-0701** is still in committee.
   - Primary texts conflict on whether 2025-1545 sunsets the inclusionary overlay: the Legistar title says it does, but the June 2026 redline amends the overlay instead.

   Any tool has to state which code version it scores. "Current code vs. proposed" is both an honesty requirement and a possible feature.
   → [reforms in flux](policy/reforms-in-flux-2025-2026.md)

4. ⚠ **We measured one slow path, and it is by-right review of new construction. Discretionary steps are unmeasured.**
   - From OneStopPGH workflow records `[read]`:
     - Residential alterations take a median 8 days.
     - Residential new construction takes a **median 153 days elapsed, including time waiting on the applicant**. This covers only the **74 of 210 cases (35%) that have been issued**, so it is biased short by an unknown amount.
     - The median of about 5 "Revisions Required" flags counts **parallel reviewer flags, not resubmission rounds**.
   - The City reports, via PublicSource, that time to issue a Building/Development Application fell from about 27 days (July 2025) to about 11 (July 2026). This is not independently verified.
   - ZBA process terms come from the City's Dec 2024 handout, not code text:
     - at least 21 days' notice
     - decision within 45 days **after the record closes**
     - a $400 fee
   - ⭐ **The ZBA usually says yes (round 5).**
     - We coded 90 decisions from 2026 hearings. Of the 84 relief requests, **81% were approved** (35 of those with conditions), 15.5% were denied and 3.6% split.
     - The most-varied sections are setbacks (§903.03), accessory structures/parking pads (§912.04) and signs (§919). Use (§911) is the most cited once special exceptions are counted.
     - **No case cites the §906 overlays.**
     - Median time from the *final* hearing to the decision was 34 days, and at least 15 cases needed more than one hearing.
     - Coverage is about two-thirds of 2026 case numbers, withdrawn cases are missing, and the rate is biased upward.
     - → [ZBA sample](../sweeps/r5-zba-decisions-sample.md), [CSV](../sources/pittsburghpa-2026-09-26-zba-decisions-sample.csv)
   - The Planning Commission, RCO and PWSA/sewage-planning steps remain untimed. PWSA's own manual puts the sewage-planning sign-off at 3–6 months (round 5).
   → [approval pathway](policy/approval-pathway.md) · [permit timelines](policy/permit-timelines.md)

5. **Pittsburgh's environmental constraints are overlay districts with specific consequences.** Read on eCode360 (2026-09-26):
   - **SS-O steep slope (≥25%):** *"all uses and structures permitted in the base underlying district shall be reviewed and approved by the Planning Commission"*.
   - **UM-O undermined:** a single-unit dwelling can be approved with >100 ft of overburden and no subsidence history. *"Other Development Prohibited"* until a site investigation clears the plans.

   Also confirmed on eCode360 in round 5:
   - **SS-O setback:** 50 ft "in both directions" from the overlay edge at the ridgeline or base. The Planning Commission may waive it.
   - **FP-O floodway:** no construction without a no-rise hydraulic analysis **and** a DEP permit.
   - **Regulatory flood elevation:** base flood elevation + 1.5 ft.
   - **Missed deadlines:** if the deciding body misses its deadline, the code treats the application as **denied**.
   - **Parking:** a shortfall is not automatically a variance. It goes through an Alternative Access and Parking Plan (§914.07.D), decided by the Zoning Administrator if 10 or fewer spaces are required, or by the ZBA as a Special Exception above 10.
   - **No "40% no-disturbance" rule** in Ch. 906 or 915.
   - → [re-read sweep](../sweeps/r5-ecode360-reread-ch906-914-915-922.md)

   Bill 2026-0834 would amend Ch. 906.
   → [environmental overlays](policy/environmental-overlays-ch906.md)

6. ⚠ **In the coverage we read, the barriers named most often are site control and title, financing, and preservation, not site selection.** This is **not a ranking or a survey**. It comes from about a dozen news and advocacy pieces, mostly quoting CDCs, the County Executive and a nonprofit CEO. Two of the brief's four personas (municipal planner, small developer) have no direct voice in the base. The specific claims:
   - The Land Bank *expects* about 9 months to clear title under its new sheriff-sale authority, per a third-party meeting summary and WESA. There is no outcome data.
   - The County reports that the count of apartments renting under a nominal $1,000 fell by 44,000+ from 2019 to 2024. How much of that is rent inflation and how much is physical loss is unknown.

   ⭐ **Round 6 added primary testimony.** We counted 42 practitioner appearances across Council and Planning Commission hearings, from YouTube captions, because Legistar holds no testimony records. This is a count of testimony, not a survey, and the hearings concerned code text, not sites. The obstacles raised most:
   - **the financing gap and cost to build**, quoted at $350k–$568k per unit
   - **process complexity and delay**, including PWSA
   - **parking minimums**, including lender-required parking
   - **variances forced by minimum lot size**

   City staff said some lots "can't build anything" under the residential-compatibility setbacks. Practitioners asked for current neighborhood cost/rent inputs, predictable rules, and a permit-pipeline dashboard (promised by the City, not released as of 9/23/26). The City already has a GIS layer of lots nonconforming under old vs new minimums. → [testimony sweep](../sweeps/r6-council-testimony-practitioner-voice.md)

   A feasibility tool that ignores site control and title may miss what practitioners raise. Whether it matters to the tool's actual users is the first open question.
   → [practitioners](stakeholders/practitioners.md) · [Land Bank](stakeholders/land-bank.md) · [County](stakeholders/allegheny-county.md)

7. **The City and the County emphasize different things, though both agendas include both.**
   - **City:** the Mayor's office frames housing as growth ("laser-focus on growth"). The only AI use named *in the March 2026 permitting plan* is checking applications for missing information. The City's 2050 comprehensive plan is to estimate units to "produce and preserve".
   - **County:** the County Executive stresses preservation. The County's executive order also funds supply and incentives for municipal zoning reform across 130 municipalities.
   → [City](stakeholders/city-of-pittsburgh.md) · [County](stakeholders/allegheny-county.md)

8. **Most parcel-level data is public and keyless, and the organizers have catalogued most of it. Several Track 3 sources and one Track 1 brief item are harder.** The data-service counts below were independently re-checked:
   - parcels, assessments and sales
   - zoning and overlays
   - FEMA flood; landslide, slope and undermined layers
   - contamination layers
   - 1 m elevation
   - OneStopPGH permits and new-construction outcomes
   - 5,786 city-owned vacant parcels, of which **3,260 are "Available for Sale"**. **Buildability is unassessed.** About half of the 3,260 are under 2,400 sf, roughly a third of the residential-district ones are below their district's minimum lot size, and 298 are in the Hillside district. **Round 6, Ch. 921 read on eCode360:** a vacant lot below the minimum can hold **one house via an Administrator Exception the Zoning Administrator "shall approve"** if it is in separate ownership from abutting lots. Two or more units need a ZBA special exception. The code gives **no path when the same owner holds an abutting parcel**, which is common among public lots, so any analysis needs an owner-adjacency check → [sweep](../sweeps/r6-ch921-hillside-916.md).

   What needs more than an anonymous request:
   - the ACS API needs a key
   - HUD needs a token
   - CHAS needs browser headers
   - the code text and ZBA pages need a browser or browser-like fetches
   - the H+T index needs registration

   The organizers' catalog has 60 rows (58 distinct sources) and already lists OneStopPGH, ZBA decisions, 3DEP, city-owned property and CHAS. So **data access alone is unlikely to distinguish any entry.** Its quality rule is worth adopting as a design principle: *"Never let an AI-generated answer outrank an authoritative rule or source record."*
   → [organizer catalog](data/organizer-data-catalog.md) · [land availability](data/land-availability-and-title.md) · [data index](data/README.md)

9. ⚠ **Some of what the brief asks for, we could not find in public data.**
   - **Infrastructure capacity:** we found no public sewer, water or electrical capacity data. That was a search only, plus a check of PWSA's ArcGIS service list. Yet "infrastructure gaps" is named in the Track 1 brief. Sewer capacity is decided per project through the DEP planning-module process.
   - **ZBA decisions:** the ones we found are per-case PDFs. curl is blocked, but browser-like fetches work. Template consistency across years is unknown.
   - **Zoning outside the city:** there is no countywide zoning layer. Nine municipal layers were found.
   - **Building condition:** not public.

   For any of these, a responsible tool says **"unknown", not "bad"**.
   → [infrastructure](data/infrastructure.md) · [ZBA decisions](data/zba-decisions.md) · [municipal zoning](data/municipal-zoning-outside-city.md)

10. **There is a way to check a score against reality, with limits we have not yet quantified.**
    - **What we have:** about 370 deduplicated residential new-construction projects since 2019, from one sweep's filter. The parcel-level counts differ by source and are not reconciled.
    - **What it could support:** reporting how well a rule-based score ranks parcels that were actually built on, and possibly a small regularized model. **Statistical power is uncomputed,** and heavy clustering shrinks the effective sample.
    - **Cautions:**
      - Being built reflects **demand × ease**, not ease alone.
      - Features that change after construction leak the outcome.
      - The 2025 rule change means past behavior reflects the old code.
    - **Precedent:** LA and SF Housing Element "likelihood of development" models.
    → [backtest and calibration](methods/backtest-and-calibration.md)

11. **Track 3's hardest requirement is epistemic, not computational.** The brief asks users to *"understand which conclusions are data-driven versus value judgments."*
    - **Carbon makes this concrete.** In a study of 503 as-built homes, **the same embodied-carbon data ranks typologies differently per m² depending on how floor area is defined.** Heated area favors semi-detached; a municipal gross-area definition favors townhouses. The study says policymakers "must weigh" which metric to use. The unit of comparison is a value judgment the tool has to expose.
    - **Other carbon sources we hold:**
      - A Dublin study: 316 / 396 / 437 kgCO2e/m² embodied (A1–A5) for house / duplex / apartment.
      - RECS 2020 national per-household site energy by building type: 94.6 MMBtu detached vs 33.7 for 5+ unit apartments.
      - These are **different quantities**. RECS is cross-sectional and confounded by unit size and household size, so it is not a density effect.
    → [carbon by typology](track3/carbon-by-typology.md) · [Track 3 brief](track3/brief-and-requirements.md)

12. ⚠ **Equity framing: where need and cheap land concentrate is not the same as where the published displacement metric flags risk, and neither should be simplified.**
    - A "densify here" ranking that favors need, transit and cheap vacant land will tend to point at the **Transitional and Stressed MVA markets, where Black residents are concentrated**: 45% of Black residents live in Transitional markets and 21% in Stressed, per the MVA summary.
    - But the published block-group **Displacement Risk Ratio does not flag those markets as high-risk.** Joining the two datasets:
      - In Transitional and Stressed markets, 319 of 371 block groups are "Below Countywide Ave", and only 4 are ≥1.0.
      - DRR ≥1.0 concentrates in **Robust** markets.
      - The DRR's formula is undocumented.
    - Until it is understood, neither market group should be labeled "highest displacement risk".
    - Design options that survive either reading:
      - show who benefits and who bears risk under each scenario
      - treat displacement as a warning rather than a tradeable weight
      - route contested cases to community consultation
    → [displacement and equity](track3/displacement-and-equity.md)

13. **Several ideas we first thought were distinctive turn out to be established practice or already proposed elsewhere.**
    - Permit-timeline prediction with confidence scores **won** Seattle's 2025 permitting hackathon (confirmed live).
    - Parcel "what can I build" tools, zoning envelopes, pro forma calculators and code chatbots are common.
    - A public participant research plan independently proposes sub-scores, "bad vs. unknown", historical-permit priors, and three archetype parcels.
    - We found **no example** of a Pittsburgh-specific score, ZBA outcome prediction, a per-typology ease score, or place-specific marginal carbon by typology. **That absence mostly reflects limited search reach.** We make no claim about what other teams will build.
    → [landscape](landscape/README.md) · [other participants](landscape/other-participants.md) · [hackathon precedents](landscape/hackathon-precedents.md)

14. **The build looks feasible on the team's stack if the geospatial work stays offline.** This is an untested recommendation from one feasibility sweep.
    - **Lowest-risk option we found, a static-first hybrid:**
      - a Python/DuckDB pipeline produces PMTiles and JSON
      - TypeScript scoring runs in the client
      - the server handles only LLM explanations and a Neon audit table for human overrides
    - **Riskiest pieces:**
      - the MapLibre v6 worker under Vite/SSR
      - large PMTiles on Vercel
      - hand-encoding zoning rules, now compounded by Bill 2026-0834
    - The scaffold's login wall is a demo risk.
    → [architecture options](build-plan/architecture-options.md) · [timeline and workstreams](build-plan/timeline-and-workstreams.md)

---

## Part I — What the challenge asks (all tracks)

The hackathon has three tracks. The packet asks each team to pick one and to demonstrate it on at least one Pittsburgh or Allegheny County case.

The Track 1 brief asks that a user be able to *"enter a parcel ID or compare multiple parcels and receive a source-grounded Development Ease Score, a plain-language explanation of the biggest barriers, and clear flags for zoning, environmental, infrastructure, or policy issues that require further review."* The landing page adds a pro forma angle ("grounded in public records and approved affordability assumptions"). The detailed brief does not repeat it, and the packet names the track "Development Feasibility Navigator".

The organizers' Brief Source Map lists a **fourth brief, "Policy-to-Permit Navigator"**, that is not among the site's tracks. Its core sources are the zoning code, PLI permits, OneStopPGH, ZBA decisions and municipal codes. Track 1's page lives at `challenges/policy-to-permit.html`, so we infer the brief was folded into Track 1, which would put permitting and ZBA work in scope. This is unconfirmed; ask the organizers.
→ [organizer catalog](data/organizer-data-catalog.md), [saved copy](../sources/organizers-2026-09-26-public-data-catalog-readme-and-brief-map.md)

Track 3 asks for a tool that *"should present scenarios rather than declare a single objectively correct neighborhood or housing type."*
→ [brief and judging](challenge/brief-and-judging.md), [Track 3 brief](track3/brief-and-requirements.md)

Judging has six criteria:
1. Problem value
2. User fit
3. Technical execution
4. Data & AI integrity
5. Actionability
6. Continuation potential

The packet rewards honesty explicitly: *"We don't have good data on X, so our tool doesn't claim to answer it"* is scored as a strength.

Mandatory checks:
- a limitations statement
- decision-support framing
- a public repo whose history starts at kickoff
- AI-tool disclosure
- a 3–5 minute demo video that states what is mocked

The sources conflict on team size: the packet says 1–5, the landing page says 3–5.
→ [rules and deliverables](challenge/rules-and-deliverables.md)

## Part II — What constrains building in Pittsburgh

**Dimensional rules.** Residential districts combine a use subdistrict (R1D, R1A, R2, R3, RM) with a density subdistrict (VL–VH).
- The §903.03 minimum lot sizes are in Summary §2.
- Setbacks and height vary by combination. For example, RM-H allows 85 ft and 9 stories, and RM-VH allows 180 ft.
- Party-wall construction sets the interior side yard to zero.
- Contextual standards (§925.06–.07) and residential compatibility (Ch. 916) can modify these.
- Nonconforming lots are governed by Ch. 921 (§921.04; read in round 6, and Bill 2026-0834 would amend it). An undersized vacant lot gets one house via an Administrator Exception if it is in separate ownership from abutting lots. Two or more units need a ZBA special exception. Same-owner abutting lots have no stated path.
→ [dimensional standards and use table](policy/dimensional-standards-and-use-table.md)

**Uses.** Among residential districts:
- single-unit detached is permitted everywhere
- two-unit requires R2+
- three-unit requires R3+
- multi-unit is by right only in RM

Above a district's ceiling, a project needs a use variance. Bill 2024-0701's proposed use-table changes are still in committee and are not law.

**Overlays.** See Summary §5.
→ [environmental overlays](policy/environmental-overlays-ch906.md), [environmental constraint data](data/environmental-constraints.md)

**Approval pathway.** A project's path is set by the most demanding step it triggers:

| Step | Trigger or decider |
|---|---|
| By-right zoning review | Default |
| Site Plan Review | ≥4 units, or any construction in the H district (mirror-read) |
| Administrator Exception | Zoning Administrator |
| Special Exception or Variance | ZBA |
| Conditional Use | Planning Commission, then Council |
| Historic Review Commission | Parcel in a historic district |
| RCO meeting | Hearing-bound projects meeting size thresholds |
| Stormwater review | Disturbance or impervious-area thresholds |
| PWSA and the DEP sewage planning module | Most net-new units |

→ [approval pathway](policy/approval-pathway.md), [parking](policy/parking.md), [inclusionary zoning](policy/inclusionary-zoning-and-bonus.md)

**Measured timelines.** See Summary §4. These are elapsed times that include applicant time, over the finished cases only.
→ [permit timelines](policy/permit-timelines.md)

## Part III — What agencies and practitioners say

- **City.** Permitting reform is under way (EO 2026-01; March 2026 plan). The plan includes *"investigating AI technologies to review applications for missing info"*. No vendor is named and no RFP was found.
  → [City](stakeholders/city-of-pittsburgh.md)
- **County.** A Feb 2026 executive order commissions a housing needs assessment, a land-bank review, a housing fund, and incentives for zoning reform. The organizer catalog lists an existing County HNA, but **its link returns 404 and we found no such report**. The order's "first" assessment is currently the better-supported reading.
  → [County](stakeholders/allegheny-county.md)
- **State.** The PA Housing Action Plan projects a 185k-unit shortfall by 2035. A 2026 PHFA policy fellow is studying Pittsburgh and Wilkinsburg's roughly 27,000 vacant lots. That is the closest match to Track 1 we found, and a possible person to validate with.
  → [State](stakeholders/state-dced-phfa.md)
- **Land Bank.**
  - About 5,000 tax-delinquent vacant lots and about 270 condemned buildings.
  - Federal funding ends after 2027.
  - An expected ~9-month title path, per the meeting summary cited in Summary §6.
  - A rehab pilot.
  → [Land Bank](stakeholders/land-bank.md)
- **Practitioners.** See Summary §6. One CEO notes rehab often costs more per square foot than new construction.
  → [practitioners](stakeholders/practitioners.md)

## Part IV — The data

The organizer catalog is the common starting kit.
→ [organizer catalog](data/organizer-data-catalog.md)

Beyond it:
- [Parcels and assessments](data/parcels-and-assessments.md): 585k rows; parcel polygons; address-to-parcel lookup. **Owner names exist on the County portal but must not be ingested (PII). Use the ownership category only.**
- [Zoning GIS](data/zoning-gis.md) and [zoning code text](data/zoning-code-text.md). The code text needs a browser.
- [Environmental constraints](data/environmental-constraints.md) and [LiDAR slope](data/lidar-slope.md): per-parcel slope classes from 3DEP.
- [Permits and outcomes](data/permits-and-outcomes.md): new-construction labels, a 2025 recode, demolitions.
- [Land availability and title](data/land-availability-and-title.md): city-owned vacant parcels (buildability breakdown in Summary §8), liens, delinquency, conservatorship.
- [Market and affordability](data/market-and-affordability.md): sales (code 16 marks new construction), HUD FY2026 limits, QCT/DDA.
- [Infrastructure](data/infrastructure.md): sewersheds with CSO ranking as a stress proxy; capacity not found.

**Freshness.** Many City layers were last edited in 2023, so every UI element should show a data-as-of date.

## Part V — Methods

- **Score structure.** These are options, with no pick yet:
  - gates vs. friction vs. opportunity, combined multiplicatively so a blocker can't be averaged away
  - per-typology scores
  - pathway-driven time and uncertainty
  - persona weight presets with a rank-stability check

  The literature precedents are mostly recalled, not re-read `[found]`: MCDA, CA Housing Elements, Portland BLI, UrbanSim, CalEnviroScreen.
  → [score design options](methods/score-design-options.md)
- **Calibration.** See Summary §10.
  → [backtest and calibration](methods/backtest-and-calibration.md)
- **Uncertainty and explanation:**
  - interval bands
  - per-factor confidence and vintage
  - observed / derived / assumed / unverified / normative labels
  - reason codes
  - planner override with an audit trail
  → [uncertainty and explainability](methods/uncertainty-and-explainability.md)
- **The LLM's role.** It explains and cites deterministic results. It extracts rules from code text only with human sign-off. It never produces a number, and the tool falls back to the reasons list without it.
  → [LLM role](methods/llm-role.md)
- **Pro forma.** Available inputs are the PHFA 2025–26 QAP caps and cost limits, HUD FY2026 limits, and sales comps. The weak link is local hard-cost data.
  → [pro forma](methods/pro-forma.md)

## Part VI — Track 3: typology, equity and climate

- **Indicators at each geography:**
  - Parcel: zoning and constraints.
  - Block group: MVA and DRR.
  - Tract: CHAS 2018–22, NRI, the City's Community Need layer, Opportunity Atlas (2010 tracts).
  - Stop: transit.
  - Known traps:
    - the Census API key
    - CHAS headers
    - NRI's resilience score, which looks county-level
    - the RCO layer's contact details, which are PII (request only the organization name and geometry)
  → [indicators and data](track3/indicators-and-data.md)
- **Typology prototypes.** Define each type by its lot needs, units, floor area, parking, cost, rent and carbon. Zoning filters the candidates, then user weights score the survivors, with each criterion labeled data or value.
  → [typology prototypes](track3/typology-prototypes.md)
- **Displacement and equity.** See Summary §12. The Urban Displacement Project has no Pittsburgh output in its repo.
  → [displacement and equity](track3/displacement-and-equity.md)
- **Carbon.** See Summary §11.
  → [carbon by typology](track3/carbon-by-typology.md)

## Part VII — Combining Tracks 1 and 3

Three shapes emerged, and none is recommended here:
- **A. Buildable → Fit, per parcel.** Track 1 gates the typologies, and Track 3 ranks the survivors under adjustable weights.
- **B. A policy what-if across both.** Current code vs. Bill 2025-1545 as proposed, which is "Held In Council", and possibly Bill 2026-0834. It must be labeled "proposed, not law".
- **C. Area-level scenarios.** Tract or neighborhood mixes, with Track 1 rolled up as a supply constraint.

Risks common to all three:
- one track on the form
- two headline numbers
- scope
- geography mismatches
→ [combining with Track 1](track3/combining-with-track1.md), [framings](landscape/framings.md)

## Part VIII — What already exists

- **Common:**
  - parcel lookup with a plain-language zoning report
  - 3D envelopes
  - pro forma calculators
  - RAG chat over code
- **Less common, with precedents:**
  - permit backtesting (LA/SF)
  - timeline prediction (Seattle's winner)
  - policy-lever simulators (Terner; an MIT-licensed El Paso tool)
  - typology-to-place tools (UrbanFootprint, Envision Tomorrow)
  - tract-level displacement typologies (UDP)
- **Not found:** see Summary §13.

Pittsburgh's own tools are data explorers, not scorers:
- WPRDC tools
- OneStopPGH Insights
- the Landslide portal
- ETHOS, a stormwater and green-infrastructure lot-suitability analysis

→ [commercial tools](landscape/commercial-tools.md), [hackathon precedents](landscape/hackathon-precedents.md), [Pittsburgh civic tools](landscape/pittsburgh-civic-tools.md)

## Part IX — Building it

See Summary §14. → [architecture options](build-plan/architecture-options.md), [data pipeline](build-plan/data-pipeline.md), [timeline and workstreams](build-plan/timeline-and-workstreams.md), [UX patterns](build-plan/ux-patterns.md)

The proposed sequence:
- a vertical slice by hour 4
- the full-city Track 1 layer by hour 12
- Track 3 overnight
- freeze Sunday morning
- video Sunday afternoon
- submit around 9–10pm

Cut lines are defined at hours 8, 12, 16, 18 and 20. All times are estimates.

---

## What this survey does not establish

- **That any user wants the tool.** No practitioner, planner or Land Bank staffer has been asked. The office-hours questions in [`../docs/03-open-questions.md`](../docs/03-open-questions.md) are the fastest test.
- **That our reading of the code is complete or current.**
  - Read on eCode360: §903.03, and SS-O/UM-O in Ch. 906.
  - Read on eCode360 in round 5: Ch. 914, 915 and 922, with §911.02 columns verified. Not read: Ch. 916 and the district chapters that may set PDP thresholds.
  - Read in round 6: Ch. 921 (nonconformities) and Ch. 916. Not found: the Planning Commission's Hillside Development Standards and any "40% slope" rule.
  - Two pending bills would amend much of this.
- **How often variances are granted, beyond one 2026 sample.** 90 decisions, about two-thirds coverage, withdrawals missing. About 1,000 older decisions on the Internet Archive are unpulled.
- **Infrastructure capacity for any parcel.** Not found in public data.
- **What the Displacement Risk Ratio measures.** Its formula is undocumented.
- **Anything about other teams' plans.**
- **That any build-time estimate holds.** None has been tested.

## Method and provenance

- **Sweeps** (full-fidelity agent reports) are in [`../sweeps/`](../sweeps/):
  - **r1:** prior art and pro forma; parcel, environmental and infrastructure data; zoning and reforms.
  - **r2:** deeper data; scoring; approval pathway; UX and stack.
  - **r3:** a reality check run after an overclaim.
  - **r4:** Track 3 data and prior art; build feasibility.
  - **r5:** primary records (Council, ZBA, eCode360), in progress.
- **Critique:** [`../docs/04-critique.md`](../docs/04-critique.md). 34 disputed claims, applied in this revision.
- **Primary text saved in [`../sources/`](../sources/):**
  - eCode360 §903.03 and §911.02
  - the organizer data catalog
  - round-5 Legistar, County and MVA extracts
- **Access blockers:** [`../admin/source-access.md`](../admin/source-access.md)
- **Bibliography:** [`../docs/02-bibliography.md`](../docs/02-bibliography.md)
- **Open questions:** [`../docs/03-open-questions.md`](../docs/03-open-questions.md)
- **Corrections:** [`README.md#corrections-log`](README.md#corrections-log)
