# DESIGN: Glass explorer

Visual redesign of the Groundwork explorer, using `powering-the-globe-a-holistic-overview-2-1440x927.png` as the reference. The image is inspiration for **appearance and layout only**. Every piece of data the explorer shows today keeps showing, in the same pane, with the same behavior. Nothing is added, hidden, merged or reworded.

Vocabulary used here is defined in [CONTEXT.md](./CONTEXT.md). The decision to replace the old "super minimal dark" system is recorded in [ADR 0001](./docs/adr/0001-glass-visual-system.md).

## 1. What the reference image gives us

| Element in image | What we take from it |
|---|---|
| 48px icon Rail on the far left, dark, with logo top and avatar bottom | The Rail. It replaces the top Header on every route. |
| ~300px translucent Pane over the map, map glow visible through it | The Glass Surface: heavy blur, low opacity, hairline borders. |
| Stacked Section Cards inside the pane, each a lighter second layer with a title row and optional action on the right | The Section Card grammar for every pane body. |
| Dual-stat card with big numbers and small units | The Stat Tile treatment for Overall score, pillar scores and typology scores. |
| Four category tiles with gradient icon chips (teal, blue, purple, amber) | Accent Hues for non-semantic chrome: pillar icon chips, typology tile headers, chat suggestion chips. |
| Segmented tab bar (Overview / Buildings / Layers) | The Segmented Control treatment for the basemap switcher. |
| Rounded pill buttons bottom-right ("Copilot", "Simulate") | The pill style for the chat launcher on non-explorer routes. |
| Deep navy canvas, teal primary, soft glows on markers | Palette and the teal selection glow on the map. |

Not taken: the scatter and line charts (no data counterpart), the 3D extruded markers (data change), the location and date filters (no such filters exist).

## 2. Layout

### 2.1 Root shell

Today: `grid h-svh grid-rows-[auto_1fr]` with `<Header/>` on top (`apps/web/src/routes/__root.tsx:58`).

After: `grid h-svh grid-cols-[3rem_1fr]` with `<Rail/>` on the left and `<Outlet/>` filling the rest. `apps/web/src/components/header.tsx` is deleted. The page title "My App" becomes "Groundwork".

### 2.2 Rail

New component `apps/web/src/components/rail.tsx`. Fixed 48px wide, full height, `bg-canvas` (opaque, not glass) with a 1px right border in `--glass-border`.

Top to bottom, 40px square icon buttons on an 8px gap:

1. Logo mark (a 28px rounded square with the teal-to-blue gradient, letter "G"). Links to `/`.
2. Nav: Home (`Map` icon) to `/`, Dashboard (`LayoutDashboard`) to `/dashboard`, Todos (`ListChecks`) to `/todos`. These are exactly the links from the current Header. Active route shows a 2px teal bar on the left edge and `text-foreground`; inactive is `text-muted-foreground`.
3. Spacer.
4. `ThemeToggle` (existing component, unchanged behavior).
5. `UserMenu` (existing component, unchanged behavior).

Every rail button has a `Tooltip` on the right with its label, since the rail has no text.

### 2.3 Explorer: map underlay and overlay panes

Today `ParcelMap` (`apps/web/src/components/parcel-map.tsx:360-490`) puts the map inside one `ResizablePanel` beside the right column and above the bottom strip. Glass over a sibling shows nothing, so the map moves underneath.

After:

```
<div class="relative h-full w-full">                       explorer root
  <div ref={containerRef} class="absolute inset-0" />       MapLibre canvas, full bleed
  <ResizablePanelGroup class="absolute inset-0 pointer-events-none">
    ... identical group/panel tree to today ...
    map pane content: transparent, pointer-events-none, holds only the floating overlays
    every other pane: pointer-events-auto, renders a Glass Surface
  </ResizablePanelGroup>
</div>
```

Rules:

