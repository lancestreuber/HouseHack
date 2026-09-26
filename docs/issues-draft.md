# GitHub issues — draft (review before creating)

Labels: `lane:data` `lane:scoring-ai` `lane:map` `lane:report` `setup` `blocker`
Milestones: **M1 Setup (Sat 1:30pm)** · **M2 Checkpoint (Sat 7pm)** · **M3 Freeze (Sun 2pm)** · **M4 Submit (Sun 9pm)**
Each issue links to the research doc that has the recipe, so nobody starts from scratch.

## Setup (M1)
1. **Setup runbook: bun, env, dev server running** (`setup`): Install bun, create `apps/web/.env` before `bun install`, and use a placeholder DATABASE_URL. Recipe in `docs/research/stack-setup.md` §1.
2. **Remove scaffold cruft** (`setup`): Delete todos, `_auth/`, `login.tsx`, the sign-in/up forms and `user-menu`. Set the title, remove forced dark mode, and hide devtools in production. See stack-setup §5.
3. **Shared contract: `packages/scoring/src/types.ts` + mock data** (`setup`, `blocker`): ParcelFeatures, NeighborhoodMetrics, Factor, TypologyResult, Fact, ProForma. Add mock JSON in `apps/web/public/data/mock/`.
4. **Design tokens + fonts + shadcn components** (`setup`, `lane:map`): Tokens and color scales from ui-map §4. Fonts: Raleway 800 and DM Sans. Run the shadcn add command from ui-map §6.
5. **Vercel project + env + preview protection off** (`setup`): See stack-setup §7.

## Lane A: Data (`lane:data`)
6. **Data workspace `@HouseHack/data` + `bun run data:refresh`** (M1)
7. **Parcels: ParcelsPublic → features → `parcels.pmtiles`** (M2): Join zoning, neighborhood, vacant and owner category. See data-sources §parcels.
8. **Constraint layers: slope 25%, landslide, undermined, flood, zoning, neighborhoods → GeoJSON + per-parcel flags** (M2)
9. **Demand/equity: MVA 2021, displacement ratio, Census Reporter ACS, Housing_Burden → neighborhood + parcel metrics** (M2)
10. **Transit: HighFrequencyTransit + GTFS → nearest frequent stop distance and trips/hr per parcel** (M2)
11. **Satellite: tree canopy, impervious and summer surface temperature sampled per parcel (pin geotiff@2.1.3)** (M3)
12. **City-owned parcels + Land Bank transfer flags + permits layer** (M2)

## Lane B: Scoring + AI (`lane:scoring-ai`)
13. **Encode `ZONING_RULES` (from zoning-rules.md) + tests** (M2)
14. **Development Ease Score (10-factor rubric, pass/warn/block, hard caps) + tests** (M2)
15. **Typology matcher + Track 3 weights + confidence ranges** (M2)
16. **Reform scenario overrides (Bill 2025-1545, labeled pending) + citywide delta counts** (M3)
17. **Pro forma lite with editable, sourced defaults (pro-forma.md)** (M3)
18. **`ai.brief` streaming router: fact-id citations, Evidence/Assumption/Value tags, cache, works with no key** (M2). The code is in stack-setup §4.
19. **`ai.filters`: "Ask the map", which turns natural language into structured filter chips via tool use** (M3)
20. **Methodology page content: sources, weights, limits, who could be harmed** (M3)

## Lane C: Map + explorer (`lane:map`)
21. **Map shell: MapLibre 6 + OpenFreeMap Positron, ClientOnly/lazy, worker URL** (M1). The component is in ui-map §1.
22. **Layers + combined legend/layer list; hazards drawn as hatching or outlines** (M2)
23. **Search: ⌘K command palette for address (Census geocoder), ZIP and neighborhood, with flyTo** (M2)
24. **Priority sliders → GPU recolor of parcels and neighborhoods; state in the URL** (M2)
25. **Parcel hover/select highlight → open the report drawer; map padding shifts** (M2)
26. **Reverse Lot Finder: goals → ranked shortlist on the map + in a list** (M3)
27. **3D massing preview of the typology on the selected lot** (stretch, M3)
28. **Mobile bottom sheet (vaul) + ranked list view for accessibility** (M3)

## Lane D: Report, compare, polish (`lane:report`)
29. **Site report drawer: score gauge, factor chips, typology cards, tradeoff table** (M2)
30. **AI brief panel: streamed sentences with fact chips + tag badges** (M2)
31. **Pro forma card with editable assumptions** (M3)
32. **Policy reform toggle UX: before/after diff + citywide counter** (M3)
33. **Compare tray (up to 3 sites) + shortlist export (link/CSV)** (M3)
34. **Landing page + community brief print stylesheet (map snapshot, OSM attribution)** (M3)
35. **Demo video script + recording (3–5 min: say the hackathon name + team, be honest about what's real)** (M4)
36. **Submission: Google Form, public repo check, secret scan, README** (M4)
