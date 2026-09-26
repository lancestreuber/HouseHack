import { DISTRICT_PATHWAYS, LEGAL_MATRIX_AS_OF, PATHWAYS } from "./legal-matrix.generated";
import { matchColor, NO_DATA_COLOR } from "./styles";
import type { OverlayDefinition, OverlayMetric } from "./types";

const TYPOLOGIES: [string, string][] = [
  ["single_detached", "Single-unit detached house"],
  ["single_attached", "Single-unit attached (rowhouse)"],
  ["two_unit", "Two-unit (duplex)"],
  ["three_unit", "Three-unit"],
  ["multi_unit", "Multi-unit apartments (4+)"],
  ["elderly_limited", "Housing for the elderly (limited, <30 units)"],
  ["elderly_general", "Housing for the elderly (general, 30+ units)"],
  ["assisted_living_a", "Assisted living A (<9 beds)"],
  ["assisted_living_b", "Assisted living B (9–17 beds)"],
  ["assisted_living_c", "Assisted living C (18+ beds)"],
  ["personal_care_small", "Personal care residence (small)"],
  ["personal_care_large", "Personal care residence (large)"],
  ["community_home", "Community home"],
  ["multi_suite_limited", "Multi-suite residential (limited)"],
  ["multi_suite_general", "Multi-suite residential (general)"],
  ["interim_housing", "Interim housing"],
];

const PATHWAY_META: Record<string, { color: string; label: string }> = {
  by_right: { color: "#67e8f9", label: "By right (staff review)" },
  za: { color: "#60a5fa", label: "Administrator exception" },
  zbe_special_exception: { color: "#a78bfa", label: "Special exception (Zoning Board hearing)" },
  conditional_use: { color: "#e879f9", label: "Conditional use (Planning Commission + Council)" },
  not_permitted: { color: "#f43f5e", label: "Not permitted (variance or rezoning only)" },
};

const METRICS: OverlayMetric[] = TYPOLOGIES.map(([id, label]) => ({ id, label, property: id }));

// Color each zoning polygon by the pathway its district gives the chosen housing type.
function pathwayFill(typology: string) {
  const byZone: Record<string, string> = {};
  for (const [zone, row] of Object.entries(DISTRICT_PATHWAYS)) {
    const color = PATHWAY_META[row[typology]]?.color;
    if (color) byZone[zone] = color;
  }
  return matchColor("zon_new", byZone, NO_DATA_COLOR);
}

export const legalPathwayOverlay: OverlayDefinition = {
  id: "legal-pathway",
  label: "Legal pathway by housing type",
  group: "heat",
  description: "What approval each City zoning district requires for a chosen housing type (Zoning Code §911.02).",
  source: { kind: "static", url: "/data/pittsburgh-zoning.geojson" },
  metrics: METRICS,
  layers: (sourceId, metric = METRICS[4]) => [
    {
      id: "legal-pathway-fill",
      type: "fill",
      source: sourceId,
      paint: { "fill-color": pathwayFill(metric.id) as never, "fill-opacity": 0.55 },
    },
  ],
  tooltipLayerIds: ["legal-pathway-fill"],
  tooltip: (p, metric = METRICS[4]) => {
    const zone = String(p.zon_new ?? "");
    const row = DISTRICT_PATHWAYS[zone];
    const pathway = row?.[metric.id] ?? "unknown";
    const info = PATHWAYS[pathway];
    return [
      `${metric.label} in ${zone}${row?.full_zoning_type ? ` (${row.full_zoning_type.toLowerCase()})` : ""}`,
      PATHWAY_META[pathway]?.label ?? "Not in the §911.02 use table (special or planned district)",
      info ? `Decided by: ${info.decider}` : "",
      info && info.hearing !== "no" ? `Hearing: ${info.hearing}` : "",
      info && info.clock !== "none" ? `Timeline: ${info.clock}` : "",
      info?.fee ? `Extra fee: $${info.fee}` : "",
      info ? `Code: ${info.section}${info.note ? ` · ${info.note}` : ""}` : "",
    ].filter(Boolean);
  },
  legend: () => [
    ...Object.values(PATHWAY_META).map(({ color, label }) => ({ color, label, shape: "fill" as const })),
    { color: NO_DATA_COLOR, label: "Special / planned district (not in the use table)", shape: "fill" as const },
  ],
  meta: {
    source: "City of Pittsburgh Zoning Code §911.02 use table, transcribed by the research team; zoning from PGHWebZoning",
    sourceUrl: "https://ecode360.com/45476524",
    asOf: `Code as of ${LEGAL_MATRIX_AS_OF}`,
    geography: "City of Pittsburgh zoning district (city only; suburbs have their own codes)",
    evidence: "policy",
    caveats: [
      "Working research, not legal advice.",
      "The use table is not the only gate: dimensional standards, overlays, Site Plan Review at 4+ units and historic review add steps.",
      "Housing for the elderly limited and general have different permissions; pick the one that matches the project size.",
      "Pending Bills 2025-1545 (ADUs, parking) and 2026-0834 (Ch. 922 procedures) would change some cells.",
    ],
  },
};

