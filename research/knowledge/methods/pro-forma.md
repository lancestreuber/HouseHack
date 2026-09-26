# Pro forma

**Type:** method
**One line:** The inputs a first-pass development pro forma for a Pittsburgh parcel would need, where each can be sourced, and how solid each source is.
**Why we care:** Track 1 asks for feasibility "grounded in public records and approved affordability assumptions." The program caps and income limits are well sourced; hard costs are not, and that gap has to be shown on screen.
**Last checked:** 2026-09-26

## Form options

| Option | What it computes | Source of the idea |
|---|---|---|
| **Residual land value (RLV)** | RLV = (NOI / cap rate) − hard − soft − financing costs, compared to land value; feasible if RLV > current value | Terner Center approach as summarized in the [scoring sweep](../../sweeps/r2-scoring-algorithm-and-validation.md) (from memory) |
| **Simple gap** | Total development cost vs what 50–80% AMI buyers or renters can afford, or vs appraisal | [Prior-art sweep](../../sweeps/r1-prior-art-proforma-and-practitioner-barriers.md) "bottom line" |
| **IRR / probability-of-build** | Target return with inputs for land cost, rents, affordability, height, parking, permitting time | Terner Center Housing Development Dashboard, fetched by the prior-art sweep; defaults set for north Oakland, CA |

The scoring sweep's draft: RLV_t = Units × (rent × 12 × (1 − vacancy/opex)) / cap rate − (hard cost/sf × GFA + soft cost % + time cost from the approval pathway); feasibility gap = RLV − assessed land value. It treats the pro forma as a **stretch goal**, and says to put every input on screen with its source.

## Inputs and their sources

### Affordability targets: HUD FY2026 income limits (strong)

Parsed from HUD's own FY2026 xlsx, Pittsburgh, PA HUD Metro FMR Area, Allegheny row ([parcel/infrastructure sweep](../../sweeps/r1-parcel-environmental-infrastructure-data.md)):

| | Area median income | 30%, 4-person | 50%, 4-person | 80%, 4-person |
|---|---|---|---|---|
| **FY2026** | **$110,400** | $33,100 | **$55,200** | **$88,300** |
| FY2025 | $107,300 | $32,200 | $53,650 | $85,850 |

