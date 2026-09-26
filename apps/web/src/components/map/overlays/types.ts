import type { AddLayerObject, LngLatBounds } from "maplibre-gl";

// How an overlay is drawn relative to the others:
// - "heat": area choropleths (block groups, tracts). Only one is shown at a time
//   so colors never mix.
// - "hazard": mapped hazard areas (flood zones, ...), stackable.
// - "infrastructure": points/lines that can be stacked on top of anything.
// - "places": points of interest (hospitals, schools, parks, shops, ...), stackable.
export type OverlayGroup = "heat" | "hazard" | "infrastructure" | "places";

// The brief asks us to separate observed evidence from assumptions, policy
// choices and value judgments. Every overlay declares which it is.
export type EvidenceType = "observed" | "assumption" | "policy" | "value";

export type LegendItem = {
  color: string;
  label: string;
  shape?: "fill" | "dot" | "line" | "dashed-line" | "hatch";
};

export type OverlayMeta = {
  source: string;
  sourceUrl: string;
  asOf: string;
  // What one value describes, e.g. "Census block group average, not this parcel".
  geography: string;
  evidence: EvidenceType;
  caveats: string[];
};

// A normalized 0–1 "burden" signal (1 = worst) an overlay can contribute to a
// future composite score such as infrastructure quality. Declared up front so
// composites can be assembled from the registry instead of hard-coded.
export type Indicator = {
  id: string;
  label: string;
  property: string;
  normalize: (value: unknown) => number | null;
};

// A sub-selection within one overlay, e.g. PM2.5 vs NO2 for air quality.
export type OverlayMetric = {
  id: string;
  label: string;
  property: string;
};

export type GeoJSONData = { type: "FeatureCollection"; features: unknown[] };

export type OverlaySource =
  | { kind: "static"; url: string }
  | {
      // Image tiles rendered by a server (e.g. an ArcGIS ImageServer); no build step.
      kind: "raster";
      tiles: string[];
      tileSize: number;
      minZoom: number;
      // Beyond this zoom, tiles are overzoomed instead of re-requested.
      maxZoom?: number;
      attribution?: string;
    }
  | {
      // Fetched for the visible map area once zoomed in far enough.
      kind: "viewport";
      minZoom: number;
      fetch: (bounds: LngLatBounds, signal: AbortSignal) => Promise<GeoJSONData>;
    };

export type OverlayDefinition = {
  id: string;
  label: string;
  group: OverlayGroup;
  // Draw beneath zoning/parcel outlines even if the group normally draws on top
  // (e.g. park polygons in the "places" group).
  drawBelowOutlines?: boolean;
  description: string;
  source: OverlaySource;
  metrics?: OverlayMetric[];
  // Layers to add for this overlay, given the selected metric (if any).
  // Layer ids must be unique across overlays; prefix them with the overlay id.
  layers: (sourceId: string, metric?: OverlayMetric) => AddLayerObject[];
  // Layers that show hover tooltips, if any.
  tooltipLayerIds?: string[];
  tooltip?: (properties: Record<string, unknown>, metric?: OverlayMetric) => string[];
  legend: (metric?: OverlayMetric) => LegendItem[];
  meta: OverlayMeta;
  indicators?: Indicator[];
};
