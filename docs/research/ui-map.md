# Groundwork PGH: Map and UI research

Researched Sat Sep 26 2026. Versions were checked on npm that day, and the SSR build was tested locally with Vite 8.

**Short version:** use `@vis.gl/react-maplibre` 8.1.3 with `maplibre-gl` 6.11.2, loaded client-only. The basemap is OpenFreeMap Positron with our data layers placed below its labels. Neighborhoods recolor through `feature-state` and parcels through a GPU paint expression. Put the 140k parcels in one PMTiles file and skip deck.gl. Panels float over a full-bleed map, with a Felt/Linear feel. The accent is yellow `#F2C230`, used only for selection and focus. Scores use the GnBu sequential scale and deltas use RdBu.

---

## 1. Libraries and install

| Package | Version | Verdict |
|---|---|---|
| `maplibre-gl` | **6.11.2** (Sep 24 2026) | Use it. **v6 is ESM-only**, needs WebGL2, and bundlers must call `setWorkerUrl` ([migration guide](https://github.com/maplibre/maplibre-gl-js/blob/main/docs/guides/v5-to-v6-migration-guide.md)). |
| `@vis.gl/react-maplibre` | **8.1.3** | **Use it.** It is the dedicated MapLibre build of react-map-gl, with peer `maplibre-gl >=4`. It loads maplibre with `import('maplibre-gl')` inside `useEffect`, so it works with v6's namespace export. Its `<Map workerUrl>` prop calls `setWorkerUrl` for us. |
| `react-map-gl` | 8.1.3 | Skip it. The `react-map-gl/maplibre` entry is the same code, but it also carries Mapbox peers. |
| raw `maplibre-gl` | n/a | Skip it. We would be rewriting the declarative `<Source>/<Layer>` diffing ourselves. |
| `deck.gl` | 9.4.0 | **Skip it.** MapLibre `circle` layers handle 140k points easily, and deck.gl would add roughly 600 KB plus interleaving work. Reconsider only if we need 3D extrusion or GPU aggregation. |
| `pmtiles` | **4.5.0** | Use it for the 140k parcel layer (see below). |
| `@turf/bbox` | 7.4.0 | Use it to get bounds for `fitBounds`. |
| `@fontsource-variable/dm-sans`, `@fontsource-variable/raleway` | 5.3.0 | Self-hosted fonts, so there is no layout shift and no Google round-trip. |

```bash
# from repo root (bun workspace)
bun add -F web maplibre-gl@^6.11.2 @vis.gl/react-maplibre@^8.1.3 pmtiles@^4.5.0 @turf/bbox@^7.4.0 \
  @fontsource-variable/dm-sans @fontsource-variable/raleway
brew install tippecanoe   # 2.79.0, only for whoever builds tiles
```

### How to serve each data layer

- **Plain GeoJSON source** for anything under about 5 MB: 90 neighborhoods, 1,069 zoning polygons (simplify with mapshaper), hazard polygons, transit stops, and the 12.5k city-owned points (with clustering). MapLibre runs geojson-vt in its worker, so we don't need a separate tiling library.
- **PMTiles** for the 140k parcel centroids. Put the precomputed, normalized (0–100) factor values on each feature so the GPU can score them (see §5):
  ```bash
  tippecanoe -o apps/web/public/tiles/parcels.pmtiles -l parcels -Z10 -z15 -r1 \
    --drop-densest-as-needed --extend-zooms-if-still-dropping -y id -y d -y t -y e -y c -y f -y own \
    --force parcels.geojsonl
  ```
  Vercel static hosting honors Range requests, which PMTiles needs ([Protomaps cloud storage](https://docs.protomaps.com/pmtiles/cloud-storage), [PMTiles + MapLibre](https://docs.protomaps.com/pmtiles/maplibre)). Confirm after deploying with `curl -sI -H 'Range: bytes=0-99' https://<app>/tiles/parcels.pmtiles`, which should return 206.
  **Fallback** if nobody has tippecanoe: load the per-neighborhood shard as GeoJSON when a neighborhood is selected or zoom is 14 or more.
- Register the protocol **once**, at module scope in the map module ([react-map-gl discussion #2165](https://github.com/visgl/react-map-gl/discussions/2165)).

### SSR in TanStack Start

I tested this with Vite 8.2 builds in the scratchpad. `import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'` builds for **both** the client and the SSR bundle (`ssr.noExternal: true` is already set in `apps/web/vite.config.ts`). The resulting SSR chunk imports cleanly in Node. Even so, render the map **client-only**, because WebGL doesn't exist on the server and rendering it there would cause hydration mismatches. Use `ClientOnly` from `@tanstack/react-router` ([docs](https://tanstack.com/router/latest/docs/framework/react/api/router/clientOnlyComponent)) together with `React.lazy`, so maplibre (about 285 KB gzipped) stays out of the initial chunk.

Load the CSS globally so it is SSR-linked and doesn't flash. In `apps/web/src/index.css`:
```css
@import "maplibre-gl/dist/maplibre-gl.css";
```

**Minimal component**, ready to paste:

```tsx
// apps/web/src/components/map/base-map.tsx  (client-only module)
import { Map, NavigationControl, AttributionControl, type MapRef, type MapProps } from "@vis.gl/react-maplibre";
import * as maplibregl from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { Protocol } from "pmtiles";
import { forwardRef } from "react";

maplibregl.addProtocol("pmtiles", new Protocol().tile); // once per page

export const BASEMAP = "https://tiles.openfreemap.org/styles/positron";
export const PGH = { longitude: -79.9959, latitude: 40.4406, zoom: 11.6 };
export const PGH_BOUNDS: [number, number, number, number] = [-80.36, 40.3, -79.8, 40.56];

export const BaseMap = forwardRef<MapRef, MapProps>(function BaseMap({ children, ...props }, ref) {
  return (
    <Map
      ref={ref}
      workerUrl={workerUrl}
      initialViewState={PGH}
      maxBounds={PGH_BOUNDS}
      minZoom={10}
      mapStyle={BASEMAP}
      attributionControl={false}
      canvasContextAttributes={{ preserveDrawingBuffer: true }} // for print snapshot
      style={{ position: "absolute", inset: 0 }}
      {...props}
    >
      <NavigationControl position="bottom-right" showCompass={false} />
      <AttributionControl position="bottom-right" compact />
      {children}
    </Map>
  );
});
```

```tsx
// apps/web/src/routes/explore.tsx
import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
const ExploreMap = lazy(() => import("@/components/map/explore-map")); // uses BaseMap
export const Route = createFileRoute("/explore")({ validateSearch: exploreSearch, component: Explore });
function Explore() {
  const fallback = <div className="absolute inset-0 animate-pulse bg-[#EEF0EC]" />;
  return (
    <div className="relative h-full overflow-hidden">
      <ClientOnly fallback={fallback}><Suspense fallback={fallback}><ExploreMap /></Suspense></ClientOnly>
      {/* floating panels are SSR-rendered siblings */}
    </div>
  );
}
```
If TypeScript complains about `?worker&url`, make sure `/// <reference types="vite/client" />` is included.

## 2. Basemap

| Style | URL | Key? | Notes |
|---|---|---|---|
| **OpenFreeMap Positron** (pick this) | `https://tiles.openfreemap.org/styles/positron` | none, no stated limits | Near-white and quiet, and our data colors read cleanly on it. The glyphs are `Noto Sans Regular/Bold`. Attribution: "OpenFreeMap © OpenMapTiles Data from OpenStreetMap" ([quick start](https://openfreemap.org/quick_start/)). |
| OpenFreeMap Liberty, Bright | `/styles/liberty` | none | Too colorful under a choropleth. Liberty fits a "street context" toggle. |
| CARTO Positron, Voyager, Dark Matter (GL) | `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json` | vector: **not yet**; raster: **yes** | Returned 200 without a key today. CARTO's FAQ says raster basemaps now need a key and vector ones "do not yet". Commercial terms change on Sep 23 2026 ([CARTO FAQ](https://docs.carto.com/faqs/carto-basemaps)). **Don't bet the demo on it.** Attribution: © OpenStreetMap contributors © CARTO. |
| Protomaps (`@protomaps/basemaps` 5.7.2) | self-hosted `pmtiles extract` | none if self-hosted | It has the nicest "light" and "grayscale" flavors, but it needs a Pittsburgh extract of 30–60 MB. Stretch goal only. |

**Restyling, applied once in `onLoad`:**
```ts
const map = e.target;
for (const l of map.getStyle().layers) {
  if (l.type === "symbol" && /^highway-name|road_shield|highway-shield/.test(l.id)) map.setLayoutProperty(l.id, "visibility", "none");
  if (l.type === "symbol") map.setPaintProperty(l.id, "text-color", "#6B6860");
  if (l.id === "building") map.setPaintProperty(l.id, "fill-opacity", ["interpolate", ["linear"], ["zoom"], 14, 0, 16, 0.6]);
}
```
Insert every data fill or line layer with `beforeId="waterway_line_label"`, which is the first symbol layer in OpenFreeMap Positron (in CARTO Positron it is `waterway_label`). Labels then sit above the choropleth. Raise selection and hover outlines above the labels by leaving `beforeId` off.

## 3. Design references and what to take from each

1. **Felt** ([interface tour](https://help.felt.com/getting-started/tour-the-interface), [UI 2.0](https://felt.com/blog/ui-upgrades)): the legend doubles as the layer list, with inline eye toggles, swatches and collapse per layer. The detail panel stays hidden until something is selected.
2. **Regrid** ([property app](https://regrid.com/property-app)): the parcel card opens from the right with an address hero, key facts as a two-column definition list, and "open full report". On mobile the card becomes a draggable bottom sheet.
3. **NYC ZoLa** ([app](https://zola.planning.nyc.gov/), [source](https://github.com/NYCPlanning/labs-zola)): layer groups get checkbox toggles with a single legend swatch. The zoning palette follows planning conventions (residential yellow, commercial red, manufacturing purple). The URL encodes the lot and active layers.
4. **Burgh's Eye View** ([news](https://nextpittsburgh.com/business-tech-news/burghs-eye-view-app-provides-first-ever-city-data-for-pittsburgh-neighborhoods/), [parcels repo](https://github.com/CityofPittsburgh/burghs-eye-view-parcels)): search by address or ZIP, then "zoom to neighborhood". It is the local baseline. We should look an order of magnitude more polished than this Shiny app.
5. **Zoneomics / UrbanFootprint** ([zoneomics.com](https://www.zoneomics.com/), [urbanfootprint.com](https://urbanfootprint.com/)): a site-feasibility card built as a score, then pass/fail factor chips, then "what you can build" typologies.
6. **Placer.ai** ([placer.ai](https://www.placer.ai/)): comparison is a first-class tray. You pin places, then open a side-by-side table with one column per site and the winning cell highlighted.
7. **Google Environmental Insights Explorer** ([insights.sustainability.google](https://insights.sustainability.google/)): big numbers with a plain-language sentence and a source link under each metric. That is our evidence-versus-assumption pattern.
8. **Kontur Disaster Ninja** ([disaster.ninja](https://disaster.ninja/)): a bivariate legend placed as a small square in the map corner. Its hazard overlays are semi-transparent with crisp outlines.
9. **Urban Institute data tools** ([urban.org/data-tools](https://www.urban.org/data-tools)): a "how to read this" sentence above each chart, and a methodology drawer. Their accessible palette discipline is worth copying.
10. **Linear** (not a map, but the polish bar): ⌘K for everything, single-key shortcuts (`L` layers, `C` compare, `Esc` close), 150–200 ms transitions, and tabular numerals.

### Our layout

The map is full-bleed with **floating panels**: 12 px inset, `rounded-2xl`, `bg-white/95 backdrop-blur`, and a `shadow-[0_8px_30px_rgba(0,0,0,.08)]`. It must not look like a docked dashboard.

```
DESKTOP ≥1024
┌──────────────────────────────────────────────────────────────────────────────┐
│ ◆ Groundwork PGH   [ ⌕  Search address, ZIP, neighborhood…   ⌘K ]  Scenario:[Today|Proposed]  ⤴ Share │ 56px bar
├──────────────────────────────────────────────────────────────────────────────┤
│┌─ PRIORITIES ─────┐                                   ┌─ SITE REPORT ──────┐│
││ Preset [Balanced▾]│        (full-bleed map)           │ 7112 Frankstown Av ││
││ Demand    ━━━●━ 30│                                   │ ◔ 78 Strong fit    ││
││ Transit   ━━●━━ 20│      ┌───────────────┐            │ ✓Transit ✓City-own ││
││ Equity    ━━●━━ 20│      │ Homewood N 72 │ ← hover    │ ⚠Slope  ✕Flood     ││
││ Climate   ━●━━━ 15│      │ ▲ +6 vs city  │   card     │ [Typologies][Trade-││
││ Feasib.   ━●━━━ 15│      └───────────────┘            │  offs][AI brief]   ││
│├─ LAYERS ──────────┤                                   │ …scroll…           ││
││ ● Opportunity  ◉  │                                   │ [+ Compare] [Print]││
││ ○ Zoning       ◯  │                                   └────────────────────┘│
││ ○ Hazards ▸       │  ┌ legend 0 ▇▇▇▇▇▇▇ 100 ┐                      [+][−]  │
││ ○ City-owned  ◉   │  └ Opportunity score    ┘                      [⌖]    │
│└───────────────────┘       ┌ Compare ▢ Homewood 78 ▢ Beechview 61 ▢ +  [Open] ┐│
└──────────────────────────────┴─────────────────────────────────────────────────┘
   left panel 320px, collapsible           report 420px, slides in from right
```

- **Search** sits centered in the top bar and opens a `Command` dialog with ⌘K or `/`. It shows grouped results (Neighborhoods, ZIPs, Addresses) and recent searches. Selecting a result calls `fitBounds`, and a parcel also opens its report.
- **The left panel** has two sections, each collapsible. "Priorities" holds five sliders, a preset select and a reset button. "Layers" is a Felt-style legend and layer list: each row has a toggle, a swatch and a "?" popover, and hazards form a nested group.
- **The legend** is a floating chip at the bottom-left showing the active choropleth only: a classed ramp with its min and max, plus a "No data" swatch. It reads "Opportunity Δ" when the scenario diff is on.
- **The hover card** follows the cursor with a 12 px offset, after a 120 ms delay. It shows the name, the score, and one delta line. It never appears on touch devices.
- **The selected parcel** gets a 3 px `#F2C230` ring over a 5 px `#222` casing, plus a pulse ring that plays once. Neighborhood hover gets a 1.5 px `#222` outline.
- **The report drawer** slides in on the right. When it opens, call `map.easeTo({ padding: { right: 440 } })` so the selection stays centered in the visible map. This one detail makes the whole thing feel premium. Tabs: Overview (gauge, chips, evidence), Typologies, Trade-offs, AI brief (streamed).
- **The compare tray** is a bottom-center pill that appears once one site is pinned and holds up to three. "Open" launches a full-screen `Dialog` or goes to `/compare`.
- **The scenario toggle** is a segmented control in the top bar. When it is "Proposed", the choropleth switches to the diverging Δ scale and the legend changes to match.

```
MOBILE <768
┌──────────────────────┐
│[⌕ Search…      ][≡]  │  floating search pill; ≡ opens layers sheet
│                      │
│        MAP           │
│                 [⌖]  │
│╭────────────────────╮│  vaul Drawer, snapPoints [0.14, 0.5, 0.92]
││ ── Homewood N · 72 ││  peek: selection summary or "Top 5 areas"
││ [Priorities][Report]│  mid: tabs; full: whole report
│╰────────────────────╯│
│ [Compare 2 ▸]        │  sticky pill above sheet
└──────────────────────┘
```

## 4. Visual system

**Tokens** (override shadcn variables in `packages/ui/src/styles/globals.css`, and drop the forced `className="dark"` on `<html>`):

```css
:root{
  --background:#F7F6F2;   /* warm app canvas */      --card:#FFFFFF;  --popover:#FFFFFF;
  --foreground:#222222;   --muted-foreground:#6B6860; --border:#E7E5DF; --input:#E7E5DF;
  --primary:#222222;      --primary-foreground:#FFFFFF;           /* buttons are near-black */
  --accent-brand:#F2C230; --accent-brand-ink:#222222;             /* selection, focus, slider thumb */
  --ring:#F2C230;         --radius:0.75rem;
  --good:#0E7C86;  --good-bg:#E3F4F4;   --warn:#9A6700; --warn-bg:#FFF4D6;   --bad:#B42318; --bad-bg:#FEE4E2;
  --font-display:"Raleway Variable",ui-sans-serif; --font-sans:"DM Sans Variable",ui-sans-serif;
}
```
Rules: yellow is **never text on white** (contrast about 1.7:1). Use it only as a fill under `#222` text (about 10:1) or as a ring or stroke. Factor chips pair an icon with a word (✓, ⚠, ✕), so color is never the only signal.

**Score scale, sequential and color-blind safe** ([ColorBrewer GnBu-7](https://colorbrewer2.org/#type=sequential&scheme=GnBu&n=7)). Use 7 classes with a `step` expression, not a continuous interpolation, because classes make the legend readable:
`#F0F9E8 #CCEBC5 #A8DDB5 #7BCCC4 #4EB3D3 #2B8CBE #08589E`. No data is `#E5E4DF` with a hatched pattern.

**Delta scale, diverging** ([RdBu-7](https://colorbrewer2.org/#type=diverging&scheme=RdBu&n=7), color-blind safe): `#B2182B #EF8A62 #FDDBC7 #F7F7F7 #D1E5F0 #67A9CF #2166AC`. Worse is red and better is blue.

**Zoning families** follow the planning convention used by ZoLa. Render them at 0.45 fill opacity with a 0.5 px outline in the same hue at 0.8:
| Family (Pittsburgh codes) | Hex |
|---|---|
| Single/two-family R1D, R1A, R2 | `#F6E7B0` |
| Multi-unit R3, RM | `#E9B949` |
| Neighborhood commercial LNC, NDO, UNC | `#F2A38A` |
| Highway/urban commercial HC, GT, DR (downtown) | `#D1495B` |
| Industrial / riverfront LI, GI, UI, RIV | `#9C89B8` |
| Institutional EMI | `#6FA8DC` |
| Parks & hillside P, H | `#9CC59A` |
| Specially planned SP / other | `#B8B5AD` |

**Hazards** are overlays with outline and hatch, so they stay legible over the choropleth. FEMA flood is `#2F80ED` (fill 0.18 with a solid line). Steep slope ≥25% is `#A0522D` (45° hatch). Landslide-prone is `#C2410C` (dashed line with a 0.15 fill). Undermined is `#6B21A8` (dotted line with cross-hatch). Make the hatches with `map.addImage("hatch-slope", canvasImageData)` and `fill-pattern`.
**City-owned parcels** are `#222` dots with a white stroke. Clusters are `#222` circles with white counts in Noto Sans Bold.

**Typography.** Display text is Raleway Variable at weight 800 with −0.02em tracking. Use it for H1/H2, the score number and panel titles only. Everything else is DM Sans Variable 400/500/600. All numbers get `tabular-nums`. Scale: 12 / 13 (UI default) / 15 / 18 / 24 / 36 / 56 (gauge number). Map labels stay Noto Sans from the basemap glyphs. Import `@fontsource-variable/raleway` and `@fontsource-variable/dm-sans` in `__root.tsx`, then set `--font-sans` and `--font-display` in `@theme inline`.

**Spacing** is on a 4 px grid. Panels use 16 px padding, rows are 12 px apart, sections 24 px. Controls are 32 px high on desktop and at least 44 px on touch.

**Motion.** Panels use `transition: transform 220ms cubic-bezier(.2,.8,.2,1), opacity 160ms`, and tw-animate-css is already installed. For map moves use `flyTo({center, zoom, duration: 1200})` for search jumps and `easeTo` of 300–500 ms for padding changes. **Don't** pass `essential: true`. MapLibre then honors `prefers-reduced-motion` on its own. Choropleth recolors use `"fill-color-transition": { duration: 250 }`, which works for feature-state changes.

**Data viz.**
- **Gauge:** a hand-rolled SVG (below). It prints crisply, has no dependencies and takes about 30 lines.
- **Trade-off, factor and compare bars:** shadcn `chart` (Recharts 3.10) horizontal `BarChart`, or plain `div` bars with widths set in `%`, which is often nicer and faster. Save Recharts for the radar or small-multiples in Compare.

```tsx
export function ScoreGauge({ value }: { value: number }) { // 0–100, 240° arc
  const r = 52, c = 2 * Math.PI * r, arc = c * (240 / 360), filled = arc * (value / 100);
  return (
    <svg viewBox="0 0 120 120" className="size-32" role="img" aria-label={`Score ${value} of 100`}>
      <g transform="rotate(150 60 60)" fill="none" strokeWidth="10" strokeLinecap="round">
        <circle cx="60" cy="60" r={r} stroke="#EEEDE8" strokeDasharray={`${arc} ${c}`} />
        <circle cx="60" cy="60" r={r} stroke="#08589E" strokeDasharray={`${filled} ${c}`}
          className="transition-[stroke-dasharray] duration-500" />
      </g>
      <text x="60" y="66" textAnchor="middle" className="fill-[#222] font-[var(--font-display)] text-[30px] font-extrabold tabular-nums">{value}</text>
    </svg>
  );
}
```

## 5. Interaction and performance recipes

**Neighborhood choropleth, recolored with feature-state.** 90 `setFeatureState` calls per frame is effectively free.
```tsx
<Source id="hoods" type="geojson" data="/data/neighborhoods.geojson" promoteId="hood_id">
  <Layer id="hoods-fill" type="fill" beforeId="waterway_line_label" paint={{
    "fill-color": ["case", ["==", ["feature-state", "score"], null], "#E5E4DF",
      ["step", ["feature-state", "score"], "#F0F9E8", 15, "#CCEBC5", 30, "#A8DDB5", 45, "#7BCCC4", 60, "#4EB3D3", 75, "#2B8CBE", 90, "#08589E"]],
    "fill-opacity": 0.78, "fill-color-transition": { duration: 250 } }} />
  <Layer id="hoods-line" type="line" paint={{
    "line-color": "#222", "line-width": ["case", ["boolean", ["feature-state", "hover"], false], 1.5, 0.4],
    "line-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 1, 0.35] }} />
</Source>
```
```ts
// scores: Map<hoodId, number>, recomputed in useMemo from weights (pure fn in packages/scoring)
useEffect(() => {
  const map = mapRef.current?.getMap(); if (!map) return;
  const raf = requestAnimationFrame(() => {
    if (!map.getSource("hoods")) return;
    for (const [id, score] of scores) map.setFeatureState({ source: "hoods", id }, { score });
  });
  return () => cancelAnimationFrame(raf);
}, [scores]);
// also re-apply in onLoad / on 'sourcedata' when e.sourceId==='hoods' && e.isSourceLoaded
```
Drive the sliders with `onValueChange`. Keep the weights in React state and write them to the URL only `onValueCommitted`. That preserves 60 fps and avoids flooding router history.

**Parcels (140k): the GPU does the scoring.** Don't loop in JS. Rebuild the paint expression from the weights, and react-maplibre diffs it and calls `setPaintProperty`.
```ts
const w = normalize(weights); // sums to 1
const score = ["+", ["*", w.demand, ["get", "d"]], ["*", w.transit, ["get", "t"]], ["*", w.equity, ["get", "e"]],
                    ["*", w.climate, ["get", "c"]], ["*", w.feas, ["get", "f"]]];
<Source id="parcels" type="vector" url="pmtiles:///tiles/parcels.pmtiles" promoteId="id">
  <Layer id="parcels-pt" type="circle" source-layer="parcels" minzoom={12} beforeId="waterway_line_label" paint={{
    "circle-color": ["step", score, "#F0F9E8", 15, "#CCEBC5", 30, "#A8DDB5", 45, "#7BCCC4", 60, "#4EB3D3", 75, "#2B8CBE", 90, "#08589E"],
    "circle-radius": ["interpolate", ["linear"], ["zoom"], 12, 1.2, 16, 5],
    "circle-stroke-width": ["case", ["boolean", ["feature-state", "selected"], false], 3, 0],
    "circle-stroke-color": "#F2C230" }} />
</Source>
```
`pmtiles:///tiles/...` with three slashes resolves relative to the origin. If it doesn't in your setup, use `` `pmtiles://${location.origin}/tiles/parcels.pmtiles` ``.

**Hover with feature-state.** Keep tooltip position out of React state:
```tsx
const hovered = useRef<string | number | null>(null);
const tip = useRef<HTMLDivElement>(null);
<BaseMap interactiveLayerIds={["hoods-fill", "parcels-pt", "city-owned"]}
  onMouseMove={(e) => {
    const map = e.target, f = e.features?.[0];
    if (hovered.current != null) map.setFeatureState({ source: "hoods", id: hovered.current }, { hover: false });
    hovered.current = f?.layer.id === "hoods-fill" ? (f.id ?? null) : null;
    if (hovered.current != null) map.setFeatureState({ source: "hoods", id: hovered.current }, { hover: true });
    map.getCanvas().style.cursor = f ? "pointer" : "";
    if (tip.current) { tip.current.style.transform = `translate(${e.point.x + 12}px, ${e.point.y + 12}px)`;
                       tip.current.dataset.show = f ? "1" : "0"; }
    setHoverFeature(f?.properties ?? null); // cheap: only name/score render
  }}
  onMouseLeave={...clear} onClick={(e) => selectFeature(e.features?.[0])} />
```

**Clustering the 12.5k city-owned parcels:**
```tsx
<Source id="city-owned" type="geojson" data="/data/city_owned.geojson" cluster clusterMaxZoom={15} clusterRadius={40} promoteId="id">
  <Layer id="co-clusters" type="circle" filter={["has", "point_count"]} paint={{ "circle-color": "#222",
    "circle-radius": ["step", ["get", "point_count"], 12, 50, 16, 250, 22, 1000, 28], "circle-stroke-width": 2, "circle-stroke-color": "#fff" }} />
  <Layer id="co-count" type="symbol" filter={["has", "point_count"]} layout={{ "text-field": ["get", "point_count_abbreviated"],
    "text-font": ["Noto Sans Bold"], "text-size": 11 }} paint={{ "text-color": "#fff" }} />
  <Layer id="city-owned" type="circle" filter={["!", ["has", "point_count"]]} paint={{ "circle-color": "#222", "circle-radius": 4, "circle-stroke-width": 1.5, "circle-stroke-color": "#fff" }} />
</Source>
// click cluster → zoom in
const zoom = await (map.getSource("city-owned") as GeoJSONSource).getClusterExpansionZoom(f.properties.cluster_id);
map.easeTo({ center: (f.geometry as Point).coordinates as [number, number], zoom });
```

**Fit to a search result:**
```ts
import bbox from "@turf/bbox";
const [minX, minY, maxX, maxY] = bbox(feature);
map.fitBounds([[minX, minY], [maxX, maxY]], { padding: { top: 80, bottom: 80, left: 360, right: reportOpen ? 460 : 80 }, maxZoom: 17, duration: 1000 });
// point (address): map.flyTo({ center, zoom: 17, padding: {...} })
```

**URL state** (TanStack Router, where zod 4 implements Standard Schema and plugs into `validateSearch`):
```ts
export const exploreSearch = z.object({
  site: z.string().optional(),                                 // parcel id
  cmp: z.array(z.string()).max(3).default([]).catch([]),
  w: z.string().regex(/^\d+(-\d+){4}$/).default("30-20-20-15-15").catch("30-20-20-15-15"), // D-T-E-C-F
  scn: z.enum(["today", "proposed"]).default("today").catch("today"),
  layers: z.string().default("opp,co").catch("opp,co"),
  v: z.string().optional(),                                    // "lng,lat,zoom"
});
// write (debounced 300ms on moveend / slider commit):
navigate({ search: (p) => ({ ...p, v: `${c.lng.toFixed(5)},${c.lat.toFixed(5)},${z.toFixed(2)}` }), replace: true, resetScroll: false });
```
Read `v` once and use it for `initialViewState`, not for a controlled `viewState`, because controlled views re-render on every frame.

**Print** (`/site/$id?print=1`, or `window.print()` from the report):
```css
@media print {
  @page { size: Letter; margin: 0.5in; }
  body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  [data-map-chrome], .maplibregl-canvas-container, nav, [data-compare-tray] { display: none !important; }
  [data-report] { position: static !important; width: 100% !important; box-shadow: none !important; }
  [data-report] section { break-inside: avoid; }
  a[href^="http"]::after { content: " (" attr(href) ")"; font-size: 9pt; color: #6B6860; }
}
```
The static map snapshot comes from `map.getCanvas().toDataURL("image/png")`, which is why `preserveDrawingBuffer` is set on BaseMap. Put it in an `<img>` that is visible only in print.

## 6. shadcn components

The monorepo convention (README) is to put shared primitives in `packages/ui`. The base-lyra style is read from `packages/ui/components.json`.
```bash
npx shadcn@latest add sheet drawer tabs slider badge select table dialog switch chart popover \
  command toggle-group separator scroll-area hover-card collapsible progress kbd item spinner -c packages/ui
```
- `drawer` pulls in **vaul** and is the mobile bottom sheet (`snapPoints`). `sheet` is the desktop report on small laptops.
- `command` gives the ⌘K search: put `CommandDialog` in the top bar and group results with `CommandGroup`.
- `toggle-group` is the scenario switch and the layer segmented controls. `hover-card` is the "?" explainer on factors. `chart` brings Recharts for the compare charts.
- **Skip the `sidebar` block.** It is built for app navigation, and floating map panels are custom `div`s with `scroll-area`.

## 7. Accessibility and mobile

- **Give an alternative to the map.** Add a "List" toggle that shows the ranked neighborhoods table, sortable and linked to the same selection. Screen readers can't read WebGL, and judges notice this.
- **Keyboard:** MapLibre already handles the arrow keys and +/−. Add `/` or ⌘K for search, `Esc` to close the drawer, `L` for layers and `C` to pin to compare. The canvas gets `aria-label="Map of Pittsburgh showing opportunity scores"`. Every slider has a visible label and value, and the value is announced (base-ui Slider supports this). Selection changes are announced in an `aria-live="polite"` region, e.g. "Selected 7112 Frankstown Ave, score 78".
- **Color:** use the color-blind-safe ramps above. Chips carry icons and text. The legend states units and what "higher" means. Focus rings are 2 px `#F2C230` with an offset over a `#222` outline.
- **Motion:** respect `prefers-reduced-motion`. This works automatically as long as flyTo isn't marked essential, and panel transitions should be switched off too.
- **Mobile:** use `h-dvh` rather than `100vh`, and leave `cooperativeGestures` off because the map is full-screen. On touch, tap replaces hover. Hit targets are at least 44 px, and `queryRenderedFeatures` gets a 10 px box around the tap for dots. The bottom sheet sits above the attribution. Turn off `dragRotate` and `touchPitch`. Test at 375 px width, and check load time on throttled 4G, where maplibre and the PMTiles header should arrive in under 3 s.
- **Attribution** must stay visible (the compact control is fine) on screen and in print: "© OpenFreeMap © OpenMapTiles © OpenStreetMap contributors".
