import type { OverlayDefinition } from "./types";

// Local zoning codes aren't comparable across municipalities, so suburban zoning is
// drawn as neutral outlines with the municipality's own code in the tooltip.
export const suburbanZoningOverlay: OverlayDefinition = {
  id: "suburban-zoning",
  label: "Suburban zoning (9 municipalities)",
  group: "policy",
  drawBelowOutlines: true,
  description: "Zoning districts from municipalities that publish zoning GIS (codes are local).",
  source: { kind: "static", url: "/data/overlays/suburban-zoning.geojson" },
  layers: (sourceId) => [
    {
      id: "suburban-zoning-fill",
      type: "fill",
      source: sourceId,
      paint: { "fill-color": "#c084fc", "fill-opacity": 0.08 },
    },
    {
      id: "suburban-zoning-outline",
      type: "line",
      source: sourceId,
      paint: { "line-color": "#c084fc", "line-width": 0.8, "line-opacity": 0.7 },
    },
  ],
  tooltipLayerIds: ["suburban-zoning-fill"],
  tooltip: (p) =>
    [`${p.muni} zoning: ${p.zone_code ?? "unknown"}`, p.zone_desc ? String(p.zone_desc) : "", "Local code; check the municipal ordinance"].filter(
      Boolean,
    ),
  legend: () => [{ color: "#c084fc", label: "Municipal zoning district (local codes)", shape: "line" }],
  meta: {
    source: "Municipal GIS: Penn Hills, Bethel Park, Monroeville, Mt. Lebanon, Whitehall, Upper St. Clair, Dormont, Moon, McCandless",
    sourceUrl: "https://services8.arcgis.com/4sXEsxQJTWBlSKA1/arcgis/rest/services/BasemapFeatureService_ReadOnl/FeatureServer/9",
    asOf: "Pulled Sep 2026",
    geography: "Zoning districts (Dormont is parcel-level)",
    evidence: "observed",
    caveats: [
      "Shown only where municipalities publish zoning GIS; there is no county-wide zoning layer.",
      "District codes are each municipality's own and are not comparable to the City's.",
    ],
  },
};

const KIND_COLORS: Record<string, string> = {
  inclusionary: "#f43f5e",
  multi_unit: "#22c55e",
  parking_reduction: "#38bdf8",
  transit_buffer: "#0ea5e9",
  historic: "#d97706",
};
const KIND_LABELS: Record<string, string> = {
  inclusionary: "Inclusionary zoning (affordable units required)",
  multi_unit: "Zoning district permits multi-unit housing",
  parking_reduction: "Parking reduction overlay",
  transit_buffer: "Major transit buffer (parking reduction)",
  historic: "City historic district (design review)",
};
const kindColor = ["match", ["get", "kind"], ...Object.entries(KIND_COLORS).flat(), "#a3a3a3"];

export const cityZoningOverlaysOverlay: OverlayDefinition = {
  id: "city-zoning-overlays",
  label: "City zoning overlays & historic districts",
  group: "policy",
  drawBelowOutlines: true,
  description: "Inclusionary zoning, multi-unit districts, parking reductions and historic districts (City of Pittsburgh).",
  source: { kind: "static", url: "/data/overlays/city-zoning-overlays.geojson" },
  layers: (sourceId) => [
    {
      id: "city-zoning-overlays-fill",
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": kindColor as never,
        "fill-opacity": ["match", ["get", "kind"], "multi_unit", 0.12, 0.18] as never,
      },
    },
    {
      id: "city-zoning-overlays-outline",
      type: "line",
      source: sourceId,
      paint: { "line-color": kindColor as never, "line-width": 1.2, "line-dasharray": [2, 1] },
    },
  ],
  tooltipLayerIds: ["city-zoning-overlays-fill"],
  tooltip: (p) => [KIND_LABELS[String(p.kind)] ?? String(p.label), p.kind === "historic" ? String(p.label) : ""].filter(Boolean),
  legend: () => Object.entries(KIND_COLORS).map(([k, color]) => ({ color, label: KIND_LABELS[k], shape: "dashed-line" as const })),
  meta: {
    source: "City of Pittsburgh zoning overlays and historic districts (City ArcGIS)",
    sourceUrl: "https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services",
    asOf: "Pulled Sep 2026",
    geography: "Overlay districts",
    evidence: "policy",
    caveats: [
      "City of Pittsburgh only.",
      "Pending zoning bills (e.g. 2025-1545, 2026-0834) may change these; check current code.",
    ],
  },
};

export const rcoOverlay: OverlayDefinition = {
  id: "rcos",
  label: "Community organizations (RCOs)",
  group: "policy",
  description: "Registered Community Organizations that review development proposals (City of Pittsburgh).",
  source: { kind: "static", url: "/data/overlays/rcos.geojson" },
  layers: (sourceId) => [
    {
      id: "rcos-fill",
      type: "fill",
      source: sourceId,
      paint: { "fill-color": "#fde68a", "fill-opacity": 0.05 },
    },
    {
      id: "rcos-outline",
      type: "line",
      source: sourceId,
      paint: { "line-color": "#fde68a", "line-width": 1.5, "line-opacity": 0.8 },
    },
  ],
  tooltipLayerIds: ["rcos-fill"],
  tooltip: (p) =>
    [
      `Development here is reviewed with: ${p.name}`,
      p.meetings ? `Meets: ${p.meetings}` : "",
      p.website ? String(p.website) : "",
      p.expires ? `RCO registration through ${p.expires}` : "",
    ].filter(Boolean),
  legend: () => [{ color: "#fde68a", label: "Registered Community Organization area", shape: "line" }],
  meta: {
    source: "City of Pittsburgh Registered Community Organizations (City ArcGIS)",
    sourceUrl: "https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services/PGHWebRCO/FeatureServer/0",
    asOf: "Edited Aug 2026",
    geography: "RCO service areas (they can overlap)",
    evidence: "observed",
    caveats: ["Contact names, emails and phone numbers are intentionally not shown; use the organization's website."],
  },
};
