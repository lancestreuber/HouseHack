# GitHub issues: draft (review before creating)

**Track 3 only.** The product: pick a place (and who you're planning for), then see **scenario cards** (housing type × place × household), then ask the **AI companion**. Underneath is one engine: fit = benefits − exposure × household sensitivity × (1 − mitigation from the housing type).

**Labels:** `lane:data` `lane:engine-ai` `lane:map` `lane:experience` `setup` `blocker`
**Milestones:** M1 Setup (Sat 1:30pm) · M2 Checkpoint (Sat 7pm) · M3 Freeze (Sun 2pm) · M4 Submit (Sun 9pm)

Each issue names the research doc that holds its recipe. All paths are under `docs/research/`.

## Setup (M1)
1. **Setup runbook: bun, env, dev server running** (`setup`). Follow stack-setup.md §1. Create `apps/web/.env` before `bun install`. No database is needed.
2. **Remove scaffold cruft** (`setup`). Delete the todos, `_auth/`, login and user-menu code. Set the page title, drop the forced dark theme, and hide devtools in production. Steps in stack-setup.md §5.
3. **Shared contract + mock data** (`setup`, `blocker`). Create `packages/scoring/src/types.ts` with these types:
   - `Parcel`, `PlaceMetrics`
   - `Household`, `Typology`
   - `Scenario`, `Factor`, `Fact`
   - `TradeoffCard`

   Put mock JSON in `apps/web/public/data/mock/`.
4. **Design tokens, fonts, shadcn components** (`setup`). Follow ui-map.md §4 and §6.
5. **Vercel project, env vars, preview protection off** (`setup`). Follow stack-setup.md §7.

## Lane A: Data (`lane:data`), docs: data-sources, access-amenities, environment-infrastructure, catalog-sweep, household-lens
6. **Data workspace `@HouseHack/data` + `bun run data:refresh`** (M1)
7. **Parcels:** ParcelsPublic, then per-parcel features: zoning, lot width/depth, vacancy, owner. Output `parcels.pmtiles`. (M2)
8. **Hazards and exposures per parcel** (M2):
   - slope, landslide, undermined, flood
   - lead line (PWSA / `lead-risk`)
   - sewershed overflows
   - highway and industrial proximity
   - tract PM2.5
9. **Access per parcel via kdbush** (M2):
   - jobs by transit (Access Across America)
   - grocery, parks, schools (growth score), health, childcare
   - frequent transit stops
   - sidewalks
10. **Demand and equity per place** (M2):
    - Market Value Analysis 2021 and the displacement risk ratio
    - ACS 2024 via Census Reporter (income, rent, burden, household mix, zero-car)
    - Eviction Lab filings
    - expiring affordability
    - 1937 redlining (HOLC) layer
11. **Satellite per parcel** (M3): canopy, impervious surface, summer heat. Pin `geotiff@2.1.3`.
12. **Climate and carbon inputs** (M3): FEMA National Risk Index (tract), DOE LEAD energy cost by building type, BTS LATCH vehicle miles, HUD Location Affordability Index.
13. **Household-lens inputs** (M3): LEHD commute flows to job centers, including suburbs, and household composition. Follow household-lens.md.

## Lane B: Engine + AI (`lane:engine-ai`), docs: track3-methodology, interactions, zoning-rules, pro-forma, household-lens
14. **`ZONING_RULES` + tests** (M2)
15. **Six sub-scores** (M2): Feasibility, Demand, Access, Climate, Equity/Displacement, Infrastructure. Use percentile ranks. Suppress a sub-score when coverage is below 67%.
16. **One engine: `SENSITIVITY` × `MITIGATION` exposure-risk sub-score + red-flag rule** (M2)
17. **Scenario generator** (M2). For a place and household, rank typologies with fit, a P10–P90 confidence range, legal status and the top tradeoffs. Each scenario becomes a card.
18. **Tradeoff card triggers**, the 11 rules in interactions.md (M3)
19. **Household personas + weight presets** (Balanced / CDC / Climate / Market) (M2)
20. **Affordability gap (pro forma lite) + subsidy matches** (M3)
21. **Policy simulation, 7 levers** (M3). The ADU reform (pending, Bill 2025-1545) comes first, with before/after deltas.
22. **AI companion (Claude, tool use, streaming)** (M2). Tools:
    - `find_places`, `get_site_report`
    - `compare_scenarios`, `explain_factor`
    - `simulate_policy`, `get_sources`

    It may only state facts that a tool returned. It cites fact ids, and it degrades gracefully when there is no API key.
23. **Who benefits / who might be harmed / what the tool gets wrong**, rule-based text (M3)

## Lane C: Map (`lane:map`), doc: ui-map
24. **Map shell** (M1): MapLibre 6 + OpenFreeMap Positron, ClientOnly/lazy, worker URL.
25. **Layers + combined legend/layer list**, including the redlining and exposure layers (M2)
26. **Pick-a-place** (M2): ⌘K search (address, ZIP, neighborhood) with flyTo. Tap-to-select a neighborhood or parcel.
27. **GPU recolor as weights and household change**, with state kept in the URL (M2)
28. **Companion → map actions** (M3): the companion can fly to places, highlight them and filter.
29. **Mobile bottom sheet + ranked list view (accessibility)** (M3)
30. **3D massing preview for a scenario** (stretch, M3)

## Lane D: Experience (`lane:experience`), docs: ui-map, track3-methodology
31. **Household picker** (M2): who you're planning for, plus an optional workplace.
32. **Scenario cards** (M2): fit, confidence, top tradeoffs, benefits/harms, legal status. Compare and pin.
33. **Companion chat panel** (M2): streaming, fact chips, Evidence/Assumption/Value tags, suggested next questions, glossary tooltips.
34. **Site report drawer + affordability card + next steps** (M3). Next steps include the zoning path, variance odds, Land Bank and RCO contacts.
35. **Policy simulation UX** (M3): toggle, before/after, citywide counter.
36. **Landing page + methodology page + community brief print** (M3)
37. **Demo video** (M4): 3–5 minutes. Open with the hackathon name and team, and say plainly what is real.
38. **Submission** (M4): Google Form, repo public, secret scan, README.
