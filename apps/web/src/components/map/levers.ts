import { PATHWAY_META, TYPOLOGIES, zbaLine } from "./overlays/legal-feasibility";
import { DISTRICT_PATHWAYS, PATHWAYS } from "./overlays/legal-matrix.generated";
import { rezoningTargets } from "./typology-meta";

export type LeverStatus = "yes" | "no" | "flag" | "unknown";
export type LeverLine = { id: string; status: LeverStatus; text: string; detail?: string; source: string; sourceUrl: string };
export type Tone = "go" | "maybe" | "stop" | "unknown";
export type PathStep = { label: string; value: string };
export type LeverPath = { title: string; steps: PathStep[]; source: string; sourceUrl: string };
export type LeverSection = {
  key: "zoning" | "incentives" | "land";
  lever: string;
  question: string;
  tone: Tone;
  answer: string;
  explain: string;
  paths: LeverPath[];
  items: LeverLine[];
};
export type Levers = { typology: string; zoning: LeverSection; incentives: LeverSection; land: LeverSection };

type Ring = [number, number][];
type Geometry = { type: "Polygon"; coordinates: Ring[] } | { type: "MultiPolygon"; coordinates: Ring[][] };
type Feature<P> = { properties: P; geometry: Geometry };
type AreaProps = { designation?: string; kind?: string; label?: string };
type CityOwned = { pin: string; inventory_type: string; status: string; class: string };
type TreasurySale = { pin: string; sale_date: string };
type Delinquent = { pin: string; years_delinquent: number };

export type LeverData = {
  designations: Feature<AreaProps>[];
  overlays: Feature<AreaProps>[];
  cityOwned: Map<string, CityOwned>;
  treasury: Map<string, TreasurySale>;
  delinquent: Map<string, Delinquent>;
};

const LEGAL_URL = "https://ecode360.com/45476524";
const HUD_URL = "https://www.huduser.gov/portal/datasets/qct.html";
const OZ_URL = "https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/Opportunity_Zones/FeatureServer/13";
const OVERLAYS_URL = "https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services";
const CITY_OWNED_URL = "https://data.wprdc.org/dataset/city-owned-properties";
const TREASURY_URL = "https://data.wprdc.org/dataset/city-treasury-sales";
const DELINQUENT_URL = "https://data.wprdc.org/dataset/city-of-pittsburgh-property-tax-delinquency";
const URA_URL = "https://www.ura.org/pages/housing-opportunity-fund-programs";
const LAND_BANK_URL = "https://pghlandbank.org/";

const LIHTC_TYPES = new Set(["multi_unit", "elderly_limited", "elderly_general"]);
const LARGE_TYPES = new Set(["multi_unit", "elderly_general"]);
const GAP_TYPES = new Set(["multi_unit", "elderly_limited", "elderly_general", "three_unit"]);

