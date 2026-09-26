# Timeline and workstreams

**Type:** build
**One line:** A proposed split of the build into five workstreams, with timed checkpoints, cut lines and the critical path.
**Why we care:** The event is short. Knowing in advance what gets cut, and when, keeps a slipping feature from taking the demo down with it.
**Last checked:** 2026-09-26

> **This is a proposal from the build sweep, not an agreed plan.** Hour 0 is assumed to be Saturday about 10am. All durations are estimates. The event dates (Sept 26–27, 2026) are from the repository README; submission rules are in [rules and deliverables](../challenge/rules-and-deliverables.md).

## Five workstreams (proposed)

| # | Workstream | Scope |
|---|---|---|
| 1 | **Data A** | Parcels, zoning, overlays, floodway/FEMA joins, then PMTiles |
| 2 | **Data B** | 3DEP slope, ACS/HUD, transit, displacement per tract, then the Track 3 metrics JSON |
| 3 | **Scoring and rules** | Zoning dimensional tables (lot size, setbacks, height by district), approval pathway, typology fit, weight model. Pure TypeScript with unit tests on 5 hand-checked parcels |
| 4 | **Frontend** | Map, parcel panel, typology cards, weight sliders, override UI |
| 5 | **LLM / integration / DevOps** | Zoning-code corpus, `explain` procedure, Neon plus the overrides table, Vercel deploy, README, video |

## Checkpoints (proposed)

| Window | Goal |
|---|---|
| **H0–4, spike** | Deploy the scaffold to Vercel with the auth wall removed; map renders a hand-made 50-parcel PMTiles from `public/` on the deployed URL (proves range requests and file size); one parcel end to end: click → JSON → score → LLM explanation with one citation |
| **Checkpoint H4** | Stop and fix anything red |
| H4–12 | Full city pipeline, rules engine v1, UI v1 |
| **Checkpoint H12** (Sat ~10pm) | All ~140k parcels on the map with Track 1 scores |
| Overnight | Data B and Track 3 layers |
| H12–20 | Track 3 matchmaker, sliders, overrides, citations polish |
| **Checkpoint H20** (Sun ~6am) | Feature freeze on scope |
| H20–24 | Bug fixes; README (data sources, AI disclosure, limitations); scripted demo parcels |
| H24–26 | Record the video (2 hours plus retakes) |
| H26–28 | Buffer, final deploy, repo public. Submit around 9–10pm Sunday, not 11:59pm |

## Critical path

**Parcels + zoning join → PMTiles → map → rules engine → demo.** The LLM and Track 3 are off it. Anything on the critical path should have an owner from H0.

## Cut lines (proposed)

| Hour | If this is not done | Fall back to |
|---|---|---|
| H8 | 3DEP slope | City steep-slope overlay or ETHOS `SteepSlope`, or state it as a limitation |
| H12 | Full-city PMTiles | 2–3 neighborhoods |
| H16 | Track 3 | 3 typologies (ADU, duplex, small apartment) and 3 weights (feasibility, transit, displacement); drop carbon or make it a static per-typology factor stated in limitations |
| H18 | Neon is flaky | Overrides in localStorage (architecture option C) |
| H20 | LLM citations are shaky | Deterministic cited code sections without prose |

## Riskiest pieces (from the sweep)
1. MapLibre v6 worker under Vite/SSR: spike by H2; v5 as fallback.
2. PMTiles file size on Vercel: deploy a real file by H2.
3. **Zoning dimensional rules:** manual transcription and the biggest accuracy risk. Limit to the top 6–8 residential districts; mark unmodeled cases "needs review" rather than guessing. Remember there is no FAR in residential districts ([corrections log](../README.md#corrections-log)).
4. FeatureServer paging and outages: cache raw pulls once and share parquet.
5. Env / Varlock / Vercel sync (`bun run env:preview`): do it in the first hour.

## Alternatives to this split
- **Fewer, broader streams** (data / app / story) if the team is smaller than five; the critical path is the same.
- **Track 1 only**, dropping Track 3 work from Data B and the H12–20 window, which frees time for the backtest ([backtest](../methods/backtest-and-calibration.md)). Whether to combine tracks is discussed in [combining with Track 1](../track3/combining-with-track1.md).
- **Backtest in the scoring stream:** the scoring sweep estimated ~5h for AUC and a reliability plot and ~4h for Monte Carlo bands (estimates). This plan does not schedule either explicitly.

## Open questions
- Team size and actual start time; the plan assumes five people and a 10am start.
- Where the backtest and uncertainty bands fit, if at all.
- Exact submission deadline and format (see [rules and deliverables](../challenge/rules-and-deliverables.md)).

## Connects to
- [Architecture options](architecture-options.md): options A/B/C referenced by the cut lines
- [Data pipeline](data-pipeline.md): Data A and Data B stages
- [UX patterns](ux-patterns.md): what the frontend stream builds
- [LLM role](../methods/llm-role.md): the H20 fallback
- [Score design options](../methods/score-design-options.md): the rules engine
- [Rules and deliverables](../challenge/rules-and-deliverables.md): README, video, public repo
- [Combining with Track 1](../track3/combining-with-track1.md): the Track 3 scope that can be cut

## Sources
- Sweep: [../../sweeps/r4-build-feasibility-on-team-stack.md](../../sweeps/r4-build-feasibility-on-team-stack.md) `[read]` *(accessed 2026-09-26)*: workstreams, timeline, cut lines, critical path, risks
- Sweep: [../../sweeps/r2-scoring-algorithm-and-validation.md](../../sweeps/r2-scoring-algorithm-and-validation.md) `[read]` *(accessed 2026-09-26)*: build-order hour estimates for scoring, backtest, Monte Carlo
- Team scaffold: [README.md](../../../README.md) `[read]` *(accessed 2026-09-26)*: event dates and tracks
