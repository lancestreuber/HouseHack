# Methods

**Type:** method
**One line:** Index of the method nodes: how a parcel score could be built, tested, explained, narrated by an LLM, and extended into a pro forma.
**Why we care:** These are the choices that decide whether the tool's numbers can be defended. Each node presents options and tradeoffs; none of them records a final decision.
**Last checked:** 2026-09-26

## Nodes

| Node | What it covers |
|---|---|
| [score-design-options.md](score-design-options.md) | Gates / friction / opportunity; per-typology scoring; envelope without FAR; multiplicative vs additive; MCDA/AHP, CA Housing Element, Terner, Portland BLI, Seattle, UrbanSim, CalEnviroScreen |
| [backtest-and-calibration.md](backtest-and-calibration.md) | New-construction permit positives from two sources, dedupe by project, demand × ease confound, leakage, temporal holdout, what a backtest can and cannot show |
| [uncertainty-and-explainability.md](uncertainty-and-explainability.md) | Per-factor confidence and vintage, unknown-vs-bad, Monte Carlo bands, persona sensitivity, waterfalls, reason codes, overrides |
| [llm-role.md](llm-role.md) | Explain-only boundary, deterministic retrieval, citations through document blocks, fallback, cost estimates |
| [pro-forma.md](pro-forma.md) | RLV vs gap forms; HUD FY2026 limits, PHFA QAP caps and cost limits, URA programs, sales code 16 comps, weak hard-cost sources |

## Tagging notes for this directory

- Literature in the scoring sweep (Malczewski, Saaty, CA Housing Element, Portland, Seattle, UrbanSim, CalEnviroScreen, Lundberg & Lee, Peduzzi) was cited **from memory, not re-fetched**, so it is tagged `[found]` and linked to the sweep that names it.
- The Terner Center dashboard is `[read]` because the prior-art sweep fetched it.
- Estimates from sweeps (build hours, API cost per call, confidence intervals) are labeled as estimates in the body.

## Corrections that affect these nodes
- Pittsburgh §903.03 residential districts have **no FAR**; the scoring sweep's draft envelope formula used FAR. See [score design](score-design-options.md) and the [corrections log](../README.md#corrections-log).
- HUD $55,200 (50% AMI, 4-person) is **FY2026**, not FY2025. See [pro forma](pro-forma.md).

## Open questions
- Which combination form and which calibration use (evaluate only vs re-weight vs fitted score) to adopt. Not decided.
- Approval probabilities have no Pittsburgh data behind them.
- Hard-cost inputs lack a credible public source.

## Connects to
- [PAPER.md](../PAPER.md): the survey these nodes support
- [Build](../build-plan/README.md): how the methods map onto the stack
- [Data](../data/permits-and-outcomes.md): the outcome labels for calibration
- [Policy](../policy/dimensional-standards-and-use-table.md): the rules the score encodes
- [Track 3: combining with Track 1](../track3/combining-with-track1.md): typology matching

## Sources
- Sweep: [../../sweeps/r2-scoring-algorithm-and-validation.md](../../sweeps/r2-scoring-algorithm-and-validation.md) `[read]` *(accessed 2026-09-26)*: scoring and calibration
- Sweep: [../../sweeps/r1-prior-art-proforma-and-practitioner-barriers.md](../../sweeps/r1-prior-art-proforma-and-practitioner-barriers.md) `[read]` *(accessed 2026-09-26)*: pro forma inputs
- Sweep: [../../sweeps/r4-build-feasibility-on-team-stack.md](../../sweeps/r4-build-feasibility-on-team-stack.md) `[read]` *(accessed 2026-09-26)*: LLM integration
- Working notes: [../../archive/working-notes-2026-09-26/03-scoring-methods.md](../../archive/working-notes-2026-09-26/03-scoring-methods.md) `[read]` *(accessed 2026-09-26)*: options summary
