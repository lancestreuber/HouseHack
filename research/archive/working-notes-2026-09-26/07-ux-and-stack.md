# UX patterns and map stack

npm versions were checked on 2026-09-26. The team's scaffold on main uses TanStack Start, not Next.js. See [09-build-feasibility.md](09-build-feasibility.md) for how this fits.

## Map stack candidates
- **MapLibre GL JS 6.11.2** (BSD-3). Use it through **react-map-gl 8.1.3** (`react-map-gl/maplibre`).
  - Avoid Mapbox GL: its license is proprietary and it needs a token.
- **deck.gl 9.4.0** (MIT) only for heavy overlays. deck.gl now ships a `@deck.gl/maplibre` module with a MapLibre overlay class.
- **Basemap: OpenFreeMap.** No key, no registration, commercial use allowed, OSM attribution required.
  - Styles: `https://tiles.openfreemap.org/styles/{positron|bright|liberty|dark|fiord}`.
  - The OpenMapTiles `building` layer has `render_height`, which allows a 3D `fill-extrusion`.
  - CARTO basemaps now need a key to avoid a watermark.
- **Citywide scores:** tippecanoe (felt fork) → `.pmtiles`, loaded with `pmtiles` 4.5.0 and `maplibregl.addProtocol`.
  - Keep attributes minimal: ID, score, confidence, integer sub-scores. Fetch details by ID.
  - Use aggregates at low zoom.
  - Use `feature-state` for hover and selection.
  - Recolor the simulator client-side with `setPaintProperty` plus a `match` or `interpolate` expression over precomputed sub-scores.
- **Charts:**
  - Recharts 3.10.1 for waterfall and bar charts.
  - Observable Plot 0.6.17 for dot-and-interval uncertainty charts.
- **PDF:** @react-pdf/renderer 4.9.0, or a print CSS route.

## Patterns worth borrowing
| Source | Patterns |
|---|---|
| NYC ZoLa | Lot card with collapsible sections; layer groups; greyed-out layers that need zoom; compare two lots; URL state |
| Regrid | Dense key-value card; a link to the ordinance for every zoning field |
| Envelope / Gridics / TestFit / Archistar | 3D envelope drawn over context buildings; used vs allowed gauge; scenario toggles |
| Deepblocks / Placer / UrbanFootprint | Filter sidebar plus a ranked list linked to the map; KPI tiles |
| Felt / Carto | Quiet greyscale basemap; one legend card |
| Stripe / Linear | Restrained palette; tabular numerals; Cmd-K command menu; skeleton loaders |
| Our World in Data | Chart / map / table tabs; source-and-date footer on every chart; download buttons |
| NYT / The Pudding | Scrollytelling intro, useful for the demo video |

## Accessibility and uncertainty
- USWDS data-viz guidance: pair every visual with a text summary, use common chart types, keep each visual to 2–3 concepts.
- Meet WCAG 2.2 AA. Use a colorblind-safe ramp (viridis/cividis). Always show a number and a word label, never color alone.
- Provide a keyboard-navigable list or table as an alternative to the map. Support `prefers-reduced-motion`.
- Plain language, aimed at a grade 6–8 reading level:
  - Lead with the answer, then the reason, then the jargon with tooltips.
  - Say what the user can do next.
  - Include a "not a legal determination" note.
- Showing uncertainty:
  - On the map: lower saturation or hatching.
  - Show intervals, e.g. "62, likely 55–70".
  - A confidence chip with a list of unknowns.
  - A data-as-of date for each source.
  - Dot-and-interval charts in the comparison view.
- References: [ZoLa](https://zola.planning.nyc.gov/), [Envelope](https://envelope.city/), [Regrid](https://app.regrid.com/us), [deck.gl + MapLibre](https://deck.gl/gallery/maplibre-overlay), [OpenFreeMap](https://openfreemap.org/quick_start/), [USWDS data viz](https://designsystem.digital.gov/components/data-visualizations/).
