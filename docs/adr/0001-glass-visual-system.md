---
status: accepted
date: 2026-09-26
---

# Replace the minimal-dark visual system with an image-derived glass system

PLAN.md §0 and the 2026-09-26 design spec defined the explorer's look as "super minimal dark": `#0B0B0C` background, 1px `#222` borders, no shadows or card chrome, color only for severity, and yellow `#F2C230` reserved for selection. We are replacing that with the system in [DESIGN.md](../../DESIGN.md): a navy palette with a teal primary, heavy translucent glass panes over a full-bleed map, rounded Section Cards, decorative accent hues, and teal as the selection color. The reference is `powering-the-globe-a-holistic-overview-2-1440x927.png`.

This supersedes the visual-system lines of PLAN.md §0 ("UI" and "Basemap" rows), Lane C task C2, and the "Frontend: pane explorer" section of the spec. It changes nothing about which data is shown, where, or how panes behave. The rule that severity is the only meaning-bearing color survives; the rule reserving yellow for selection does not, since teal selection is coherent with the teal primary and yellow would fight it.

## Considered options

- **Keep minimal dark, restyle lightly.** Rejected: the reference image's identity is its glass and palette, and a light touch would not read as it.
- **Glass panes as siblings of the map with an ambient gradient behind them.** Rejected: fake glass. The map would never show through, which is the point of the effect. Cost is a map-underlay refactor with padding synced to pane sizes.
- **Keep yellow selection.** Rejected: with teal as primary, a reserved yellow would be the only warm chrome color and would look like a warning.

## Consequences

- The map canvas no longer lives in a resizable pane. `fitBounds` and `flyTo` depend on `map.setPadding` tracking pane sizes.
- `backdrop-filter` over WebGL is the most expensive compositing path in browsers. One blur per pane, alpha fills for cards, and an opaque fallback under `prefers-reduced-transparency` are mandatory.
- The shadcn "lyra" square-corner style is overridden globally; every route gets rounded controls.
- Light mode is a derivation rule from dark, and the basemap follows theme (Positron in light).
