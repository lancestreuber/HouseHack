# The Knowledge Brain

This is where the project's facts live. It is a **cross-linked wiki**, not a folder of reports. The paper at [`PAPER.md`](PAPER.md) is the way in, and every claim in it links to a node that holds the sources behind it.

The method is the same one used in the team's earlier research repositories:
- a paper as the entry point
- one node per topic
- an honest verification tag on every source
- contradictions kept visible
- a public corrections log

## Start here

**→ [`PAPER.md`](PAPER.md): *Where Housing Can Be Built, and What Should Be Built There. A survey for the Pittsburgh AI for Housing Hackathon.***

## How this is organized

| Directory | What's in it |
|---|---|
| [`challenge/`](challenge/) | The hackathon: tracks, rules, judging, deliverables |
| [`data/`](data/) | One node per data source family, with endpoints, verification status, gotchas, and freshness |
| [`policy/`](policy/) | Pittsburgh zoning rules, reforms in flux, and the approval pathway. These are the binding constraints. |
| [`stakeholders/`](stakeholders/) | What the City, County, State, Land Bank, and practitioners say they need, in their own words where possible |
| [`methods/`](methods/) | Scoring, calibration, uncertainty, the LLM's role, and typology matching |
| [`landscape/`](landscape/) | Existing tools, hackathon precedents, and public repos from other participants |
| [`track3/`](track3/) | Typology, equity, and climate: data, methods, and options for combining with Track 1 |
| [`build-plan/`](build-plan/) | Architecture on our scaffolded stack, the data pipeline, timeline, workstreams, and UX patterns |

## Node index

These are the canonical filenames. Link to them even before they exist; a link to a missing node marks something worth writing.

