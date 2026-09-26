# HouseHack

Our entry for the AI Horizons 2026 AI for Housing Hackathon (Pittsburgh). **Focus: Track 3, the Housing Typology, Equity & Climate Matchmaker** ([brief](https://ai-horizons-2026-ai-for-housing-hackathon.brandon831577.chatgpt.site/challenges/typology-equity-climate)). The Track 1 feasibility research feeds its feasibility axis. The build window closes **Sun Sept 27, 2026, 11:59 p.m. ET** and there are no extensions.

## Research: read this before building or answering questions about the domain

All of the domain research lives in [`research/`](research/). Where to go:

1. **The 2-minute version** (what we can build, what works, what doesn't, what's unknown): [`research/BRIEFING.md`](research/BRIEFING.md)
2. **Finding a specific fact** (endpoint, zoning rule, dataset, stakeholder, method): grep [`research/knowledge/INDEX.md`](research/knowledge/INDEX.md), then open the node it points to.
3. **The full argument**, with every claim sourced: [`research/knowledge/PAPER.md`](research/knowledge/PAPER.md)
4. **Before citing anything:** check the corrections log in [`research/knowledge/README.md`](research/knowledge/README.md) and the audit in [`research/docs/04-critique.md`](research/docs/04-critique.md).

Research method and rules are in [`research/CLAUDE.md`](research/CLAUDE.md). When you add research, update `BRIEFING.md` if a conclusion changes, and re-run `python3 research/admin/scripts/build_index.py` from `research/`.

## Hard rules for the product

- **Decision support only.** Nothing the app outputs is legal, financial or zoning advice.
- **No PII.** Never ingest property owner names. Some City GIS layers (for example, `PGHWebRCO`) contain contact details; request only non-personal fields.
- **"Unknown" is not "bad".** Infrastructure capacity is not public, so the app must say "unknown", never "fails".
- **The LLM explains; it never produces a score.** Keep scoring deterministic and cite the code section behind each flag.
- **No secrets in the repo.** It must be public at submission.
