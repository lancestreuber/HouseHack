# Sweep: UI patterns, map stack, accessibility, uncertainty display

**Round 2** · 2026-09-26 · single research subagent, web search and fetch plus live endpoint probes

> Archived at full fidelity, exactly as the agent reported it. Its tags are its own: some sweeps use [V]/[S]/[U] and some use [F]/[S]. The paper maps these onto `[read]` / `[skimmed]` / `[found]` / `[inaccessible]`. Local scratch paths have been replaced with `<scratch>`. Treat claims here as leads, and check the paper and the corrections log before citing.

---

## Recommended stack (versions checked on npm on 2026-09-26)

- **Map:** MapLibre GL JS **6.11.2** (BSD-3). Use it through react-map-gl **8.1.3** (`react-map-gl/maplibre`). Avoid Mapbox GL **3.31**: its license is proprietary, it needs a token, and billing starts once you pass the free tier. No wow feature here needs Mapbox.
- **Heavy overlays:** deck.gl **9.4.0** (MIT). deck.gl now ships a separate `@deck.gl/maplibre` module with a MapLibre overlay class that supports MapLibre v4.5.1, v5 and v6 (the old `@deck.gl/mapbox` MapboxOverlay is the Mapbox path). Use deck.gl only for the policy-simulator recolor and polished 3D. The choropleth and fill-extrusion can stay plain MapLibre layers.
- **Skip Kepler.gl.** It's great for exploring data but looks like a generic tool, and you can't control the UX.
- **Basemap:** use **OpenFreeMap**. It needs no API key and no registration, has no request limits, allows commercial use, and only asks for OSM/OpenMapTiles attribution. Styles live at `https://tiles.openfreemap.org/styles/{positron|bright|liberty|dark|fiord}`. Positron works for light mode and Dark for the "wow" dark mode. The OpenMapTiles `building` layer has `render_height`, so a MapLibre `fill-extrusion` gives 3D buildings for free.
  - **CARTO Positron/Dark Matter now need an API key** to avoid a watermark. The free tier is 1M tile requests/month commercial or 5M non-commercial, and attribution is required. Workable, but it's one more thing to go wrong.
  - Protomaps' hosted API needs a key. Its daily planet build is free (BSD code, CC0 style, ODbL data) if you want to cut out a Pittsburgh extract and self-host it.
- **Score tiles:** tippecanoe **2.x** (felt fork, BSD-2) writes `.pmtiles` directly. Suggested command: `tippecanoe -o parcels.pmtiles -zg --extend-zooms-if-still-dropping --coalesce-densest-as-needed --no-tile-size-limit -l parcels -y parcel_id -y score -y conf …`.
  - Put only a few attributes in the tiles (ID, score, confidence, subscores as ints) and fetch full details from JSON by ID.
  - At z<13, show neighborhood or hex aggregates rather than 140k polygons.
  - Serve from Vercel static hosting or R2/S3 through the `pmtiles` **4.5.0** protocol (`maplibregl.addProtocol('pmtiles', …)`).
  - Use `feature-state` for hover and selection rather than restyling everything.
  - For the simulator, drive the color expression from uniforms or `setPaintProperty` with a `match`/`interpolate` on precomputed subscores. Recompute in the client, not on the server.
- **App shell:** Next.js **16.3.6**, Tailwind **4.3.3**, shadcn/ui, and nuqs **2.10.1** to keep map view, selection and sliders in the URL (shareable links come nearly free).
- **Charts:** Recharts **3.10.1** for fast work (waterfall, bars). Observable Plot **0.6.17** for OWID-style dot and interval charts that show uncertainty.
- **PDF:** @react-pdf/renderer **4.9.0**, or a print CSS route plus the browser's "Save as PDF".

## Patterns to borrow

- **NYC ZoLa**
  - Address/ID search leads to a right-hand lot card with collapsible sections: zoning, lot facts, building, links out.
  - Layer panel grouped by theme. Layers that need more zoom appear greyed out with a hint.
  - Two-lot side-by-side compare and bookmarkable layer state in the URL.
- **Regrid:** a dense key-value property card, a Layers tab, standardized plus local zoning fields, and a link to the ordinance for every field.
- **Envelope.city, Gridics, Archistar, TestFit:** the 3D max-buildable envelope drawn translucent over the real context buildings, a "used vs. allowed FAR" gauge, and scenario toggles.
- **Deepblocks, Placer.ai, UrbanFootprint:** a find-sites screen with a filter sidebar and a ranked results list tied to map highlights. Placer.ai and UrbanFootprint add KPI tiles above the map.
- **Felt and Carto:** a minimal floating toolbar, one clean legend card, and a basemap that stays quiet (greyscale) so your data carries the color.
- **Stripe and Linear:** a restrained neutral palette with one accent, small-caps labels, tabular numerals, a Cmd-K command palette ("jump to parcel/neighborhood"), keyboard navigation, and skeleton loaders.
- **Our World in Data:** a chart/map/table tab switch on the same data, a source-and-date footer on every chart, and download-data buttons.
- **NYT and The Pudding:** a scrollytelling landing page ("Why is it hard to build in Pittsburgh?") that flies the map between neighborhoods. This is the best opener for the demo video.

## Prioritized feature list

Effort: S is a few hours, M is about half a day to a day, L is more than a day.

**Must**