- **challenge/**
  - `brief-and-judging.md`
  - `rules-and-deliverables.md`
- **data/**
  - `parcels-and-assessments.md`
  - `zoning-gis.md`
  - `zoning-code-text.md`
  - `environmental-constraints.md`
  - `lidar-slope.md`
  - `infrastructure.md`
  - `permits-and-outcomes.md`
  - `zba-decisions.md`
  - `land-availability-and-title.md`
  - `market-and-affordability.md`
  - `municipal-zoning-outside-city.md`
  - `organizer-data-catalog.md`
- **policy/**
  - `dimensional-standards-and-use-table.md`
  - `environmental-overlays-ch906.md`
  - `approval-pathway.md`
  - `permit-timelines.md`
  - `parking.md`
  - `inclusionary-zoning-and-bonus.md`
  - `reforms-in-flux-2025-2026.md`
- **stakeholders/**
  - `city-of-pittsburgh.md`
  - `allegheny-county.md`
  - `state-dced-phfa.md`
  - `land-bank.md`
  - `practitioners.md`
- **methods/**
  - `score-design-options.md`
  - `backtest-and-calibration.md`
  - `uncertainty-and-explainability.md`
  - `llm-role.md`
  - `pro-forma.md`
- **landscape/**
  - `commercial-tools.md`
  - `hackathon-precedents.md`
  - `pittsburgh-civic-tools.md`
  - `other-participants.md`
  - `framings.md`
- **track3/**
  - `brief-and-requirements.md`
  - `indicators-and-data.md`
  - `typology-prototypes.md`
  - `displacement-and-equity.md`
  - `carbon-by-typology.md`
  - `combining-with-track1.md`
- **build-plan/**
  - `architecture-options.md`
  - `data-pipeline.md`
  - `timeline-and-workstreams.md`
  - `ux-patterns.md`

## Contributing

1. **One node, one thing.** If a node is about two things, it should be two nodes.
2. **Every factual claim carries its source, inline, with a link.** If we can't cite it, it goes under *Open questions*, not in the body.
3. **Mark verification honestly** with one of these tags:
   - `[read]`: the full page or document was fetched and read, or an API endpoint was queried and its response inspected.
   - `[skimmed]`: a partial fetch, an abstract, a search snippet, or a secondary source's summary.
   - `[found]`: known to exist, not opened.
   - `[inaccessible]`: blocked. Record the specific blocker in [`../admin/source-access.md`](../admin/source-access.md).

   **Never upgrade a tag without the artefact.** A search snippet is not a read.
4. **Anything that changes carries a date accessed.** That covers policy, code text, dataset vintage, and bill status. This project's facts are unusually perishable: the zoning code is being rewritten while we work.
5. **Separate what a source says, what we infer, and what we are guessing.** Never let an inference drift into the voice of a source.
6. **Contradictions stay visible.** Say which we believe and why. Do not average them into mush.
7. **No claims about what other teams will or won't build.** We can report what public repos contain. We cannot know what anyone else is doing.
8. **People are cited by role.** Officials appear in their public capacity, for example "the Mayor" or "ACTION-Housing's CEO", and then only as needed. No personal details about private individuals. Other participants' public repos may be linked as sources, and nothing more is said about their authors.

## The domain-specific rule

> **A zoning or permitting rule is `[skimmed]` until it has been read in the code text itself (eCode360) or an official City document with a date.** Commercial mirrors (zoneomics), news summaries, and advocacy posts are leads. Where a mirror and the code disagree, the code wins. Where the code and a pending bill disagree, say which one the claim is about.

## Node template

```markdown
# <Name>

**Type:** data | policy | stakeholder | method | landscape | track3 | build | challenge
**One line:** <what this is, in a sentence>
**Why we care:** <relevance to the build decision, one or two sentences>
**Last checked:** 2026-09-26

## <body sections>

## Open questions
- what we don't know

## Connects to
- [Other node](../dir/other.md): why they're related

## Sources
- [Title](url) `[read|skimmed|found|inaccessible]` *(accessed 2026-09-26)*: what it's good for
- Sweep: [../../sweeps/<file>.md](../../sweeps/<file>.md)
```

## Corrections log

Being wrong in the open is the point of this table. When a closer read overturns something we asserted, it gets a row, and the affected node gets a ⚠.

| Date | What we had said | What the source actually says |
|---|---|---|
| 2026-09-26 | Steep-slope, landslide, undermined, and floodplain rules live in **Chapter 915** | ⚠ They are the **Chapter 906 overlay districts** (SS-O §906.08, LS-O §906.04, UM-O §906.05, FP-O §906.02). Ch. 915 holds the general environmental performance standards. → [environmental overlays](policy/environmental-overlays-ch906.md) |
| 2026-09-26 | Residential lot sizes: VH was 1,800 sf before the reform; uncertain whether old or new values applied | ⚠ The live eCode360 text (Ord. 10-2025, eff. 5-7-2025) gives VL 6,000 / L 3,000 / M 2,400 / H 1,200 sf / VH no minimum. The old-versus-new ambiguity came from reading strikethrough formatting in a PDF draft. → [dimensional standards](policy/dimensional-standards-and-use-table.md) |
| 2026-09-26 | A scoring draft used FAR in the envelope formula | ⚠ §903.03 residential districts have **no FAR**. The envelope comes from lot size, setbacks, and height only. → [score design](methods/score-design-options.md) |
| 2026-09-26 | Summary to the team said certain features were things "no other team will do" and that others would be "city-only" | ⚠ **Unsupported.** We have no evidence about other teams' plans. A later check found the organizer data catalog already recommends OneStopPGH, ZBA decisions, and USGS 3DEP. At least one participant's public research plan independently proposes sub-scores, bad-versus-unknown, and historical-permit priors. → [other participants](landscape/other-participants.md) |
| 2026-09-26 | HUD FY2025 Pittsburgh 50% AMI (4-person) = $55,200 (secondary source) | ⚠ $55,200 is the **FY2026** figure, parsed from HUD's own xlsx. FY2025 was $53,650. → [market and affordability](data/market-and-affordability.md) |
| 2026-09-26 | "3,260 available-for-sale city lots" was flagged unverified by one sweep | Verified by another sweep's live query of `ParcelsPublicCityVacant` `current_status` counts. The contradiction is resolved in favor of the query. → [land availability](data/land-availability-and-title.md) |

| 2026-09-26 | ETHOS Lot Suitability is "the City's vacant-lot reuse model" and a housing-suitability input (Dec 2024) | ⚠ **Narrower than we said.** A Pittsburgh Water press release (2026-01-14, `[skimmed]`) describes it as a City/Ethos Collaborative **stormwater and green-infrastructure** suitability analysis of vacant lots. The layer does carry a `Housing` field. Its methodology and the "Dec 2024" date are unverified. → [Pittsburgh civic tools](landscape/pittsburgh-civic-tools.md) |
| 2026-09-26 | Participant repo HomeSignal was "empty" | ⚠ **Stale within hours.** A later check found code, tests and a LIMITATIONS doc. Public repos change during the event, so any statement about them carries a timestamp. → [other participants](landscape/other-participants.md) |
| 2026-09-26 | Track 1 treated as having one name and scope | ⚠ It is named three ways: the landing page says "Pro Forma Navigator" and mentions affordability assumptions; the brief page has "Pro Forma" in its title only; the packet calls it "Development Feasibility Navigator". The organizers' Brief Source Map also lists a fourth brief, "Policy-to-Permit Navigator", and Track 1's URL is `policy-to-permit.html`. → [brief and judging](challenge/brief-and-judging.md) |
| 2026-09-26 | Team size is 1–5 | ⚠ **The sources conflict.** The packet says 1–5 and the landing page says 3–5. → [rules](challenge/rules-and-deliverables.md) |

| 2026-09-26 | Paper §12: a densify-here ranking points at "Transitional and Stressed MVA markets, **where displacement risk is highest**" | ⚠ **Contradicted by our own dataset.** Joining the published DRR to MVA block groups: Transitional/Stressed have 319 of 371 "Below Countywide Ave" and only 4 ≥1.0. DRR ≥1.0 concentrates in Robust markets, and the DRR formula is undocumented. What holds: Black residents are 45% Transitional / 21% Stressed. → [critique row 24](../docs/04-critique.md), [displacement](track3/displacement-and-equity.md) |
| 2026-09-26 | Paper §4: "approval friction is **mostly in discretionary steps**"; new construction "median 153 days with **about 5 revision cycles**"; underestimate because "78 of 210 still in revisions" | ⚠ **Three errors.** No discretionary step was timed. The only slow path measured is by-right review. "5" counts parallel reviewer flags, not rounds. 153 days includes applicant time. Only 74 of 210 (35%) have been issued, so the median describes the finished minority. → [critique rows 1–3](../docs/04-critique.md), [permit timelines](policy/permit-timelines.md) |
| 2026-09-26 | "We could not confirm a vote" on Bill 2025-1545; "no City Council records"; hearing "9/11/25"; "Council voted 5–4" in Oct 2025 | ⚠ **The access claim was false.** Legistar's API answers without a key. 2025-1545 is **Held In Council** with no final vote. Hearings were 9/10/25 and 9/23/26. The 10/15/25 action was a committee substitute plus PC referral, and the 5–4 tally is unverified. Bill 2026-0834 amends Ch. 906, 921 and 922, among others. Bill 2024-0701 is still in committee. → [critique rows 8–10](../docs/04-critique.md), [reforms](policy/reforms-in-flux-2025-2026.md) |
| 2026-09-26 | "3,260 city lots Available for Sale" presented as usable supply | ⚠ **The count is right; the meaning was overstated.** Median lot is 2,178 sf and 51% are under 2,400 sf. About 36% of the residential-district lots are below their minimum lot size, and 298 are in the Hillside district. Ch. 921 relief is unchecked, so buildability is unassessed. → [critique row 18](../docs/04-critique.md) |
| 2026-09-26 | Paper §11: embodied carbon per m² vs RECS energy per household shows "which one wins depends on the unit" | ⚠ **Apples to oranges.** Those are different quantities. The real same-quantity flip is in the BfCA study, where the per-m² ranking changes with the floor-area definition. RECS is cross-sectional, not a density effect. → [critique row 23](../docs/04-critique.md) |
| 2026-09-26 | Practitioner barriers presented as an ordered list ("only then, zoning and variances") | ⚠ **Not a ranking.** It is one agent's ordering of about 12 news/advocacy pieces. Two of four personas have no voice in the base. → [critique row 12](../docs/04-critique.md) |
| 2026-09-26 | County HNA contradiction "unresolved" | The catalog's County HNA link returns **404**, and no such report was found. The executive order's "first" is better supported. → [critique row 27](../docs/04-critique.md) |
| 2026-09-26 | Bibliography "strongest tag wins"; 136 `[read]` | ⚠ **This inflated verification.** Tags are agent-reported, and several sources carry conflicting tags (Lenze 2024, CivCheck, PHFA QAP). The rule is now **weakest tag wins** unless the node names the artefact. Counts were regenerated. → [critique rows 29, 30, 34](../docs/04-critique.md) |

⚠ **A short corrections table is not a sign of accuracy.** Expect it to grow with every reading pass, and expect most corrections to make a claim weaker and more specific.

## Source status

*(Updated as the base grows. Counts belong here, not in prose.)* Generated from node Sources sections on 2026-09-26. See [`../docs/02-bibliography.md`](../docs/02-bibliography.md).

| Tag (strongest per source) | Count |
|---|---|
| `[read]` | 136 |
| `[skimmed]` | 74 |
| `[found]` | 23 |
| `[inaccessible]` | 1 |
| **total unique external sources** | **234** |

There are 13 sweeps and 46 nodes. ⚠ **A high `[read]` count is not a high confidence count.** Most `[read]` sources are GIS endpoints and City web pages. The kinds of source we have *not* reached (practitioners, Council records, and hackathon-project archives) are listed in [`../docs/03-open-questions.md`](../docs/03-open-questions.md).
