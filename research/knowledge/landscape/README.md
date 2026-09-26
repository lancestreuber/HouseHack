# Landscape

What already exists: commercial and open tools, hackathon precedents, Pittsburgh civic tools, other participants' public repos, and alternative product framings.

| Node | What it covers |
|---|---|
| [commercial-tools.md](commercial-tools.md) | Commercial zoning/feasibility products, research likelihood models, open-source repos with licenses |
| [hackathon-precedents.md](hackathon-precedents.md) | Seattle PACT-athon, AEC Tech (UpZone, Zone In, Anthill), ZoneMind, YIMBY AI, NJ |
| [pittsburgh-civic-tools.md](pittsburgh-civic-tools.md) | WPRDC tools, Lots to Love, ETHOS lot suitability, OneStopPGH Insights, Landslide Portal, Board Explorer, Pro-Housing IZ dataset, Neighborhood Project, MVA |
| [other-participants.md](other-participants.md) | Public repos from this event (facts only; not a competitor count) |
| [framings.md](framings.md) | Nine Track 1 framings with evidence and risks |

## Common / less common / no example found

⚠ **Absence of evidence is not evidence of absence.** These lists reflect a few hours of search on 2026-09-26. Devpost coverage was weak because Devpost blocked scripted search, so we saw only what search engines index. Private and unpushed repos are invisible. Nothing here is a claim about what other teams will build.

### Common (baseline)
- **Parcel lookup + zoning summary + plain-language "what can I build here."** Commercial: Zoneomics (covers Allegheny County), Gridics, Deepblocks, Symbium, Envelope. Hackathons: Zone In, Seattle's PreAssess. Many small 2026 GitHub repos. → [commercial tools](commercial-tools.md), [hackathon precedents](hackathon-precedents.md)
- **Zoning envelope / 3D massing.** UpZone, TestFit, building-viz.
- **Pro forma calculators.** Terner dashboard and "Making It Pencil," UDST/developer.
- **Chat / RAG over zoning code or permits.** Seattle 2nd place, NJ entry, Devpost projects.
- **Environmental overlay flags** (flood, slope, landslide). Standard in commercial tools.

### Exists but less common
- **Backtesting a score against real permits.** LA and SF Housing Element likelihood models, YIMBYdata, UCLA RHNAmaps; locally, the Pro-Housing Pittsburgh IZ dataset (109 buildings, CC BY-NC). No hackathon version found.
- **Approval-timeline prediction.** Seattle's 1st-place Permit Predictor (with confidence scores); PermitFlow marketing claims.
- **Policy-lever simulator.** El Paso housingstrategy (MIT), Terner Housing Policy Simulator, Terner/MapCraft SB 9.
- **Lot assembly.** Archistar markets it (Australia); Envelope.city air-rights search. No open or hackathon version found.
- **Uncertainty ranges on outputs.** Permit Predictor; El Paso's conservative vs upper-bound figures.

### No example found (this search only)
- A development score **specific to Pittsburgh or Allegheny County**, public or commercial. Regional tools are data explorers ([Pittsburgh civic tools](pittsburgh-civic-tools.md)).
- Approval-pathway timelines from **OneStopPGH/PLI data** by project type (the IZ study is the only Pittsburgh timeline work found).
- **ZBA or variance outcome prediction** (only fairness research found).
- **LiDAR-derived slope** inside a housing feasibility score.
- **Scoring city-owned lots for assembly.**
- An **ease score broken out by typology** (partial analogs: El Paso yield per lever; Gridics/TestFit massing).
- For Track 3: typology-to-place matching across all seven brief axes; a tool that explicitly labels data-driven results vs value weights; marginal carbon by typology in a given location; an open, maintained, permissively licensed scenario engine.

Sources for this summary: [r3 reality check](../../sweeps/r3-reality-check-existing-tools.md), [r4 Track 3 prior art](../../sweeps/r4-track3-prior-art-and-hackathons.md), [working notes](../../archive/working-notes-2026-09-26/05-landscape-and-prior-art.md). Per-item sources and tags are in the nodes above.

## What this implies (our inference)

"Not found" items are where Pittsburgh data could make an entry distinctive, but the organizer data catalog already recommends several of the relevant datasets to every team, and at least one public participant repo reasons along similar lines ([other participants](other-participants.md)). If an entry is to stand apart, the idea list alone is unlikely to do it; execution and honesty about limits are what remain. This is a guess, not evidence about judging.

## Related
- [Brief and judging](../challenge/brief-and-judging.md)
- [Organizer data catalog](../data/organizer-data-catalog.md)
- [Track 3: combining with Track 1](../track3/combining-with-track1.md)