- The resizable tree keeps the same panels, default sizes, min/max sizes, collapse sizes, `panelRef`s and `onResize` handlers as today. Only the map's canvas leaves its pane. Resizing and collapsing behave exactly as they do now.
- The map pane's content keeps `ParcelTab`, `LayersPanel`, `AddressSearch`, the basemap switcher, hint chips and the NavigationControl. It sets `pointer-events-none` on its own box and `pointer-events-auto` on each floating child so map gestures pass through.
- `ResizableHandle` gets `pointer-events-auto`.
- **Map padding follows the panes.** A `useMapPadding` hook reads the right column's and bottom strip's pixel sizes on every `onResize` and calls `map.setPadding({ right, bottom, top: 34 })` where `top` is the `ParcelTab` height. `fitBounds`, `flyTo` and `easeTo` already honor padding, so the selected parcel and search results land in the uncovered region. When a pane collapses, padding drops to its collapsed size.
- Each overlay pane is inset 8px from the viewport edges and from its neighbors, so glass panes read as floating cards rather than a wall. The gap between panes is where the `ResizableHandle` lives.

### 2.4 Pane inventory (unchanged contents)

| Pane | File | Contents that must survive verbatim |
|---|---|---|
| ParcelTab | `map/parcel-tab.tsx` | "Parcel {pin}" or "Select a parcel", star toggle (localStorage `parcel-star:{pin}`), collapse button |
| Layers (floating, top-left) | `map/layers-panel.tsx` | Heat overlay radio group incl. "None", metric select, stackable checkbox groups, "(zoom in to N+)" hints, LoadingBadge, Legend (swatches, geography, source link, as-of, evidence pill, caveats) |
| AddressSearch (floating, top-center) | `map/address-search.tsx` | trigger with ⌘K kbd, CommandDialog, "no parcel match" tag |
| Basemap switcher (floating, bottom-left) | `parcel-map.tsx:383-405` | Dark Matter, OSM (inverted), Zoning |
| Hint chips (floating, top-right) | `parcel-map.tsx:406-416` | zoom hint, zoning legend chip |
| Scores | `map/pillars-panel.tsx` | header (Parcel, PIN, Zoning, collapse, close), status text, Overall card with ScoreBar and p10–p90 range, five PillarCards with subscores, flags, expandable IndicatorRows with detail boxes, footer note |
| Breakdowns | `map/breakdown-panel.tsx` | header, per-pillar sections with anchor ids, AlertRows, "Label = raw" rows with norm/100 |
| Chat | `chat/chat-pane.tsx` | header actions, subject line, Welcome + Top questions, turns, FactChips, Composer with mic and send, pop-out window with 8 resize handles, "Dock it back here" placeholder |
| Typology | `map/typology-panel.tsx` | header with Zoning, four TypologyTiles each with Select, score, pathway label |

## 3. Tokens

All tokens live in `packages/ui/src/styles/globals.css`. Values below are hex for readability; keep them as hex or convert to oklch, either is fine under Tailwind v4.

### 3.1 Dark (reference)

```css
.dark {
  /* canvas and surfaces */
  --canvas:            #070C17;   /* rail, page background on non-map routes */
  --pane:              #0D1526;   /* glass base color, used with alpha */
  --card:              #131D33;   /* opaque fallback for Section Cards */
  --popover:           #131D33;
  --background:        #0B1322;   /* shadcn alias; equals pane with alpha removed */
  --foreground:        #E8EEF7;
  --muted-foreground:  #8A97AD;
  --muted:             #1A2540;
  --secondary:         #1A2540;
  --accent:            #22304F;
  --border:            rgb(255 255 255 / 0.08);
  --input:             rgb(255 255 255 / 0.10);

  /* primary and accent hues */
  --primary:           #2BD4BD;   /* teal */
  --primary-foreground:#04110F;
  --ring:              #2BD4BD;
  --hue-teal:          #2BD4BD;
  --hue-blue:          #3D8BFD;
  --hue-purple:        #8B5CF6;
  --hue-amber:         #F5A524;
  --hue-pink:          #F0508A;

  /* semantic (score) colors, retuned from #22c55e / #eab308 / #ef4444 / #525252 */
  --score-good:        #34D399;
  --score-mid:         #F5B93E;
  --score-bad:         #F26D6D;
  --score-none:        #5B6678;
  --destructive:       #F26D6D;

  /* selection */
  --select:            #2BD4BD;
  --select-glow:       rgb(43 212 189 / 0.55);

  /* glass */
  --glass-blur:        40px;
  --glass-saturate:    140%;
  --glass-alpha-edge:  0.45;      /* pane opacity at the edge that touches the map */
  --glass-alpha-body:  0.72;      /* pane opacity 96px in from that edge and beyond */
  --glass-card:        rgb(255 255 255 / 0.06);
  --glass-card-hover:  rgb(255 255 255 / 0.09);
  --glass-border:      rgb(255 255 255 / 0.08);
  --glass-highlight:   rgb(255 255 255 / 0.18);  /* 1px specular line on the top edge */
  --glass-shadow:      0 12px 40px rgb(0 0 0 / 0.45);

  --radius:            0.75rem;
}
```

