# Map datasets

Each low-level dataset on the map is one **overlay**, made of:

1. **A build script** here (static data), writing a small GeoJSON file to `public/data/overlays/`. Run all of them with `bun run data:overlays` from `apps/web`. Datasets too large to ship as a file skip this step and load live for the visible area instead (see `sewer-lines.ts`).
2. **An overlay definition** in `src/components/map/overlays/`. It covers the source, map layers, legend, tooltip, and metadata (source, as-of date, geography, caveats).
3. **An entry in `OVERLAYS`** in `src/components/map/overlays/index.ts`.

The layers panel, legends and tooltips are generated from the registry, so nothing else needs editing.

## Handing a dataset over for integration

For each new dataset, give:

| Field | Example |
|---|---|
| Name and what it measures | "PWSA service line material: lead/galvanized/unknown per service address" |
| Endpoint | ArcGIS FeatureServer layer URL, WPRDC resource id, or a download URL |
| Geometry and count | points / lines / polygons, ~80k features |
| Geography | parcel, address, block group, tract, neighborhood |
| Key fields | Field names plus a few example values. Exact strings matter for styling. |
| Join key, if not spatial | `PIN`, block-group GEOID, tract GEOID |
| Vintage / last updated | "edited Sep 2026", "2012 snapshot" |
| License / attribution | "none stated; PWSA accuracy disclaimer" |
| Caveats | "blank = unmatched, not 'no lead'" |
| Access gotchas | needs a key, CORS blocked, max 1000 records per page |

## Rules

- **Never write to the database schema.** The Neon database is read-only for overlays.
- **No personal data.** Drop owner names, applicant names and contact fields when building a file.
- **Keep files small.** Request only the needed fields, use `geometryPrecision` 5 and simplify polygons. Anything over ~5 MB should load by viewport instead.
- **Label honestly.** Every overlay states its geography (for example "tract rating, not this parcel"), its vintage and its caveats.
- **Clip to the county line.** ZIP codes and bounding boxes cross it. Official county lists of agencies (fire, police, EMS) are the exception: an agency based just over the line still serves Allegheny municipalities.

## Patterns

- **Prepared extracts.** When a dataset arrives as a ready file, copy it and the script that made it into `inputs/`, and have the build script read it from there (see `places-multisource.ts`).
- **Large point sets.** Tens of thousands of points: write a grid of tile files plus a small density summary, and let a viewport source load only the visible tiles (see `vacancy.ts`).
- **One producer per file.** When a dataset is replaced, remove the old code that wrote it, so a full rebuild can't bring it back.

## Checks

- `bun scripts/data/audit-overlays.ts`: for every overlay, runs MapLibre style validation on its layers (for every metric), confirms its file exists, and reports how many features have each property its styles read.
- Type-check with `bunx tsc --noEmit -p .` (the scripts' "Cannot find name 'Bun'" errors are expected).
