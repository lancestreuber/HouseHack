import { CELL_NOTES, DISTRICT_PATHWAYS, LEGAL_MATRIX_AS_OF, PATHWAYS, ZBA_OUTCOMES } from "./legal-matrix.generated";
import { matchColor, NO_DATA_COLOR } from "./styles";
import type { OverlayDefinition, OverlayMetric } from "./types";

export const TYPOLOGIES: [string, string][] = [
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

// Ranked pathways run cyan (easiest) to red (hardest). The non-ranked states sit
// off that ramp: planned-unit districts purple, Mount Oliver light grey.
export const PATHWAY_META: Record<string, { color: string; label: string }> = {
  by_right: { color: "#22d3ee", label: "By right" },
  za: { color: "#60a5fa", label: "Administrator exception" },
  zbe_special_exception: { color: "#fbbf24", label: "Special exception (Zoning Board hearing)" },
  conditional_use: { color: "#fb923c", label: "Conditional use (Planning Commission + Council)" },
  not_permitted: { color: "#f43f5e", label: "Not permitted (variance or rezoning only)" },
  per_plan: { color: "#a855f7", label: "Set by the site's approved plan (planned-unit district)" },
  not_city_jurisdiction: { color: "#e4e4e7", label: "Mount Oliver Borough (not City zoning)" },
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

// What happens if the City misses its decision deadline. Where the research
// found City code and state law disagree, say so rather than pick one.
function missedDeadlineLine(value: string | undefined) {
  if (!value || value === "n/a" || value === "unknown") return "";
  if (/conflict/i.test(value)) return "Missed deadline: City code says deemed denial; conflicts with state law (unresolved)";
  return `Missed deadline: ${value}`;
}

// ZBA outcomes are keyed by base district: "R1D-L" -> "R1D", "UC-MU" -> "UC".
const zbaBase = (zone: string) => (zone === "R-MU" ? zone : zone.split("-")[0]);
// These bases pool subdistricts with different rules (e.g. RIV-GI bars housing,
// RIV-MU allows apartments), so their counts would mislead. GT subdistricts
// share rules, so GT is shown but labeled as pooled.
const ZBA_POOLED_SKIP = new Set(["UC", "RIV", "SP"]);
const ZBA_POOLED_LABEL: Record<string, string> = { GT: "Golden Triangle (GT-A…E) pooled" };

export function zbaLine(zone: string, typology: string) {
  const base = zbaBase(zone);
  if (ZBA_POOLED_SKIP.has(base)) return "";
  const byType = ZBA_OUTCOMES[base];
  const typed = byType?.[typology];
  const all = byType?.ALL;
  const fmt = (o: { n: number; approved: number }) => `${o.approved} of ${o.n} approved`;
  // Counts cover any relief (setbacks, parking, use), not only permission for the use itself.
  const where = ZBA_POOLED_LABEL[base] ?? base;
  if (typed) return `Zoning Board cases 2023–26 for this type in ${where} (any relief sought): ${fmt(typed)}`;
  if (all) return `Zoning Board cases 2023–26, all types in ${where} (any relief sought): ${fmt(all)}`;
  return "";
}

// Unconfirmed readings and Mount Oliver are drawn fainter.
function pathwayOpacity(typology: string) {
  const faint: Record<string, string> = {};
  for (const [zone, row] of Object.entries(DISTRICT_PATHWAYS)) {
    if (CELL_NOTES[zone]?.[typology]?.unconfirmed || row[typology] === "not_city_jurisdiction") faint[zone] = "faint";
  }
  const zones = Object.keys(faint);
  return zones.length ? ["match", ["get", "zon_new"], zones, 0.25, 0.55] : 0.55;
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
      paint: { "fill-color": pathwayFill(metric.id) as never, "fill-opacity": pathwayOpacity(metric.id) as never },
    },
    {
      id: "legal-pathway-plan-outline",
      type: "line",
      source: sourceId,
      filter: ["in", ["get", "zon_new"], ["literal", ["AP", "CP", "RP"]]] as never,
      paint: { "line-color": PATHWAY_META.per_plan.color, "line-width": 1.5, "line-dasharray": [3, 2] },
    },
  ],
  tooltipLayerIds: ["legal-pathway-fill"],
  tooltip: (p, metric = METRICS[4]) => {
    const zone = String(p.zon_new ?? "");
    const row = DISTRICT_PATHWAYS[zone];
    const pathway = row?.[metric.id] ?? "unknown";
    const info = PATHWAYS[pathway];
    const cell = CELL_NOTES[zone]?.[metric.id];
    return [
      `${metric.label} in ${zone}${row?.full_zoning_type ? ` (${row.full_zoning_type.toLowerCase()})` : ""}`,
      PATHWAY_META[pathway]?.label ?? "Unresolved: the code doesn't clearly say",
      info?.decider ? `Decided by: ${info.decider}` : "",
      info?.hearing && info.hearing !== "no" ? `Hearing: ${info.hearing}` : "",
      info?.clock && info.clock !== "none" ? `Timeline: ${info.clock.replace(/ before deemed denial$/, "")}` : "",
      missedDeadlineLine(info?.missedDeadline),
      info?.fee ? `Extra fee: $${info.fee}` : "",
      info?.section ? `Code: ${info.section}` : "",
      // Unranked rows (per plan, Mount Oliver, unknown) carry notes meant for
      // the data team; the per-cell note below explains those districts.
      info?.note && info.rank != null ? `Note: ${info.note.replace(/\s*\([\w-]+\.csv\)/g, "")}` : "",
      zbaLine(zone, metric.id),
      cell?.unconfirmed ? `⚠ ${cell.basis ?? "Unconfirmed reading of the code"}` : "",
      cell ? cell.note : "",
    ].filter(Boolean);
  },
  legend: () => [
    ...Object.values(PATHWAY_META).map(({ color, label }) => ({ color, label, shape: "fill" as const })),
    { color: NO_DATA_COLOR, label: "Unresolved in the code", shape: "fill" as const },
  ],
  meta: {
    source: "City of Pittsburgh Zoning Code §911.02 use table, transcribed by the research team; zoning from PGHWebZoning",
    sourceUrl: "https://ecode360.com/45476524",
    asOf: `Code as of ${LEGAL_MATRIX_AS_OF}`,
    geography: "City of Pittsburgh zoning district (city only; suburbs have their own codes)",
    evidence: "policy",
    caveats: [
      "Working research, not legal advice.",
      "Zoning Board counts cover posted decisions only (withdrawn cases have none), so approval rates skew high.",
      "Faint districts are unconfirmed readings or inferred from a district's adopted use list; the tooltip explains why.",
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
    .map((x) => PATHWAY_META[x]?.label.toLowerCase() ?? "unresolved in the code")
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

const COUNCIL_STATUS: Record<string, { color: string; label: string }> = {
  adopted: { color: "#4ade80", label: "Adopted" },
  pending: { color: "#facc15", label: "Pending / held" },
  held: { color: "#facc15", label: "Pending / held" },
  failed: { color: "#f43f5e", label: "Failed or withdrawn" },
  withdrawn: { color: "#f43f5e", label: "Failed or withdrawn" },
};
const COUNCIL_CATEGORY: Record<string, string> = {
  map_amendment: "Rezoning (map amendment)",
  conditional_use: "Conditional use",
  sp_pud: "Specially planned / PUD",
};
const RELEVANCE: Record<string, string> = {
  enables_more_housing_byright: "Allows more housing by right",
  reduces_housing_byright: "Allows less housing by right",
  area_wide_remap_mixed: "Area-wide remap (mixed effects)",
  no_change_in_residential_ceiling: "No change in housing allowed by right",
  mixed_up_and_down: "Mixed: up in places, down in others",
  tdr_dwelling_units: "Transfer of development rights (dwelling units)",
  residential_use: "Residential use",
  group_quarters_use: "Group living use",
};

export const councilActionsOverlay: OverlayDefinition = {
  id: "council-land-use-actions",
  label: "City Council land-use votes (2000–26)",
  group: "legal",
  description: "Rezonings, conditional uses and planned-district actions from Legistar, colored by outcome (non-residential hidden).",
  source: { kind: "static", url: "/data/overlays/council-land-use-actions.geojson" },
  layers: (sourceId) => [
    {
      id: "council-land-use-actions-dots",
      type: "circle",
      source: sourceId,
      filter: ["!=", ["get", "residential_relevance"], "non_residential"] as never,
      paint: {
        "circle-color": matchColor("status", Object.fromEntries(Object.entries(COUNCIL_STATUS).map(([k, v]) => [k, v.color])), "#a3a3a3") as never,
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 4, 16, 9] as never,
        // Rezonings get a white ring, conditional uses a dark one.
        "circle-stroke-color": ["match", ["get", "action_category"], "conditional_use", "#111111", "sp_pud", "#a855f7", "#ffffff"] as never,
        "circle-stroke-width": 2,
      },
    },
  ],
  tooltipLayerIds: ["council-land-use-actions-dots"],
  tooltip: (p) =>
    [
      `${COUNCIL_CATEGORY[String(p.action_category)] ?? String(p.action_category)} · ${String(p.status ?? "").replace(/_/g, " ")}${p.final_action_date ? ` ${p.final_action_date}` : ""}`,
      p.from_districts || p.to_districts ? `${p.from_districts ?? "?"} → ${p.to_districts ?? "?"}` : p.cu_district_zoned ? `In ${p.cu_district_zoned}` : "",
      RELEVANCE[String(p.residential_relevance)] ?? "",
      p.housing_typology ? `Housing: ${String(p.housing_typology).replace(/_/g, " ")}${p.units_stated ? ` · ${p.units_stated} units` : ""}` : "",
      p.days_intro_to_final != null ? `${p.days_intro_to_final} days from introduction to final action` : "",
      p.votes_aye != null ? `Vote: ${p.votes_aye}–${p.votes_nay ?? 0}` : "",
      p.passed_pursuant_to_case_law ? "Passed “pursuant to case law” (likely a missed Council deadline; unverified)" : "",
      p.title ? String(p.title) : "",
      `Legistar file ${p.file_number}`,
    ].filter(Boolean),
  legend: () => [
    { color: "#4ade80", label: "Adopted", shape: "dot" },
    { color: "#facc15", label: "Pending / held", shape: "dot" },
    { color: "#f43f5e", label: "Failed or withdrawn", shape: "dot" },
    { color: "#a3a3a3", label: "Expired, tabled or filed", shape: "dot" },
    { color: "#ffffff", label: "White ring = rezoning; dark ring = conditional use", shape: "line" },
  ],
  meta: {
    source: "City of Pittsburgh Legistar (City Council), compiled and geocoded by the research team",
    sourceUrl: "https://pittsburgh.legistar.com/",
    asOf: "2000 – Sep 2026, pulled 2026-09-26",
    geography: "Action locations, City of Pittsburgh",
    evidence: "observed",
    caveats: [
      "101 of 284 matters had no mappable address and aren't shown.",
      "Area-wide remaps are shown as a single point.",
      "Whether a change adds or removes housing is our coding of the district change, not the City's.",
      "Non-residential actions are hidden.",
    ],
  },
};

const ZBA_OUTCOME_COLORS: Record<string, { color: string; label: string }> = {
  approved: { color: "#4ade80", label: "Approved (incl. with conditions)" },
  denied: { color: "#f43f5e", label: "Denied" },
  split: { color: "#fbbf24", label: "Split decision" },
};
const RELIEF_LABELS: Record<string, string> = {
  dimensional_variance: "dimensional variance",
  use_variance: "use variance",
  special_exception: "special exception",
  nonconforming_review: "nonconforming-use review",
  aapp_parking: "parking exception",
};

// One layer per scope, so housing cases show by default and the rest can be
// switched on separately.
function zbaOverlay(housing: boolean): OverlayDefinition {
  const id = housing ? "zba-decisions-housing" : "zba-decisions-other";
  return {
    id,
    label: housing ? "Zoning Board decisions: housing (2023–26)" : "Zoning Board decisions: other (2023–26)",
    group: "legal",
    description: housing
      ? "Zoning Board of Adjustment decisions on residential cases, colored by outcome."
      : "Zoning Board of Adjustment decisions on non-residential cases, colored by outcome.",
    source: { kind: "static", url: "/data/overlays/zba-decisions.geojson" },
    layers: (sourceId) => [
      {
        id: `${id}-dots`,
        type: "circle",
        source: sourceId,
        filter: ["==", ["get", "is_housing"], housing] as never,
        paint: {
          "circle-color": matchColor(
            "outcome_group",
            Object.fromEntries(Object.entries(ZBA_OUTCOME_COLORS).map(([k, v]) => [k, v.color])),
            "#a3a3a3",
          ) as never,
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 3.5, 16, 8] as never,
          // Cases that change the number of homes get a white ring.
          "circle-stroke-color": ["case", ["==", ["get", "housing_scope"], "housing_units"], "#ffffff", "#111111"] as never,
          "circle-stroke-width": 1.5,
        },
      },
    ],
    tooltipLayerIds: [`${id}-dots`],
    tooltip: (p) =>
      [
        `${String(p.outcome ?? p.outcome_group ?? "")}${p.decision_date ? ` · ${p.decision_date}` : ""}`,
        String(p.address ?? ""),
        p.request ? `“${p.request}”` : "",
        p.units_before != null || p.units_after != null ? `Units: ${p.units_before ?? "?"} → ${p.units_after ?? "?"}` : "",
        p.relief_type
          ? `Relief: ${String(p.relief_type).split("|").map((r) => RELIEF_LABELS[r] ?? r.replace(/_/g, " ")).join(", ")}`
          : "",
        p.zon_new ? `Zoning ${p.zon_new}${p.neighborhood ? ` · ${p.neighborhood}` : ""}` : "",
        p.days_hearing_to_decision != null ? `${p.days_hearing_to_decision} days from hearing to decision` : "",
        `ZBA case ${p.zone_case}`,
      ].filter(Boolean),
    legend: () => [
      ...Object.values(ZBA_OUTCOME_COLORS).map(({ color, label }) => ({ color, label, shape: "dot" as const })),
      { color: "#a3a3a3", label: "Appeal or no relief needed", shape: "dot" as const },
      ...(housing ? [{ color: "#ffffff", label: "White ring = changes the number of homes", shape: "line" as const }] : []),
    ],
    meta: {
      source: "City of Pittsburgh ZBA decisions (pittsburghpa.gov and Internet Archive), coded by HouseHack 2026-09-26",
      sourceUrl: "https://www.pittsburghpa.gov/Business-Development/City-Planning/City-Planning-Meetings/ZBA-Agendas",
      asOf: "Decisions 2023 – Aug 2026, pulled 2026-09-26",
      geography: "Case addresses, City of Pittsburgh",
      evidence: "observed",
      caveats: [
        "Covers roughly 61–73% of each year's case numbers; withdrawn cases never get a posted decision, so approval looks higher than it is.",
        "Zoning is the district named in each decision; some name several.",
        "Each case's decision PDF is in the data (decision_pdf); popups can't hold links.",
        "Outcomes were read from the decision text (some scanned and OCR'd).",
      ],
    },
  };
}

export const zbaHousingOverlay = zbaOverlay(true);
export const zbaOtherOverlay = zbaOverlay(false);

export const careSpacingOverlay: OverlayDefinition = {
  id: "care-facility-spacing",
  label: "800 ft care-facility spacing (partial)",
  group: "legal",
  drawBelowOutlines: true,
  description: "New assisted living or personal care residences must be at least 800 ft from these licensed care facilities.",
  source: { kind: "static", url: "/data/overlays/care-facility-spacing.geojson" },
  layers: (sourceId) => [
    {
      id: "care-facility-spacing-fill",
      type: "fill",
      source: sourceId,
      paint: { "fill-color": "#f472b6", "fill-opacity": 0.1 },
    },
    {
      id: "care-facility-spacing-outline",
      type: "line",
      source: sourceId,
      paint: { "line-color": "#f472b6", "line-width": 1.5, "line-dasharray": [3, 2] },
    },
  ],
  tooltipLayerIds: ["care-facility-spacing-fill"],
  tooltip: (p) =>
    [
      `Within ${p.radius_ft ?? 800} ft of ${String(p.facility_name ?? "a licensed care facility")}`,
      p.counts_as ? `Counts as: ${p.counts_as}` : "",
      "A new assisted living or personal care residence can't locate here (§911.04.A.66, .95A/B)",
    ].filter(Boolean),
  legend: () => [{ color: "#f472b6", label: "800 ft around a licensed care facility", shape: "dashed-line" }],
  meta: {
    source: "Research team, from PA DHS licensed personal care / assisted living and CMS nursing homes; rule from Zoning Code §911.04",
    sourceUrl: "https://ecode360.com/45476524",
    asOf: "Facilities as of 2026-09-26",
    geography: "800 ft circles, City of Pittsburgh",
    evidence: "policy",
    caveats: [
      "Partial: only licensed facilities are drawn; unlicensed group homes also count under the rule but aren't mapped (privacy).",
      "A parcel-level gate the district map can't show.",
    ],
  },
};

// Density tiers for the plain "what does zoning allow here" choropleth,
// distinct from the per-typology Legal pathway overlay above: this colors
// every district by its own residential density tier (or red if it excludes
// housing entirely), regardless of which typology you're asking about.
const DENSITY_TIER_COLORS: Record<string, string> = {
  R1D: "#4ade80",
  R1A: "#38bdf8",
  R2: "#818cf8",
  R3: "#a78bfa",
  RM: "#e879f9",
};
const NON_RESIDENTIAL_ZONING_COLOR = "#ef4444";
const OTHER_ZONING_COLOR = "#71717a";

export const residentialZoningOverlay: OverlayDefinition = {
  id: "residential-zoning",
  label: "Zoning: residential density allowed",
  group: "heat",
  description:
    "City zoning districts colored by residential density tier (single-unit detached through multi-unit); red where housing is excluded entirely.",
  source: { kind: "static", url: "/data/pittsburgh-zoning.geojson" },
  layers: (sourceId) => [
    {
      id: "residential-zoning-fill",
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": [
          "case",
          ["==", ["get", "non_housing"], true],
          NON_RESIDENTIAL_ZONING_COLOR,
          matchColor("zoning_base", DENSITY_TIER_COLORS, OTHER_ZONING_COLOR),
        ] as never,
        "fill-opacity": 0.45,
      },
    },
    {
      id: "residential-zoning-outline",
      type: "line",
      source: sourceId,
      paint: { "line-color": "#111111", "line-width": 0.5, "line-opacity": 0.4 },
    },
  ],
  tooltipLayerIds: ["residential-zoning-fill"],
  tooltip: (p) =>
    [
      `${p.zon_new ?? "Unknown"}${p.full_zoning_type ? ` (${String(p.full_zoning_type).toLowerCase()})` : ""}`,
      p.non_housing ? "Excludes housing entirely" : "",
    ].filter(Boolean),
  legend: () => [
    { color: DENSITY_TIER_COLORS.R1D!, label: "Single-unit detached (R1D)", shape: "fill" },
    { color: DENSITY_TIER_COLORS.R1A!, label: "Single-unit attached (R1A)", shape: "fill" },
    { color: DENSITY_TIER_COLORS.R2!, label: "Two-unit (R2)", shape: "fill" },
    { color: DENSITY_TIER_COLORS.R3!, label: "Three-unit (R3)", shape: "fill" },
    { color: DENSITY_TIER_COLORS.RM!, label: "Multi-unit (RM)", shape: "fill" },
    { color: NON_RESIDENTIAL_ZONING_COLOR, label: "Excludes housing", shape: "fill" },
    { color: OTHER_ZONING_COLOR, label: "Other (commercial, mixed-use, planned)", shape: "fill" },
  ],
  meta: {
    source: "PGHWebZoning (City of Pittsburgh), transcribed by the research team",
    sourceUrl: "https://ecode360.com/45476524",
    asOf: LEGAL_MATRIX_AS_OF,
    geography: "City zoning district (city only; Mount Oliver Borough uses its own code)",
    evidence: "policy",
    caveats: [
      "Colored by the base district's typical density tier only; the actual permitted-use table has exceptions per typology -- see the Legal pathway overlay for exact rules.",
      "Working research, not legal advice.",
    ],
  },
};
