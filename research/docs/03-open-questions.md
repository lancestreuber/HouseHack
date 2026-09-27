# Open Questions: what the research did not answer

These are ranked by **how much the answer would change what we build**. The fastest channel for most of them is Slack office hours (Sat and Sun, 10 a.m.–6 p.m. ET), where housing, planning, permitting and technical mentors are present.

> **Repetition across sweeps is not convergence.** Most of our evidence comes from three kinds of source: public GIS and data endpoints, City web pages, and local journalism. That is why findings repeat. We have **no practitioner interviews**, **no City Council records beyond hearing notices**, and **weak coverage of hackathon projects**. Each of those is a different kind of source that we have not yet reached.

---

## Track 3 focus (pivot 2026-09-26): ask these first

| # | Question | Why it matters |
|---|---|---|
| T3-1 | Which real Pittsburgh place makes the most useful demo? | The brief requires "a real place". The choice shapes data, equity optics, and continuation. Candidates: a neighborhood with an active neighborhood plan, city-owned lots, and mixed market types. |
| T3-2 | Should displacement be a weight, a guardrail (warning), or both? | This is itself a value judgment. The published DRR flags Robust markets, not Transitional or Stressed ones. → [displacement](../knowledge/track3/displacement-and-equity.md) |
| T3-3 | Default carbon normalization: per unit, per person, or per m²? | The ranking can flip with the choice. → [carbon](../knowledge/track3/carbon-by-typology.md) |
| T3-4 | Do judges expect all seven axes, or depth on a few? | Scope. Shallow coverage of seven axes risks weak numbers. |
| T3-5 | Should "demand" mean need (CHAS, household mix) or market (prices, rents), and would the partners accept both shown side by side? | Need and market point to different typologies. |
| T3-6 | Which personas do the City and County partners care about most: planners, CDCs, developers, or residents? | Sets the default lens and the demo story |

## SME answers, 2026-09-27

The Slack `#housing-sme-help` channel answered #1 (partly), #3, #7 (scope only) and #11, and the score-structure question (no prescribed system; red/yellow/green suggested, S1). Details: [SME gap analysis §3](../knowledge/build-plan/sme-feedback-gap-analysis.md#3-research-follow-ups). **The SMEs gave no input on T3-1…T3-6, displacement/DRR, carbon, the Land Bank, or which code version to score (#4).** Those remain open. This was chat, not a published source.

## Tier 1: would change what we build

