# Alternative framings for Track 1

**Type:** landscape
**One line:** Nine ways to frame a Track 1 product, each defined by its user, the decision it changes, what the LLM adds, and its main risk.
**Why we care:** The literal brief (a parcel scorecard) is the most common shape; other framings reuse the same rules engine but aim at a different user and a sharper decision. These are options, not a pick.
**Last checked:** 2026-09-26

## The table

Synthesised from the [r3 framings sweep](../../sweeps/r3-alternative-framings.md) and our [working notes](../../archive/working-notes-2026-09-26/06-framings.md). Feasibility ratings are the sweep's judgement, not a source fact.

| # | Framing | User / moment | Decision changed | Where the LLM adds value | Main risk | Feasibility |
|---|---|---|---|---|---|---|
| 1 | Parcel scorecard + citywide map (literal brief) | Planner, developer | Which parcels to pursue or fast-track | Plain-language explanation with citations | Similar to baseline tools and hackathon entries ([landscape README](README.md)); the "site selection" pain is weakly evidenced ([practitioners](../stakeholders/practitioners.md)) | High |
| 2 | Land Bank / city-lot disposition prioritizer | Land Bank or URA staff before board meetings; CDCs choosing lots | Which lots to clear title on and market first, and for what use | Cited per-lot rationale; explaining clusters; drafting the board memo | The Land Bank's priorities (funding runway, community goals) may not be "ease"; inventory data is messy | High |
| 3 | Assemblage finder | Mission-driven developer or CDC acquisitions lead | Combine small or steep lots into a viable site | Explaining threshold crossings; drafting outreach. Adjacency math stays deterministic | Geometry bugs; owner-contact privacy | Medium |
| 4 | Starter-home / missing-middle "what can I build here" | Small builders, homeowners with a side lot | Whether to buy or build, and which typology | Plain-language answers quoting the code section | Legal-advice-shaped tool on a code being rewritten; needs disclaimers and a pinned code version | Medium-high (if limited to 3–4 districts) |
| 5 | Pre-application / variance packet drafter with ZBA precedents | Applicant before filing with OneStopPGH or the ZBA | Redesign to stay by right vs file for relief; fewer resubmissions | Highest: retrieving similar past cases and outcomes, drafting the narrative, completeness checklist | ZBA PDFs are hard to fetch in bulk; may be read as "helping developers get around zoning"; a drafted precedent summary could misstate an outcome | Medium |
| 6 | Planner intake triage queue | City zoning intake staff | Routing: fast-track vs hearing | Summarising each application against its parcel; flagging likely missing items with the rule cited | No real application documents public (synthetic demo); City demand unconfirmed | Medium |
| 7 | Policy "unlock" simulator | Council staff, City Planning, advocates | Which amendment to push, by counting parcels that move from "needs a variance" to "by-right" | Turning amendment text into rule parameters, with human review | Code complexity; a wrong count is politically loaded | Medium (reuses the scoring engine) |
| 8 | Rehab / adaptive-reuse ease | Land Bank rehab pilot, small rehab investors, downtown conversions | Rehab vs demolish vs build | Summarising violation histories; change-of-use triggers | Building condition not in public data; office floor plates unavailable | Medium-low (office), medium (small residential) |
| 9 | Subsidy stack + gap matcher (the "Pro Forma" half) | Affordable developer's finance lead in pre-development | Does it pencil, and which programs to apply to | Pulling QAP criteria with page citations; stating the affordability assumptions used | Cost and rent inputs are guesses; the gap must be a range with user inputs | Medium (if kept simple) |

## Evidence behind the framings

