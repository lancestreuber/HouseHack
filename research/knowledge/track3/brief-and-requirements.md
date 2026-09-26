# Track 3 brief and requirements

**Type:** track3
**One line:** What the Track 3 brief ("Housing Typology, Equity & Climate Matchmaker") actually asks for, quoted from the brief, and what its two hardest requirements mean in build terms.
**Why we care:** The success criteria are concrete and checkable. Any Track 3 entry, or a Track 1 entry that borrows Track 3 ideas, is judged against these words, not against our paraphrase of them.
**Last checked:** 2026-09-26

## The brief, verbatim

All quotes below are from the Track 3 brief page, fetched 2026-09-26 `[read]`.

**Title:** "Challenge 03 · Housing Typology, Equity & Climate Matchmaker"

**Tagline:** "Build a decision-support tool that matches places with plausible housing types and explains the tradeoffs behind each scenario."

**How to use these briefs** (applies to all tracks): "Teams should build a working prototype, use real regional data where possible, explain assumptions and uncertainty, and demonstrate the product with at least one Pittsburgh or Allegheny County use case."

**Core problem:** "Communities need more homes, but the best form and location vary with household demand, land, infrastructure, transit, affordability, and climate impacts. A simple label such as "missing middle" does not tell a planner, nonprofit, or developer whether a particular neighborhood needs duplexes, apartments, townhomes, accessory units, senior housing, or another option, or whether current zoning allows it."

**Build challenge:** "Build a decision-support tool that matches places with plausible housing types and explains the tradeoffs. The model should compare demand, physical feasibility, affordability, displacement risk, infrastructure capacity, access to opportunity, and marginal carbon emissions. It should present scenarios rather than declare a single objectively correct neighborhood or housing type."

### Success criteria (exact wording)

> "A user can compare at least two housing scenarios for a real place, see why the tool ranked them differently, change normative weights, and understand which conclusions are data-driven versus value judgments."

And from the closing panel:

> "The strongest submissions will make tradeoffs legible and separate observed evidence from policy choices, assumptions, and value judgments."

### Owner and users (verbatim)

- **Owner / input:** "Housing-policy and planning leads with community-stakeholder input."
- **Primary users:**
  - "Municipal planners testing zoning and infrastructure scenarios"
  - "Community development corporations choosing projects that meet local needs"
  - "Developers evaluating product type and likely market demand"
  - "Residents and public officials comparing alternative growth patterns"

### Prototype possibilities (verbatim)

- "Neighborhood-to-typology match with interpretable factors and confidence ranges"
- "Scenario tool comparing duplexes, townhomes, apartments, accessory units, and detached homes"
- "Climate score based on building form, embodied carbon, transportation, and infrastructure extension"
- "Equity dashboard identifying affordability gaps and access to jobs, schools, transit, and services"
- "Policy simulator for zoning, tax incentives, density bonuses, or infrastructure investments"

### Useful data (verbatim)

"HUD CHAS", "Land-use data", "Transit accessibility", "Demographic indicators", "Environmental resilience layers". What each of these resolves to in Pittsburgh, with access gotchas, is in [indicators and data](indicators-and-data.md).

## The seven comparison axes, and where each is covered

The build challenge names seven things "the model should compare". This table is our mapping, not the brief's.

| Axis in the brief | Where we cover it | Status of our evidence |
|---|---|---|
| demand | [indicators](indicators-and-data.md) (CHAS, MVA) | Data located and queried |
| physical feasibility | [combining with Track 1](combining-with-track1.md), [use table](../policy/dimensional-standards-and-use-table.md) | Track 1 work supplies it |
| affordability | [indicators](indicators-and-data.md) (CHAS cost burden, H+T) | CHAS queried; H+T needs registration |
| displacement risk | [displacement and equity](displacement-and-equity.md) | MVA + DRR queried; DRR formula not published |
| infrastructure capacity | [infrastructure](../data/infrastructure.md) | **Not covered by the Track 3 sweeps.** Open question |
| access to opportunity | [indicators](indicators-and-data.md) (Opportunity Atlas, GTFS, LODES, SLD) | Queried; tract-vintage mismatch |
| marginal carbon emissions | [carbon by typology](carbon-by-typology.md) | Three published sources read; one paywalled |

## What "scenarios, not one answer" requires concretely

Our reading of the success criterion, broken into things a judge could check in a demo. These are inferences from the quoted text, not the brief's words.

