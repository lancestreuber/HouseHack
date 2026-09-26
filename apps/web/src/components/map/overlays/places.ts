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
  tooltip: (p) => [
    String(p.name),
    String(p.address ?? ""),
    p.kind === "specialty" && "Specialty hospital",
    p.emergency === true && "Emergency department",
    p.cms_rated != null && `CMS overall rating: ${p.cms_rating != null ? `${p.cms_rating} of 5 stars` : "not available"}`,
  ],
  meta: {
    source: "PA Department of Health licensed hospitals (PASDA)",
    sourceUrl: "https://mapservices.pasda.psu.edu/server/rest/services/pasda/DepHealth/MapServer/6",
    asOf: "DOH Hospitals, Nov 2025",
    geography: "Facility locations, Allegheny County",
    caveats: [
      "Specialty is inferred from the name.",
      "Emergency department and star rating come from CMS Care Compare (Jul 2026), matched by address; specialty hospitals are not rated.",
      "The CMS star rating is a composite of reported measures, not a full quality judgment.",
    ],
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

// Everyday amenities from the Allegheny County Assets registry (WPRDC).
const ASSETS_META = {
  source: "Allegheny County Assets (WPRDC, CC0)",
  sourceUrl: "https://data.wprdc.org/dataset/allegheny-county-assets",
  asOf: "Registry updated Sep 2026; many underlying sources date from 2017–2020",
  geography: "Listed locations",
  caveats: ["Listed, not verified open today."],
};

const assetOverlay = (id: string, label: string, file: string, color: string, extraCaveats: string[] = []) =>
  pointOverlay({
    id,
    label,
    description: `${label} (Allegheny County Assets).`,
    file,
    color,
    radius: [2.5, 6],
    tooltip: (p) => [String(p.name), p.address && String(p.address), p.hours && `Hours: ${p.hours}`],
    meta: { ...ASSETS_META, caveats: [...ASSETS_META.caveats, ...extraCaveats] },
  });

const SNAP_LINE = (p: Record<string, unknown>) =>
  p.snap ? "Accepts SNAP (USDA-authorized)" : "Not matched to a SNAP-authorized store";
const FOOD_META = {
  source: "USDA FNS SNAP authorized retailers merged with ACHD food permits (deduplicated)",
  sourceUrl: "https://services1.arcgis.com/RLQu0rK7h4kbsBq5/arcgis/rest/services/snap_retailer_location_data/FeatureServer/0",
  asOf: "SNAP list Sep 2026; ACHD permits as of 2025",
  geography: "Store locations",
};

export const groceriesOverlay = pointOverlay({
  id: "places-groceries",
  label: "Grocery stores",
  description: "Full-service grocery stores and specialty food stores (SNAP retailer list merged with county food permits).",
  file: "places-groceries.geojson",
  color: {
    property: "tier",
    colors: { full_grocery: "#84cc16", specialty_food: "#facc15" },
    labels: { full_grocery: "Full-service grocery", specialty_food: "Specialty food store (bakery, butcher, ethnic market…)" },
  },
  radius: [3, 7],
  tooltip: (p) => [String(p.name), p.address && String(p.address), p.snap_type && `USDA store type: ${p.snap_type}`, SNAP_LINE(p)],
  meta: {
    ...FOOD_META,
    caveats: [
      "Store tier comes from USDA and county permit categories, not a store audit.",
      "Permits can lag closures.",
    ],
  },
});

export const foodOtherOverlay = pointOverlay({
  id: "places-food-other",
  label: "Other food retail",
  description: "Farmers markets, dollar and packaged-food stores, and convenience stores.",
  file: "places-food-other.geojson",
  color: {
    property: "tier",
    colors: { farmers_market: "#22c55e", other_food_retail: "#a8a29e", convenience_limited: "#78716c" },
    labels: {
      farmers_market: "Farmers market or seasonal stand",
      other_food_retail: "Dollar / packaged-food store",
      convenience_limited: "Convenience store (limited food)",
    },
  },
  radius: [2, 5],
  tooltip: (p) => [String(p.name), p.address && String(p.address), p.permit_category && `Permit: ${p.permit_category}`, SNAP_LINE(p)],
  meta: { ...FOOD_META, caveats: ["Tier comes from USDA and county permit categories, not a store audit."] },
});

export const pharmaciesOverlay = pointOverlay({
  id: "places-pharmacies",
  label: "Pharmacies",
  description: "Pharmacies registered with CMS (NPPES), Rite Aid excluded (closed 2025).",
  file: "places-pharmacies.geojson",
  color: {
    property: "kind",
    colors: { retail: "#14b8a6", other_pharmacy: "#5eead4", clinic_or_institutional: "#0f766e" },
    labels: {
      retail: "Retail pharmacy",
      other_pharmacy: "Specialty, long-term-care or mail-order",
      clinic_or_institutional: "Clinic or hospital pharmacy",
    },
  },
  radius: [2.5, 6],
  tooltip: (p) => [String(p.name), p.address && String(p.address)],
  meta: {
    source: "CMS NPPES NPI Registry (pharmacy organizations)",
    sourceUrl: "https://npiregistry.cms.hhs.gov/",
    asOf: "Registry pulled Sep 2026",
    geography: "Pharmacy locations (geocoded addresses)",
    caveats: [
      "NPPES doesn't record closures, so a few listed pharmacies may be gone.",
      "Rite Aid (84 county NPIs) is excluded: the chain closed all stores by Sep 2025.",
    ],
  },
});

export const banksOverlay = pointOverlay({
  id: "places-banks",
  label: "Bank branches",
  description: "FDIC-insured bank branches.",
  file: "places-banks.geojson",
  color: "#64748b",
  radius: [2.5, 6],
  tooltip: (p) => [String(p.name), p.branch && String(p.branch), p.address && String(p.address)],
  meta: {
    source: "FDIC BankFind branch locations",
    sourceUrl: "https://api.fdic.gov/banks/locations",
    asOf: "FDIC index Sep 2026",
    geography: "Branch locations",
    caveats: ["Credit unions (NCUA) aren't included."],
  },
});

export const healthCentersOverlay = pointOverlay({
  id: "places-health-centers",
  label: "Community health centers",
  description: "HRSA-funded health center sites: primary care on a sliding fee scale, regardless of insurance.",
  file: "places-health-centers.geojson",
  color: "#f43f5e",
  radius: [3, 7],
  tooltip: (p) => [String(p.name), p.organization && String(p.organization), p.address && String(p.address), p.mobile && "Mobile van site"],
  meta: {
    source: "HRSA health center service delivery sites",
    sourceUrl: "https://data.hrsa.gov/data/download",
    asOf: "HRSA daily file, Sep 2026",
    geography: "Service site locations",
    caveats: ["Administrative-only sites are excluded; 3 sites are mobile vans."],
  },
});

export const clinicsOverlay = pointOverlay({
  id: "places-clinics",
  label: "Urgent care & other clinics",
  description: "Urgent care and primary-care clinics registered with CMS (NPPES).",
  file: "places-clinics.geojson",
  color: {
    property: "kind",
    colors: { urgent_care: "#fb7185", primary_care_clinic: "#fda4af", community_health_clinic: "#e11d48", fqhc_clinic: "#be123c" },
    labels: {
      urgent_care: "Urgent care",
      primary_care_clinic: "Primary-care clinic",
      community_health_clinic: "Community health clinic",
      fqhc_clinic: "Health-center clinic (not in HRSA site list)",
    },
  },
  radius: [2.5, 6],
  tooltip: (p) => [String(p.name), p.address && String(p.address)],
  meta: {
    source: "CMS NPPES NPI Registry (clinic taxonomies)",
    sourceUrl: "https://npiregistry.cms.hhs.gov/",
    asOf: "Registry pulled Sep 2026",
    geography: "Clinic locations (geocoded addresses)",
    caveats: ["Health-center clinics within ~100 m of an HRSA site are dropped as duplicates.", "NPPES doesn't record closures."],
  },
});

const OSM_MERGE_META = {
  source: "OpenStreetMap contributors (ODbL) merged with Allegheny County Assets (WPRDC)",
  sourceUrl: "https://www.openstreetmap.org/copyright",
  asOf: "OSM pulled Sep 2026; Assets entries date from 2017–2020",
  geography: "Listed locations",
};

const osmOverlay = (id: string, label: string, description: string, file: string, color: string, caveats: string[]) =>
  pointOverlay({
    id,
    label,
    description,
    file,
    color,
    radius: [2.5, 6],
    tooltip: (p) => [String(p.name), p.address && String(p.address)],
    meta: { ...OSM_MERGE_META, caveats: ["Listed, not verified open today.", ...caveats] },
  });

export const foodAssistanceOverlay = pointOverlay({
  id: "places-food-banks",
  label: "Food pantries & distributions",
  description: "Greater Pittsburgh Community Food Bank partner pantries, markets and distributions.",
  file: "places-food-banks.geojson",
  // Program types as published; food-bank-led and agency-led distributions share a color.
  color: {
    property: "type",
    colors: {
      "Food Pantry": "#65a30d",
      "The Market Food Pantry": "#65a30d",
      "Fresh Market": "#a3e635",
      "Walk-up Distribution - Food Bank Led": "#16a34a",
      "Walk-up Distribution - Agency Led": "#16a34a",
      "Drive-up Distribution - Food Bank Led": "#0d9488",
      "Drive-up Distribution - Agency Led": "#0d9488",
    },
    labels: {
      "Food Pantry": "Food pantry",
      "The Market Food Pantry": "Food pantry (The Market)",
      "Fresh Market": "Fresh market",
      "Walk-up Distribution - Food Bank Led": "Walk-up distribution",
      "Walk-up Distribution - Agency Led": "Walk-up distribution (agency)",
      "Drive-up Distribution - Food Bank Led": "Drive-up distribution",
      "Drive-up Distribution - Agency Led": "Drive-up distribution (agency)",
    },
  },
  radius: [2.5, 6],
  tooltip: (p) => [String(p.name), p.type && String(p.type), p.address && String(p.address)],
  meta: {
    source: "Greater Pittsburgh Community Food Bank partner programs (hosted by Pittsburgh Regional Transit)",
    sourceUrl:
      "https://services3.arcgis.com/544gNI3xxlFIWuTc/arcgis/rest/services/Food_Banks__Greater_Pittsburgh_Community_Food_Bank_/FeatureServer/8",
    asOf: "Data gathered Apr 2025",
    geography: "Program locations",
    caveats: ["Hours and eligibility change often; check the Food Bank's locator (pittsburghfoodbank.org) before going."],
  },
});

export const AMENITY_OVERLAYS = [
  groceriesOverlay,
  foodOtherOverlay,
  pharmaciesOverlay,
  healthCentersOverlay,
  clinicsOverlay,
  pointOverlay({
    id: "places-libraries",
    label: "Libraries",
    description: "Public libraries (Allegheny County GIS).",
    file: "places-libraries.geojson",
    color: "#8b5cf6",
    radius: [3, 7],
    tooltip: (p) => [String(p.name), p.address && String(p.address)],
    meta: {
      source: "Allegheny County libraries (Allegheny County GIS)",
      sourceUrl: "https://services1.arcgis.com/vdNDkVykv9vEWFX4/arcgis/rest/services/Libraries/FeatureServer/0",
      asOf: "Edited Dec 2024",
      geography: "Library locations",
    },
  }),
  banksOverlay,
  osmOverlay("places-post-offices", "Post offices", "USPS post offices (private shipping stores excluded).", "places-post-offices.geojson", "#0ea5e9", []),
  assetOverlay("places-senior-centers", "Senior centers", "places-senior-centers.geojson", "#d97706"),
  foodAssistanceOverlay,
  osmOverlay("places-laundromats", "Laundromats", "Self-service laundromats (dry cleaners excluded).", "places-laundromats.geojson", "#94a3b8", [
    "Some County Assets entries (2017–20) may have closed.",
  ]),
  osmOverlay("places-dentists", "Dentists", "Dental offices.", "places-dentists.geojson", "#fda4af", [
    "Doesn't say which dentists take Medicaid. Pair with the dental shortage areas layer.",
  ]),
  osmOverlay("places-community-centers", "Community centers", "Community and recreation centers.", "places-community-centers.geojson", "#c084fc", []),
];

export const PLACE_OVERLAYS = [
  hospitalsOverlay,
  fireStationsOverlay,
  policeStationsOverlay,
  emsStationsOverlay,
  schoolsOverlay,
  childCareOverlay,
];