`--chart-1..5` are replaced by the five `--hue-*` tokens. `--sidebar-*` tokens are removed; nothing uses them.

### 3.2 Light (derived)

Light is a derivation rule, not a second design. Every token is produced from its dark counterpart as follows:

- Canvas and pane: hue-preserving flip. `--canvas #F3F6FB`, `--pane #FFFFFF`, `--card #FFFFFF`, `--background #F7F9FC`, `--foreground #0B1322`, `--muted-foreground #55627A`, `--muted #E9EEF6`, `--border rgb(11 19 34 / 0.08)`.
- Primary teal darkens for contrast on white: `--primary #0FA394`, `--primary-foreground #FFFFFF`, `--ring #0FA394`, `--select #0FA394`.
- Accent hues darken one step: `--hue-blue #2F6FE0`, `--hue-purple #6D3FE0`, `--hue-amber #D68A0C`, `--hue-pink #D63A72`. Teal shares primary.
- Score colors darken for AA on white: `--score-good #1B9E6B`, `--score-mid #B57F0D`, `--score-bad #D24444`, `--score-none #8A94A6`.
- Glass: `--glass-alpha-edge 0.55`, `--glass-alpha-body 0.82`, `--glass-card rgb(11 19 34 / 0.04)`, `--glass-border rgb(11 19 34 / 0.08)`, `--glass-highlight rgb(255 255 255 / 0.9)`, `--glass-shadow 0 12px 40px rgb(11 19 34 / 0.12)`.
- Basemap follows theme (see §7).

### 3.3 Typography

- Load Inter Variable locally: add `@fontsource-variable/inter` to `packages/ui` and `@import "@fontsource-variable/inter";` at the top of `globals.css`. The existing `--font-sans: "Inter Variable", sans-serif` then resolves.
- Add `--font-mono: "JetBrains Mono Variable", ui-monospace, monospace` via `@fontsource-variable/jetbrains-mono` for the PIN and any `font-mono` use.
- Type scale inside panes stays as today (`text-xs` body, `text-[11px]` Layers, `text-[10px]` chips). Headings in Section Cards are `text-[13px] font-semibold tracking-[-0.01em]`. Stat values are `font-semibold tabular-nums tracking-[-0.02em]`.
- Body gets `font-feature-settings: "cv11", "ss01"` for Inter's alternate digits and a `tabular-nums` utility on every numeric span (already present in most places).

### 3.4 Radius

`--radius` moves from `0.625rem` to `0.75rem`. In `packages/ui/src/components/button.tsx` every `rounded-none` becomes `rounded-md` (icon sizes too). In `card.tsx` the four `rounded-none` become `rounded-lg`, and `ring-1 ring-foreground/10` becomes `border border-glass-border`. Resizable handle grip (`resizable.tsx:41`) becomes `rounded-full`.

### 3.5 Tailwind mapping

Add to `@theme inline`: `--color-canvas`, `--color-pane`, `--color-hue-teal` through `--color-hue-pink`, `--color-score-good/mid/bad/none`, `--color-select`, `--color-glass-card`, `--color-glass-border`, `--color-glass-highlight`. Add a `--blur-glass: var(--glass-blur)` so `backdrop-blur-glass` works.