const SENIOR_TYPES: Record<string, { color: string; label: string }> = {
  hud_202_elderly: { color: "#38bdf8", label: "HUD Section 202 elderly" },
  hud_mf_elderly: { color: "#0ea5e9", label: "HUD-assisted elderly" },
  lihtc_elderly: { color: "#a78bfa", label: "LIHTC elderly" },
  public_housing_senior: { color: "#facc15", label: "HACP senior public housing" },
  nursing: { color: "#f472b6", label: "Nursing home" },
  personal_care: { color: "#fb923c", label: "Personal care home" },
  assisted_living: { color: "#f97316", label: "Assisted living" },
  hud_811: { color: "#4ade80", label: "HUD Section 811 (disability)" },
  lihtc_disabled: { color: "#22c55e", label: "LIHTC disability" },
  hud_mf_disabled: { color: "#16a34a", label: "HUD-assisted disability" },
  hud_202_disabled: { color: "#15803d", label: "HUD 202 disability" },
};

const pathwayLabel = (v: unknown) =>
  String(v ?? "unknown")
    .split("|")
    .map((x) => PATHWAY_META[x]?.label.toLowerCase() ?? "not in the use table")
    .join(" or ");

export const seniorHousingOverlay: OverlayDefinition = {
  id: "senior-supportive-housing",
  label: "Senior & supportive housing (existing)",
  group: "legal",
  description: "Senior, assisted-living, personal-care, nursing and disability housing that exists in the City today.",
  source: { kind: "static", url: "/data/overlays/senior-supportive-housing.geojson" },
  layers: (sourceId) => [
    {
      id: "senior-supportive-housing-dots",
      type: "circle",
      source: sourceId,
      paint: {
        "circle-color": matchColor("type", Object.fromEntries(Object.entries(SENIOR_TYPES).map(([k, v]) => [k, v.color])), "#a3a3a3") as never,
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 3.5, 16, 8] as never,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1,
      },
    },
  ],
  tooltipLayerIds: ["senior-supportive-housing-dots"],
  tooltip: (p) =>
    [
      String(p.name ?? ""),
      String(p.address ?? ""),
      `${SENIOR_TYPES[String(p.type)]?.label ?? String(p.type)}${p.capacity != null ? ` · ${Math.round(Number(p.capacity))} ${String(p.capacity_unit ?? "").replace(/ \(.*\)/, "")}` : ""}`,
      p.zon_new ? `Zoning ${p.zon_new}: as ${String(p.zoning_use_label ?? "this use").toLowerCase()}, ${pathwayLabel(p.permission_pathway)}` : "",
      p.zon_new ? `Apartments in this district: ${pathwayLabel(p.multi_unit_pathway)}` : "",
      p.possible_same_site_as ? "Also listed by another program (same building)" : "",
    ].filter(Boolean),
  legend: () => Object.values(SENIOR_TYPES).map(({ color, label }) => ({ color, label, shape: "dot" as const })),
  meta: {
    source: "PA DHS provider directory, PA DOH / CMS nursing homes, HUD Multifamily, HUD LIHTC, HACP (compiled by the research team)",
    sourceUrl: "https://www.humanservices.dhs.pa.gov/HUMAN_SERVICE_PROVIDER_DIRECTORY/",
    asOf: "Pulled 2026-09-26",
    geography: "Facility locations, City of Pittsburgh only",
    evidence: "observed",
    caveats: [
      "One building can appear under HUD, LIHTC and HACP (124 points ≈ 101 sites); don't add points up.",
      "The zoning use is our inference from size and program, not a City determination.",
      "Many sit where their use isn't permitted today; most likely they predate the current code.",
      "Market-rate senior apartments aren't covered; group homes are left out for privacy.",
    ],
  },
};

