# UX patterns

**Type:** build
**One line:** Map-stack options with versions checked on npm, interface patterns worth borrowing from existing parcel and data tools, and accessibility and uncertainty-display practice.
**Why we care:** Judges see the tool through its interface. The patterns below make a parcel score legible, shareable and honest about uncertainty without inventing new UI.
**Last checked:** 2026-09-26

## Map stack options

Versions were checked on npm on 2026-09-26 by the [UX sweep](../../sweeps/r2-ux-and-map-stack.md); the build sweep re-states the map versions.

| Piece | Option | Version | Notes |
|---|---|---|---|
| Map library | **MapLibre GL JS** (BSD-3) via `react-map-gl/maplibre` | 6.11.2 / react-map-gl 8.1.3 | v6 worker needs bundler config; v5 is a fallback ([build sweep](../../sweeps/r4-build-feasibility-on-team-stack.md)) |
| Map library (avoid, per UX sweep) | Mapbox GL | 3.31 | Proprietary license, token required, billing past free tier |
| Heavy overlays | deck.gl (MIT), `@deck.gl/maplibre` overlay supports MapLibre v4.5.1, v5, v6 | 9.4.0 | The UX sweep suggests it only for a policy-simulator recolor and polished 3D; the build sweep suggests skipping it, since MapLibre fill/line layers handle ~140k parcels as vector tiles. The two sweeps disagree; both positions are recorded. |
| Tiles | tippecanoe → `.pmtiles`, served with `pmtiles` protocol | pmtiles 4.5.0 | See [data pipeline](data-pipeline.md) |
| Basemap | **OpenFreeMap** | n/a | No key, no registration, no request limits, commercial use allowed, OSM/OpenMapTiles attribution. Styles: positron, bright, liberty, dark, fiord. The `building` layer has `render_height` for 3D `fill-extrusion` |
| Basemap alternatives | CARTO Positron/Dark Matter; Protomaps | n/a | CARTO now needs an API key to avoid a watermark (free tier 1M tile requests/month commercial, 5M non-commercial). Protomaps hosted API needs a key; its daily planet build is free to self-host |
| Charts | Recharts; Observable Plot | 3.10.1; 0.6.17 | Recharts for waterfall/bars; Plot for dot-and-interval uncertainty charts |
| URL state | nuqs | 2.10.1 | The UX sweep proposed it in a Next.js shell; the team's scaffold is **TanStack Start**, which has its own router search params. Whether nuqs is needed there is open. |
| PDF | @react-pdf/renderer, or print CSS + browser "Save as PDF" | 4.9.0 | |
| App shell (UX sweep's proposal) | Next.js 16.3.6, Tailwind 4.3.3, shadcn/ui | | The scaffold already uses TanStack Start, Tailwind 4.3.3 and shadcn/ui in `packages/ui` ([repository README](../../../README.md)); Next.js is not in use |

Rendering techniques from the UX sweep: `feature-state` for hover and selection; recolor the simulator with `setPaintProperty` and a `match`/`interpolate` expression over precomputed subscores, computed in the client; neighborhood or hex aggregates at z<13.

## Patterns to borrow

| Reference | Pattern |
|---|---|
| [NYC ZoLa](https://zola.planning.nyc.gov/) | Address/ID search → right-hand lot card with collapsible sections; layer panel grouped by theme; greyed-out layers that need more zoom; two-lot compare; layer state in the URL |
| [Regrid](https://app.regrid.com/us) | Dense key-value property card; standardized plus local zoning fields; a link to the ordinance for every field |
| [Envelope](https://envelope.city/), Gridics, Archistar, TestFit | 3D max-buildable envelope drawn translucent over real buildings; used-vs-allowed gauge; scenario toggles |
| Deepblocks, Placer.ai, UrbanFootprint | Find-sites screen: filter sidebar and ranked list linked to map highlights; KPI tiles |
| Felt, Carto | Minimal floating toolbar; one legend card; quiet greyscale basemap |
| Stripe, Linear | Restrained palette with one accent; tabular numerals; Cmd-K palette; keyboard navigation; skeleton loaders |
| Our World in Data | Chart/map/table tabs on the same data; source-and-date footer on every chart; download buttons |
| NYT, The Pudding | Scrollytelling intro that flies the map between neighborhoods (useful for the demo video) |

⚠ The UX sweep says its descriptions of Placer.ai, TestFit, Deepblocks, Gridics, Archistar and UrbanFootprint are **general product knowledge, not checked**. Treat those rows as unverified. See [commercial tools](../landscape/commercial-tools.md).

**3D envelope caveat.** In Pittsburgh residential districts the envelope comes from setbacks and height, not FAR ([corrections log](../README.md#corrections-log)), so a "used vs allowed FAR" gauge does not apply there. A setback-shrunk box at max height is an honest simple version; stepped setbacks are more work (UX sweep).

## Feature options (UX sweep's prioritization)

Effort: S = a few hours, M = half a day to a day, L = more than a day (the sweep's estimates).

- **Must:** citywide score choropleth from PMTiles with low-zoom aggregates (M); parcel card with score, headline, confidence and freshness badges, citations (M); score waterfall (S); "path to yes" checklist linked to code sections (S–M); shareable URLs (S); search plus Cmd-K (S).
- **Should:** 2–4 parcel compare (M); policy-lever sliders that recolor the map live, with a parcels-changed counter (M); feasibility memo PDF (M); approval-pathway timeline, only if duration data can be defended, otherwise labeled "illustrative" (S–M); planner override with audit trail (M).
- **Could:** 3D envelope (M); grounded zoning-code chat, only with real clickable citations (M–L; see [LLM role](../methods/llm-role.md)); scrollytelling landing (M); hex-bin cluster view (S).

## Accessibility and plain language

- **USWDS data-viz guidance:** pair every chart and the map with a text summary; use common chart types when audience data literacy is unknown; limit each visual to two or three concepts.
- **Color:** WCAG 2.2 AA contrast; a colorblind-safe sequential ramp (viridis/cividis), not red-green; always a number and a word label, never color alone.
- **Keyboard and screen readers:** a keyboard-navigable parcel list or table as an alternative to the map; `aria-label` on the map region; respect `prefers-reduced-motion` for fly-to animations.
- **Plain language (18F/USWDS, Code for America):** lead with the answer ("Likely buildable by right: 3 units"), then the why, then jargon with a glossary tooltip; aim for a grade 6–8 reading level; say what the user can do next; include a "not a legal determination" note.

## Showing uncertainty
- **Map:** value-suppressing palette (lower saturation) or hatching on low-confidence parcels.
- **Card:** point plus interval bar ("62, likely 55–70"); High/Med/Low chip with an "unknowns" list; data-as-of date per source.
- **Compare:** dot-and-interval plots so overlapping ranges read as "not meaningfully different."
- **Weights:** show them and let users adjust them.

Method side: [uncertainty and explainability](../methods/uncertainty-and-explainability.md).

## Open questions
- Whether Pittsburgh setback and zoning data is clean enough for a 3D envelope or an approval timeline. The UX sweep flags this as the real risk for both.
- deck.gl or not (the two sweeps disagree).
- Whether TanStack Router search params replace nuqs.
- Bundle size of MapLibre on the map route. The build sweep's ~800KB–1MB is an unmeasured estimate.

## Connects to
- [Architecture options](architecture-options.md): the stack underneath
- [Data pipeline](data-pipeline.md): tile generation
- [Uncertainty and explainability](../methods/uncertainty-and-explainability.md): what the displays encode
- [LLM role](../methods/llm-role.md): grounded chat option
- [Commercial tools](../landscape/commercial-tools.md) and [Pittsburgh civic tools](../landscape/pittsburgh-civic-tools.md): the products referenced
- [Stakeholders: practitioners](../stakeholders/practitioners.md): who reads the parcel card

## Sources
- [NYC ZoLa](https://zola.planning.nyc.gov/) `[skimmed]` *(accessed 2026-09-26)*: lot card, layers, compare, URL state
- [ZoLa user guide (PDF)](https://www.nyc.gov/assets/planning/download/pdf/data-maps/maps-geography/zola/zola-userguide.pdf) `[skimmed]` *(accessed 2026-09-26)*: listed as a source by the UX sweep
- [Regrid Property App](https://app.regrid.com/us) `[skimmed]` *(accessed 2026-09-26)*: property card density
- [Regrid zoning fields docs](https://support.regrid.com/docs/zoning-fields-in-the-property-app) `[skimmed]` *(accessed 2026-09-26)*: ordinance link per field
- [Envelope: about](https://envelope.city/about) `[skimmed]` *(accessed 2026-09-26)*: 3D envelope
- [deck.gl with MapLibre](https://deck.gl/docs/developer-guide/base-maps/using-with-maplibre) `[skimmed]` *(accessed 2026-09-26)*: `@deck.gl/maplibre` overlay support
- [OpenFreeMap quick start](https://openfreemap.org/quick_start/) `[skimmed]` *(accessed 2026-09-26)*: styles, terms
- [CARTO basemaps FAQ](https://docs.carto.com/faqs/carto-basemaps) `[skimmed]` *(accessed 2026-09-26)*: key requirement, free tier
- [Protomaps basemap downloads](https://docs.protomaps.com/basemaps/downloads) `[skimmed]` *(accessed 2026-09-26)*: self-hosting option
- [USWDS data visualizations](https://designsystem.digital.gov/components/data-visualizations/) `[skimmed]` *(accessed 2026-09-26)*: accessibility guidance
- [Wilke: visualizing uncertainty](https://clauswilke.com/dataviz/visualizing-uncertainty.html) `[skimmed]` *(accessed 2026-09-26)*: uncertainty display
- [npm registry](https://www.npmjs.com/) `[read]` *(accessed 2026-09-26)*: package versions checked on 2026-09-26 per the UX sweep
- Placer.ai, TestFit, Deepblocks, Gridics, Archistar, UrbanFootprint UIs. Link: [UX sweep](../../sweeps/r2-ux-and-map-stack.md) `[found]` *(accessed 2026-09-26)*: general product knowledge, not checked
- Sweep: [../../sweeps/r2-ux-and-map-stack.md](../../sweeps/r2-ux-and-map-stack.md) `[read]` *(accessed 2026-09-26)*: stack, patterns, feature list, accessibility
- Sweep: [../../sweeps/r4-build-feasibility-on-team-stack.md](../../sweeps/r4-build-feasibility-on-team-stack.md) `[read]` *(accessed 2026-09-26)*: deck.gl skip, MapLibre v6 worker risk
- Working notes: [../../archive/working-notes-2026-09-26/07-ux-and-stack.md](../../archive/working-notes-2026-09-26/07-ux-and-stack.md) `[read]` *(accessed 2026-09-26)*: scaffold is TanStack Start, not Next.js