⚠ **Contradictions kept visible:**
- The prior-art sweep labeled $55,200 (50%) and $88,300 (80%) as **FY2025**, from a secondary source (Mon Valley Initiative). The xlsx shows these are **FY2026**; FY2025 was $53,650 / $85,850. Logged in the [corrections log](../README.md#corrections-log). We believe the xlsx.
- The same sweep reported a search snippet putting FY2026 50% at $54,650. The xlsx says $55,200. We believe the xlsx.
- The prior-art sweep's 4-person 60% figure ($66,240) came from the secondary source and is not in the xlsx extract; recompute it from the xlsx if needed.
- **Do not confuse** the HUD AMI of $110,400 with the PHFA Keystone homebuyer income limit for Allegheny County (July 2026), which is also $110,400, but for 1–2 person households ($126,900 for 3+) and is a different program limit ([prior-art sweep](../../sweeps/r1-prior-art-proforma-and-practitioner-barriers.md), `[skimmed]`).
- HUD's HTML summary pages and FMR/SAFMR API were not usable (HTTP 202 empty body; "Unauthenticated") ([deeper data sweep](../../sweeps/r2-deeper-data-sources.md)).

### LIHTC caps: PHFA 2025–2026 QAP (strong, read)

From the QAP PDF, read by the prior-art sweep:
- **Maximum basis per unit (§3.4):** $320,000 for 9% credits; $380,000 for 4% credits with tax-exempt bonds. Excludes developer fee and acquisition.
- **Developer fee:** 15% of the first $10M of replacement cost, 10% after. 9% deals capped at $1.75M ($2.0M for 60+ units or supportive housing). 4% deals: paid-fee cap $2.55M.
- **Credit pools:** roughly 50% Urban, 50% Suburban/Rural; at least 25% of the Urban Pool initially set aside for places other than Philadelphia.

### Soft-cost ratios: PHFA Development Cost Limits, revised 1/17/25 (strong, read)
- General requirements up to 6% of hard costs; builder's overhead 2%; builder's profit 6%.
- Construction contingency 5% new construction, 10% rehab.
- Legal fees up to $175K; cost certification up to $15K.
- Architect fees on a sliding scale, e.g. 9.5% at $100K of construction cost and 7.31% at $1M for "regular" (townhouse or walk-up) developments.

### Local subsidy: URA Housing Opportunity Fund (partial)
- Programs: Rental Gap, For-Sale Development (low-interest construction financing and/or grants), Small Landlord Fund, Homeowner Assistance (up to $35K), Housing Stabilization (up to $6K), down-payment assistance ([URA page](https://www.ura.org/pages/housing-opportunity-fund-programs), read by the prior-art sweep).
- **The page gives no per-unit caps or AMI targets.** Those remain unknown.
- The fund is under budget pressure ([WESA, 2025-12-08](https://www.wesanews.org/politics-government/2025-12-08/ura-housing-opportunity-fund-pittsburgh-finances), `[skimmed]`).

### Inclusionary zoning and the proposed bonus (policy, changing)
- Mandatory IZ in Lawrenceville, Bloomfield, Polish Hill and Oakland for 20+ units: 10% set-aside at 50% AMI rents (`[skimmed]` via PublicSource / Pro-Housing Pittsburgh); 35-year term (EngagePGH, `[read]`).
- Proposed voluntary citywide bonus (June 2026 draft): 10–20% affordable at ≤50% AMI rental / ≤80% AMI owner for 20 years; 1 point = 15 ft extra height (2–6 points), or $25/sf payment in lieu; recommended by Planning Commission June 3, 2026; Council hearing scheduled Sept 23, 2026. Model as a toggle. Details in [inclusionary zoning and bonus](../policy/inclusionary-zoning-and-bonus.md).

### Revenue side: sales comps and rents (usable, with work)
- **New-construction comps:** WPRDC sales (503,747 rows, current to 2026-09-24) sale code **16, "BUILDING NOT YET ASSESSED" (6,657 rows)** marks sales of newly built houses. Valid-sale filter is `SALECODE='0'` (99,176). Exclude codes 3, H, 9, 33, 35, 13 ([deeper data sweep](../../sweeps/r2-deeper-data-sources.md)).
- The sales table has **no square footage**: join on PARID to assessments (FINISHEDLIVINGAREA, YEARBLT, LOTAREA, etc.) to get neighborhood new-construction $/sf as an after-repair-value proxy.
- The WPRDC SQL endpoint returns 403; use `datastore_search` with filters or the bulk dump.
- **Rents:** Zillow ZORI by ZIP covers 55 Allegheny ZIPs through 2026-08. ACS median rent needs a Census API key; the keyless city layer `C/ACS_DP04` is 2020 5-year data.

### Hard costs (weak: the main gap)
- The only public-ish Pittsburgh figure found: a builder blog giving **$200–450/sf** for new construction in 2026, plus **$30K–80K** for hillside site work and **10–20%** soft costs ([Incline Homes blog](https://incline-homes.com/blog/cost-to-build-a-new-home-in-pittsburgh/), `[skimmed]`). A builder's marketing page is a lead, not a benchmark.
- One real project data point: about **$300K per unit** on a 9-unit rehab in Hazelwood ($2.7M total); deals typically combine **11–13 funding sources**; one nonprofit hit about **$1M of unexpected infrastructure cost** on one project ([WESA, 2025-02-12](https://www.wesanews.org/development-transportation/2025-02-12/building-affordable-housing-expensive-difficult), `[read]`). That is rehab, not new construction.
- Average single-family rehab cost "approaching $350K", above many properties' value (the appraisal gap) ([PCRG](https://www.pcrg.org/pulse/closing-the-appraisal-gap-how-nhia-can-revitalize-disinvested-communities), `[read]`).
- Options: show hard cost as a user-editable range with the source named; show results at the low, middle and high ends of the range; or omit a dollar result and show only the gap direction.

### Other cost and time inputs
- **Approval time** from the pathway (see [approval pathway](../policy/approval-pathway.md)); the Sewage Facilities Planning Module can add 3–6 months ([approval sweep](../../sweeps/r2-approval-pathway-and-timelines.md)).
- **Site conditions:** hillside work (above), contamination (PA DEP Act 2 / AUL layers), undermining ([deeper data sweep](../../sweeps/r2-deeper-data-sources.md)).
- **LIHTC basis boost eligibility:** QCT / DDA 2026 layers queried by the parcel sweep. See [market and affordability](../data/market-and-affordability.md).
- **Cap rate, vacancy, opex:** no Pittsburgh source in the sweeps. These are assumptions.

## Open questions
- A defensible Pittsburgh hard cost per sf for new small multifamily. No source beyond a builder blog.
- URA per-unit subsidy caps and AMI targets (not on the program page; the prior-art sweep suggests asking URA staff).
- Cap rate, vacancy and opex assumptions for Pittsburgh.
- Whether the IZ bonus passes, and when.
- Whether code-16 sales plus assessment square footage give enough comps per neighborhood to be useful.

## Connects to
- [Market and affordability](../data/market-and-affordability.md): HUD limits, QCT/DDA, rents
- [State DCED / PHFA](../stakeholders/state-dced-phfa.md): the QAP and cost limits
- [Inclusionary zoning and bonus](../policy/inclusionary-zoning-and-bonus.md): set-aside rules and toggle
- [Parcels and assessments](../data/parcels-and-assessments.md): square footage for comps
- [Score design options](score-design-options.md): feasibility as an optional layer
- [Approval pathway](../policy/approval-pathway.md): time cost
- [Practitioners](../stakeholders/practitioners.md): appraisal gap, funding-stack complexity
- [Commercial tools](../landscape/commercial-tools.md): Terner and commercial feasibility tools

## Sources
- [HUD FY2026 Section 8 income limits (xlsx)](https://www.huduser.gov/portal/datasets/il/il26/Section8-FY26.xlsx) `[read]` *(accessed 2026-09-26)*: parsed by the parcel/infrastructure sweep; AMI $110,400, 50% $55,200, 80% $88,300 (4-person)
- [PHFA 2025–2026 LIHTC QAP](https://www.phfa.org/forms/multifamily_program_notices/qap/2025_and_2026/2025-2026-lihtc-qap.pdf) `[read]` *(accessed 2026-09-26)*: basis caps, developer fee, pools
- [PHFA Development Cost Limits, revised 1/17/25](https://www.phfa.org/forms/multifamily_application_guidelines/application/2025-2026-mai-07.pdf) `[read]` *(accessed 2026-09-26)*: soft-cost ratios, contingency, fees
- [URA Housing Opportunity Fund programs](https://www.ura.org/pages/housing-opportunity-fund-programs) `[read]` *(accessed 2026-09-26)*: program list; no per-unit caps
- [WESA: URA Housing Opportunity Fund finances (2025-12-08)](https://www.wesanews.org/politics-government/2025-12-08/ura-housing-opportunity-fund-pittsburgh-finances) `[skimmed]` *(accessed 2026-09-26)*: budget pressure
- [Mon Valley Initiative: Pittsburgh HUD income limits](https://www.monvalleyinitiative.com/pittsburgh-hud-income-limits) `[skimmed]` *(accessed 2026-09-26)*: secondary source; mislabeled year (see corrections log)
- [PHFA Keystone income limits, appendix A](https://www.phfa.org/forms/sellersguide/appendices/a.pdf) `[skimmed]` *(accessed 2026-09-26)*: $110,400 (1–2 persons) homebuyer limit, a different measure
- [EngagePGH: Inclusionary Zoning](https://engage.pittsburghpa.gov/implementing-housing-needs-assessment/inclusionary-zoning-iz) `[read]` *(accessed 2026-09-26)*: 35-year term; proposed bonus
- [WESA: Planning Commission on voluntary IZ (2026-06-03)](https://www.wesanews.org/development-transportation/2026-06-03/pittsburgh-planning-commission-vountary-inclusionary-zoning) `[read]` *(accessed 2026-09-26)*: recommendation to Council
- [WPRDC property sales, resource 5bbe6c55-bce6-4edb-9d04-68edeb6bf7b1 (bulk dump)](https://data.wprdc.org/datastore/dump/5bbe6c55-bce6-4edb-9d04-68edeb6bf7b1) `[read]` *(accessed 2026-09-26)*: sale code 16 new-construction comps; queried by the deeper data sweep
- [WPRDC property assessments, resource 65855e14-549e-4992-b5be-d629afc676fa (bulk dump)](https://data.wprdc.org/datastore/dump/65855e14-549e-4992-b5be-d629afc676fa) `[read]` *(accessed 2026-09-26)*: square footage and year built for the join
- [Zillow ZORI by ZIP (CSV)](https://files.zillowstatic.com/research/public_csvs/zori/Zip_zori_uc_sfrcondomfr_sm_month.csv) `[read]` *(accessed 2026-09-26)*: rents through 2026-08
- [Incline Homes: cost to build in Pittsburgh](https://incline-homes.com/blog/cost-to-build-a-new-home-in-pittsburgh/) `[skimmed]` *(accessed 2026-09-26)*: $200–450/sf; builder blog
- [WESA: building affordable housing is expensive (2025-02-12)](https://www.wesanews.org/development-transportation/2025-02-12/building-affordable-housing-expensive-difficult) `[read]` *(accessed 2026-09-26)*: ~$300K/unit rehab, 11–13 funding sources
- [PCRG: closing the appraisal gap](https://www.pcrg.org/pulse/closing-the-appraisal-gap-how-nhia-can-revitalize-disinvested-communities) `[read]` *(accessed 2026-09-26)*: ~$350K rehab cost
- [Terner Center Housing Development Dashboard](https://ternercenter.berkeley.edu/development-calculator-dashboard/) `[read]` *(accessed 2026-09-26)*: closest analog for the pro forma half
- Sweep: [../../sweeps/r1-prior-art-proforma-and-practitioner-barriers.md](../../sweeps/r1-prior-art-proforma-and-practitioner-barriers.md) `[read]` *(accessed 2026-09-26)*: PHFA, URA, IZ, hard costs
- Sweep: [../../sweeps/r1-parcel-environmental-infrastructure-data.md](../../sweeps/r1-parcel-environmental-infrastructure-data.md) `[read]` *(accessed 2026-09-26)*: HUD xlsx figures
- Sweep: [../../sweeps/r2-deeper-data-sources.md](../../sweeps/r2-deeper-data-sources.md) `[read]` *(accessed 2026-09-26)*: sales codes, ZORI, HUD API status
- Sweep: [../../sweeps/r2-scoring-algorithm-and-validation.md](../../sweeps/r2-scoring-algorithm-and-validation.md) `[read]` *(accessed 2026-09-26)*: RLV draft formula
- Sweep: [../../sweeps/r2-approval-pathway-and-timelines.md](../../sweeps/r2-approval-pathway-and-timelines.md) `[read]` *(accessed 2026-09-26)*: sewage planning module time
