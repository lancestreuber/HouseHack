# Sweep: Commercial/civic prior art, PHFA/HUD/URA pro forma inputs, practitioner-cited barriers

**Round 1** · 2026-09-26 · single research subagent, web search and fetch plus live endpoint probes

> Archived at full fidelity, exactly as the agent reported it. Its tags are its own: some sweeps use [V]/[S]/[U] and some use [F]/[S]. The paper maps these onto `[read]` / `[skimmed]` / `[found]` / `[inaccessible]`. Local scratch paths have been replaced with `<scratch>`. Treat claims here as leads, and check the paper and the corrections log before citing.

---

## Research report: Track 1, Development Feasibility and Pro Forma Navigator (Pittsburgh)

Key: **[V]** means I fetched the page or PDF and read the text myself. **[S]** means it comes only from a search snippet or a secondary aggregator. **[K]** means it is general background knowledge that I did not check this session.

### 1. Commercial prior art

- **Zoneomics.** Has a Pittsburgh zoning page listing zone codes, setbacks, height, coverage, density, lot dimensions, permitted uses, parking requirements and 24-hour zoning reports. Pricing is subscription or "contact us" and no rates are published [V] https://www.zoneomics.com/zoning-maps/pennsylvania/pittsburgh. Claims 23,500+ cities and supplies the zoning data used inside TestFit and Autodesk Forma [S] https://www.testfit.io/integrations-zoneomics.
- **Regrid.** Sells Allegheny County parcels with a "Standardized Zoning" schema, bought by county, state or nationwide [S] https://app.regrid.com/store/us/pa/allegheny.
- **Deepblocks.** Miami-based tool that works out development capacity per parcel. Snippet pricing is $99, $499, $1,999 and $5,999 per month, with no free tier [S] https://buildingtech.pro/tools/deepblocks.
- **Gridics (ZoneIQ).** Sold mainly to cities under municipal contracts, with no public prices [S] https://gridics.com/zoneiq/.
- **TestFit.** Does site yield and feasibility modeling and uses Zoneomics for zoning data [S].
- **Symbium.** Turns zoning code into computer rules ("computational law"); its coverage is mostly California [S] https://www.govtech.com/biz/Symbium-Opens-Service-for-Analyzing-Zoning-Building-Codes.html.
- **Archistar.** Runs AI plan pre-checks for Austin and Los Angeles [S] https://www.archistar.ai/aiprecheck/.
- **UrbanForm, LandTech, Envelope, PermitFlow.** UrbanForm covers a limited list of cities; LandTech is mainly a UK product; Envelope covers NYC; PermitFlow handles permit paperwork, not feasibility [K/S]. I found no evidence that any of them covers Pittsburgh in depth, but I did not verify each one.

**The gap a hackathon tool could fill.** Nothing I found combines four things:
1. A free, public-sector tool.
2. Explainable flags that each cite their source record.
3. Pittsburgh-specific constraints: landslide-prone slopes, tangled title and tax-delinquent lots, recent zoning reform, and the inclusionary zoning overlay.
4. Financing assumptions tied to programs, such as PHFA cost limits, HUD income limits and URA subsidies.

The commercial tools are built for private developers chasing market-rate yield and are not affordability-aware.

### 2. Civic and academic prior art

- **National Zoning Atlas, Pennsylvania [V].** It is actively working in the Pittsburgh metro area, which has more jurisdictions than any metro except New York City. It has an online map and "Zoning Snapshots", and a "Zoning Report: Pittsburgh" is due in fall 2026. https://www.zoningatlas.org/pennsylvania. This is directly relevant: it could be a data source or a partner, or it could be a competitor on the zoning layer.
- **Terner Center Housing Development Dashboard [V].** A free beta calculator that estimates the probability a project gets built, using internal rate of return (IRR). Inputs are target return, land cost, rents or sale prices, affordability requirements, height, parking, permitting time and discretionary approvals. Its defaults are set for north Oakland, California. https://ternercenter.berkeley.edu/development-calculator-dashboard/. It is the closest analog for the pro forma half of the tool.
- **Pittsburgh data tools [S].**
  - WPRDC parcel data, the Burgh's Eye View parcel map, and WPRDC Tools: https://tools.wprdc.org/
  - Lots to Love, which says there are more than 45,000 vacant lots in Allegheny County: https://www.lotstolove.org/ and https://data.wprdc.org/dataset/lots-to-love
  - The City's Vacant Lot Toolkit and Adopt-A-Lot: https://www.pittsburghpa.gov/Business-Development/City-Planning/Planning-Programs/Adopt-A-Lot/Vacant-Lot-Toolkit
  - The Allegheny County Landslide Portal: https://landslide-portal-alcogis.opendata.arcgis.com/
  - OneStopPGH Insights, a permitting dashboard: https://experience.arcgis.com/experience/89d500285ecd4804ae9945d93d424569
  - PublicSource Board Explorer, which covers the Zoning Board of Adjustment (ZBA): https://boards.publicsource.org/board/zoning-board-of-adjustment/
