# LLM role

**Type:** method
**One line:** Where a language model fits in a parcel-feasibility tool: explaining deterministic results with real citations, and optionally drafting rule tables for human sign-off, but never producing a number.
**Why we care:** An LLM that invents a setback or an approval odds figure would sink the tool's credibility with planners and judges. A narrow, cited role keeps the useful part (plain-language explanation) without that risk.
**Last checked:** 2026-09-26

## The boundary

Every source that discusses it draws the same line ([scoring sweep](../../sweeps/r2-scoring-algorithm-and-validation.md), [build sweep](../../sweeps/r4-build-feasibility-on-team-stack.md), [working notes](../../archive/working-notes-2026-09-26/03-scoring-methods.md)):

- **All scores, gates and weights are deterministic** code over precomputed data. The LLM receives the numbers and must not change them.
- **Allowed role (a): explain.** Turn the deterministic contribution vector and reasons into plain-language prose with citations.
- **Allowed role (b), optional: extract.** Draft dimensional standards from zoning code text into a JSON table, with a human reviewing and signing off, and section citations stored. This happens offline, before the tool runs.
- **Log** the prompt and output alongside data vintages.

## Options for the explain role

| Option | What the user sees | Tradeoff |
|---|---|---|
| **No LLM** | A deterministic reasons list with linked code sections | Zero hallucination risk; less readable |
| **Explain with citations** (the sources' main proposal) | Prose tied to specific code sections, with cited text | Readable and checkable; needs a retrieval step and an API key |
| **Chat grounded in the zoning code** | Open-ended Q&A | The UX sweep rates it high demo impact but notes it is a common idea and "only worth it if citations are real and clickable. Ungrounded answers hurt credibility" ([UX sweep](../../sweeps/r2-ux-and-map-stack.md)) |

## Grounding and citations (as proposed in the build sweep)

- **Corpus:** chunk the Pittsburgh zoning code into JSON sections `{id, title, url, text}`.
- **Deterministic retrieval, not embeddings:** pick 3–8 relevant sections from the parcel's zoning district and the gates it triggered. The same parcel always gets the same sections, which makes outputs reproducible and auditable.
- **Document blocks with citations:** pass the sections as `document` blocks with `citations: {enabled: true}`. Responses then carry `cited_text` and a document index that maps back to section URLs.
  - ⚠ The build sweep marks this as from a **skill reference, not tested** in our stack.
  - The same sweep notes that citations **can't be combined with structured-output** `output_config.format`. So a response can be cited prose or structured JSON, not both.
- **Server only:** `@anthropic-ai/sdk` (0.128.0 per the build sweep) inside an oRPC `publicProcedure`, streamed ([build sweep](../../sweeps/r4-build-feasibility-on-team-stack.md)).

The code text the corpus is built from is described in [zoning code text](../data/zoning-code-text.md). A rule is only `[read]` once checked in eCode360 or an official City document ([knowledge README](../README.md)).

## Fallback

If the API key or network fails, show the deterministic "reasons" list without prose ([build sweep](../../sweeps/r4-build-feasibility-on-team-stack.md)). The build sweep's H20 cut line: if LLM citations are shaky, ship deterministic cited code sections without prose. See [timeline](../build-plan/timeline-and-workstreams.md).

## Cost (estimates)

These are **estimates** from the build sweep, at list prices it reported, assuming about 8k input and 800 output tokens per call. The prices and model IDs were not independently re-checked for this node.

| Model (as named in the sweep) | Price per million tokens (in/out) | Estimated cost per call |
|---|---|---|
| `claude-opus-5` | $5 / $25 | ~$0.06 |
| `claude-sonnet-5` | $2 / $10 | ~$0.024 |
| `claude-haiku-4-5` | $1 / $5 | ~$0.012 |

The sweep estimates 500 demo calls at about $6–30. Options to control cost and latency: cache by (parcel, typology) in Neon or a KV store so a demo replays instantly; rate-limit or cap the endpoint rather than putting it behind a login. Model choice is the team's call.

## Disclosure

The build sweep lists an "AI disclosure" section in the README as part of the final deliverables ([build sweep](../../sweeps/r4-build-feasibility-on-team-stack.md)). Rules on AI use are in [rules and deliverables](../challenge/rules-and-deliverables.md).

## Open questions
- Whether document-block citations work as described with the SDK version in the scaffold. Untested.
- Current model IDs and list prices; the figures above are the sweep's.
- Whether the extraction role (b) is worth the review burden for 6–8 residential districts, versus transcribing by hand. The build sweep calls manual transcription "the biggest accuracy risk" either way.
- Whether the zoning code text can be chunked from eCode360 with stable section URLs.

## Connects to
- [Score design options](score-design-options.md): the deterministic numbers the LLM explains
- [Uncertainty and explainability](uncertainty-and-explainability.md): the contribution vector and reason codes
- [Zoning code text](../data/zoning-code-text.md): the corpus
- [Architecture options](../build-plan/architecture-options.md): where the explain endpoint and cache live
- [Timeline and workstreams](../build-plan/timeline-and-workstreams.md): the LLM is off the critical path
- [Rules and deliverables](../challenge/rules-and-deliverables.md): AI disclosure

## Sources
- Sweep: [../../sweeps/r4-build-feasibility-on-team-stack.md](../../sweeps/r4-build-feasibility-on-team-stack.md) `[read]` *(accessed 2026-09-26)*: grounding design, citations caveat, cost estimates, fallback
- Sweep: [../../sweeps/r2-scoring-algorithm-and-validation.md](../../sweeps/r2-scoring-algorithm-and-validation.md) `[read]` *(accessed 2026-09-26)*: narrow LLM role (extract with sign-off; explain; never a number)
- Sweep: [../../sweeps/r2-ux-and-map-stack.md](../../sweeps/r2-ux-and-map-stack.md) `[read]` *(accessed 2026-09-26)*: grounded chat as a "could" feature and its credibility risk
- Working notes: [../../archive/working-notes-2026-09-26/03-scoring-methods.md](../../archive/working-notes-2026-09-26/03-scoring-methods.md) `[read]` *(accessed 2026-09-26)*: LLM never produces numbers
- Anthropic citations via `document` blocks and model pricing, as reported by the build sweep from a skill reference. Link: [build sweep](../../sweeps/r4-build-feasibility-on-team-stack.md) `[skimmed]` *(accessed 2026-09-26)*: secondary summary; not tested in our stack