- **Code in flux.** Minimum lot size per unit was removed in residential districts in May 2025 ([Pro-Housing Pittsburgh](https://www.prohousingpgh.org/blog/wins-minimum-lot-sizes) `[skimmed]`). In March 2026 the Mayor announced a full zoning code overhaul and said he was interested in "AI technologies to review applications for missing information" ([WESA](https://www.wesanews.org/politics-government/2026-03-09/pittsburgh-permitting-zoning-reforms) `[skimmed]`). This supports framings 4–7 and is the main staleness risk for all of them. See [reforms in flux](../policy/reforms-in-flux-2025-2026.md).
- **Land Bank.** 5,000–20,000 tax-delinquent properties, about 1,000 needing Land Bank intervention, about 80 sales in 2025; a new agreement is **expected** to cut title clearing from about 2 years to 9 months (⚠ a stated expectation, no outcome data *(corrected 2026-09-26 per docs/04-critique.md row 13)*); no dedicated city funding after 2027 ([WESA](https://www.wesanews.org/development-transportation/2025-11-20/pittsburgh-taxing-land-bank-blighted-properties) `[skimmed]`). Supports framing 2. See [Land Bank](../stakeholders/land-bank.md).
- **Permits are faster; discretionary steps are where waits appear.** Building permits fell from 27 to 11 days ([PublicSource](https://www.publicsource.org/pittsburgh-building-permits-faster-under-oconnor/) `[skimmed]`). The sweep infers long waits sit in ZBA, Planning Commission and RCO steps; it found no hard ZBA wait numbers. See [permit timelines](../policy/permit-timelines.md).
- **AI pre-screening elsewhere.** Seattle's CivCheck study recommended automating completeness checks only, since coverage mattered more than accuracy ([Seattle](https://innovation-hub.seattle.gov/2026/06/17/ai-construction-permitting-seattle-civcheck-study/) `[skimmed]`). Supports the narrow scope of framings 4 and 5.
- **ZBA sources** for framing 5: [process guide](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/process-guides-and-handouts/process-guide-handout-zba-2024.pdf) `[skimmed]`, [example decision PDF](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/e-jefferson-street-3-of-2026-zba-decision.pdf) `[skimmed]`. See [ZBA decisions](../data/zba-decisions.md).
- **Framing 8 incentives:** downtown conversion abatement and a state vacant-building abatement ([WPXI](https://www.wpxi.com/news/local/were-about-rescue-downtown-tax-abatement-program-help-transform-pittsburgh/Q4743VMR4FBMNH2B3HBZWJHIXA/) `[skimmed]`, [Axios](https://www.axios.com/local/pittsburgh/2025/04/15/downtown-pittsburgh-offices-housing-conversion) `[skimmed]`).
- **Framing 9 inputs:** [PHFA QAP 2025–26](https://www.phfa.org/forms/multifamily_program_notices/qap/2025_and_2026/2025-2026-lihtc-qap.pdf) `[read]` (read by the round-1 sweep). See [pro forma](../methods/pro-forma.md).

## Analogues named by the sweep

All `[skimmed]` (links from the sweep, not opened for this node): [Detroit Land Bank vacant land sales dashboard](https://data.detroitmi.gov/datasets/dlba-vacant-land-program-sales-dashboard), [Philadelphia Land Bank disposition policies](https://phillylandbank.org/acquisition-and-disposition-policies-landing/), [Chicago Large Lots](https://largelots.org), [Cleveland NEO CANDO](https://case.edu/socialwork/povertycenter/data-systems/neocando), [NYC ZoLa](https://zola.planning.nyc.gov), [LA ZIMAS](https://zimas.lacity.org), Symbium Build, [Terner Housing Policy Simulator](https://www.ternerlabs.org/terner-housing-policy-simulator-full-methodology) (the r4 sweep read this one: `[read]`).

## Tradeoffs the sweep draws (its judgement)

- **Data & AI Integrity:** framings 5 and 7 have a deterministic core, and the LLM's claims can be checked against precedents or rule text.
- **Closest to the brief's wording:** 1 (the literal dashboard), 2 and 4.
- **Continuation story:** 2 (Land Bank funding cliff and messy data) and 5/6 (the Mayor's stated AI interest). Neither is confirmed demand.
- **Hardest to fake:** 8 and 9, which need data that isn't public.
- **Shared foundation:** one parcel-and-zoning rules engine powers 2, 3, 4 and 7 (and, by our inference, 1), so one engine could show two views.
- **Interface is a separate axis:** map, chat or memo. Memos and packets (2, 5, 9) give judges and users something concrete to take away; chat is weaker on citations unless every answer points to a record.

Note: the sweep numbers its framings 1–8 without the literal scorecard; this table adds the scorecard as #1, so sweep numbers are shifted by one. The tradeoff bullets above use this table's numbering.

## Open questions
- Who is the intended user: Land Bank or URA staff, CDCs, small builders or planners? Is any of them a judge? (Mentor question.)
- Where do Pittsburgh projects actually stall most: ZBA, RCO/Planning Commission, title, or financing?
- Would the City or Land Bank use a tool that ranks specific lots, given the political risk?
- Is a financing pro forma in scope for Track 1? See [brief and judging](../challenge/brief-and-judging.md).

## Connects to
- [Brief and judging](../challenge/brief-and-judging.md): which criteria each framing serves
- [Hackathon precedents](hackathon-precedents.md): which framings echo past winners
- [Land Bank](../stakeholders/land-bank.md), [City of Pittsburgh](../stakeholders/city-of-pittsburgh.md), [practitioners](../stakeholders/practitioners.md): the users behind each framing
- [ZBA decisions](../data/zba-decisions.md): framing 5's data
- [Land availability and title](../data/land-availability-and-title.md): framings 2 and 3
- [Reforms in flux](../policy/reforms-in-flux-2025-2026.md): framing 7 and staleness risk
- [Pro forma](../methods/pro-forma.md): framing 9
- [Architecture options](../build-plan/architecture-options.md): the shared rules engine
- [UX patterns](../build-plan/ux-patterns.md): map vs chat vs memo

## Sources
- [Pro-Housing Pittsburgh, minimum lot sizes](https://www.prohousingpgh.org/blog/wins-minimum-lot-sizes) `[skimmed]` *(accessed 2026-09-26)*
- [WESA, permitting and zoning reforms (2026-03-09)](https://www.wesanews.org/politics-government/2026-03-09/pittsburgh-permitting-zoning-reforms) `[skimmed]` *(accessed 2026-09-26)*
- [WESA, Land Bank (2025-11-20)](https://www.wesanews.org/development-transportation/2025-11-20/pittsburgh-taxing-land-bank-blighted-properties) `[skimmed]` *(accessed 2026-09-26)*
- [PublicSource, faster permits](https://www.publicsource.org/pittsburgh-building-permits-faster-under-oconnor/) `[skimmed]` *(accessed 2026-09-26)*
- [Seattle CivCheck study](https://innovation-hub.seattle.gov/2026/06/17/ai-construction-permitting-seattle-civcheck-study/) `[skimmed]` *(accessed 2026-09-26)*
- [ZBA process guide 2024](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/process-guides-and-handouts/process-guide-handout-zba-2024.pdf) `[skimmed]` *(accessed 2026-09-26)*
- [Example ZBA decision](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/e-jefferson-street-3-of-2026-zba-decision.pdf) `[skimmed]` *(accessed 2026-09-26)*
- [WPXI, downtown abatement](https://www.wpxi.com/news/local/were-about-rescue-downtown-tax-abatement-program-help-transform-pittsburgh/Q4743VMR4FBMNH2B3HBZWJHIXA/) `[skimmed]` *(accessed 2026-09-26)*
- [Axios, office-to-housing](https://www.axios.com/local/pittsburgh/2025/04/15/downtown-pittsburgh-offices-housing-conversion) `[skimmed]` *(accessed 2026-09-26)*
- [PHFA QAP 2025–2026](https://www.phfa.org/forms/multifamily_program_notices/qap/2025_and_2026/2025-2026-lihtc-qap.pdf) `[read]` *(accessed 2026-09-26)*
- [Terner Housing Policy Simulator](https://www.ternerlabs.org/terner-housing-policy-simulator-full-methodology) `[read]` *(accessed 2026-09-26)*
- Analogues (Detroit, Philadelphia, Chicago, Cleveland, ZoLa, ZIMAS) `[skimmed]` *(accessed 2026-09-26)*: links above
- Working notes: [../../archive/working-notes-2026-09-26/06-framings.md](../../archive/working-notes-2026-09-26/06-framings.md)
- Sweep: [../../sweeps/r3-alternative-framings.md](../../sweeps/r3-alternative-framings.md)
- [Adversarial critique](../../docs/04-critique.md) — row 13
