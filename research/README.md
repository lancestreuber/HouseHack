# HouseHack Research

**A survey to support our AI for Housing Hackathon entry.** It covers:
- where housing can be built in Pittsburgh and what stands in the way (Track 1)
- what should be built there, weighed across need, equity and climate (Track 3)
- what it would take to build a tool for either or both during the event

> **This is research, not a spec.** It informs what to build and how. It does not decide either.

## Start here

**→ [`knowledge/PAPER.md`](knowledge/PAPER.md) — *Where Housing Can Be Built, and What Should Be Built There***

The paper is the map. Every claim in it links to a node in [`knowledge/`](knowledge/), and each node carries its sources.

Before building, read [`docs/03-open-questions.md`](docs/03-open-questions.md). It lists the questions for mentor office hours whose answers would most change the plan.

## What's in it

| Path | Contents |
|---|---|
| [`knowledge/`](knowledge/) | **The knowledge base.** A cross-linked wiki with one node per topic, and every claim sourced. |
| [`docs/`](docs/) | Bibliography, open-question register, critique |
| [`sweeps/`](sweeps/) | The archive: every research sweep at full fidelity |
| [`sources/`](sources/) | Saved copies of load-bearing primary text (zoning code tables) |
| [`admin/`](admin/) | Source-access log: what was blocked and why |
| [`archive/`](archive/) | Superseded first-pass working notes, kept for provenance |

## Method

A paper serves as the entry point, backed by one node per topic.
- Every source carries a verification tag: `[read]` / `[skimmed]` / `[found]` / `[inaccessible]`.
- Contradictions are kept visible.
- A public corrections log records what we got wrong.

The rules and the node template are in [`knowledge/README.md`](knowledge/README.md), and the research stance is in [`CLAUDE.md`](CLAUDE.md).

One rule is specific to this domain, because Pittsburgh's zoning is being rewritten while we work:

> **A zoning or permitting rule is `[skimmed]` until it has been read in the code text itself or an official dated City document, and every rule carries its code version or bill status.**

## What this research does not establish

- **That anyone wants the tool.** No practitioners have been interviewed yet.
- **That our reading of the code is complete.** Two sections were read on the code of record, and the rest on a mirror. Two bills pending before City Council could change the rules.
- **Variance approval rates or infrastructure capacity.** Neither is public.
- **What other teams are building.** A few public repos were checked, and that is all anyone can see.
- **That the build estimates hold.** None has been tested.

## Hard rules

- **No PII.** People are cited by role. Some City GIS layers contain contact details, and these never enter the repo or the app.
- **No secrets.**
- **Decision support only.** Nothing here is legal, financial or zoning advice.
