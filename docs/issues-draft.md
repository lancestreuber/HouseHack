# Work plan: 5 people, Track 3 only (draft; create the issues after lanes are picked)

**The product.** A user picks a place, and optionally who they're planning for. They get **scenario cards** (housing type × place × household) and can ask the **AI companion** about them.

**Decisions** come from **Jev** (TypeSafe AI). Jev returns typed choices, scores and yes/no answers, each with a calibrated probability. **Claude** writes the companion's words.

**Data** is GeoJSON layers plus per-parcel features, described in a shared manifest.

| Lane | People | Owns | Main docs |
|---|---|---|---|
| **D1: Data, Land & Hazards** | 1 | `scripts/data/land/`, `public/data/land/` | data-sources, environment-infrastructure, catalog-sweep |
| **D2: Data, People & Place** | 1 | `scripts/data/people/`, `public/data/people/` | access-amenities, household-lens, catalog-sweep |
| **J: Jev + engine + integration** | 1 | `packages/scoring/`, `packages/api/` | track3-methodology, interactions, zoning-rules, pro-forma |
| **F1: Frontend, Map** | 1 | `apps/web/src/components/map/` | ui-map |
| **F2: Frontend, Experience** | 1 | `apps/web/src/components/{scenarios,companion,report}/`, routes | ui-map, track3-methodology |

**Labels:** `lane:data-land` `lane:data-people` `lane:jev-integration` `lane:map` `lane:experience` `setup` `blocker`.

**Milestones:**
- M1 Setup: Sat 3pm
- M2 Checkpoint: Sat 8pm, end-to-end on real data, deployed
- M3 Freeze: Sun 2pm
- M4 Submit: Sun 9pm

All docs live in `docs/research/`.

## The contracts, first hour (everyone builds against these)
1. **GeoJSON contract + `public/data/manifest.json`** (`blocker`, D1+D2+J).
   - One file per layer.
   - Properties use snake_case.
   - Every layer lists `source`, `source_url`, `as_of`, `license` and `label` (evidence/assumption) in the manifest.
   - Parcel features are keyed by `parcel_id`; place metrics are keyed by `hood_id` and `tract_id`.
   - Mock versions go in `public/data/mock/`.
2. **Engine types** in `packages/scoring/src/types.ts` (`blocker`, J): `Parcel`, `PlaceMetrics`, `Household`, `Typology`, `Scenario`, `Decision` (the Jev result + probability), `TradeoffCard` and `Fact`.
3. **Jev decision schema** (`blocker`, J), written down so F2 can build the cards against it:
   - **Choice:** best typology per place × household.
   - **Score (low/med/high):** each tradeoff dimension.
   - **Yes/no:** red flags and tradeoff-card triggers.
4. **Setup for all 5**: bun, env, dev server running (stack-setup.md §1). Plus scaffold cleanup (§5), design tokens and shadcn (ui-map §4, §6), and Vercel with preview protection off (§7). The J person leads.
5. **Confirm Jev early-access API key** (`blocker`, J). If there's no key by 3pm, J builds the deterministic fallback first (the same schema, computed by rules).

## D1: Data, Land & Hazards (`lane:data-land`)
6. Data workspace + `bun run data:refresh` (M1)
7. Parcels: ParcelsPublic → zoning, lot width/depth, vacancy, owner category, city-owned / Land Bank → `parcels.pmtiles` + `parcels.geojson` sample (M2)
8. Hazards: slope 25%, landslide, undermined, flood, plus 311 landslide/sinkhole reports, joined per parcel (M2)
9. Infrastructure: lead lines (PWSA / `lead-risk`), hydrant and street distance, sewershed overflows, city steps (M2)
10. Environment: tract PM2.5, highway and industrial proximity, FEMA National Risk Index (flood, heat) (M2)
11. Satellite: canopy, impervious surface and summer heat per parcel. Pin `geotiff@2.1.3`. (M3)
12. Historic districts + Zoning Board case history, for variance odds (M3)

## D2: Data, People & Place (`lane:data-people`)
13. **Permits as a "people want to live here" signal** (M2):
    - PLI permits (65k) as recent residential construction and renovation per neighborhood, plus the trend.
    - Census permits by building type.
    - It feeds Demand, and, together with rising sale prices, displacement pressure.
14. Access per parcel (kdbush) (M2):
    - jobs by transit (Access Across America)
    - grocery, parks, schools (growth), health, childcare
    - frequent transit, sidewalks
15. Demand + equity per place: MVA 2021, displacement ratio, ACS 2024 (income, rent, burden, household mix, zero-car), Eviction Lab, expiring affordability (M2)
16. 1937 redlining (HOLC) layer + neighborhoods + ZIPs for search (M2)
17. Household lens: 10 personas, commute times to 14 job centers (r5py; the recipe is in household-lens.md), underserved demand (M3)
18. Climate/carbon inputs: DOE LEAD energy cost by type, BTS LATCH vehicle miles, HUD Location Affordability Index (M3)

## J: Jev + engine + integration (`lane:jev-integration`)
19. `ZONING_RULES` + six sub-scores with percentile ranks and coverage suppression (M2)
20. Sensitivity × mitigation exposure engine + red-flag rule (M2)
21. **Jev decision layer** (M2):
    - Send the place + household + sub-score facts as `state`.
    - Ask the Choice, Score and yes/no questions.
    - Return scenarios with probabilities as the confidence.
    - Cache results, and fall back to rules if Jev is unavailable.
22. Scenario API (oRPC): `scenarios.forPlace(place, household)`, `site.report(parcel)`, `policy.simulate(lever)` (M2)
23. **AI companion**:
    - Claude with tools: `find_places`, `get_site_report`, `compare_scenarios`, `explain_factor`, `simulate_policy`, `get_sources`.
    - It streams, cites fact ids, and can only state facts that tools returned.
    - It is *not* trained on the data; it reads the data live. (M2)
24. Policy levers (ADU reform first, labeled pending) + affordability gap + subsidy matches (M3)
25. Integration: merge the lanes, deploy to Vercel, end-to-end checks at M2 and M3 (M2/M3)

## F1: Frontend, Map (`lane:map`)
26. Map shell: MapLibre 6 + OpenFreeMap Positron, ClientOnly/lazy (M1)
27. Layers from the manifest + combined legend and layer list (hazards hatched, redlining toggle) (M2)
28. Pick-a-place: ⌘K search (address/ZIP/neighborhood) + tap to select (M2)
29. GPU recolor when the household or weights change; state in the URL (M2)
30. Companion → map actions (fly, highlight, filter) + commute arcs to job centers (M3)
31. Mobile bottom sheet + ranked list view; 3D massing preview (stretch) (M3)

## F2: Frontend, Experience (`lane:experience`)
32. Household picker (10 personas + optional workplace) (M2)
33. Scenario cards: fit + Jev confidence, top tradeoffs, benefits/harms, legal status, red flags; compare and pin (M2)
34. Companion chat panel: streaming, fact chips, Evidence/Assumption/Value tags, suggested questions, glossary (M2)
35. Site report + next steps (zoning path, variance odds, Land Bank, RCO contacts) + policy simulation UI (M3)
36. Landing + methodology page ("what this tool gets wrong") + community brief print (M3)
37. Demo video (3–5 min; start with the hackathon name + team; be honest about what's real) + submission form (M4)
