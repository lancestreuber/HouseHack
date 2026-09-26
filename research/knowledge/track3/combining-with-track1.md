# Combining Track 3 with Track 1

**Type:** track3
**One line:** Three ways to join Track 1's parcel feasibility work with Track 3's typology/equity/climate matching, the shared data model they would use, and where combining could hurt.
**Why we care:** Much of the Track 1 pipeline (zoning, use table, slope, overlays) is the "physical feasibility" axis Track 3 asks for. Whether and how to combine is a scoping decision for the team; this node lays out options, not a pick.
**Last checked:** 2026-09-26

## Constraint: one track on the form

The submission form asks for one track. The data sweep's archive note records that the lead researcher read the packet text directly: *"Challenge track: Which of the three you're entering"* ([data sweep](../../sweeps/r4-track3-data-methods-and-combination.md)). Whether judges score across tracks is not known. See [rules and deliverables](../challenge/rules-and-deliverables.md).

## Options

### A. "Buildable → Fit" (per parcel)

- **Track 1 layer:** legal and physical gates, the path to approval, friction, and a Development Ease Score.
- **Track 3 layer:** among the typologies that pass the gates, score need (CHAS), displacement (DRR and MVA), access (GTFS, LODES, SLD), climate (NRI, canopy, RECS, embodied carbon), with user-set weights.
- **Demo shape:** 2–3 parcels, e.g. city-owned vacant lots in different MVA groups; compare scenarios, move weights, open "why it ranked this way" and "what's data vs. value".
- Can be framed either as Track 3 using Track 1 as a physical-feasibility filter, or as Track 1 extended to "compare parcels for starter homes".

### B. "Policy what-if"

- A switch between **"current code"** and **"Bill 2025-1545 as proposed"** (citywide ADUs by right, parking minimums removed, an Affordable Housing Bonus Program) showing which typologies become possible and how feasibility and fit change.
- Status: Planning Commission recommended June 2, 2026; Council public hearing **Sept 23, 2026**; whether Council has voted is unconfirmed. **Label it proposed, not law.**
- Maps to the brief's prototype possibility "Policy simulator for zoning, tax incentives, density bonuses, or infrastructure investments" (brief `[read]`).
- Can layer on top of A or C.

### C. Area level, not parcel level

- Neighborhood- or tract-level typology-mix scenarios for Track 3, with Track 1 feasibility rolled up as a supply constraint.
- Fits Track 3's area-scale data more naturally (most indicators are tract or block group; see [indicators](indicators-and-data.md)), but uses less of the parcel work.

### Comparison

| | A. Buildable → Fit | B. Policy what-if | C. Area level |
|---|---|---|---|
| Reuses Track 1 parcel work | Fully | Fully, plus a second rule set | Partly (rolled up) |
| Matches Track 3 data scale | Parcels inherit area values; parcel-precision claims are weaker than they look | Same as its base | Natural |
| Extra rules work | Typology gates | Transcribing the proposed bill's rules; risk of mis-stating pending law | Aggregation logic |
| Fits "compare ≥2 scenarios for a real place" | Yes (typologies on one parcel) | Yes (two code regimes on one place) | Yes (two mixes for one area) |
| Main risk | Two scoring systems in the time available | Bill status could change mid-event | Weaker link to Track 1 work |

## Shared data model

From the data sweep: **parcel → block group → tract → RCO area.**
- Zoning and constraints attach at **parcel**.
- MVA and DRR attach at **block group**.
- CHAS, NRI, Community Need and Opportunity Atlas attach at **tract**.
- RCO area for the "consult" prompt (org name + geometry only; the layer holds PII).
- Each parcel gets a list of typology options, each with gate results, criterion scores, citations and data/value labels.

The build sweep's static-first architecture precomputes Track 3 metrics per block group into one JSON (about 1–2 MB, estimated) that the client-side scoring engine reads so sliders update instantly; the critical path is parcels + zoning → PMTiles → map → rules engine → demo, with **Track 3 off the critical path** ([build sweep](../../sweeps/r4-build-feasibility-on-team-stack.md)).

## Risks of combining

From the data sweep (its judgment) and the build sweep (its timeline):

1. **One-track submission form.** The team would need to pick a primary track and describe the other as the input it needs, and say it the same way in the pitch, README and form.
2. **Two headline numbers.** Judges may be confused by an Ease Score and a fit rank side by side. One option the sweep raises: keep Ease as a gate or tier and rank only on fit. Another is the reverse. Either is a framing choice.
3. **Scope.** Two scoring systems in the event window. The build sweep's H16 cut line: if Track 3 is behind, ship 3 typologies (ADU, duplex, small apartment) and 3 weights (feasibility, transit, displacement), and drop carbon or make it a static per-typology factor in limitations. The data sweep suggests limiting carbon to three cited sources.
4. **Geographic mismatches.** 2010 vs. 2020 tracts, MVA block groups with a/b splits, city-only vs. county-wide layers ([indicators](indicators-and-data.md)).
5. **Displacement framing.** A combined "buildable and good fit" ranking inherits the framing risk in [displacement and equity](displacement-and-equity.md).

## Open questions

- How judges score across tracks, and whether a combined entry helps or hurts.
- Whether Council has voted on Bill 2025-1545 (decides whether B is "proposed" or "law").
- Which framing, Track 1 primary or Track 3 primary, the team wants. That is a team decision, not a research finding.

## Connects to

- [Brief and requirements](brief-and-requirements.md): Track 3 success criteria
- [Challenge brief and judging](../challenge/brief-and-judging.md): Track 1 brief and judging
- [Rules and deliverables](../challenge/rules-and-deliverables.md): one-track form
- [Typology prototypes](typology-prototypes.md): the use-table gates
- [Reforms in flux](../policy/reforms-in-flux-2025-2026.md): Bill 2025-1545 for option B
- [Dimensional standards and use table](../policy/dimensional-standards-and-use-table.md)
- [Score design options](../methods/score-design-options.md): Ease as gate vs. score
- [Architecture options](../build-plan/architecture-options.md) and [timeline and workstreams](../build-plan/timeline-and-workstreams.md): where Track 3 sits in the build
- [Land availability and title](../data/land-availability-and-title.md): city-owned vacant lots for the demo

## Sources

- [Track 3 brief](https://ai-horizons-2026-ai-for-housing-hackathon.brandon831577.chatgpt.site/challenges/typology-equity-climate.html) `[read]` *(accessed 2026-09-26)*: policy-simulator prototype possibility
- [WESA: Planning Commission and inclusionary zoning](https://www.wesanews.org/development-transportation/2026-06-03/pittsburgh-planning-commission-vountary-inclusionary-zoning) `[read]` *(accessed 2026-09-26)*: Bill 2025-1545 recommendation
- [City Council public hearing, Sept 23, 2026](https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/Council-Public-Hearings/City-Council-Public-Hearing-September-23-2026) `[read]` *(accessed 2026-09-26)*: hearing date
- Sweep: [../../sweeps/r4-track3-data-methods-and-combination.md](../../sweeps/r4-track3-data-methods-and-combination.md) `[read]` *(accessed 2026-09-26)*: options A/B/C, data model, risks, one-track note
- Sweep: [../../sweeps/r4-build-feasibility-on-team-stack.md](../../sweeps/r4-build-feasibility-on-team-stack.md) `[read]` *(accessed 2026-09-26)*: metrics JSON, critical path, cut lines