- **Academic work [V].** Lenze, Hinojos and Grady (Journal of Urban Planning and Development, 2024) studied 210 ZBA applications from 2020 against a social vulnerability index. They found no significant overall relationship, but significant links with the share of pre-1940 housing and of multifamily units. https://ascelibrary.com/doi/full/10.1061/JUPDDM.UPENG-4474. Separately, CMU's Remaking Cities Institute supported a "Residential Zoning by Race" project [S].
- **National analogs [K, not fetched].** NYC ZoLa, Philadelphia Atlas and UrbanFootprint are well-known examples of parcel lookup plus zoning. I found no parcel-level feasibility tool from any Pittsburgh public agency.

### 3. Pro forma assumptions

**PHFA 2025/2026 Qualified Allocation Plan [V]** (https://www.phfa.org/forms/multifamily_program_notices/qap/2025_and_2026/2025-2026-lihtc-qap.pdf):
- Maximum basis per unit (§3.4) is **$320,000 for 9% credits** and **$380,000 for 4% credits with tax-exempt bonds**. This excludes developer fee and acquisition.
- Developer fee is 15% of the first $10M of replacement cost and 10% after that. For 9% deals it is capped at $1.75M, or $2.0M for 60+ units or supportive housing. For 4% deals the paid-fee cap is $2.55M.
- Credits are split roughly 50% Urban Pool and 50% Suburban/Rural Pool. At least 25% of the Urban Pool is initially set aside for places other than Philadelphia.

**PHFA Development Cost Limits (revised 1/17/25) [V]** (https://www.phfa.org/forms/multifamily_application_guidelines/application/2025-2026-mai-07.pdf):
- General requirements up to 6% of hard costs; builder's overhead 2%; builder's profit 6%.
- Construction contingency 5% for new construction and 10% for rehab.
- Legal fees up to $175K; cost certification up to $15K.
- Architect fees run on a sliding scale, e.g. 9.5% at $100K of construction cost and 7.31% at $1M for "regular" (townhouse or walk-up) developments.

**HUD income limits.**
- FY2025 Pittsburgh HMFA [S, via Mon Valley Initiative] (https://www.monvalleyinitiative.com/pittsburgh-hud-income-limits), for a 4-person household: 30% = $33,100; 50% = $55,200; 60% = $66,240; 80% = $88,300.
- FY2026 [unverified]: a snippet put the 50% limit at $54,650 (4-person) and $38,300 (1-person). That is lower than FY2025, which is odd. HUD's site blocked my fetches, so pull the figures directly from https://www.huduser.gov/portal/datasets/il.html.
- PHFA Keystone homebuyer income limit for Allegheny County (July 2026) is $110,400 for 1–2 persons and $126,900 for 3+ [S] https://www.phfa.org/forms/sellersguide/appendices/a.pdf.

**Hard costs.**
- The only public-ish source is a builder blog giving $200–450 per sq ft for Pittsburgh new construction in 2026. It adds $30K–80K for hillside site work and 10–20% soft costs [S] https://incline-homes.com/blog/cost-to-build-a-new-home-in-pittsburgh/.
- Real project figure [V]: Rising Tide Partners spent about $300K per unit on a 9-unit rehab in Hazelwood ($2.7M total). Deals typically combine 11–13 funding sources. ACTION Housing hit about $1M of unexpected infrastructure cost on one project. https://www.wesanews.org/development-transportation/2025-02-12/building-affordable-housing-expensive-difficult

**Urban Redevelopment Authority (URA) Housing Opportunity Fund [V]** (https://www.ura.org/pages/housing-opportunity-fund-programs):
- Programs are Rental Gap, For-Sale Development (low-interest construction financing and/or grants), Small Landlord Fund, Homeowner Assistance (up to $35K), Housing Stabilization (up to $6K) and down-payment assistance.
- The page gives no per-unit caps or AMI targets, so those are still unknown. The fund is also under budget pressure [S] https://www.wesanews.org/politics-government/2025-12-08/ura-housing-opportunity-fund-pittsburgh-finances.

**Inclusionary zoning.**
- Mandatory in Lawrenceville, Bloomfield, Polish Hill and Oakland for 20+ units. It requires a 10% set-aside, with rents affordable at 50% AMI [S: PublicSource / Pro-Housing Pittsburgh].
- Affordability term is 35 years for both rental and owner units [V] https://engage.pittsburghpa.gov/implementing-housing-needs-assessment/inclusionary-zoning-iz.
- Proposed optional citywide Affordable Housing Bonus (June 2026 draft) [V, same page]:
  - Applies where 4+ units are allowed, excluding the Golden Triangle zoning district.
  - 10–20% of units must be affordable: at or below 50% AMI for rentals and 80% AMI for owner units, for 20 years.
  - Bonus is 1 point = 15 ft of extra height (2–6 points), or a payment in lieu of $25 per sq ft.
- Planning Commission recommended the voluntary version on June 3, 2026, and it now awaits City Council [V] https://www.wesanews.org/development-transportation/2026-06-03/pittsburgh-planning-commission-vountary-inclusionary-zoning. A council hearing was scheduled for Sept 23, 2026 [V, EngagePGH], so the rule may be changing right as you present. Build it as a configurable toggle.

### 4. Barriers practitioners cite

**Zoning and nonconforming lots.**
- The City's own analysis found a "high preponderance of lots that did not meet current minimum lot size requirements" in low and very-low density zones [V] https://engage.pittsburghpa.gov/implementing-housing-needs-assessment/minimum-lot-size. **I could not find a published percentage of nonconforming lots, or a share of projects that need variances.** Computing that share from parcel data and zoning geometry would be a genuinely new contribution.
- Bill 2025-1579, signed May 7, 2025 [V], cut minimum lot sizes:

  | Subdistrict | Before (sq ft) | After (sq ft) |
  |---|---|---|
  | Very low density | 8,000 | 6,000 |
  | Low density | 5,000 | 3,000 |
  | Moderate density | 3,200 | 2,400 |
  | High density | 1,800 | 1,200 |
  | Very high density | 1,800 (EngagePGH; a snippet said 1,200) | None |

  It also removed lot-size-per-unit requirements everywhere.
- **Your nonconformity flags must use the post-May-2025 rules.**
- Bill 2025-1545 would legalize accessory dwelling units (ADUs) and remove parking minimums citywide. It is pending [V]. Mayor O'Connor's Executive Order 2026-01 launched a "Phase One" zoning amendment, also pending [V] https://engage.pittsburghpa.gov/pittsburghs-zoning-code-amendment-hub.

**ZBA.** There were 210 applications in 2020 [V, paper above]. The process takes 3–5 months [S].

**Permitting has improved, so it is not a strong pain point to pitch [V]** (PublicSource, 9/23/2026, https://www.publicsource.org/pittsburgh-building-permits-faster-under-oconnor/):
- Building and development permits dropped from 27 days (July 2025) to 11 days (July 2026).
- Single-family permits dropped from 11 days to 5.
- There is now an EZ Permits track for 15 permit types.

**Vacancy and tangled title [V]** (PublicSource, 12/22/2025, https://www.publicsource.org/pittsburgh-housing-shortage-population-decline-vacant-homes/):
- More than 20,000 vacant units, about 15% of the housing stock, many with "dead-end" tangled titles.
- The Land Bank has received no city money since its initial $3.5M in 2021. The city is not foreclosing on tax-delinquent vacant homes, so "these properties are simply inaccessible."

**Appraisal gap [V].** PCRG says the average cost to rehab a single-family home is approaching $350K, well above the value of many properties (3/3/2025) https://www.pcrg.org/pulse/closing-the-appraisal-gap-how-nhia-can-revitalize-disinvested-communities.

**Slopes and landslides, and sewer and infrastructure [S].**
- Landslides destroyed a home on Greenleaf St in 2018 and closed William St on Mount Washington. The William St fix is a roughly $10M FEMA-backed project.
- ALCOSAN is under a federal consent decree for sewer overflows.
- Sources: https://www.publicsource.org/landslides-pittsburgh-mount-washington-federal-funds-mayor-gainey-traffic/ and https://www.wesa.fm/development-transportation/2024-10-25/pittsburgh-landslides-flooding-insurance
- I found no public figures on PWSA or ALCOSAN capacity or tap-in fees for individual parcels.

### Bottom line for the team

- **Differentiator:** a free, cited, explainable parcel score that combines:
  - zoning conformity under the post-2025 rules
  - the landslide and slope layer
  - tax-delinquency and ownership status, as a proxy for tangled title
  - whether the parcel is in the inclusionary zoning overlay or eligible for the bonus
  - a simple gap calculation: cost (PHFA caps and fee percentages, local $/sq ft) against value or appraisal and what 50–80% AMI buyers or renters can afford.
- **Risks:**
  - The National Zoning Atlas Pittsburgh report lands this fall and overlaps on zoning.
  - The inclusionary zoning and parking rules may change within weeks.
  - HUD FY2026 income limits and URA per-unit subsidy caps are unverified. Get them from HUD User and URA staff, or mark them "assumption, pending approval."

