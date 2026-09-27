# Sweep: Alternative product framings for Track 1

**Round 3** · 2026-09-26 · single research subagent, web search and fetch plus live endpoint probes

> Archived at full fidelity, exactly as the agent reported it. Its tags are its own: some sweeps use [V]/[S]/[U] and some use [F]/[S]. The paper maps these onto `[read]` / `[skimmed]` / `[found]` / `[inaccessible]`. Local scratch paths have been replaced with `<scratch>`. Treat claims here as leads, and check the paper and the corrections log before citing.

---

## Pittsburgh context worth knowing first (checked in this session)
- **The zoning code is changing now.** Minimum lot size per unit was removed in all residential districts in May 2025 ([Pro-Housing PGH](https://www.prohousingpgh.org/blog/wins-minimum-lot-sizes)). In March 2026 Mayor O'Connor announced a full zoning code overhaul with fewer districts and simpler height rules. He also said he was interested in "AI technologies to review applications for missing information," and the city, not the RCOs, will now schedule public input meetings ([WESA](https://www.wesanews.org/politics-government/2026-03-09/pittsburgh-permitting-zoning-reforms)). Affordable-housing zoning moved from a mandatory policy to a voluntary bonus, and a June 2026 draft was still under revision ([WESA](https://www.wesa.fm/politics-government/2025-09-12/pittsburgh-inclusionary-zoning-debates-housing-affordability), [EngagePgh](https://engage.pittsburghpa.gov/implementing-housing-needs-assessment/inclusionary-zoning-iz)). **So any score based on today's code will go stale.** You can treat that as a risk or build a feature around it.
- **Land Bank:** 5,000–20,000 tax-delinquent properties, about 1,000 need Land Bank intervention, and about 80 sales in 2025. A new agreement cuts title clearing from about 2 years to 9 months. There is no dedicated city funding after 2027 ([WESA](https://www.wesanews.org/development-transportation/2025-11-20/pittsburgh-taxing-land-bank-blighted-properties)).
- **Permits:** a building permit took a typical 11 days in July 2025, down from 27 ([PublicSource](https://www.publicsource.org/pittsburgh-building-permits-faster-under-oconnor/)). Resubmission cycles are still the complaint; one architect called it "screaming into the void." The long waits appear to sit in the discretionary steps (ZBA, Planning Commission, RCO meetings), not in issuing permits. I found no hard numbers on ZBA wait times.
- **Similar AI tools elsewhere:** Seattle tested CivCheck for AI pre-screening. Completeness checks were 87% accurate and code compliance checks 92%. Seattle's lesson was that *coverage* matters more than accuracy, and it recommended automating completeness checks only ([Seattle](https://innovation-hub.seattle.gov/2026/06/17/ai-construction-permitting-seattle-civcheck-study/)). Honolulu and LA County are running CivCheck and Archistar in production.
- **Not verified:** the "3,260 available-for-sale lots" figure. WPRDC has [City-Owned Properties](https://data.wprdc.org/dataset/city-owned-properties) and [Lots to Love](https://data.wprdc.org/dataset/lots-to-love), but I did not count the rows.

## Eight framings

**1. Land Bank / city lot disposition prioritizer (unit = the inventory)**
- **Who and when:** Pittsburgh Land Bank or URA staff before board meetings, or a CDC choosing which lots to request.
- **Decision it changes:** which of hundreds of lots to clear title on and market first, and for what use (housing, side yard, green space).
- **Data:** city-owned and Land Bank parcels, zoning, slope, landslide and flood layers, sales nearby, condemned-property records, water and sewer adjacency.
- **What the LLM adds:** writes a cited reason for each lot, explains clusters ("four adjacent lots could be assembled into a 6-unit project"), and drafts the board memo.
- **Main risk:** the Land Bank's own priorities, such as its funding runway and community goals, may differ from "ease." The inventory data is known to be messy.
- **Demo:** upload a list of 50 lots, get a ranked queue, click through to a one-page memo, export to CSV.
- **Feasibility:** high.
- **Analogues:** [Detroit's vacant land sales dashboard](https://data.detroitmi.gov/datasets/dlba-vacant-land-program-sales-dashboard), [Philadelphia Land Bank disposition policies](https://phillylandbank.org/acquisition-and-disposition-policies-landing/), [Chicago Large Lots](https://largelots.org), and Cleveland's [NEO CANDO / NST](https://case.edu/socialwork/povertycenter/data-systems/neocando) property tool built for CDCs.

**2. Assemblage finder (unit = a block or group of adjacent lots)**
- **Who and when:** a mission-driven developer or CDC acquisitions lead at the site-search stage.
- **Decision it changes:** single lots are often too small or too steep. The tool finds groups of adjacent parcels with public or tax-delinquent owners and scores the combined site.
- **Data:** parcel geometry, owner type, delinquency, zoning, and slope.
- **What the LLM adds:** explains why the combined site crosses a threshold, for example "combined 7,200 sq ft allows a by-right triplex under the 2025 lot size change," and drafts outreach to owners or the Land Bank. The adjacency math itself is deterministic.
- **Main risk:** geometry bugs, and owner-contact privacy.
- **Demo:** click a block, see the combined outline, compare the score to single lots.
- **Feasibility:** medium. The GIS joins take time.

**3. Missing-middle / starter-home "what can I build here" flow**
- **Who and when:** small local builders and homeowners with a side lot. They are the people helped most by the lot size reform, and they cannot afford a land-use attorney.
- **Decision it changes:** whether to buy or build at all, and which typology (single-family, duplex, triplex, cottage court).
- **Data:** zoning district rules (setbacks, height, units allowed), lot dimensions, slope, [Lots to Love](https://data.wprdc.org/dataset/lots-to-love).
- **What the LLM adds:** answers in plain language with the code section quoted ("a triplex needs a special exception in R2 because…"), and handles follow-up questions.
- **Main risk:** building a legal-advice-shaped tool on a code that is being rewritten. It needs strong disclaimers and a pinned code version.
- **Demo:** enter an address, see duplex, triplex and cottage court each marked by-right, needs a variance, or not allowed, with citations and a rough building footprint.
- **Feasibility:** medium-high if you limit it to 3–4 residential districts.
- **Analogues:** [Symbium Build](https://www.govtech.com/biz/Symbium-Opens-Service-for-Analyzing-Zoning-Building-Codes.html) (which carries an "outside company, may not be accurate" disclaimer), [NYC ZoLa](https://zola.planning.nyc.gov), [LA ZIMAS](https://zimas.lacity.org).

**4. Pre-application / variance packet drafter (fits into the approval workflow)**
- **Who and when:** an applicant after picking a site and before filing with OneStopPGH or the ZBA.
- **Decision it changes:** whether to redesign to stay by-right or file for a variance. It also reduces resubmission cycles.
- **Data:** the zoning code, [the ZBA process guide](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/process-guides-and-handouts/process-guide-handout-zba-2024.pdf), and **past ZBA decision PDFs** ([example](https://www.pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/e-jefferson-street-3-of-2026-zba-decision.pdf)).
- **What the LLM adds:** the most here of any framing. It retrieves similar past variances and their outcomes, drafts the hardship narrative, lists missing items, and drafts the RCO or community meeting deck.
- **Main risk:** judges may see it as "helping developers get around zoning." A drafted precedent summary could also misstate an outcome.
- **Demo:** from a parcel plus a proposed project, show the required relief, three similar past cases with their outcomes, and a draft application with a completeness checklist.
- **Feasibility:** medium. Parsing the ZBA PDFs is the main work.
- **Why now:** this is exactly the mayor's stated "AI for missing information" interest and Seattle's recommended scope.

**5. Planner-side intake triage queue**
- **Who and when:** City Planning or zoning intake staff each morning.
- **Decision it changes:** routing, meaning which cases are simple and can be fast-tracked versus which need a hearing. This matches Phase I's "prioritization by project size, type, and complexity."
- **Data:** permit and zoning application records on WPRDC, plus parcel layers.
- **What the LLM adds:** summarizes each application against its parcel, flags likely missing items, and cites the rule for each flag.
- **Main risk:** no real application documents are available, so it has to be demoed on synthetic data. There is also the question of whether the city wants it; the mentors would know.
- **Demo:** a queue view where a reviewer accepts or overrides each flag. This shows human-in-the-loop well.
- **Feasibility:** medium.

**6. Policy "unlock" simulator (unit = the whole city)**
- **Who and when:** council staff, City Planning, advocates during the zoning overhaul.
- **Decision it changes:** which amendment to push, by counting how many parcels move from "needs a variance" to "by-right" under a proposed rule change (single-stair, setbacks, height, removing parking minimums).
- **Data:** every parcel's zoning and dimensions, plus the rules written as parameters.
- **What the LLM adds:** turns the text of a proposed amendment into rule parameters (a human reviews them), then explains the change by neighborhood.
- **Main risk:** Pittsburgh's code is complex, so a hackathon version has to simplify a lot, and a wrong count is politically loaded. The underlying engine is the same one framing 3 needs.
- **Demo:** move a setback or lot-size slider and watch a map show "+1,140 parcels become by-right for a duplex."
- **Feasibility:** medium if it reuses the scoring engine.
- **Analogue:** the [Terner Housing Policy Simulator](https://www.ternerlabs.org/terner-housing-policy-simulator-full-methodology), which runs a pro forma over every parcel.

**7. Rehab / adaptive-reuse ease (unit = an existing structure)**
- **Who and when:** Land Bank staff on its rehab pilot, small rehab investors, and the downtown office-to-residential market.
- **Decision it changes:** rehab versus demolish versus new construction, and which vacant structures are closest to viable.
- **Data:** condemned and dead-end properties, code violations, assessment and building characteristics, the downtown office-conversion abatement and the state's 20-year vacant-building abatement ([WPXI](https://www.wpxi.com/news/local/were-about-rescue-downtown-tax-abatement-program-help-transform-pittsburgh/Q4743VMR4FBMNH2B3HBZWJHIXA/), [Axios](https://www.axios.com/local/pittsburgh/2025/04/15/downtown-pittsburgh-offices-housing-conversion)).
- **What the LLM adds:** summarizes violation histories and explains change-of-use triggers.
- **Main risk:** building condition is not in public data, and office-conversion feasibility depends on floor-plate data you won't have.
- **Demo:** filter condemned structures, rank them, show the incentives each one qualifies for.
- **Feasibility:** medium-low for office conversion, medium for small residential rehab.

**8. Subsidy stack and gap matcher (the "Pro Forma Navigator" line on the landing page)**
- **Who and when:** an affordable-housing developer's finance lead during pre-development.
- **Decision it changes:** whether the site can pencil, and which programs to apply to.
- **Data:** QCT/DDA and Opportunity Zone boundaries, [PHFA QAP 2025–26](https://www.phfa.org/forms/multifamily_program_notices/qap/2025_and_2026/2025-2026-lihtc-qap.pdf) scoring, URA programs, abatements.
- **What the LLM adds:** pulls QAP criteria with page citations, explains which points this site earns, and states the "approved affordability assumptions" it used.
- **Main risk:** cost and rent inputs are guesses, so the gap number could be falsely precise. You would need to show ranges and require the user to enter their own inputs.
- **Demo:** a site shows eligible programs with QAP site points cited and a range for the gap.
- **Feasibility:** medium if the pro forma is kept deliberately simple.

**Interface is a separate axis.** Any of these could be a map, a chat, or a generated memo. Memos and packets (framings 1, 4, 8) make the output concrete for judges and something a user can take away. Chat is weaker on judgment and citations unless every answer points back to a record.

## Tradeoffs (no pick)
- **Best for the "data & AI integrity" criterion:** 4 and 6. Each has a clear deterministic core, and the LLM's claims can be checked against precedents or rule text.
- **Closest to the brief's literal wording:** 1, 3, and your current dashboard idea.
- **Best continuation story:** 1 (the Land Bank has a funding cliff and messy data, a real partner opening) and 4/5 (the mayor's stated AI interest). Neither is confirmed demand.
- **Hardest to fake:** 7 and 8, because they need data you won't have.
- **Shared foundation:** a rules engine for parcels and zoning powers 1, 2, 3 and 6, so you could build one engine and show two of these views.

## Questions for mentors
1. Who is the intended user: Land Bank or URA staff, CDCs, small builders, or city planners? Is any of them a sponsor or judge?
2. Where do Pittsburgh housing projects actually stall most: ZBA and variances, RCO and Planning Commission, title clearing, or financing? Is any of that data public, such as ZBA decisions in bulk?
3. Is there a machine-readable zoning code, and will judges penalize using the current code while the overhaul is pending?
4. What exactly are the "approved affordability assumptions" behind the Pro Forma Navigator? Is a financing pro forma in scope for Track 1?
5. Would the city or Land Bank actually use a tool that ranks or drafts for them, or does the political risk of scoring specific lots make an analyst- or advocate-facing tool the better target?
