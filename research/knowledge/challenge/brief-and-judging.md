# Brief and judging

**Type:** challenge
**One line:** What the three track briefs ask for, and the six criteria plus three mandatory checks that judges score against.
**Why we care:** Every build decision is scored against this rubric. The Track 1 name and scope differ between the landing page, the brief page and the packet, and that affects whether a pro forma is in scope.
**Last checked:** 2026-09-26

## What every brief shares

All three brief pages carry the same framing paragraph ([Track 1 brief](https://ai-horizons-2026-ai-for-housing-hackathon.brandon831577.chatgpt.site/challenges/policy-to-permit.html) `[read]`):

> "Teams should build a working prototype, use real regional data where possible, explain assumptions and uncertainty, and demonstrate the product with at least one Pittsburgh or Allegheny County use case."

The packet asks teams to "Pick one" track ([packet](https://docs.google.com/document/d/1L-UYid6Q0JDRH3iy4cpqGIDlZNpJspok_rPxIsILbLQ) `[read]`). It also says, of all tracks:

> "The strongest submissions are explicit about who benefits, who might be harmed, and what the tool gets wrong. 'We don't have good data on X, so our tool doesn't claim to answer it' is a strength, and judges score it that way."

## Track 1: Development Feasibility (& Pro Forma) Navigator

Source: [brief page](https://ai-horizons-2026-ai-for-housing-hackathon.brandon831577.chatgpt.site/challenges/policy-to-permit.html) `[read]`. The URL slug is `policy-to-permit`.

- **Ask:** "an AI-driven tool that generates a Development Ease Score for potential sites, highlighting regulatory bottlenecks, required variances, and infrastructure gaps so cities and developers can prioritize fast-track sites and identify areas needing policy or resource intervention."
- **Problem:** older housing stock and a constrained development environment; developers and planners struggle to see how zoning, infrastructure and environmental constraints "interact to affect project feasibility."
- **Success looks like:** "A user can enter a parcel ID or compare multiple parcels and receive a source-grounded Development Ease Score, a plain-language explanation of the biggest barriers, and clear flags for zoning, environmental, infrastructure, or policy issues that require further review."
- **Owner / input:** "City, County, and PHFA with academic and mentor support."
- **Personas:**
  - Municipal Planner: quickly assess feasible sites, identify regulatory bottlenecks.
  - Small/Mid-Size Developer: reduce project risk, evaluate site feasibility quickly.
  - Housing Nonprofit/CDC: where affordable projects are most viable.
  - Policy Analyst: where zoning or infrastructure changes are most impactful.
- **Use cases:** developer enters a parcel ID and gets a score plus bottlenecks; planner compares parcels "to identify sites best suited for starter home development"; City finds low-scoring sites and asks whether zoning reform or infrastructure upgrades are needed; agencies prioritize investment "based on score clusters across neighborhoods."
- **Data named:** Allegheny County Real Estate Portal; City of Pittsburgh Zoning Code & Zoning Map; PA DEP eMapPA environmental datasets; Pittsburgh Department of City Planning GIS.
- **Closing line:** the strongest submissions show "the sources, assumptions, and human-review points behind each score."

### ⚠ The "Pro Forma" wording is inconsistent across sources

| Source | Track 1 name | Mentions pro forma / affordability assumptions? |
|---|---|---|
| [Landing page](https://ai-horizons-2026-ai-for-housing-hackathon.brandon831577.chatgpt.site/) `[read]` | "Development Feasibility & Pro Forma Navigator" | Yes: "first-pass feasibility tool for parcels and proposed housing concepts, grounded in public records and approved affordability assumptions." |
| [Brief page](https://ai-horizons-2026-ai-for-housing-hackathon.brandon831577.chatgpt.site/challenges/policy-to-permit.html) `[read]` | "Development Feasibility & Pro Forma Navigator" (title only) | No. The body describes only the Development Ease Score. |
| [Packet](https://docs.google.com/document/d/1L-UYid6Q0JDRH3iy4cpqGIDlZNpJspok_rPxIsILbLQ) `[read]` | "Development Feasibility Navigator" | No. |

Our reading (inference, not a source statement): the scored deliverable is the Development Ease Score; a financing pro forma is at most an optional extension. ⚠ **The SMEs disagreed, 2026-09-27:** "ideally both" financial and zoning feasibility, and the tool should build the pro forma if confirming feasibility needs one. They also said one dimension done well beats several done poorly ([gap analysis](../build-plan/sme-feedback-gap-analysis.md) S4, S12). What "approved affordability assumptions" means is still unanswered. See [pro forma](../methods/pro-forma.md).

## Track 2: Housing Production, Rents & Household Flow Observatory

Source: [brief page](https://ai-horizons-2026-ai-for-housing-hackathon.brandon831577.chatgpt.site/challenges/housing-observatory.html) `[read]`.

- **Ask:** an interactive regional observatory combining "administrative, market, and responsibly crowdsourced data" to show change over time; users move "from a regional pattern to a tract, parcel, building, or project where the underlying data permit." It "should make missingness, reporting bias, and privacy protections visible."
- **Success looks like:** a policymaker can answer "how many homes were built, where, for whom, and at what apparent rent or price"; a resident can contribute or retrieve information "without exposing personal data"; "every visualization communicates data quality."
- **Owner / input:** "Planning/data leads with university research support."
- **Primary users:** county and municipal policymakers; researchers and advocates; residents comparing rents, locations and landlord experiences; developers and nonprofits identifying unmet demand.
- **Prototype possibilities:** production dashboard (proposed, permitted, completed, converted, demolished); privacy-protected rents aggregator with landlord reviews; household flow map; demand map; policy timeline comparing production before and after zoning, tax or permitting changes.
- **Data named:** ACS; HUD CHAS; County sales and assessment records; occupancy certificates; documented market indicators.
- The packet adds: "The hard part is that the data doesn't agree with itself."

## Track 3: Housing Typology, Equity & Climate Matchmaker

Source: [brief page](https://ai-horizons-2026-ai-for-housing-hackathon.brandon831577.chatgpt.site/challenges/typology-equity-climate.html) `[read]`. Details in [track3 brief](../track3/brief-and-requirements.md).

- **Ask:** "matches places with plausible housing types and explains the tradeoffs," comparing "demand, physical feasibility, affordability, displacement risk, infrastructure capacity, access to opportunity, and marginal carbon emissions." It "should present scenarios rather than declare a single objectively correct neighborhood or housing type."
- **Success looks like:** "A user can compare at least two housing scenarios for a real place, see why the tool ranked them differently, change normative weights, and understand which conclusions are data-driven versus value judgments."
- **Owner / input:** "Housing-policy and planning leads with community-stakeholder input."
- **Primary users:** municipal planners; CDCs; developers evaluating product type and demand; residents and public officials comparing growth patterns.
- **Prototype possibilities:** neighborhood-to-typology match "with interpretable factors and confidence ranges"; scenario tool for duplexes, townhomes, apartments, accessory units, detached homes; climate score; equity dashboard; policy simulator.
- **Data named:** HUD CHAS; land-use data; transit accessibility; demographic indicators; environmental resilience layers.
- The packet adds: "a tool that pretends there's one right answer is less useful than one showing you what you're giving up."

## Judging criteria (packet, verbatim questions)

Source: [packet](https://docs.google.com/document/d/1L-UYid6Q0JDRH3iy4cpqGIDlZNpJspok_rPxIsILbLQ) `[read]`. No weights are published.

1. **Problem Value.** "Does the prototype address a costly, frequent, or consequential housing bottleneck identified in the challenge briefs (e.g., development feasibility, missing-middle housing typologies, or policy/permitting navigation)?"
2. **User Fit & Usability.** "Is the interface intuitive, plain-language, and practical for target end-users (such as municipal planners, small developers, nonprofits, or community partners) to adopt?"
3. **Technical Execution.** "Does the working demo/prototype reliably perform its core functional tasks during testing and presentation?"
4. **Data & AI Integrity.** "Are sources, statutes, and baseline assumptions accurately cited and grounded? Are privacy constraints (no PII/sensitive data) and model uncertainties handled responsibly? Is there a clear human-in-the-loop/escalation path for consequential decisions?"
5. **Actionability.** "Does the output directly assist or accelerate real-world decisions in housing development, policy, planning, or permitting rather than merely presenting abstract analytics?"
6. **Continuation Potential.** "Is there a credible path to post-event testing, maintenance, community ownership, or pilot adoption by public/civic partners (e.g., Allegheny County, City Planning, URA, PHFA)?"

## Mandatory eligibility and compliance checks (packet, verbatim)

- "**Originality:** Must be a new, ground-up build created during the hackathon window (no pre-existing products/pitches)."
- "**Required Deliverables:** Working code repository, demo video (3-5 min), documentation, data/source citations, and limitations statement."
- "**Responsible Framing:** Tool must be positioned strictly as decision support, not binding legal, financial, or zoning advice."

## Who judges

- Judging is asynchronous, Sept 28–30; "Every project is seen by at least three judges"; "The highest-scoring submissions win" ([packet](https://docs.google.com/document/d/1L-UYid6Q0JDRH3iy4cpqGIDlZNpJspok_rPxIsILbLQ) `[read]`).
- Judges "come from housing practice, universities, technology, and the investment community. Some will know your track's subject matter deeply and some will be evaluating your technical work" (same).
- Judges "watch [the demo video] before they look at anything else" (same). See [rules and deliverables](rules-and-deliverables.md).
- The packet says strong teams include "someone who can explain why any of it matters to a housing practitioner," and that this is "the one judges notice is missing."
- No judge names, prior winners or scoring weights were found by the round-3 sweep ([r3 reality check](../../sweeps/r3-reality-check-existing-tools.md)).

## Open questions
- What exactly are the "approved affordability assumptions" on the landing page, and is a financing pro forma in scope for Track 1? Ask mentors.
- Are the six criteria equally weighted? The packet gives no weights.
- If an entry combines tracks, which track's brief do judges hold it to? The form takes one track ([rules and deliverables](rules-and-deliverables.md)).
- Is Track 1 scored on the City only, or on Allegheny County as well? The brief names both County and City data.

## Connects to
- [Rules and deliverables](rules-and-deliverables.md): timeline, repo rules, video, AI disclosure
- [Track 3 brief and requirements](../track3/brief-and-requirements.md): full Track 3 detail
- [Combining with Track 1](../track3/combining-with-track1.md): the one-track form constraint
- [Pro forma](../methods/pro-forma.md): the "Pro Forma" half of the Track 1 name
- [Uncertainty and explainability](../methods/uncertainty-and-explainability.md): the Data & AI Integrity criterion
- [LLM role](../methods/llm-role.md): the "thin wrapper" warning and human-in-the-loop
- [Organizer data catalog](../data/organizer-data-catalog.md): data beyond the four sources the Track 1 brief names
- [Stakeholders: practitioners](../stakeholders/practitioners.md): the Problem Value and Continuation criteria
- [Framings](../landscape/framings.md): which framings fit which criteria

## Sources
- [Event landing page](https://ai-horizons-2026-ai-for-housing-hackathon.brandon831577.chatgpt.site/) `[read]` *(accessed 2026-09-26)*: track names and one-liners, "approved affordability assumptions" wording, timeline
- [Track 1 brief: Development Feasibility & Pro Forma Navigator](https://ai-horizons-2026-ai-for-housing-hackathon.brandon831577.chatgpt.site/challenges/policy-to-permit.html) `[read]` *(accessed 2026-09-26)*: problem, success, personas, use cases, data
- [Track 2 brief: Housing Observatory](https://ai-horizons-2026-ai-for-housing-hackathon.brandon831577.chatgpt.site/challenges/housing-observatory.html) `[read]` *(accessed 2026-09-26)*
- [Track 3 brief: Typology, Equity & Climate Matchmaker](https://ai-horizons-2026-ai-for-housing-hackathon.brandon831577.chatgpt.site/challenges/typology-equity-climate.html) `[read]` *(accessed 2026-09-26)*
- [Participant packet (Google Doc, plain-text export)](https://docs.google.com/document/d/1L-UYid6Q0JDRH3iy4cpqGIDlZNpJspok_rPxIsILbLQ) `[read]` *(accessed 2026-09-26)*: judging criteria, mandatory checks, judge pool
- Sweep: [../../sweeps/r3-reality-check-existing-tools.md](../../sweeps/r3-reality-check-existing-tools.md)
- Sweep: [../../sweeps/r3-alternative-framings.md](../../sweeps/r3-alternative-framings.md)
