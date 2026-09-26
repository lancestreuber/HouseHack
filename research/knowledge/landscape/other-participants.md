# Other participants' public repos

**Type:** landscape
**One line:** Public GitHub repositories tied to this hackathon that we could find, with their stated content and creation dates. Facts only.
**Why we care:** It keeps us honest about what is and isn't distinctive in our thinking. It is not a competitor count.
**Last checked:** 2026-09-26

## ⚠ What this node is not

Private repositories and work that has not been pushed are invisible to GitHub search. Most teams may have nothing public yet. **This is not a count of competitors, and it says nothing about what any team will build** (contributing rule 7). We describe repo contents only and say nothing about their authors (rule 8).

## Repos found

Creation and push times are from the GitHub API, read 2026-09-26 around mid-morning ET. READMEs were read the same day.

| Repo | Created (UTC) | Stated content (from its README) | License |
|---|---|---|---|
| [het-sheth/ai-housing-hackathon-wiki](https://github.com/het-sheth/ai-housing-hackathon-wiki) `[read]` | 2026-09-26 13:52 | A research wiki: rules, track comparison, a 60-entry data catalog, open product decisions. README: "It is a research workspace, not the hackathon application submission" and "No product design or stack is approved yet." Contains the organizer data catalog CSV under `raw/hackathon/` | None |
| [Run-Disc/HomeSignal](https://github.com/Run-Disc/HomeSignal) `[read]` | 2026-09-26 14:04 | Track 2. "a Pittsburgh permit-evidence observatory." Next.js over a 2025 PLI permit snapshot from WPRDC; human Correct / Insufficient-evidence review; separate files for limitations, AI disclosure, sources, evaluation. README: "A permit record is not a housing unit." | None |
| [papisho/buildwise-housing-hackathon](https://github.com/papisho/buildwise-housing-hackathon) `[read]` | 2026-09-26 13:27 | Track 1 ("Development Feasibility Navigator"). "preliminary decision-support tool for small and mid-sized housing developers doing first-pass Pittsburgh site screening." Next.js scaffold labelled "Phase 0"; disclaimer that it is not legal, zoning, engineering, environmental or financial advice | None |
| [Becky0713/whitestown-househack](https://github.com/Becky0713/whitestown-househack) `[found]` | 2026-09-17 00:16 | Per the round-4 sweep, a personal Indiana house-hack underwriting tool; unrelated to this event | None |

Note: an earlier sweep saw HomeSignal as empty; by the time of the round-4 sweep and this check it had code, tests and a LIMITATIONS doc. Public repos change hourly; treat this table as a snapshot.

GitHub search for "Development Ease Score," "typology matchmaker," "housing typology" and "Track 3 housing" found nothing ([r4 sweep](../../sweeps/r4-track3-prior-art-and-hackathons.md)).

## Overlap with our thinking

The research wiki above contains a long research document whose Track 1 advice overlaps with ours ([working notes](../../archive/working-notes-2026-09-26/05-landscape-and-prior-art.md), summarising the repo):

- show sub-scores rather than one number
- keep "bad" separate from "unknown"
- label each fact observed / derived / assumption / unverified
- add a "next action"
- use historical permits as priors
- demo three parcel archetypes: easy, deceptive, and physically feasible but unfinanceable

Its catalog also already lists OneStopPGH permits, ZBA decisions, USGS 3DEP, city-owned property and PLI permits ([r3 sweep](../../sweeps/r3-reality-check-existing-tools.md)).

**What follows from this** (our inference): these ideas are easy for anyone to reach, and the organizer data catalog puts the same datasets in front of every team. We had earlier told the team that certain features were things "no other team will do"; that was unsupported and is logged in the [corrections log](../README.md#corrections-log).

## Open questions
- None about other teams' plans; by rule 7 we do not speculate about them.
- Re-check before submission whether any public repo reuses a license-restricted source we also use, only insofar as it affects our own attribution.

## Connects to
- [Organizer data catalog](../data/organizer-data-catalog.md): the shared starting data
- [Framings](framings.md): where our framing choices sit
- [Hackathon precedents](hackathon-precedents.md): prior events
- [Rules and deliverables](../challenge/rules-and-deliverables.md): public repo and commit-history rules
- [Score design options](../methods/score-design-options.md): sub-scores and bad-vs-unknown
- [Knowledge README corrections log](../README.md): the "no other team will do" correction

## Sources
- [het-sheth/ai-housing-hackathon-wiki](https://github.com/het-sheth/ai-housing-hackathon-wiki) `[read]` *(accessed 2026-09-26)*: README and GitHub API metadata
- [Run-Disc/HomeSignal](https://github.com/Run-Disc/HomeSignal) `[read]` *(accessed 2026-09-26)*: README, file list, GitHub API metadata
- [papisho/buildwise-housing-hackathon](https://github.com/papisho/buildwise-housing-hackathon) `[read]` *(accessed 2026-09-26)*: README, GitHub API metadata
- [Becky0713/whitestown-househack](https://github.com/Becky0713/whitestown-househack) `[found]` *(accessed 2026-09-26)*: GitHub API metadata only; description from the r4 sweep
- Working notes: [../../archive/working-notes-2026-09-26/05-landscape-and-prior-art.md](../../archive/working-notes-2026-09-26/05-landscape-and-prior-art.md)
- Sweep: [../../sweeps/r3-reality-check-existing-tools.md](../../sweeps/r3-reality-check-existing-tools.md)
- Sweep: [../../sweeps/r4-track3-prior-art-and-hackathons.md](../../sweeps/r4-track3-prior-art-and-hackathons.md)
