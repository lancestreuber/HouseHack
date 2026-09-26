import { matchColor } from "./styles";
import type { LegendItem, OverlayDefinition, OverlayMeta } from "./types";

const PLACES_CAVEAT = "Location only; straight-line distance ignores hills, rivers and road network.";

type PointOverlayOptions = {
  id: string;
  label: string;
  description: string;
  file: string;
  // A single color, or a categorical color on one property.
  color: string | { property: string; colors: Record<string, string>; labels?: Record<string, string> };
  radius?: [number, number];
  // Falsy entries are dropped, so optional lines can be written as `cond && text`.
  tooltip: (p: Record<string, unknown>) => unknown[];
  meta: Omit<OverlayMeta, "evidence" | "caveats"> & { caveats?: string[] };
};

// Factory for simple "places" point layers (one dot per location, colored by category).
function pointOverlay(o: PointOverlayOptions): OverlayDefinition {
  const layerId = `${o.id}-dots`;
  const [r0, r1] = o.radius ?? [3, 7];
  const circleColor =
    typeof o.color === "string" ? o.color : matchColor(o.color.property, o.color.colors, "#a3a3a3");
  const legend: LegendItem[] =
    typeof o.color === "string"
      ? [{ color: o.color, label: o.label, shape: "dot" }]
      : Object.entries(o.color.colors).map(([k, color]) => ({
          color,
          label: (o.color as { labels?: Record<string, string> }).labels?.[k] ?? k,
          shape: "dot" as const,
        }));
  return {
    id: o.id,
    label: o.label,
    group: "places",
    description: o.description,
    source: { kind: "static", url: `/data/overlays/${o.file}` },
    layers: (sourceId) => [
      {
        id: layerId,
        type: "circle",
        source: sourceId,
        paint: {
          "circle-color": circleColor as never,
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, r0, 16, r1] as never,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1,
        },
      },
    ],
    tooltipLayerIds: [layerId],
    tooltip: (p) => o.tooltip(p).filter(Boolean).map(String),
    legend: () => legend,
    meta: { ...o.meta, evidence: "observed", caveats: [...(o.meta.caveats ?? []), PLACES_CAVEAT] },
  };
}

export const hospitalsOverlay = pointOverlay({
  id: "places-hospitals",
  label: "Hospitals",
  description: "PA Department of Health licensed hospitals.",
  file: "places-hospitals.geojson",
  color: {
    property: "kind",
    colors: { general: "#ef4444", specialty: "#f9a8d4" },
    labels: { general: "General hospital", specialty: "Specialty (psych, rehab, long-term acute)" },
  },
  radius: [5, 9],
  tooltip: (p) => [String(p.name), String(p.address ?? ""), p.kind === "specialty" && "Specialty hospital"],
  meta: {
    source: "PA Department of Health licensed hospitals (PASDA)",
    sourceUrl: "https://mapservices.pasda.psu.edu/server/rest/services/pasda/DepHealth/MapServer/6",
    asOf: "DOH Hospitals, Nov 2025",
    geography: "Facility locations, Allegheny County",
    caveats: ["The DOH data has no emergency-department flag; specialty is inferred from the name."],
  },
});

export const fireStationsOverlay = pointOverlay({
  id: "places-fire",
  label: "Fire stations",
  description: "Fire department stations across Allegheny County.",
  file: "places-fire.geojson",
  color: "#f97316",
  tooltip: (p) => [String(p.name), p.station != null && `Station ${p.station}`, p.municipality && String(p.municipality)],
  meta: {
    source: "Allegheny County fire departments (ConnectGovs GIS)",
    sourceUrl: "https://services.arcgis.com/Kwm2c3YqtFhUC26N/arcgis/rest/services/Fire_Departments_Allegheny_County/FeatureServer/0",
    asOf: "Edited Jan 2024",
    geography: "Station locations",
  },
});

export const policeStationsOverlay = pointOverlay({
  id: "places-police",
  label: "Police stations",
  description: "Municipal, campus and state police stations.",
  file: "places-police.geojson",
  color: "#3b82f6",
  tooltip: (p) => [String(p.name)],
  meta: {
    source: "OpenStreetMap contributors (ODbL), plus PA State Police stations (PASDA)",
    sourceUrl: "https://www.openstreetmap.org/copyright",
    asOf: "OSM as of Sep 2026; PSP stations Mar 2025",
    geography: "Station locations, clipped to the county",
    caveats: ["Crowd-sourced: unnamed stations are dropped and coverage may be incomplete."],
  },
});

export const emsStationsOverlay = pointOverlay({
  id: "places-ems",
  label: "EMS stations",
  description: "Ambulance / EMS stations.",
  file: "places-ems.geojson",
  color: "#a855f7",
  tooltip: (p) => [String(p.name)],
  meta: {
    source: "OpenStreetMap contributors (ODbL)",
    sourceUrl: "https://www.openstreetmap.org/copyright",
    asOf: "OSM as of Sep 2026",
    geography: "Station locations, clipped to the county",
    caveats: ["Crowd-sourced; coverage may be incomplete."],
  },
});

export const schoolsOverlay = pointOverlay({
  id: "places-schools",
  label: "Schools",
  description: "Public, private, charter and career/technical schools (no cyber schools).",
  file: "places-schools.geojson",
  color: {
    property: "category",
    colors: { Public: "#22c55e", Charter: "#eab308", Private: "#06b6d4", CTC: "#f97316" },
    labels: { Public: "Public", Charter: "Charter", Private: "Private", CTC: "Career / technical center" },
  },
  tooltip: (p) => [String(p.name), `${p.category} school${p.grades ? `, grades ${p.grades}` : ""}`, p.district && String(p.district)],
  meta: {
    source: "Allegheny County Schools (Allegheny County GIS)",
    sourceUrl: "https://services1.arcgis.com/vdNDkVykv9vEWFX4/arcgis/rest/services/Allegheny_County_Schools/FeatureServer/0",
    asOf: "Edited Mar 2026",
    geography: "School locations",
    caveats: ["Locations only; schools are deliberately not ranked by test scores."],
  },
});

export const childCareOverlay = pointOverlay({
  id: "places-child-care",
  label: "Child care",
  description: "Licensed child care providers (PA Department of Human Services).",
  file: "places-child-care.geojson",
  color: "#f472b6",
  radius: [2, 5],
  tooltip: (p) => [
    String(p.name),
    p.type && String(p.type),
    p.capacity != null && `Capacity: ${p.capacity}`,
    p.stars && String(p.stars),
  ],
  meta: {
    source: "PA DHS child care providers (data.pa.gov)",
    sourceUrl: "https://data.pa.gov/resource/ajn5-kaxt.json",
    asOf: "Updated daily; pulled Sep 2026",
    geography: "Provider locations",
  },
});

export const PLACE_OVERLAYS = [
  hospitalsOverlay,
  fireStationsOverlay,
  policeStationsOverlay,
  emsStationsOverlay,
  schoolsOverlay,
  childCareOverlay,
];
