# Build

**Type:** build
**One line:** Index of the build nodes: architecture options on the scaffolded stack, the offline data pipeline, a proposed timeline and workstreams, and UX patterns.
**Why we care:** These nodes turn the methods into something that can ship within the event. Each presents options and their risks; the recommendations inside them are individual sweeps' views, not team decisions.
**Last checked:** 2026-09-26

## Nodes

| Node | What it covers |
|---|---|
| [architecture-options.md](architecture-options.md) | What the scaffold contains; static-first hybrid vs PostGIS-backed vs fully static; Neon PostGIS support; Drizzle's Point-only geometry; PMTiles range requests on Vercel; the auth-wall risk |
| [data-pipeline.md](data-pipeline.md) | Install-tested DuckDB / geopandas / rasterio / tippecanoe / GDAL; FeatureServer paging; 3DEP slope tiling with the timing tests; runtime estimates |
| [timeline-and-workstreams.md](timeline-and-workstreams.md) | A proposed five-workstream split, checkpoints at H4 / H12 / H20, cut lines, critical path |
| [ux-patterns.md](ux-patterns.md) | Map stack versions, reference products and patterns, feature prioritization, accessibility, uncertainty display |

## Tagging notes for this directory

- Scaffold facts are `[read]` from the repository files.
- Measured facts (tool installs, two 3DEP `exportImage` timings, a one-parcel histogram, Vercel `206` range responses) come from sweeps that ran them.
- Doc URLs the sweeps cited without an explicit verification mark are tagged `[skimmed]`.
- Runtime and effort figures are **estimates** unless the node says they were measured.

## Disagreements kept visible
- **deck.gl:** the UX sweep suggests it for the simulator and 3D; the build sweep suggests skipping it. See [UX patterns](ux-patterns.md).
- **App shell:** the UX sweep proposed Next.js; the scaffold is TanStack Start. The nodes describe the scaffold.
- **tippecanoe flags:** two different command variants. See [data pipeline](data-pipeline.md).

## Open questions
- Whether the scaffold installs and builds as committed.
- Maximum static `.pmtiles` size on a Vercel deploy.
- Real end-to-end pipeline runtime.

## Connects to
- [PAPER.md](../PAPER.md): the survey these nodes support
- [Methods](../methods/README.md): what the build computes and explains
- [Rules and deliverables](../challenge/rules-and-deliverables.md): what must ship
- [Organizer data catalog](../data/organizer-data-catalog.md): the data the pipeline pulls

## Sources
- Sweep: [../../sweeps/r4-build-feasibility-on-team-stack.md](../../sweeps/r4-build-feasibility-on-team-stack.md) `[read]` *(accessed 2026-09-26)*: architecture, pipeline, timeline
- Sweep: [../../sweeps/r2-ux-and-map-stack.md](../../sweeps/r2-ux-and-map-stack.md) `[read]` *(accessed 2026-09-26)*: map stack and UX
- Sweep: [../../sweeps/r2-deeper-data-sources.md](../../sweeps/r2-deeper-data-sources.md) `[read]` *(accessed 2026-09-26)*: 3DEP per-parcel method, paging limits
- Working notes: [../../archive/working-notes-2026-09-26/07-ux-and-stack.md](../../archive/working-notes-2026-09-26/07-ux-and-stack.md) `[read]` *(accessed 2026-09-26)*: UX summary
- Team scaffold: [README.md](../../../README.md) `[read]` *(accessed 2026-09-26)*: stack description