## 4. Surfaces

### 4.1 Glass Surface

A shared component `packages/ui/src/components/glass.tsx` exporting `GlassSurface` with an `edge` prop of `"left" | "right" | "top" | "bottom" | "none"` naming the edge that touches the map. It renders:

```
position: relative; overflow: hidden; border-radius: var(--radius-xl);
border: 1px solid var(--glass-border);
box-shadow: var(--glass-shadow);
backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
background: linear-gradient(<toward edge>,
  rgb(from var(--pane) r g b / var(--glass-alpha-body)) 0,
  rgb(from var(--pane) r g b / var(--glass-alpha-body)) calc(100% - 96px),
  rgb(from var(--pane) r g b / var(--glass-alpha-edge)) 100%);
```

plus a `::before` 1px line at the top in `--glass-highlight` (the specular edge) and a `::after` radial glow, 240px wide, 8% teal, anchored at the top-left corner, so every pane carries a hint of the image's ambient light.

The gradient is the Scrim. It is the contrast guarantee: text sits over the dense body while the map-facing edge stays see-through. With `edge="none"` (Layers panel, floating chat window) the background is flat at `--glass-alpha-body`.

Fallbacks:

- `@media (prefers-reduced-transparency: reduce)` and `@supports not (backdrop-filter: blur(1px))`: background becomes opaque `--card`, no blur, no glow.
- `will-change: backdrop-filter` is not set; `contain: paint` is set so the blur region is bounded by the pane.

Pane assignments: Scores/Breakdowns/Chat column `edge="left"`, Typology strip `edge="top"`, Layers panel `edge="none"`, ParcelTab `edge="bottom"`.

### 4.2 Section Card

The second glass layer. Shared component `SectionCard` in the same file:

```
rounded-lg border border-glass-border bg-glass-card
hover:bg-glass-card-hover (only when the card is a button)
```

with a header row: `title` (`text-[13px] font-semibold`) on the left, an optional `action` slot on the right (a `ghost` size `xs` Button, as "See Details" in the image), then children. Padding 12px, gap 8px, stacked with 8px between cards. Cards never nest more than one level; the IndicatorRow detail box inside a PillarCard is a Detail Box, not a card.

### 4.3 Detail Box and chips

- Detail Box (`IndicatorRow` open state, `pillars-panel.tsx:141`): `rounded-md bg-black/20 border border-glass-border p-2` in dark, `bg-black/[0.03]` in light. Replaces `bg-foreground/5`.
- Evidence pill (`pillars-panel.tsx:151`, `layers-panel.tsx:49`): `rounded-full border border-glass-border bg-glass-card px-1.5 text-[10px]`.
- AlertRow (`breakdown-panel.tsx:12`): `border-score-bad/30 bg-score-bad/10 text-score-bad`.
- Hint chips (`parcel-map.tsx:407,411`): `GlassSurface edge="none"` at `rounded-full px-2.5 py-1`.

### 4.4 Stat Tile

The image's big-number treatment. Applied to:

- Overall score (`pillars-panel.tsx:306`): value `text-2xl`, "/ 100" as a `text-[11px] text-muted-foreground` unit suffix, ScoreBar below.
- PillarCard closed state (`:207`): value `text-lg`.
- TypologyTile (`typology-panel.tsx:65`): value `text-2xl`, already there.

Value color remains `scoreColor()` semantics. `scoreColor` in `pillars-panel.tsx:109` and its duplicate in `typology-panel.tsx:31` both move to `apps/web/src/lib/pillars/score-color.ts`, returning CSS variable references (`var(--score-good)` etc.) instead of hex, so light mode gets the darker set for free.

### 4.5 ScoreBar

`pillars-panel.tsx:116`: track `h-1.5 rounded-full bg-white/8`, fill `rounded-full` with `background: linear-gradient(90deg, color-mix(in oklch, <scoreColor>, black 25%), <scoreColor>)` and a `0 0 8px <scoreColor>/40` glow. Phase 3.