| # | Question | Why it matters | Who or what could answer it |
|---|---|---|---|
| 1 | Who should the primary user be: City planners, the Land Bank or the Urban Redevelopment Authority (URA), CDCs, small builders, or policy analysts? **Partly answered 2026-09-27:** SMEs framed the user as developers and nonprofits doing financial feasibility (S2, S3). [SME gap analysis §3](../knowledge/build-plan/sme-feedback-gap-analysis.md#3-research-follow-ups) | Practitioners name site control, financing and preservation ahead of site selection ([practitioners](../knowledge/stakeholders/practitioners.md)). The user determines the framing ([framings](../knowledge/landscape/framings.md)). | Mentors; Pro-Housing Pittsburgh; a 2026 PHFA fellow working on vacant lots |
| 2 | The form asks for **one** track. How do judges treat a Track 1+3 combination, and which track should we list? | Decides the pitch, the headline number and the README framing ([combining](../knowledge/track3/combining-with-track1.md)) | Organizers (Slack help desk) |
| 2b | The organizers' Brief Source Map lists a "Policy-to-Permit Navigator" brief that isn't on the site, and Track 1's URL is `policy-to-permit.html`. Was that brief merged into Track 1? | If so, permitting, ZBA and municipal-code work is explicitly in scope for Track 1 ([catalog](../sources/organizers-2026-09-26-public-data-catalog-readme-and-brief-map.md)). | Organizers |
| 3 | Where do Pittsburgh housing projects actually stall most: ZBA and variances, RCO and Planning Commission, title, financing, or infrastructure? **Answered by SMEs 2026-09-27 (chat opinion):** cost exceeding market value comes first; developers check whether it pencils *before* pursuing a variance. Variances are then granted but slow and costly (S5, S11). Supports "ZBA = delay, not denial" and adds that delay costs money. [SME gap analysis §3](../knowledge/build-plan/sme-feedback-gap-analysis.md#3-research-follow-ups) | Decides whether "ease" should weight regulatory friction, acquisition, or financing | Planning and permitting mentors |
| 4 | Should we score against current code, Bill 2025-1545 as proposed, Bill 2026-0834, or show all of them as scenarios? (Legistar, 2026-09-26: 2025-1545 is **Held In Council**, with no final vote. 2026-0834, heard 10/13, would amend Ch. 906, 921 and 922.) | The rules engine needs a code version. A "what-if" view is a possible feature ([reforms](../knowledge/policy/reforms-in-flux-2025-2026.md)). | City Council records; mentors |
| 5 | Would the City or the Land Bank use a tool that ranks specific lots, or is that politically risky? | Decides whether the output is a ranked list or an exploratory view ([Land Bank](../knowledge/stakeholders/land-bank.md)) | Mentors from City, County or PHFA |

## Tier 2: would change how we build it

| # | Question | Why it matters |
|---|---|---|
| 6 | Is there a machine-readable zoning code, or structured ZBA decision data? | Hand-transcribing the code is the biggest accuracy risk. ZBA outcomes would enable precedent retrieval. ([zoning code text](../knowledge/data/zoning-code-text.md), [ZBA](../knowledge/data/zba-decisions.md)) |
| 7 | What exactly are the "approved affordability assumptions" behind the "Pro Forma Navigator" wording? Is a financing pro forma in scope? **Scope answered 2026-09-27:** "ideally both" financial and zoning feasibility (S4); if a pro forma is needed to confirm feasibility, the tool should build it (S12). The literal meaning of "approved affordability assumptions" is still open. [SME gap analysis §3](../knowledge/build-plan/sme-feedback-gap-analysis.md#3-research-follow-ups) | Scope of the [pro forma](../knowledge/methods/pro-forma.md) |
| 8 | How is the MVA Displacement Risk Ratio computed? | We would use it as a displacement warning, and its formula is undocumented ([displacement](../knowledge/track3/displacement-and-equity.md)). Reinvestment Fund could answer. |
| 9 | ~~Does an existing County HNA exist?~~ Partly answered: the catalog link returns 404 and no report was found, so the executive order's "first" is better supported. Confirm with the County. | An unresolved contradiction ([County](../knowledge/stakeholders/allegheny-county.md)) |
| 10 | Is the City's "AI for missing information" tool procured or in pilot? | Our tool could complement it or collide with it ([City](../knowledge/stakeholders/city-of-pittsburgh.md)) |
| 11 | Would judges penalize city-only zoning coverage if it is stated as a limitation? **Answered 2026-09-27:** no. Organizers said to list missing or paid data in `limitations.md`; synthetic data is fine if documented; the demo must still work (S15). | County scope needs 130 municipal codes. We have 9 zoning layers and no code text ([municipal zoning](../knowledge/data/municipal-zoning-outside-city.md)). |
| 12 | Rehab vs. new construction: what condition data exists, and how should rehab cost risk be treated? | Land Bank inventory is largely existing structures ([Land Bank](../knowledge/stakeholders/land-bank.md)) |

## Tier 3: verification debt (known unknowns in our own base)

| # | Item | Status |
|---|---|---|
| 13 | Chapters 906, 914, 915 and 922 were read on the zoneomics mirror, not eCode360 | Re-read them in a browser and save to `sources/` |
| 14 | Column alignment in our §911.02 transcription beyond the RM column | Re-check against the rendered table |
| 15 | Whether the SS-O steep-slope overlay is mapped citywide, or only applied by criterion | [U] |
| 16 | ETHOS `SteepSlope` threshold definition | [U] |
| 17 | Residential new-construction timeline is right-censored (78 of 210 still in revisions) | Needs survival-style handling or a clear caveat |
| 18 | Literature cited in score design (MCDA, CA Housing Element, Portland BLI, UrbanSim, CalEnviroScreen) was recalled, not re-read | `[found]`. Re-read before citing on a slide. |
| 19 | Rankin et al. 2024 (missing-middle embodied carbon) | `[inaccessible]` (paywall) |
| 20 | Vercel limits on large static `.pmtiles` files; MapLibre v6 worker under Vite/SSR | Untested. Spike in the first hours of the build. |

## Parked research (started, not finished)

| Item | Status | How to pick it up |
|---|---|---|
| Multi-year ZBA dataset, 2021–2025, residential cases | An attempt ran for more than an hour, was stopped at the parser stage, and produced nothing. | About 1,000 decision PDFs are on the Internet Archive (CDX query for `pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/*`, `mimetype:application/pdf`). Reuse the 2026 CSV schema in `sources/pittsburghpa-2026-09-26-zba-decisions-sample.csv`. **Timebox it**: sample ~100 residential cases rather than parsing everything. |
