import { matchColor, RAMPS, stepFill, stepLegend } from "./styles";
import type { OverlayDefinition } from "./types";

const PROGRAM_COLORS: Record<string, string> = {
  lihtc: "#38bdf8",
  public_housing: "#f472b6",
  hud_assisted: "#facc15",
};
const PROGRAM_LABELS: Record<string, string> = {
  lihtc: "LIHTC (tax credit) project",
  public_housing: "Public housing building",
  hud_assisted: "HUD-assisted multifamily (Section 8, 202, 811…)",
};

export const subsidizedHousingOverlay: OverlayDefinition = {
  id: "subsidized-housing",
  label: "Subsidized housing",
  group: "places",
  description: "LIHTC projects, public housing and HUD-assisted properties, sized by units.",
  source: { kind: "static", url: "/data/overlays/subsidized-housing.geojson" },
  layers: (sourceId) => [
    {
      id: "subsidized-housing-dots",
      type: "circle",
      source: sourceId,
      paint: {
        "circle-color": matchColor("program", PROGRAM_COLORS, "#a3a3a3") as never,
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["sqrt", ["coalesce", ["get", "units"], 1]],
          1,
          3,
          10,
          7,
          25,
          14,
        ] as never,
        "circle-opacity": 0.85,
        // Red ring: HUD contract expires within 5 years, or LIHTC affordability period may be ending.
        "circle-stroke-color": [
          "case",
          ["any", ["get", "expires_within_5y"], ["get", "affordability_may_end_soon"]],
          "#ef4444",
          "#000000",
        ] as never,
        "circle-stroke-width": [
          "case",
          ["any", ["get", "expires_within_5y"], ["get", "affordability_may_end_soon"]],
          2,
          0.5,
        ] as never,
      },
    },
  ],
  tooltipLayerIds: ["subsidized-housing-dots"],
  tooltip: (p) =>
    [
      `${p.name ?? "Unnamed property"}`,
      PROGRAM_LABELS[String(p.program)],
      p.authority ? String(p.authority) : "",
      p.units != null ? `${p.units} units${p.affordable_units != null ? ` (${p.affordable_units} affordable/assisted)` : ""}` : "",
      p.bedrooms ? `Bedrooms 0/1/2/3/4: ${p.bedrooms}` : "",
      p.serves ? `Serves: ${p.serves}` : "",
      p.year_placed ? `Placed in service: ${p.year_placed}` : "",
      p.year_built ? `Built: ${p.year_built}` : "",
      p.contract_expires ? `HUD contract expires: ${p.contract_expires}` : "",
      p.expires_within_5y ? "⚠ Contract expires within 5 years" : "",
      p.affordability_may_end_soon ? "⚠ 30-year affordability period may be ending (assumption)" : "",
      p.inspection_score != null ? `Last REAC inspection score: ${p.inspection_score}/100` : "",
    ].filter(Boolean),
  legend: () => [
    ...Object.entries(PROGRAM_COLORS).map(([k, color]) => ({ color, label: PROGRAM_LABELS[k], shape: "dot" as const })),
    { color: "#ef4444", label: "Red ring: affordability may end within ~5 years", shape: "dot" },
  ],
  meta: {
    source: "HUD: LIHTC database, Public Housing Buildings, Multifamily Assisted Properties",
    sourceUrl: "https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services",
    asOf: "LIHTC Dec 2024; public housing and assisted multifamily Jul 2026",
    geography: "Property / building locations, clipped to the county",
    evidence: "observed",
    caveats: [
      "A property can appear in more than one program (e.g. LIHTC + Section 8), so don't sum units across programs.",
      "The LIHTC 'may be ending' flag assumes a 30-year affordability period from the placed-in-service year.",
      "HUD geocodes can be approximate.",
    ],
  },
};

const VOUCHER_BREAKS = [2, 5, 10, 20, 30];

export const housingVouchersOverlay: OverlayDefinition = {
  id: "housing-vouchers",
  label: "Housing voucher use",
  group: "heat",
  description: "Housing Choice Voucher households as a share of renter units, by census tract.",
  source: { kind: "static", url: "/data/overlays/housing-vouchers.geojson" },
  layers: (sourceId) => [
    {
      id: "housing-vouchers-fill",
      type: "fill",
      source: sourceId,
      paint: { "fill-color": stepFill("voucher_pct", VOUCHER_BREAKS, RAMPS.neutral) as never, "fill-opacity": 0.6 },
    },
    {
      id: "housing-vouchers-outline",
      type: "line",
      source: sourceId,
      paint: { "line-color": "#000000", "line-width": 0.4, "line-opacity": 0.5 },
    },
  ],
  tooltipLayerIds: ["housing-vouchers-fill"],
  tooltip: (p) => [
    p.voucher_households == null
      ? "10 or fewer voucher households (HUD withholds small counts)"
      : `Voucher households: ${p.voucher_households}`,
    p.voucher_pct == null ? "" : `${Number(p.voucher_pct).toFixed(1)}% of renter units`,
    `Tract ${p.geoid}`,
  ].filter(Boolean),
  legend: () => [
    ...stepLegend(VOUCHER_BREAKS, RAMPS.neutral, (lo, hi) => (hi ? `${lo}–${hi}%` : `${lo}%+`)).map((item, i) =>
      i === 0 ? { ...item, label: `Under ${VOUCHER_BREAKS[0]}%` } : item,
    ),
    { color: "rgba(120,120,120,0.35)", label: "10 or fewer voucher households (withheld)", shape: "fill" as const },
  ],
  meta: {
    source: "HUD Housing Choice Vouchers by Tract",
    sourceUrl: "https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/Housing_Choice_Vouchers_by_Tract/FeatureServer/0",
    asOf: "Vouchers through Dec 2025",
    geography: "Census tract share (2020 boundaries), not this parcel",
    evidence: "observed",
    caveats: [
      "Where voucher holders live, which reflects landlord acceptance as well as demand.",
      "HUD omits tracts with 10 or fewer voucher holders for privacy (200 of 394 here), so grey means few vouchers, not missing data.",
    ],
  },
};