### 4.6 Accent chips

Pillar icon chips: each of the five PillarCards gets a 28px `rounded-md` chip left of its label with a lucide icon and one of the five `--hue-*` gradients (top: hue at 90%, bottom: hue at 60%), in config order: teal, blue, purple, amber, pink. The mapping lives next to `scoreColor`. The four TypologyTiles get the same treatment, in tile order. Chips are decoration; they carry no meaning and are `aria-hidden`.

### 4.7 Segmented Control

Basemap switcher (`parcel-map.tsx:383-405`): `GlassSurface edge="none"` container at `rounded-lg p-0.5`, each option `rounded-md px-2.5 py-1 text-xs`. Active option: `bg-primary/15 text-primary` with a 1px `border-primary/40`. Inactive: `text-muted-foreground hover:text-foreground`. Same three options, same handlers.

### 4.8 Resizable handle

`resizable.tsx:35`: the line becomes transparent (`bg-transparent`) since panes are inset 8px and the gap is the handle. The grip becomes `h-8 w-1 rounded-full bg-white/20`, appearing at `opacity-0` and rising to `opacity-100` on `hover` or `focus-visible` of the separator, with a `transition-opacity`.

## 5. Component-by-component changes, Phase 1

Each row lists only styling. Props, state, handlers and text are untouched.

| File | Change |
|---|---|
| `routes/__root.tsx` | Grid becomes `grid-cols-[3rem_1fr]`. Replace `<Header/>` with `<Rail/>`. Title "Groundwork". |
| `components/header.tsx` | Delete. |
| `components/rail.tsx` | New, per §2.2. |
| `components/parcel-map.tsx` | Map container moves to `absolute inset-0` under the panel group (§2.3). Add `useMapPadding`. Wrap Scores column, Typology strip and ParcelTab in `GlassSurface`. Basemap switcher becomes Segmented Control. Hint chips become glass pills. Inset each overlay pane by 8px. |
| `map/parcel-tab.tsx` | `bg-background border-b` becomes a `GlassSurface edge="bottom"` with `rounded-t-none`. Star active color `text-hue-amber`. |
| `map/layers-panel.tsx` | Container becomes `GlassSurface edge="none"` at `w-64`. Native radio becomes shadcn `RadioGroup` (add via shadcn), native checkbox becomes shadcn `Checkbox`, native select becomes shadcn `Select`. Section titles `text-[11px] font-semibold uppercase tracking-wide text-muted-foreground`. Legend becomes a `SectionCard` without title. |
| `map/address-search.tsx` | Trigger becomes a glass pill (`rounded-full`), kbd chip `bg-glass-card`. CommandDialog content `bg-pane/90 backdrop-blur-glass`. |
| `map/pillars-panel.tsx` | `aside` loses `bg-background`. Header keeps layout, gains `text-[13px]` PIN in mono. Overall becomes a `SectionCard` with Stat Tile. PillarCard becomes a `SectionCard` as a button, with accent chip. Detail Box and evidence pill per §4.3. Close button becomes `ghost icon-xs` Button. |
| `map/breakdown-panel.tsx` | Header row `text-[13px] font-semibold`. Each pillar section becomes a `SectionCard` titled with the pillar label and the score as `action`. AlertRow colors per §4.3. |
| `map/typology-panel.tsx` | Each TypologyTile becomes a `SectionCard` with accent chip. Remove local `scoreColor`, import shared one. |
| `map/pane-collapse-button.tsx` | Becomes `ghost icon-xs` Button. |
| `chat/chat-pane.tsx` | Docked: `bg-background` removed, header `border-b border-glass-border`. Floating: `GlassSurface edge="none"` with `rounded-2xl`, shadow `--glass-shadow`. UserTurn `bg-primary/15 text-foreground`. Suggestion pills `border-glass-border bg-glass-card hover:bg-glass-card-hover`. Composer shell `bg-glass-card border-glass-border rounded-2xl`. Send button `bg-primary text-primary-foreground`. |
| `chat/chat-launcher.tsx` | Pill becomes `GlassSurface edge="none" rounded-full` with a teal `MessageCircle` icon and `text-foreground`, matching the image's "Copilot" pill. Still hidden on `/`. |
| `chat/fact-chip.tsx` | `border-glass-border bg-glass-card`, hover `bg-primary/15 text-primary`. |
| `ui/components/button.tsx`, `card.tsx`, `resizable.tsx` | Per §3.4 and §4.8. |
| `ui/styles/globals.css` | Tokens per §3, font imports per §3.3, `GlassSurface` fallbacks per §4.1. |
| `packages/ui/package.json` | Add `@fontsource-variable/inter`, `@fontsource-variable/jetbrains-mono`. |

