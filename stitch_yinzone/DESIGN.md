---
name: Cartographic Precision
colors:
  surface: '#131314'
  surface-dim: '#131314'
  surface-bright: '#3a393a'
  surface-container-lowest: '#0e0e0f'
  surface-container-low: '#1c1b1c'
  surface-container: '#201f20'
  surface-container-high: '#2a2a2b'
  surface-container-highest: '#353436'
  on-surface: '#e5e2e3'
  on-surface-variant: '#d3c4b3'
  inverse-surface: '#e5e2e3'
  inverse-on-surface: '#313031'
  outline: '#9c8f7f'
  outline-variant: '#4f4538'
  surface-tint: '#f2be71'
  primary: '#f2be71'
  on-primary: '#442b00'
  primary-container: '#d4a359'
  on-primary-container: '#583a00'
  inverse-primary: '#7e5713'
  secondary: '#c8c5cb'
  on-secondary: '#303034'
  secondary-container: '#47464b'
  on-secondary-container: '#b6b4b9'
  tertiary: '#a1cafb'
  on-tertiary: '#003257'
  tertiary-container: '#86afde'
  on-tertiary-container: '#10426b'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffddb1'
  primary-fixed-dim: '#f2be71'
  on-primary-fixed: '#291800'
  on-primary-fixed-variant: '#614000'
  secondary-fixed: '#e4e1e7'
  secondary-fixed-dim: '#c8c5cb'
  on-secondary-fixed: '#1b1b1f'
  on-secondary-fixed-variant: '#47464b'
  tertiary-fixed: '#d0e4ff'
  tertiary-fixed-dim: '#a1cafa'
  on-tertiary-fixed: '#001d35'
  on-tertiary-fixed-variant: '#1b4972'
  background: '#131314'
  on-background: '#e5e2e3'
  surface-variant: '#353436'
typography:
  hero-metric:
    fontFamily: Archivo Narrow
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  hero-metric-mobile:
    fontFamily: Archivo Narrow
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  section-header:
    fontFamily: Archivo Narrow
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  body:
    fontFamily: Archivo Narrow
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-emphasis:
    fontFamily: Archivo Narrow
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: 0em
  label-sm:
    fontFamily: Archivo Narrow
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm-emphasis:
    fontFamily: Archivo Narrow
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system is engineered specifically for civil infrastructure authorities, urban analysts, and spatial engineers. The operational aesthetic balances technical rigor with structural tranquility, drawing inspiration from high-performance developer environments and institutional data terminals. The interface recedes entirely into the background to prioritize complex geographic layers, geospatial telemetry, and dense metric arrays.

The visual style is characterized by surgical restraint:
- **Quiet Depth:** Surfaces differentiate primarily through precise tonal changes rather than heavy ornamentation or aggressive framing.
- **Utilitarian Discipline:** Interfaces reject decorative graphics, visual metaphors, or whimsical transitions. Every millimeter corresponds to actionable geospatial data or operational controls.
- **Instrumental Focus:** High visual stability with strictly muted default states, ensuring spatial analysis remains free from cognitive interference.

## Colors

The palette operates on calibrated low-reflectance surfaces optimized for sustained night-and-day cartographic review. Color application is strictly functional; decorative color is absent.

### Surface System
- **Canvas Base:** `#0A0A0B` (Primary interface canvas and map backdrop)
- **Surface Level 1:** `#141416` (Docked panels, data sidebars, navigation bars)
- **Surface Level 2:** `#1C1C20` (Card interiors, control trays, active rows, hover fills)
- **Structural Border:** `#2A2A30` (Divider rules, hairline panel boundaries, inputs)

### Text Hierarchy
- **Primary Text:** `#F4F4F5` (Headings, primary readings, active labels)
- **Secondary Text:** `#A1A1AA` (Support metadata, inactive tabs, field headers)
- **Muted Text:** `#71717A` (Units of measurement, disabled indicators, time stamps)

### Functional Accent & Semantics
- **Key Accent:** `#D4A359` (Warm Amber/Brass). Reserved exclusively for primary commits, selection indicators, and targeted node highlights. Never used for passive decoration.
- **Semantic Red:** `#EF4444` (Critical structural breaches, zoning conflicts, system disconnects)
- **Semantic Amber:** `#F59E0B` (Capacity warnings, pending infrastructure validations)
- **Semantic Emerald:** `#10B981` (Nominal network telemetry, verified survey parcels)

Semantic indicators must only appear as active status dots (6px) or explicit alert counters.

## Typography