| Feature | Effort | Demo impact | Note |
|---|---|---|---|
| Citywide score choropleth from PMTiles, with neighborhood aggregates at low zoom and a legend | M | Very high | Foundation; first frame of the video |
| Parcel card: big score, plain-language headline, confidence badge, data-freshness badge, citations | M | High | Borrow from ZoLa/Regrid |
| Score breakdown waterfall (base → each factor ± → final) | S | High | Explains the "why" |
| "Path to yes" checklist | S–M | Very high | By-right vs. variance vs. special exception, each item linked to a code section |
| Shareable URLs via nuqs | S | Medium | Judges click links |
| Search (address/parcel ID) plus Cmd-K | S | Medium | |

**Should**

| Feature | Effort | Demo impact | Note |
|---|---|---|---|
| Side-by-side compare of 2–4 parcels | M | High | Aligned rows, winner highlighted per row |
| Policy-lever simulator sliders that recolor the map live | M | Very high | E.g., drop minimum parking, allow ADUs, raise height. Show a counter: "+3,412 parcels become by-right" |
| One-click feasibility memo PDF with citations and a map snapshot | M | High | Very useful for CDCs |
| Approval-pathway timeline (Gantt of steps with typical durations) | S–M | High | Only if you have or can defend the duration data. Otherwise label it "illustrative" |
| Planner override with a note, plus an audit trail | M | High for planner judges | Just localStorage, or a tiny DB table plus an "overridden" badge |

**Could**

| Feature | Effort | Demo impact | Note |
|---|---|---|---|
| 3D buildable envelope | M | Very high visually | MapLibre `fill-extrusion` on the parcel polygon shrunk by setbacks (turf `buffer` negative), at height equal to the max height, translucent over the 3D OSM buildings. A simple box is honest; stepped setbacks are L. |
| AI chat grounded in the Pittsburgh zoning code with inline section citations | M–L | High, but every team will do it | Only worth it if citations are real and clickable. Ungrounded answers hurt credibility |
| Scrollytelling landing page | M | High in video | |
| Hex-bin cluster view / "opportunity clusters" | S | Medium | |

## Accessibility, plain language and uncertainty

- **USWDS data-viz guidance:**
  - Pair every chart and the map with a text summary (screen-reader-only or visible).
  - Use common chart types (bars/lines) when your audience's data literacy is unknown.
  - Limit each visual to two or three concepts.
- **Color and contrast:** meet WCAG 2.2 AA contrast. Use a colorblind-safe sequential ramp (viridis/cividis), not red-green. Also show the score as a number and a word label (e.g., "Easy / Moderate / Hard"), never color alone.
- **Keyboard and screen readers:** make the parcel list and results table a keyboard-navigable alternative to the map. Give the map region an `aria-label`. Support `prefers-reduced-motion` for fly-to animations.
- **Plain language (18F/USWDS, Code for America):** lead with the answer ("Likely buildable by right: 3 units"), then the why, then the jargon with a glossary tooltip (FAR, setback, variance). Write for a sixth-to-eighth grade reading level. Say what the user can do next. Include a "this is not a legal determination" note.
- **Showing uncertainty:**
  - **Map:** reduce saturation (value-suppressing palette) or add hatching on low-confidence parcels.
  - **Card:** show the score as a point with an interval bar ("62, likely 55–70"), a High/Med/Low confidence chip with an "unknowns" list (e.g., "no survey data; lot lines from county GIS"), and "data as of" dates for each source.
  - **Compare view:** use dot-and-interval plots so overlapping ranges read as "not meaningfully different."
- **Honesty:** the score's weights are a modeling choice. Show them, and let users adjust them (this ties into the simulator).

## Reference URLs to emulate

1. **NYC ZoLa**, https://zola.planning.nyc.gov/ : lot card, layer groups, two-lot compare, URL state.
2. **Envelope**, https://envelope.city/ (demo video: https://www.youtube.com/watch?v=oVpZ35qoxhw): 3D envelope over the city.
3. **Regrid Property App**, https://app.regrid.com/us : parcel card density and the zoning fields layout.
4. **deck.gl + MapLibre interleaved example**, https://deck.gl/gallery/maplibre-overlay : 3D and extrusion look.
5. **OpenFreeMap style previews**, https://openfreemap.org/quick_start/ : pick the Positron or Dark basemap.
   - Also useful: USWDS data-viz guidance, https://designsystem.digital.gov/components/data-visualizations/

## Unverified

- I did not look deeply into Placer.ai, TestFit, Deepblocks, Gridics, Archistar, UrbanFootprint, LandVision or Zoneomics. What I say about their UIs is general product knowledge, not checked this session.
- I did not check whether Pittsburgh has zoning/setback data clean enough for the 3D envelope or the approval timeline. That's the real risk for those two features.

Sources: [OpenFreeMap](https://openfreemap.org/), [CARTO basemaps FAQ](https://docs.carto.com/faqs/carto-basemaps), [Protomaps downloads](https://docs.protomaps.com/basemaps/downloads), [deck.gl + MapLibre](https://deck.gl/docs/developer-guide/base-maps/using-with-maplibre), [tippecanoe](https://github.com/felt/tippecanoe), [ZoLa guide](https://www.nyc.gov/assets/planning/download/pdf/data-maps/maps-geography/zola/zola-userguide.pdf), [Regrid zoning fields](https://support.regrid.com/docs/zoning-fields-in-the-property-app), [Envelope](https://envelope.city/about), [USWDS data viz](https://designsystem.digital.gov/components/data-visualizations/), [Wilke on visualizing uncertainty](https://clauswilke.com/dataviz/visualizing-uncertainty.html).