Map style changes in Phase 1 (`parcel-map.tsx:156-166`): selected parcel outline uses `--select` at 3px, plus a second line layer beneath it at 9px width, `--select-glow` color, `line-blur: 6` for the glow. Parcel outline `#f5f5f5` becomes `#E8EEF7` at opacity 0.7.

## 6. Phase 2

- **Basemap follows theme.** `parcel-map.tsx:44-45`: when the theme is light and the basemap is `carto-dark`, load `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`. The switcher's first option label reads "Carto" instead of "Dark Matter" only if both styles share it; otherwise keep "Dark Matter" and add nothing. Zoning and overlay layers re-apply after `setStyle`, as today.
- **Themed map popups.** `overlay-controller.ts:142-155`: give the `Popup` a `className` and style `.maplibregl-popup-content` as a glass pill with `--foreground` text and `--glass-border`. Remove `text-neutral-900`.
- **Rail polish.** Active-route indicator animates between items (`transition-transform`). Logo chip gets the teal-blue gradient glow.
- **Floating overlays.** `NavigationControl` restyled through `.maplibregl-ctrl-group` to glass.

## 7. Phase 3

- ScoreBar gradient and glow (§4.5).
- Stat Tile unit suffixes and `tracking-[-0.02em]` on all stat values.
- PillarCard closed state: subscores rendered as two-column mini stats under the bar instead of inline text (same values, same labels).
- Typology tiles: pathway label becomes a small pill under the score.

## 8. Constraints that must hold

- **No data change.** Every string, number, list, link, tooltip and control in §2.4 stays. A visual diff of pane contents before and after must show the same words.
- **No behavior change.** Resizing, collapsing, pop-out chat, localStorage keys, ⌘K search, anchor scrolling to `#breakdown-{id}`, star toggle.
- **Contrast.** Body text on the dense part of the Scrim must reach 4.5:1 in both themes. Verify with the map at its brightest (Positron in light, a heat overlay at full in dark).
- **Performance.** One `backdrop-filter` per pane, none per card. Cards use alpha fills, not blur. If frame rate over the map drops below 50fps on a mid-range laptop, lower `--glass-blur` to 28px before touching anything else.
- **Accessibility.** `prefers-reduced-transparency` produces opaque panes. Rail buttons have tooltips and `aria-label`s. Focus rings use `--ring` (teal) at 2px.

## 9. Verification checklist

**Run step 2 first, before any styling work is reviewed.** The map-underlay refactor (§2.3) is the only Phase 1 change that touches behavior: `fitBounds` and `flyTo` now depend on `map.setPadding` tracking pane sizes. If step 2 fails, nothing else in the checklist is meaningful yet.

1. `bun run dev`, open `/`. Map fills the viewport behind the panes; the right column and bottom strip are translucent and the map is visible through their outer 96px.
2. Drag every handle; collapse every pane. Padding updates so a search result lands in the uncovered area.
3. Select a parcel. Outline is teal with a glow. Scores, Breakdowns, Typology, Chat populate with the same content as `main`.
4. Toggle theme. Panes go frosted white, basemap switches to Positron (Phase 2), all text stays readable.
5. Enable `prefers-reduced-transparency` in the OS. Panes go opaque.
6. Visit `/dashboard` and `/todos`. Rail shows the active route; no top header; chat launcher pill is present bottom-right.
7. Pop chat out, resize from each edge, dock it back.
