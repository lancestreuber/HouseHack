# Parcel pillar scores

Every City of Pittsburgh parcel gets five 0–100 pillar scores, where **100 = a good place to build new housing**:
- Demand
- Site Feasibility
- Housing Need
- Access to Opportunity
- Climate & Environment

It also gets an overall score, a zoning status and a site-availability status. Clicking a parcel on the map opens `src/components/map/pillars-panel.tsx`, which shows every number behind a score.

## The open-weights file

`src/lib/pillars/pillars.config.json` is the single source of truth. For each indicator it records the source file and field, the geography, how the value is normalized, its weight, its evidence type (observed, assumption, policy or value) and the reason for it. It also holds:
- the pillar sub-scores and their weights
- the hazard caps ("gates")
- the zoning (`legal`) and site-availability multipliers
- the phrases shown for each score band
- the presets

The build, the scorer, the panel and the CLI all read this file. **Weights are value judgments.** To change them, do one of these:
- edit the file (the published defaults);
- use the sliders in the panel (saved in your browser);
- pass `--weights mine.json` to the CLI.

## Commands (run from `apps/web`)

| Command | What it does |
|---|---|
| `bun scripts/pillars/fetch-inputs.ts` | Downloads the parcel spine, the parcel → tract/block-group crosswalk, the City Ch. 906 overlays and lot dimensions into `.cache/pillars/` (~35 s) |
| `bun scripts/pillars/derive-inputs.ts` | Builds small derived tables (sales per owner-occupied unit) |
| `bun scripts/pillars/build-indicators.ts` | Computes and normalizes every indicator for all ~142k parcels. Writes `public/data/pillars/parcels/*.json` (per-parcel shards for the panel, committed) and `parcel-indicators.json` (gitignored) (~4 min) |
| `bun scripts/pillars/build-hexes.ts` | Rolls the default-weight parcel scores up into ~175 m hexagons for the five "Pillar scores" map overlays. Writes `public/data/overlays/pillar-hexes.geojson` (committed; ~2 s). Rerun after `build-indicators.ts`, and update the legend breaks in `src/components/map/overlays/pillars.ts` if the distribution moves. |
| `bun scripts/pillars/score-parcels.ts [--preset climate_first] [--weights mine.json] [--out f.csv]` | Writes a scores CSV for any weighting |
| `bun scripts/pillars/explain-parcel.ts <PIN> [...]` | Prints the full breakdown for parcels: the same numbers as the panel |
| `bun scripts/pillars/diagnostics.ts` | Runs JRC composite-indicator checks: indicator vs pillar (or sub-score) correlation, pillar correlations, rank stability across presets. "Weak" is expected for independent hazards (flooding vs slope) and for context signals; "conflicting" or "redundant" needs a look. |
| `bun test src/lib/pillars` | Scorer unit tests |

Rerun the build after changing a source or normalization rule. Weight changes need no rebuild.

## How a score is computed

1. **Normalize.** Each indicator becomes 0–100 through one of:
   - a percentile across Allegheny County units (block groups, tracts, ZIPs) or City parcels;
   - a fixed linear scale, for distances and shares;
   - a category code.

   Missing values stay missing. Reliability rules blank unreliable values, such as small sample sizes and small denominators.
2. **Sub-scores and pillars.** A weighted mean of the available indicators, with weights renormalized. A sub-score or pillar needs at least `min_coverage` of its weight present. Pillars with sub-scores average them by sub-score weight.
3. **Gates.** Serious hazards cap the Site pillar (floodway, floodplain, steep slope, landslide-prone land, sliver lots). Flag-only gates warn without capping (undermining, lead lines, displacement pressure).
4. **Overall.** A weighted geometric mean of the pillars; a missing pillar counts as a neutral 50 and is flagged. It is then multiplied by:
   - the **zoning** factor for the easiest legal pathway among detached, townhouse, two-unit, three-unit and multi-unit homes (not permitted ×0.2, or ×0.35 on the border of a housing district);
   - the **site-availability** factor (parks, cemeteries, rail and rights-of-way ×0.05; condo units ×0.5).
5. **Rank.** The panel shows "better than X% of City parcels" against the equal-weight distribution. The overall phrase is based on that rank.

## Inputs

Most inputs are the map overlays in `public/data/overlays/`. Tract and block-group extracts built by the data sessions, with their scripts, live in `scripts/pillars/inputs/` and `scripts/data/inputs/`. The zoning matrix is in `scripts/data/inputs/legal-feasibility/`. Sources, vintages and caveats are in each indicator's `rationale` and in the overlay metadata.

## Reviews and research

- `research/pillars/aggregation-standards.md` and `per-pillar-methods.md`: the cited standards (OECD/JRC, HDI, CalEnviroScreen, HUD, CNT, Walk Score, …)
- `research/pillars/reviews/round1-*.md`: parcel-level reality checks and the changes they drove
- `research/pillars/typology-design.md`: the next step, ranking housing types per parcel

## Known limitations

- **Distances are straight-line.** Hills, rivers and rail make some walks much longer (Mount Washington, Fineview).
- **Transit counts every nearby stop.** A route serving several nearby stops is counted more than once.
- **Tract and block-group values apply to every parcel inside.** They don't describe the individual lot.
- **Condo units score at ×0.5** instead of being scored as their building lot.
- **Infrastructure capacity isn't scored.** Sewer, water and power capacity aren't public.
- **Some data is old:** market and displacement data end in 2019–20, and the emissions inventory ends in 2021.
