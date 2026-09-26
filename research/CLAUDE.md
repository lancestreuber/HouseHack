# CLAUDE.md — HouseHack research

These are project-specific instructions for working in `research/`. They add to the global `~/.claude/CLAUDE.md`.

## What this is

The research base for our entry to the AI Horizons 2026 AI for Housing Hackathon (Pittsburgh, build window Sept 26–27, 2026). It supports decisions about **what to build and how**. It does not decide them.

It uses a cross-linked wiki with a paper as the entry point ([`knowledge/PAPER.md`](knowledge/PAPER.md)), honest verification tags on every source, full-fidelity sweep archives, and a visible corrections log. Node rules and the template are in [`knowledge/README.md`](knowledge/README.md).

## Epistemic stance: cautious, curious, never finished

1. **Never claim the research is exhausted or converged.** The most we may say is that *"the sources reached are repeating themselves"*, and then we ask what kind of source we haven't reached.
2. **When findings repeat, change the search method.** Try a primary document, a City Council record, a practitioner, or a dataset query. Repetition is not a reason to stop.
3. **Keep three things apart:** what a source says, what we infer, and what we are guessing.
4. **Contradictions stay visible**, and we log corrections in `knowledge/README.md`.
5. **Never claim what other teams will or won't build**, or that an approach will win. We can report what public repos contain. Anything about other teams' plans is speculation.

## This domain's traps

- **The rules are changing while we work.** The minimum lot size reform took effect 5/7/2025. Bill 2025-1545 had its hearing 9/23/2026 and its vote status is unknown. Bill 2026-0834 has a hearing 10/13/2026. A full zoning rewrite is planned. **Every rule carries the code version or bill status and a date accessed.**
- **Mirrors and summaries are not the code.** A zoning rule stays `[skimmed]` until it has been read on eCode360 or in an official, dated City document.
- **Many public GIS layers are stale**, often last edited in 2023. Record `editingInfo` dates.
- **"Unknown" is not "bad".** Sewer and water capacity is not public. The tool and the research must say "unknown", not "fails".
- **Equity framing.** A ranking that favors densifying places with high need, good transit and cheap land tends to point at neighborhoods at risk of displacement. Treat displacement as a warning, not a tradeable weight.

## Verification tags

- `[read]` — fetched and read, or an endpoint queried and its response inspected
- `[skimmed]` — partial, snippet, abstract, or secondary summary
- `[found]` — known to exist, not opened, including anything recalled from memory
- `[inaccessible]` — blocked; record the blocker in `admin/source-access.md`

**Never upgrade a tag without the artefact.**

## If we cite it, we hold it

Save load-bearing code text, policy text and data dictionaries to `sources/` as `<publisher>-<yyyy-mm-dd>-<slug>.<ext>`, with the date accessed.

## Hard rules

- **No PII.** Cite people by role. Some City layers contain contact details, such as the `PGHWebRCO` contact names, emails and phone numbers. Never copy those into this repo or into the app. Request only non-personal fields.
- **No secrets.** No API keys or tokens anywhere in `research/`.
- **Decision support, not advice.** Nothing here is legal, financial or zoning advice.