The typographic system is constrained to Archivo Narrow across exactly four discrete scale sizes and two weights: Regular (`400`) and SemiBold (`600`). This compact cadence enforces clarity within high-density technical layouts.

All numerical figures, coordinates, layer statistics, and data readouts must activate tabular alignment using `font-feature-settings: "tnum" 1, "cv05" 1`. This prevents visual jitter during real-time GIS stream updates. All uppercase labels must utilize a subtle tracking offset (`0.02em`) with size fixed at `13px`.

## Layout & Spacing

Layout geometry follows an 8px base rhythm with 4px micro-steps for tight dashboard inputs. 

- **GIS Console Frame:** A multi-pane layout with a fluid center canvas for MapLibre/Deck.gl viewpoints.
- **Docked Toolbars & Shelves:** Fixed-width sidebars (320px left inspection tray, 380px right metadata sheet) collapsing into sliding drawers on smaller viewports.
- **Spacing Rhythm:** Standard spacing increments are 4px (`space-xs`), 8px (`space-sm`), 16px (`space-md`), 24px (`space-lg`), and 32px (`space-xl`).
- **Responsive Rules:** Desktop interfaces default to uninterrupted edge-to-edge spatial viewports with docked floating panels. Below 1024px, inspection trays dock to the viewport bottom as persistent sheets.

## Elevation & Depth

This system avoids layered dropshadows, artificial gradients, and skeuomorphic bevels. Visual grouping is achieved via hairline boundaries and strict surface stacking:

1. **Base (Map/Canvas):** `#0A0A0B` — flat, anchor level.
2. **Structural Level 1 (Docked Sidebars/Headers):** `#141416` with a `1px solid #2A2A30` border.
3. **Card/Module Level 2:** `#1C1C20` set against `#141416` using structural boundaries (`1px solid #2A2A30`).
4. **Floating Overlays (Command Menus, Context Popovers, Layer Pickers):** Background `#1C1C20`, border `1px solid #2A2A30`, with a single ambient shadow token: `0 8px 32px rgba(0, 0, 0, 0.45)`. No other surface may cast shadows.

## Shapes

The design maintains an intentional corner radius between 8px and 10px (`0.5rem` to `0.625rem`) across structural modules, panels, inputs, and buttons. 

- **Panels & Cards:** 8px (`rounded-lg`) border radius.
- **Controls, Input Fields & Buttons:** 8px border radius.
- **Tooltips, Badges & Small Chips:** 6px border radius.
- **Status Dots & Radios:** Full circle (`9999px`).

Sharp 0px edges and playful organic pill shapes are prohibited.

## Components

### Buttons
- **Primary:** Background `#D4A359`, text `#0A0A0B` (SemiBold, 13px), no border, radius 8px, padding `6px 14px`. Hover: brightness 108%.
- **Secondary:** Background `#1C1C20`, text `#F4F4F5`, border `1px solid #2A2A30`, radius 8px, padding `6px 14px`. Hover: background `#2A2A30`.
- **Tertiary / Ghost:** Background transparent, text `#A1A1AA`, radius 8px, padding `6px 10px`. Hover: text `#F4F4F5`, background `#1C1C20`.

### Text Inputs & Select Fields
- Height: 32px.
- Background: `#141416`.
- Border: `1px solid #2A2A30`.
- Text: 13px regular, `#F4F4F5`. Placeholder text: `#71717A`.
- Focus state: Border color changes to `#D4A359` without outer focus rings.

### Checkboxes & Radios
- Size: 16px × 16px.
- Unchecked: Background `#141416`, border `1px solid #2A2A30`, radius 4px (checkbox) or circle (radio).
- Checked: Background `#D4A359`, border color `#D4A359`. Check icon is 10px stroke `#0A0A0B`.

### Layer & Attribute Chips
- Height: 24px.
- Background: `#1C1C20`. Border: `1px solid #2A2A30`.
- Padding: `0 8px`. Radius: 6px.
- Label: 13px Archivo Narrow, `#A1A1AA`. Active/Toggled state: Text `#F4F4F5`, border `#D4A359`.

### Data Cards & Modules
- Background: `#141416`.
- Border: `1px solid #2A2A30`.
- Padding: 16px.
- Header structure: 13px uppercase `#71717A` with value set at 36px/20px SemiBold `#F4F4F5`.

### Map Floating HUD / Toolbars
- Background: `#141416` with `1px solid #2A2A30`.
- Shadow: `0 8px 32px rgba(0, 0, 0, 0.45)`.
- Control spacing: 4px between 28px icon buttons.