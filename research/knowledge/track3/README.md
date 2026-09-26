# Track 3: Typology, equity and climate

**Type:** track3
**One line:** Index for the Track 3 ("Housing Typology, Equity & Climate Matchmaker") nodes: the brief, the data, the methods, and options for combining with Track 1.
**Why we care:** Track 3 overlaps heavily with Track 1's feasibility work, and its success criteria (scenarios, adjustable weights, data vs. value labels) are specific. These nodes hold what we know and what we don't.
**Last checked:** 2026-09-26

## Nodes

| Node | What it holds |
|---|---|
| [Brief and requirements](brief-and-requirements.md) | The brief quoted verbatim, including the success criteria; what "scenarios not one answer" and "data vs. value judgments" require concretely |
| [Indicators and data](indicators-and-data.md) | Every indicator with source, geography level, vintage, and access gotchas (CHAS UA, Census key, 2010 vs. 2020 tracts, NRI caveats, RCO PII, H+T registration) |
| [Typology prototypes](typology-prototypes.md) | Envision Tomorrow-style prototypes, per-typology parameters labelled data / assumption / value, and use-table gates |
| [Displacement and equity](displacement-and-equity.md) | MVA 2021, DRR (formula missing; ⚠ flags Robust markets, not Transitional/Stressed *(corrected 2026-09-26 per docs/04-critique.md row 24)*), UDP (no Pittsburgh output), framing risk and mitigation options |
| [Carbon by typology](carbon-by-typology.md) | BfCA floor-area flip (⚠ the one same-quantity flip we hold *(corrected 2026-09-26 per docs/04-critique.md row 23)*), RECS 2020 (national per-household averages, not a density effect), Dublin embodied carbon, TRB VMT range, Rankin (inaccessible); normalization as a value judgment |
| [Combining with Track 1](combining-with-track1.md) | Options A/B/C, the parcel → block group → tract → RCO data model, and the risks |

## The short version

- The success criterion is quoted exactly in [brief and requirements](brief-and-requirements.md): compare at least two scenarios for a real place, see why they rank differently, change normative weights, and tell data-driven conclusions from value judgments.
- Most Track 3 data is **tract or block group**, not parcel. Parcels inherit area values ([indicators](indicators-and-data.md)).
- Two choices that look technical are value judgments: **carbon normalization** ([carbon](carbon-by-typology.md)) and **displacement as weight vs. warning** ([displacement](displacement-and-equity.md)).
- Legal gates come from the §911.02 use table, reliable for R1D–RM only ([typology prototypes](typology-prototypes.md)). ADU legality depends on Bill 2025-1545, ⚠ Held In Council with no final vote per Legistar (2026-09-26) *(corrected 2026-09-26 per docs/04-critique.md row 9)*; current ADU terms are in the June 2026 PC redline, not the 2024 EngagePgh page *(corrected 2026-09-26 per docs/04-critique.md row 26)*.
- Combining with Track 1 has three shapes and real costs; no option is picked here ([combining](combining-with-track1.md)).

## Open questions

Collected from the nodes:
- DRR formula; UDP Pittsburgh map; GPL-3.0 acceptability.
- Council vote on Bill 2025-1545; ADU placement in current code.
- Any data for "infrastructure capacity" and "infrastructure extension".
- Rankin 2024 access; CO2e factors for RECS energy.
- How judges score across tracks.

## Connects to

- [Knowledge base README](../README.md): template, tags, corrections log
- [Challenge brief and judging](../challenge/brief-and-judging.md)
- [Score design options](../methods/score-design-options.md)
- [Dimensional standards and use table](../policy/dimensional-standards-and-use-table.md)
- [Data pipeline](../build-plan/data-pipeline.md)

## Sources

- [Track 3 brief](https://ai-horizons-2026-ai-for-housing-hackathon.brandon831577.chatgpt.site/challenges/typology-equity-climate.html) `[read]` *(accessed 2026-09-26)*
- Sweep: [../../sweeps/r4-track3-data-methods-and-combination.md](../../sweeps/r4-track3-data-methods-and-combination.md) `[read]` *(accessed 2026-09-26)*
- Sweep: [../../sweeps/r4-track3-prior-art-and-hackathons.md](../../sweeps/r4-track3-prior-art-and-hackathons.md) `[read]` *(accessed 2026-09-26)*
- Sweep: [../../sweeps/r4-build-feasibility-on-team-stack.md](../../sweeps/r4-build-feasibility-on-team-stack.md) `[read]` *(accessed 2026-09-26)*
- [Adversarial critique](../../docs/04-critique.md) — rows 9, 23, 24, 26