1. **At least two scenarios for one real place.** The same parcel, block group or neighborhood shown under two or more typology options (e.g. duplex vs. townhomes vs. small apartment), side by side. A single ranked list of neighborhoods does not meet it.
2. **"See why the tool ranked them differently."** Each scenario needs a per-criterion breakdown, so the difference in rank can be traced to specific criteria and their values. A single composite number without decomposition does not meet it.
3. **"Change normative weights."** The user must be able to move weights and see the ranking respond. The data sweep suggests preset weight profiles (for example "tenant advocate", "climate", "feasibility first") plus sliders, and reporting where the ranking flips, e.g. "Duplex overtakes townhomes when climate weight exceeds 0.4" ([data sweep](../../sweeps/r4-track3-data-methods-and-combination.md)). That example is illustrative, not a computed result.
4. **No single "objectively correct" output.** The brief says the tool "should present scenarios rather than declare a single objectively correct neighborhood or housing type". One way to honor this is showing the Pareto set, the options no other option beats on every criterion, rather than only the top-weighted one ([data sweep](../../sweeps/r4-track3-data-methods-and-combination.md)).

## What "data-driven versus value judgments" requires concretely

Again our inference from the brief's wording:

- **Every criterion carries a label**: "data" or "value judgment", plus source, vintage and an uncertainty band. The data sweep proposes exactly this per-criterion labelling.
- **The weights are value judgments by definition**, so the UI should say so where the sliders are.
- **Some choices look technical but are value judgments.** Two surfaced in the sweeps:
  - Normalizing carbon per m², per unit or per resident changes which typology ranks best ([carbon by typology](carbon-by-typology.md)).
  - Whether displacement risk is a tradeable weight or a separate warning ([displacement and equity](displacement-and-equity.md)).
- **Assumptions are a third category** the closing panel names ("policy choices, assumptions, and value judgments"). Cost per square foot and rents in a typology prototype are assumptions, not observed data ([typology prototypes](typology-prototypes.md)).
- **Legal gates are data.** Whether a typology is permitted in a district is read from the use table, not weighted ([typology prototypes](typology-prototypes.md)).

The prior-art sweep found no hackathon project or open tool that explicitly labels the data/value split; ArcGIS Urban and CommunityViz expose weights but do not label it ([prior-art sweep](../../sweeps/r4-track3-prior-art-and-hackathons.md)). That was a limited search, not an exhaustive one.

## Open questions

- How judges score across tracks, and whether a Track 1 entry is marked down for Track 3 features or vice versa. Not stated on the brief page.
- Whether "infrastructure capacity" has any usable Pittsburgh data (water, sewer, road capacity). Neither Track 3 sweep looked.
- Whether "infrastructure extension" in the climate prototype has any per-typology source. None found.
- Whether "confidence ranges" in the first prototype possibility is expected numerically, or whether labelled uncertainty is enough.

## Connects to

- [Challenge brief and judging](../challenge/brief-and-judging.md): all three tracks and how they are judged
- [Rules and deliverables](../challenge/rules-and-deliverables.md): the one-track submission form
- [Indicators and data](indicators-and-data.md): the data behind each axis
- [Typology prototypes](typology-prototypes.md): how "housing types" become comparable objects
- [Displacement and equity](displacement-and-equity.md): the displacement axis and its framing risks
- [Carbon by typology](carbon-by-typology.md): the "marginal carbon emissions" axis
- [Combining with Track 1](combining-with-track1.md): feasibility gates from Track 1
- [Score design options](../methods/score-design-options.md): weighted sums, Pareto sets, gates
- [Uncertainty and explainability](../methods/uncertainty-and-explainability.md): how to show "why it ranked this way"

## Sources

- [Track 3 brief: Housing Typology, Equity & Climate Matchmaker](https://ai-horizons-2026-ai-for-housing-hackathon.brandon831577.chatgpt.site/challenges/typology-equity-climate.html) `[read]` *(accessed 2026-09-26)*: full page fetched with curl; all quotes above
- Sweep: [../../sweeps/r4-track3-data-methods-and-combination.md](../../sweeps/r4-track3-data-methods-and-combination.md) `[read]` *(accessed 2026-09-26)*: weekend method, preset weight profiles, Pareto set
- Sweep: [../../sweeps/r4-track3-prior-art-and-hackathons.md](../../sweeps/r4-track3-prior-art-and-hackathons.md) `[read]` *(accessed 2026-09-26)*: gap analysis on data/value labelling
