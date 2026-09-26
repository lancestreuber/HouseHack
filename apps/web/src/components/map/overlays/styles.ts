import type { LegendItem } from "./types";

// MapLibre style expressions are plain JSON arrays. They are typed loosely here
// and checked by MapLibre at runtime.
export type Expression = unknown[];

export const NO_DATA_COLOR = "rgba(120,120,120,0.35)";

// Sequential ramps chosen to read on the dark basemap: low values are dark and
// muted, high values bright. They are colorblind-safe (no red/green pairs).
export const RAMPS = {
  // Warm "magma"-like ramp for air quality.
  warm: ["#3b0f70", "#8c2981", "#de4968", "#fe9f6d", "#fcfdbf", "#ffffff"],
  // Neutral blue-teal ramp for values where "low" should not read as "bad"
  // (income, rent, home value).
  neutral: ["#0c2a3a", "#134e66", "#1f7a8c", "#3fa9b8", "#8fd3d6", "#e0f7f5"],
  // Purple ramp for weather risk, so it never reads as air quality.
  purple: ["#2d1b4e", "#4c2a85", "#6f42c1", "#a07fe0", "#d9c8ff"],
};

// Step choropleth on a numeric property: breaks[i] starts color i+1.
// Missing values are checked first: `to-number` turns null into 0, which would
// otherwise color no-data areas as the lowest bin.
// When the first break is above zero, negative values are treated as sentinels
// (no data). When it's zero or below (e.g. percent change), everything under the
// first break gets the first color, so declines stay visible.
export function stepFill(property: string, breaks: number[], colors: string[]): Expression {
  const signed = breaks[0] <= 0;
  const expr: Expression = signed
    ? ["step", ["to-number", ["get", property]], colors[0]]
    : ["step", ["to-number", ["get", property], -1], NO_DATA_COLOR, 0, colors[0]];
  breaks.forEach((b, i) => expr.push(b, colors[i + 1]));
  return ["case", ["==", ["get", property], null], NO_DATA_COLOR, expr];
}

export function stepLegend(breaks: number[], colors: string[], format: (lo: number, hi?: number) => string): LegendItem[] {
  const signed = breaks[0] <= 0;
  const edges = signed ? [Number.NEGATIVE_INFINITY, ...breaks] : [0, ...breaks];
  return colors.map((color, i) => ({
    color,
    label: signed && i === 0 ? `Below ${format(breaks[0]).replace(/\+$/, "")}` : format(edges[i], edges[i + 1]),
    shape: "fill" as const,
  }));
}

// Categorical color on a string property.
export function matchColor(property: string, mapping: Record<string, string>, fallback: string): Expression {
  const expr: Expression = ["match", ["get", property]];
  for (const [value, color] of Object.entries(mapping)) expr.push(value, color);
  expr.push(fallback);
  return expr;
}
