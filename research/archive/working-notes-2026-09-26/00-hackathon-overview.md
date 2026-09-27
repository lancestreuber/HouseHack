# Hackathon overview

Sources, all fetched 2026-09-26:
- [event site](https://ai-horizons-2026-ai-for-housing-hackathon.brandon831577.chatgpt.site/)
- [participant packet](https://docs.google.com/document/d/1L-UYid6Q0JDRH3iy4cpqGIDlZNpJspok_rPxIsILbLQ/edit)
- the three challenge brief pages

## Key dates (ET)
- **Build window:** Sat Sept 26, 9:00 a.m. to **Sun Sept 27, 11:59 p.m.** This is a hard deadline with no extensions.
- **Office hours in Slack:** Sat and Sun, 10 a.m. to 6 p.m. Housing, planning, permitting, and technical mentors will be there.
- **Judging:** Sept 28–30, asynchronous. At least 3 judges per project.
- **Winners:** notified Oct 1, announced Oct 2. $30k is shared among the top 3 college and startup teams.

## Rules that constrain us
- No code written before kickoff. The commit history must start at kickoff, and organizers check it.
- The repo must be public and stay public.
- Open-source libraries, public datasets, and APIs are allowed. List them in the README.
- AI tools are allowed but must be disclosed. The rules warn that "a thin wrapper around an existing AI product isn't a project."
- The tool must be positioned as decision support only, not binding legal, financial, or zoning advice.
- **The submission form asks for one challenge track.** If we combine tracks, we still pick one. See [08-track3.md](08-track3.md).

## Required deliverables
- Working repo
- Demo video, 3–5 minutes. Say the hackathon name and the team, show the tool working, and be honest about what is mocked.
- Documentation
- Data and source citations
- **Limitations statement**
- AI tool disclosure
- Attestation

## Judging criteria (packet)
1. **Problem value.** Does it address a costly, frequent, or consequential bottleneck named in the briefs?
2. **User fit and usability.** Is it plain-language and practical for planners, small developers, nonprofits, and community partners?
3. **Technical execution.** Does the demo reliably do its core tasks?
4. **Data and AI integrity.** Sources, statutes, and assumptions cited. No PII. Uncertainty handled. Human-in-the-loop and escalation paths.
5. **Actionability.** Does it accelerate real decisions, as opposed to producing abstract analytics?
6. **Continuation potential.** Is there a credible path to a pilot with Allegheny County, City Planning, URA, or PHFA?

The packet says: "We don't have good data on X, so our tool doesn't claim to answer it" is a strength, and judges score it that way.

The packet also says the strongest teams have "someone who can explain why any of it matters to a housing practitioner."

## Tracks (summary of the briefs)
1. **Development Feasibility & Pro Forma Navigator.** Parcel ID(s) in; out comes a source-grounded Development Ease Score, the biggest barriers in plain language, and flags for zoning, environment, infrastructure, and policy.
   - Personas: municipal planner, small or mid-size developer, nonprofit/CDC, policy analyst.
   - Data named in the brief: County Real Estate Portal, City zoning code and map, PA DEP eMapPA, City Planning GIS.
   - The landing page also mentions "approved affordability assumptions" (the pro forma angle). The detailed brief does not.
2. **Housing Production, Rents & Household Flow Observatory.** Housing production, rents, and household moves over time. Missingness and privacy must be visible.
3. **Housing Typology, Equity & Climate Matchmaker.** Match places with plausible housing types. Show tradeoffs across demand, feasibility, affordability, displacement, infrastructure, opportunity, and carbon. Present scenarios, with adjustable weights, and separate data from value judgments.

## Organizer data catalog
The packet links a "Data resources" catalog. We saw a copy through a public participant repo: `het-sheth/ai-housing-hackathon-wiki`, file `raw/hackathon/AI Hackathon for Housing — Public Data Catalog - Data Catalog.csv`. It has 60 datasets and is presumably the list every team starts from.

It includes:
- OneStopPGH permits
- ZBA decisions
- USGS 3DEP
- PASDA
- City-owned property
- Tax delinquency
- LIHTC
- CHAS
- ACS
- Zillow and Redfin
- EJScreen
- FEMA NFHL
- The Allegheny County Housing Needs Assessment

**Implication:** the data sources alone are unlikely to set us apart. The official link should be fetched from Slack.