const PERMIT_TYPES: Record<string, { color: string; label: string }> = {
  single_detached: { color: "#94a3b8", label: "Single-unit detached" },
  single_attached: { color: "#38bdf8", label: "Single-unit attached (rowhouse)" },
  two_unit: { color: "#a78bfa", label: "Two-unit" },
  three_unit: { color: "#c084fc", label: "Three-unit" },
  multi_unit_4_19: { color: "#f472b6", label: "Apartments, 4–19 units" },
  multi_unit_20plus: { color: "#fb7185", label: "Apartments, 20+ units" },
  multi_unit_size_unknown: { color: "#fda4af", label: "Apartments, size unknown" },
  senior: { color: "#facc15", label: "Senior housing" },
  other_group: { color: "#fb923c", label: "Other group living" },
  adu: { color: "#4ade80", label: "Accessory dwelling unit" },
};

export const permitsByTypeOverlay: OverlayDefinition = {
  id: "permits-by-type",
  label: "Where each housing type got permitted (2019–26)",
  group: "legal",
  description: "New residential construction permits in the City, classified by housing type (unclassified permits hidden).",
  source: { kind: "static", url: "/data/overlays/permits-by-type.geojson" },
  layers: (sourceId) => [
    {
      id: "permits-by-type-dots",
      type: "circle",
      source: sourceId,
      filter: ["!=", ["get", "typology"], "unknown"] as never,
      paint: {
        "circle-color": matchColor("typology", Object.fromEntries(Object.entries(PERMIT_TYPES).map(([k, v]) => [k, v.color])), "#a3a3a3") as never,
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          10,
          ["interpolate", ["linear"], ["sqrt", ["coalesce", ["get", "units"], 1]], 1, 2.5, 10, 7],
          16,
          ["interpolate", ["linear"], ["sqrt", ["coalesce", ["get", "units"], 1]], 1, 5, 10, 14],
        ] as never,
        // Open applications are drawn hollow.
        "circle-opacity": ["case", ["==", ["get", "censored"], true], 0.15, 0.85] as never,
        "circle-stroke-color": ["case", ["==", ["get", "censored"], true], "#ffffff", "#111111"] as never,
        "circle-stroke-width": 1,
      },
    },
  ],
  tooltipLayerIds: ["permits-by-type-dots"],
  tooltip: (p) =>
    [
      `${PERMIT_TYPES[String(p.typology)]?.label ?? String(p.typology)}${p.units ? ` · ${p.units} units` : ""}`,
      String(p.address ?? "").replace(/, Pittsburgh.*$/i, ""),
      p.censored
        ? `Open application${p.days_elapsed_if_open != null ? `, ${p.days_elapsed_if_open} days so far` : ""}`
        : `${p.status ?? "Issued"}${p.issue_date ? ` ${String(p.issue_date).slice(0, 10)}` : ""}${p.days_to_issue != null ? ` · ${p.days_to_issue} days to issue` : ""}`,
      p.zon_new ? `Zoning ${p.zon_new}${p.neighborhood ? ` · ${p.neighborhood}` : ""}` : "",
      p.classification_confidence === "low" ? "Housing type guessed from the permit text (low confidence)" : "",
      Number(p.same_parcel_n) > 1 ? `${p.same_parcel_n} permits on this parcel (one project may have several)` : "",
      p.work_desc ? `“${p.work_desc}”` : "",
    ].filter(Boolean),
  legend: () => [
    ...Object.values(PERMIT_TYPES).map(({ color, label }) => ({ color, label, shape: "dot" as const })),
    { color: "#ffffff", label: "Hollow = application still open", shape: "dot" as const },
  ],
  meta: {
    source: "City of Pittsburgh OneStopPGH permits and Development & Construction Projects (compiled by the research team)",
    sourceUrl: "https://data.wprdc.org/dataset/pli-permits",
    asOf: "Permits May 2019 – Sep 2026, pulled 2026-09-26",
    geography: "Permit locations, City of Pittsburgh only",
    evidence: "observed",
    caveats: [
      "Housing type is classified from permit text by keyword; 129 unclassified permits are hidden.",
      "Zoning is today's district, which may differ from the one at permit time.",
      "One project can have several permits; don't count points as projects.",
      "Dot size = units where known.",
    ],
  },
};
