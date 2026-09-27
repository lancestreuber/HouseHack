# Groundwork explorer UI

The vocabulary for the visual shell of the Groundwork parcel explorer: the surfaces, panes and controls that frame the map. Scoring and data terms live in the code and PLAN.md; this file covers only how the interface is named.

## Layout

**Rail**:
The fixed 48px vertical strip on the far left holding the logo, route navigation, theme toggle and user menu.
_Avoid_: Sidebar, nav bar, header

**Explorer**:
The `/` route: the map underlay plus every pane and floating overlay on top of it.
_Avoid_: Dashboard, map page

**Map underlay**:
The MapLibre canvas that fills the entire explorer behind all panes.
_Avoid_: Map pane, map container

**Pane**:
A resizable, collapsible region of the explorer rendered on top of the map underlay. The panes are Scores, Breakdowns, Chat and Typology.
_Avoid_: Panel, sidebar, drawer

**Floating overlay**:
A fixed-position control placed over the uncovered map, not part of the resizable tree: Layers, Address Search, Basemap Switcher, Hint Chips.
_Avoid_: Widget, HUD

## Surfaces

**Glass Surface**:
The translucent, blurred, hairline-bordered surface every pane and floating overlay is made of.
_Avoid_: Frosted panel, blur card, liquid glass (as a component name)

**Scrim**:
The gradient inside a Glass Surface that is dense where text sits and lightest at the edge touching the map.
_Avoid_: Overlay, fade, gradient background

**Section Card**:
The lighter second layer inside a pane that groups one topic under a title row with an optional right-side action.
_Avoid_: Card, box, tile (for containers)

**Detail Box**:
The darker inset block that opens inside a Section Card to show an indicator's raw value, method, weight and source.
_Avoid_: Drawer, accordion body

**Stat Tile**:
The large-number treatment for a score: value, unit suffix and bar.
_Avoid_: KPI, metric card, big number

**Accent Chip**:
The small gradient square with an icon that decorates a pillar or typology. Carries no meaning.
_Avoid_: Badge, icon button, category color

**Segmented Control**:
A single glass container of mutually exclusive or toggleable options, used for the basemap switcher.
_Avoid_: Tabs, button group, toggle bar

**Launcher Pill**:
The rounded floating button that opens chat on non-explorer routes.
_Avoid_: FAB, chat bubble

## Color

**Primary**:
Teal. The one color for active states, focus, selection and primary actions.
_Avoid_: Accent (for teal), brand color

**Accent Hue**:
One of five decorative hues (teal, blue, purple, amber, pink) used only for Accent Chips and chrome, never for meaning.
_Avoid_: Category color, chart color

**Score Color**:
One of good, mid, bad or none, derived from a 0–100 score. The only colors that carry meaning.
_Avoid_: Severity color, status color, traffic light

**Selection glow**:
The teal outline plus soft halo on the selected parcel.
_Avoid_: Highlight, yellow outline
