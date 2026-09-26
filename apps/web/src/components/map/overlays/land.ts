import { matchColor } from "./styles";
import type { OverlayDefinition } from "./types";

const CITY_ONLY = "City of Pittsburgh only.";

const LAND_COLORS: Record<string, string> = {
  available: "#22c55e",
  transfer: "#14b8a6",
  pending: "#eab308",
  hold: "#94a3b8",
  not_developable: "#475569",
};
const LAND_LABELS: Record<string, string> = {
  available: "Available for sale",
  transfer: "URA / Land Bank transfer",
  pending: "Sale or acquisition pending",
  hold: "Hold for study",
  not_developable: "Park, greenway or permanent city use",
};

export const cityOwnedLandOverlay: OverlayDefinition = {
  id: "city-owned-land",
  label: "City-owned property",
  group: "land",
  description: "City-owned parcels by inventory status (which ones could be acquired).",
  source: { kind: "static", url: "/data/overlays/city-owned-land.geojson" },
  layers: (sourceId) => [
    {
      id: "city-owned-land-dots",
      type: "circle",
      source: sourceId,
      paint: {
        "circle-color": matchColor("class", LAND_COLORS, "#94a3b8") as never,
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 1.5, 16, 5] as never,
        "circle-opacity": ["match", ["get", "class"], "not_developable", 0.4, 0.9] as never,
      },
    },
  ],
  tooltipLayerIds: ["city-owned-land-dots"],
  tooltip: (p) =>
    [
      `City-owned: ${p.status ?? "status unknown"}`,
      p.inventory_type ? `Inventory: ${p.inventory_type}` : "",
      p.address ? String(p.address) : "",
      p.lot_sf ? `Lot: ${Number(p.lot_sf).toLocaleString()} sq ft${p.zoned_as ? ` · zoned ${p.zoned_as}` : ""}` : "",
      `Parcel ${p.pin}`,
    ].filter(Boolean),
  legend: () => Object.entries(LAND_COLORS).map(([k, color]) => ({ color, label: LAND_LABELS[k], shape: "dot" as const })),
  meta: {
    source: "City of Pittsburgh city-owned property (WPRDC, CC-BY)",
    sourceUrl: "https://data.wprdc.org/dataset/city-owned-properties",
    asOf: "Updated daily; pulled Sep 2026",
    geography: "Parcel locations",
    evidence: "observed",
    caveats: [CITY_ONLY, "Available does not mean buildable; check lot size, slope and zoning."],
  },
};

export const treasurySalesOverlay: OverlayDefinition = {
  id: "treasury-sales",
  label: "Upcoming tax sales",
  group: "land",
  description: "Properties scheduled for the City treasurer's tax sale.",
  source: { kind: "static", url: "/data/overlays/treasury-sales.geojson" },
  layers: (sourceId) => [
    {
      id: "treasury-sales-dots",
      type: "circle",
      source: sourceId,
      paint: {
        "circle-color": "#f59e0b",
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 3, 16, 7] as never,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1.5,
      },
    },
  ],
  tooltipLayerIds: ["treasury-sales-dots"],
  tooltip: (p) =>
    [
      `Treasurer sale: ${p.sale_date ?? "date TBD"}`,
      p.address ? String(p.address) : "",
      p.tax_due ? `Taxes due: $${Number(p.tax_due).toLocaleString()}` : "",
      p.demo_cost_due ? `Demolition cost due: $${Number(p.demo_cost_due).toLocaleString()}` : "",
      `Parcel ${p.pin}`,
    ].filter(Boolean),
  legend: () => [{ color: "#f59e0b", label: "Scheduled for treasurer sale", shape: "dot" }],
  meta: {
    source: "City of Pittsburgh treasurer sales (WPRDC; license not specified)",
    sourceUrl: "https://data.wprdc.org/dataset/city-treasury-sales",
    asOf: "Next sale Oct 2, 2026",
    geography: "Property locations",
    evidence: "observed",
    caveats: [CITY_ONLY, "Properties can be withdrawn before the sale."],
  },
};

export const taxDelinquentOverlay: OverlayDefinition = {
  id: "tax-delinquent",
  label: "Long-term tax delinquency",
  group: "land",
  description: "Parcels 3+ years behind on City and school taxes (zoom in to see).",
  source: { kind: "static", url: "/data/overlays/tax-delinquent.geojson" },
  layers: (sourceId) => [
    {
      id: "tax-delinquent-dots",
      type: "circle",
      source: sourceId,
      // Parcel-level distress signal: only drawn at street zoom.
      minzoom: 14,
      paint: {
        "circle-color": "#fb7185",
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 14, 2.5, 18, 5] as never,
        "circle-opacity": 0.8,
      },
    },
  ],
  tooltipLayerIds: ["tax-delinquent-dots"],
  tooltip: (p) =>
    [
      `${p.years_delinquent}+ years of delinquent City/school taxes`,
      p.land_use ? `Land use: ${p.land_use}` : "",
      `Parcel ${p.pin}`,
    ].filter(Boolean),
  legend: () => [{ color: "#fb7185", label: "3+ years delinquent (possible acquisition or intervention signal)", shape: "dot" }],
  meta: {
    source: "City of Pittsburgh and school district property tax delinquency (WPRDC, CC-BY)",
    sourceUrl: "https://data.wprdc.org/dataset/city-of-pittsburgh-property-tax-delinquency",
    asOf: "Pulled Sep 2026",
    geography: "Parcel locations, shown from zoom 14",
    evidence: "observed",
    caveats: [
      CITY_ONLY,
      "These are real households; no owner information is shown.",
      "The 3-year threshold is an assumption, not an official definition.",
    ],
  },
};