function inRing([x, y]: [number, number], ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!;
    const [xj, yj] = ring[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function inPolygon(point: [number, number], rings: Ring[]): boolean {
  const [outer, ...holes] = rings;
  return Boolean(outer && inRing(point, outer) && !holes.some((h) => inRing(point, h)));
}

export function pointInGeometry(point: [number, number], geometry: Geometry): boolean {
  if (geometry.type === "Polygon") return inPolygon(point, geometry.coordinates);
  return geometry.coordinates.some((rings) => inPolygon(point, rings));
}

export const typologyLabel = (id: string) => TYPOLOGIES.find(([t]) => t === id)?.[1] ?? id;
const districtName = (zone: string) => {
  const full = DISTRICT_PATHWAYS[zone]?.full_zoning_type;
  return full ? `${zone} (${full.toLowerCase()})` : zone;
};

const COUNCIL_ACTIONS = "Council land-use actions 2000–2026, compiled by the research team";
const ZBA_DECISIONS = "Zoning Board decisions 2023–26, compiled by the research team";

function byRightDistricts(zoning: string, typologyId: string): string[] {
  const nearby = rezoningTargets(zoning).filter((d) => DISTRICT_PATHWAYS[d]?.[typologyId] === "by_right");
  if (nearby.length) return nearby;
  return Object.keys(DISTRICT_PATHWAYS).filter((d) => DISTRICT_PATHWAYS[d]?.[typologyId] === "by_right");
}

function alsoUnlocked(from: string, to: string, typologyId: string): string[] {
  const before = DISTRICT_PATHWAYS[from] ?? {};
  const after = DISTRICT_PATHWAYS[to] ?? {};
  return TYPOLOGIES.filter(([id]) => id !== typologyId && after[id] === "by_right" && before[id] !== "by_right").map(([, label]) => label);
}

function zoningSection(zoning: string, typologyId: string, areas: AreaProps[]): LeverSection {
  const name = typologyLabel(typologyId);
  const pathwayId = DISTRICT_PATHWAYS[zoning]?.[typologyId];
  const info = pathwayId ? PATHWAYS[pathwayId] : undefined;
  const question = `Does the City's zoning allow ${name.toLowerCase()} on this lot?`;
  const base = { key: "zoning" as const, lever: "Zoning & land use", question };
  const items = overlayItems(typologyId, areas);

  if (!pathwayId || !info || pathwayId === "per_plan" || pathwayId === "not_city_jurisdiction") {
    return {
      ...base,
      tone: "unknown",
      answer: "Can't tell from the use table",
      explain: pathwayId ? (PATHWAY_META[pathwayId]?.label ?? "") : `We have no reading of the use table for ${zoning || "this district"}.`,
      paths: [],
      items,
    };
  }
  if (pathwayId === "by_right") {
    return {
      ...base,
      tone: "go",
      answer: "Yes, allowed today",
      explain: `${districtName(zoning)} lists it as a permitted use. Zoning staff sign off at permit review; no hearing and no zoning lever needed.`,
      paths: [],
      items,
    };
  }
  if (pathwayId !== "not_permitted") {
    const zba = zbaLine(zoning, typologyId);
    return {
      ...base,
      tone: "maybe",
      answer: "Yes, with an approval",
      explain: `${districtName(zoning)} allows it only case by case. A builder applies; no rezoning is needed.`,
      paths: [
        {
          title: PATHWAY_META[pathwayId]?.label ?? pathwayId,
          steps: [
            { label: "Who decides", value: info.decider },
            ...(info.hearing && info.hearing !== "no" ? [{ label: "Public hearing", value: info.hearing }] : []),
            ...(info.clock && info.clock !== "none" ? [{ label: "Timeline", value: info.clock }] : []),
            ...(zba ? [{ label: "Track record", value: zba }] : []),
            ...(info.section ? [{ label: "Code", value: info.section }] : []),
          ],
          source: "Pittsburgh Zoning Code, Ch. 922",
          sourceUrl: LEGAL_URL,
        },
      ],
      items,
    };
  }

  const targets = byRightDistricts(zoning, typologyId);
  const target = targets[0];
  const paths: LeverPath[] = [];
  if (target) {
    const unlocked = alsoUnlocked(zoning, target, typologyId);
    paths.push({
      title: `Rezone the lot to ${target}`,
      steps: [
        { label: "What changes", value: `The zoning map for this lot goes from ${districtName(zoning)} to ${districtName(target)}, where ${name.toLowerCase()} is allowed by right.` },
        { label: "Who decides", value: "City Council votes on a zoning map amendment; a community (RCO) meeting is required first." },
        { label: "Track record", value: "42 of 49 site rezonings adopted since 2015, none voted down; median 123 days." },
        ...(unlocked.length ? [{ label: "Also allowed after", value: unlocked.slice(0, 4).join(", ") }] : []),
        ...(targets.length > 1 ? [{ label: "Other districts that allow it", value: targets.slice(1, 5).join(", ") }] : []),
      ],
      source: COUNCIL_ACTIONS,
      sourceUrl: LEGAL_URL,
    });
  }
  paths.push({
    title: "Grant a use variance for one project",
    steps: [
      { label: "What changes", value: "Nothing on the map. The Zoning Board lets one project break the use table." },
      { label: "Who decides", value: "Zoning Board of Adjustment, after a public hearing." },
      { label: "The bar", value: "The builder must prove hardship (five findings, §922.09)." },
      { label: "Track record", value: "22 of 30 use variances granted 2023–26 (withdrawn cases are missing, so this runs high)." },
    ],
    source: ZBA_DECISIONS,
    sourceUrl: LEGAL_URL,
  });
  return {
    ...base,
    tone: "stop",
    answer: "No, not today",
    explain: `${districtName(zoning)} does not list ${name.toLowerCase()} as a use. To build it here, one of these has to happen:`,
    paths,
    items,
  };
}

function overlayItems(typologyId: string, areas: AreaProps[]): LeverLine[] {
  const kinds = new Set(areas.map((a) => a.kind));
  const overlay = { source: "City of Pittsburgh zoning overlays (City ArcGIS)", sourceUrl: OVERLAYS_URL };
  const lines: LeverLine[] = [];
  if (kinds.has("inclusionary"))
    lines.push({
      id: "zoning.iz",
      status: "flag",
      text: "Inclusionary zoning area",
      detail: LARGE_TYPES.has(typologyId)
        ? "Projects of 20+ units must include affordable units (reported: 10% at 50% AMI rents)."
        : "Only affects projects of 20+ units.",
      ...overlay,
    });
  if (kinds.has("historic") || kinds.has("historic_landmark"))
    lines.push({ id: "zoning.historic", status: "flag", text: "Historic district or landmark", detail: "Exterior design needs historic review.", ...overlay });
  if (kinds.has("parking_reduction") || kinds.has("transit_buffer"))
    lines.push({ id: "zoning.parking", status: "yes", text: "Parking reduction area", detail: "Fewer parking spaces are required here.", ...overlay });
  return lines;
}

function incentivesSection(typologyId: string, designations: Set<string> | null): LeverSection {
  const base = { key: "incentives" as const, lever: "Incentives", question: "Does this location come with any tax or funding help?" };
  if (!designations)
    return { ...base, tone: "unknown", answer: "Unknown", explain: "The parcel's location didn't load, so designations weren't checked.", paths: [], items: [] };
  const lihtc = LIHTC_TYPES.has(typologyId);
  const hud = { source: "HUD Qualified Census Tracts and Difficult Development Areas 2026", sourceUrl: HUD_URL };
  const items: LeverLine[] = [];
  const basis = lihtc
    ? "Affordable rentals financed with Low-Income Housing Tax Credits can claim up to 30% more credit here."
    : "Only helps affordable rentals financed with Low-Income Housing Tax Credits, not this housing type.";
  if (designations.has("qct")) items.push({ id: "incentive.qct", status: lihtc ? "yes" : "no", text: "Qualified Census Tract (federal)", detail: basis, ...hud });
  if (designations.has("dda")) items.push({ id: "incentive.dda", status: lihtc ? "yes" : "no", text: "Difficult Development Area (federal)", detail: basis, ...hud });
  if (designations.has("oz"))
    items.push({
      id: "incentive.oz",
      status: "yes",
      text: "Opportunity Zone (federal)",
      detail: "Investors can defer federal capital-gains tax by investing here. 2018 designation; whether it carries past 2026 is unverified.",
      source: "HUD Opportunity Zones",
      sourceUrl: OZ_URL,
    });
  const located = items.filter((i) => i.status === "yes").length;
  if (GAP_TYPES.has(typologyId))
    items.push({
      id: "incentive.ura",
      status: "flag",
      text: "URA Rental Gap Program (anywhere in the City)",
      detail: "Fills funding gaps for affordable rentals: up to $75k per unit at 30% AMI, $50k at 50%, $35k at 60%; 4+ units; $2M per project.",
      source: "URA Rental Gap Program guidelines (Aug 2024)",
      sourceUrl: URA_URL,
    });
  items.push({
    id: "incentive.abatement",
    status: "unknown",
    text: "Local tax abatements (LERTA, TIF)",
    detail: "Not in our data yet. Unknown, not absent.",
    source: "Not yet collected",
    sourceUrl: "",
  });
  const none = !designations.has("qct") && !designations.has("dda") && !designations.has("oz");
  return {
    ...base,
    tone: located ? "go" : "unknown",
    answer: located ? `Yes, ${located} location-based incentive${located > 1 ? "s" : ""}` : none ? "No federal designation here" : "Designated, but not for this type",
    explain: none
      ? "Not a Qualified Census Tract, Difficult Development Area or Opportunity Zone. City-wide programs still apply."
      : "Federal designations are drawn by tract; the City can't change them, but can steer projects toward them.",
    paths: [],
    items,
  };
}

function landSection(pin: string, data: LeverData): LeverSection {
  const base = { key: "land" as const, lever: "Public land", question: "Does the City control this land?" };
  const items: LeverLine[] = [];
  const owned = data.cityOwned.get(pin);
  const sale = data.treasury.get(pin);
  const delinquent = data.delinquent.get(pin);
  const cityOwned = { source: "City of Pittsburgh city-owned property (WPRDC)", sourceUrl: CITY_OWNED_URL };
  if (owned) items.push({ id: "land.city", status: "yes", text: `Inventory: ${owned.inventory_type}`, detail: `City status: ${owned.status}.`, ...cityOwned });
  if (sale)
    items.push({
      id: "land.treasury",
      status: "flag",
      text: `On the treasurer's sale list for ${sale.sale_date}`,
      detail: "Unpaid taxes; the property is scheduled for public sale.",
      source: "City of Pittsburgh treasurer sales (WPRDC)",
      sourceUrl: TREASURY_URL,
    });
  if (delinquent)
    items.push({
      id: "land.delinquent",
      status: "flag",
      text: `${delinquent.years_delinquent}+ years behind on property taxes`,
      detail: "Long delinquency is how many lots reach tax sale or the Land Bank.",
      source: "City of Pittsburgh property tax delinquency (WPRDC)",
      sourceUrl: DELINQUENT_URL,
    });
  items.push({
    id: "land.landbank",
    status: "unknown",
    text: "Land Bank holdings",
    detail: "The Land Bank publishes no parcel list, so a Land Bank lot may not show here.",
    source: "Pittsburgh Land Bank",
    sourceUrl: LAND_BANK_URL,
  });

  const landBankSale: LeverPath = {
    title: "How a Land Bank sale works",
    steps: [
      { label: "Who decides", value: "Two-thirds vote of the Land Bank board." },
      { label: "Public notice", value: "At least 30 days' notice and a sign on the lot, then a 20-day objection window (15+ petitioners trigger a neighborhood hearing)." },
    ],
    source: "Pittsburgh Land Bank disposition process (2022)",
    sourceUrl: LAND_BANK_URL,
  };

  if (owned?.class === "available")
    return { ...base, tone: "go", answer: "Yes, City-owned and for sale", explain: "The City can put this lot in a builder's or nonprofit's hands without buying it first.", paths: [], items };
  if (owned?.class === "transfer")
    return {
      ...base,
      tone: "go",
      answer: "Yes, headed to the URA or Land Bank",
      explain: "The City is transferring this lot to a public land agency, which then sells it to a builder.",
      paths: owned.inventory_type.includes("PLB") ? [landBankSale] : [],
      items,
    };
  if (owned?.class === "pending")
    return { ...base, tone: "maybe", answer: "City-owned, deal pending", explain: "A sale or acquisition is already in progress.", paths: [], items };
  if (owned?.class === "hold")
    return { ...base, tone: "maybe", answer: "City-owned, held for study", explain: "The City owns it but hasn't released it for sale.", paths: [], items };
  if (owned)
    return { ...base, tone: "stop", answer: "City-owned, not for housing", explain: "Kept as a park, greenway or permanent City use.", paths: [], items };
  if (sale || delinquent)
    return {
      ...base,
      tone: "maybe",
      answer: "Not yet, but it could come to the City",
      explain: "Privately owned, with unpaid taxes. Tax sale or Land Bank acquisition could bring it under public control.",
      paths: [],
      items,
    };
  return { ...base, tone: "stop", answer: "No, privately held", explain: "Not in the City's inventory. Public control would mean buying it.", paths: [], items };
}

export function computeLevers(
  pin: string,
  zoning: string,
  typologyId: string,
  point: [number, number] | null,
  data: LeverData,
): Levers {
  const hits = <P>(features: Feature<P>[]) => (point ? features.filter((f) => pointInGeometry(point, f.geometry)).map((f) => f.properties) : []);
  const designations = point ? new Set(hits(data.designations).map((p) => p.designation ?? "")) : null;
  return {
    typology: typologyLabel(typologyId),
    zoning: zoningSection(zoning, typologyId, hits(data.overlays)),
    incentives: incentivesSection(typologyId, designations),
    land: landSection(pin, data),
  };
}

async function loadFeatures<P>(url: string): Promise<{ properties: P; geometry: Geometry }[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return ((await res.json()) as { features: { properties: P; geometry: Geometry }[] }).features;
}

const byPin = <P extends { pin: string }>(features: { properties: P }[]) => new Map(features.map((f) => [f.properties.pin, f.properties]));

let leverData: Promise<LeverData> | null = null;

export function loadLeverData(): Promise<LeverData> {
  leverData ??= Promise.all([
    loadFeatures<AreaProps>("/data/overlays/designation-areas.geojson"),
    loadFeatures<AreaProps>("/data/overlays/city-zoning-overlays.geojson"),
    loadFeatures<CityOwned>("/data/overlays/city-owned-land.geojson"),
    loadFeatures<TreasurySale>("/data/overlays/treasury-sales.geojson"),
    loadFeatures<Delinquent>("/data/overlays/tax-delinquent.geojson"),
  ])
    .then(([designations, overlays, cityOwned, treasury, delinquent]) => ({
      designations,
      overlays,
      cityOwned: byPin(cityOwned),
      treasury: byPin(treasury),
      delinquent: byPin(delinquent),
    }))
    .catch((error) => {
      leverData = null;
      throw error;
    });
  return leverData;
}
