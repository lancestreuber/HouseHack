// The typology heatmap and rezoning explorer. Pure and deterministic: given the
// citywide parcel facts and the user's knobs, it rates every City parcel for
// one housing type (green / yellow / red / unknown) and finds small clusters
// of land where a rezoning would unlock the most homes. It reuses the same
// scorer, verdict and pencil check as the parcel panels, so a parcel's color
// here matches what its panels say under the same settings.

import { DISTRICT_PATHWAYS } from "@/components/map/overlays/legal-matrix.generated";
import { legalLevelFor, rezoningCloseness, rezoningLikelihood } from "@/components/map/typology-meta";
import { DEFAULT_PENCIL, type PencilAssumptions, pencilCheck } from "@/lib/pillars/pencil";
import config from "@/lib/pillars/pillars.config.json";
import { type PillarId, scoreParcel } from "@/lib/pillars/score";
import { typologyVerdict, type Verdict, VERDICT_COLOR, type VerdictLevel } from "@/lib/pillars/verdict";

import { capacity, dimensionsFor, TARGET_ZONES } from "./capacity";
import type { Facts } from "./facts";

export const HEAT_TYPOLOGIES = ["single_detached", "single_attached", "two_unit", "three_unit", "multi_unit"] as const;
export type HeatTypology = (typeof HEAT_TYPOLOGIES)[number];

export const HAZARD_KNOBS = {
  floodway: ["site_floodway_share"],
  floodplain: ["site_sfha_share"],
  steepSlope: ["site_steep_slope_share"],
  landslide: ["site_landslide_prone_share", "site_recent_landslide_share"],
  undermined: ["site_undermined_share"],
} as const;
export type HazardKnob = keyof typeof HAZARD_KNOBS;

export type HeatParams = {
  typology: HeatTypology;
  /** Pillar weights for the location score (the "where is best" part). */
  weights: Record<PillarId, number>;
  /** "ignore" rates every parcel as if zoning allowed this type by right; "delta" shows only what a rezoning would change. */
  zoning: "current" | "ignore" | "delta";
  /** Checks the user has switched off. An ignored hazard counts as absent everywhere. */
  ignore: Record<HazardKnob, boolean> & { setbacks: boolean; pencil: boolean; availability: boolean };
  pencil: PencilAssumptions;
  /** Gap financing is assumed (affordable housing usually has it): "needs subsidy" and "tight" stop counting against a parcel. "Doesn't pencil" still does. */
  subsidy: boolean;
  /** true: any yellow check caps the color at yellow. false: only red deal-killers override the location tier. */
  strict: boolean;
  /** Share of scored parcels in the top (green) and bottom (red) location tiers, 0–1. */
  tiers: { green: number; red: number };
  rezone: {
    /** District the land would be rezoned to (sets the envelope for capacity), or "auto": the smallest change that allows the type. */
    target: string;
    /** How to order the rezoning areas: most homes, easiest to rezone, or homes × ease. */
    rankBy: "balanced" | "ease" | "homes";
    /** Share of new homes that would be income-restricted, 0–1. */
    affordableShare: number;
    /** Locked parcels whose representative points are this close join one cluster. */
    joinFt: number;
    /** Only link parcels in the same current district (one map amendment each). */
    sameDistrict: boolean;
    /** Also count yellow (not just green) zoning-free parcels as worth unlocking. */
    includeYellow: boolean;
    /** Treat hearings (special exception, conditional use) as locked too. */
    hearingsLocked: boolean;
    /** Only vacant land or surface parking counts (no replacing occupied buildings). */
    vacantOnly: boolean;
    /** Drop clusters that unlock fewer homes than this. */
    minHomes: number;
    /** Only areas with City-owned land that is for sale, in transfer, or pending. */
    requireCityLand: boolean;
    /** Only areas with a parcel in a federal QCT, DDA or Opportunity Zone. */
    requireIncentive: boolean;
    /** Value judgment: drop areas mostly in Transitional or Stressed markets (MVA 2021). */
    excludeStressed: boolean;
  };
};

export const DEFAULT_PARAMS: HeatParams = {
  typology: "multi_unit",
  weights: config.presets.affordability_first as Record<PillarId, number>,
  zoning: "current",
  ignore: { floodway: false, floodplain: false, steepSlope: false, landslide: false, undermined: false, setbacks: false, pencil: false, availability: false },
  pencil: DEFAULT_PENCIL,
  subsidy: true,
  strict: false,
  tiers: { green: 0.25, red: 0.25 },
  rezone: { target: "auto", rankBy: "balanced", affordableShare: 0.1, joinFt: 150, sameDistrict: true, includeYellow: false, hearingsLocked: false, vacantOnly: false, minHomes: 20, requireCityLand: false, requireIncentive: false, excludeStressed: false },
};

// Levels as small ints for the typed result arrays and the map's feature state.
export const LEVELS: VerdictLevel[] = ["green", "yellow", "red", "unknown"];
const LEVEL_CODE: Record<VerdictLevel, number> = { green: 0, yellow: 1, red: 2, unknown: 3 };
const RANK: Record<VerdictLevel, number> = { green: 0, unknown: 1, yellow: 2, red: 3 };
const worse = (a: VerdictLevel, b: VerdictLevel) => (RANK[a] >= RANK[b] ? a : b);

export type LegendEntry = { key: string; label: string; color: string; count: number };

const VERDICT_LEGEND = LEVELS.map((level) => ({ key: level, label: level === "unknown" ? "can't tell" : level, color: VERDICT_COLOR[level] }));
// Delta view: only what a rezoning would change stands out.
const DELTA_LEGEND = [
  { key: "unlocked", label: "unlocked by rezoning", color: "#22c55e" },
  { key: "unlocked_small", label: "unlocked, small area", color: "#86efac" },
  { key: "today", label: "buildable today", color: "#64748b" },
  { key: "same", label: "no change", color: "rgba(0,0,0,0)" },
];

/** Ease-of-rezoning weights: value judgments, shown in the panel. */
export const EASE_WEIGHTS = { step: 0.4, borders: 0.3, approval: 0.3 };
/** A locked parcel this close to the target district (same base, e.g. RM) could be rezoned by extending that district. */
export const BORDER_FT = 150;

// site_parcel_use code for vacant land or surface parking (pillars config `availability`).
const VACANT = 0;
const PERMITTING = new Set(["by_right", "za"]);
const HEARINGS = new Set(["zbe_special_exception", "conditional_use"]);

/** MVA 2021 market groups (Reinvestment Fund's executive summary). */
export const MVA_GROUPS = { robust: ["A", "B", "C"], steady: ["D", "E", "F"], transitional: ["G", "H"], stressed: ["I", "J"] } as const;
export type MvaGroup = keyof typeof MVA_GROUPS | "unclassified";

/** Public-lever facts summed over an area's parcels (counts of parcels). */
export type AreaLevers = {
  known: boolean;
  qct: number;
  dda: number;
  oz: number;
  anyIncentive: number;
  inclusionary: number;
  historic: number;
  parkingReduction: number;
  cityForSale: number;
  cityTransfer: number;
  cityPending: number;
  cityHeld: number;
  treasurySale: number;
  delinquent: number;
  delinquent3: number;
  mva: Record<MvaGroup, number>;
};

export type Cluster = {
  id: number;
  parcels: number[];
  homes: number;
  affordableHomes: number;
  acres: number;
  /** Parcels that are vacant land or surface parking today. */
  vacant: number;
  zones: string[];
  center: [number, number];
  /** Rough outline: convex hull of the parcels' points, padded outward. */
  hull: [number, number][];
  /** District the area would be rezoned to. */
  target: string;
  /** 0–1, higher = easier to get rezoned: a weighted mean of the parts (EASE_WEIGHTS). */
  ease: number;
  easeParts: {
    /** 1 = only the density suffix changes, 0.5 = one step up the district ladder, 0.2 = a bigger jump. */
    step: number;
    /** The area touches the target district (same base), so the rezoning just extends a neighboring district. */
    borders: boolean;
    /** Zoning Board relief approval rate in the current district, 2023–26 (a proxy; rezonings go to Council). */
    approval: number;
  };
  levers: AreaLevers;
};

export type HeatResult = {
  params: HeatParams;
  /** Per parcel, index into `legend`: the color under the chosen view. */
  level: Uint8Array;
  legend: LegendEntry[];
  /** Per parcel, location score after multipliers (NaN when unscored). */
  score: Float32Array;
  /** Per parcel, net new homes a rezoning to `target` would unlock over what today's zoning allows (0 when not locked or not worth it). */
  unlocked: Uint16Array;
  /** Per parcel, id of its rezoning cluster + 1 (0 = none). */
  cluster: Uint32Array;
  clusters: Cluster[];
  summary: {
    parcels: number;
    /** Homes possible on green parcels under current rules. */
    homesGreenToday: number;
    lockedParcels: number;
    homesUnlocked: number;
    affordableUnlocked: number;
    acresLocked: number;
    top10: { homes: number; affordable: number; acres: number };
    /** Areas where zoning, City land and a federal incentive all line up. */
    aligned: number;
    ms: number;
  };
};

/** The indicator values of parcel `i`, with ignored checks neutralized. */
export function parcelValues(facts: Facts, i: number, params: HeatParams, into: Record<string, number | null> = {}) {
  for (const id of facts.indicators) {
    const v = facts.norm[id][i];
    into[id] = v === facts.missing ? null : v;
  }
  for (const [knob, ids] of Object.entries(HAZARD_KNOBS) as [HazardKnob, readonly string[]][]) {
    if (params.ignore[knob]) for (const id of ids) into[id] = 100;
  }
  if (params.ignore.availability) into.site_parcel_use = 0;
  return into;
}

function pencilFor(facts: Facts, i: number, params: HeatParams, values: Record<string, number | null>) {
  if (params.ignore.pencil) return null;
  const result = pencilCheck(params.typology, values, rawValues(facts, i), params.pencil);
  if (result && params.subsidy && (result.status === "subsidy" || result.status === "tight")) return null;
  return result;
}

function rawValues(facts: Facts, i: number) {
  const out: Record<string, number | null> = {};
  for (const [id, col] of Object.entries(facts.raw)) out[id] = Number.isFinite(col[i]) ? col[i] : null;
  return out;
}

/** The verdict for one parcel, with its reasons (for the heatmap tooltip and panel). */
export function parcelVerdict(facts: Facts, i: number, params: HeatParams, zoningMode = params.zoning): Verdict {
  const zone = facts.zones[facts.zone[i]];
  const values = parcelValues(facts, i, params);
  const pathway = DISTRICT_PATHWAYS[zone]?.[params.typology];
  return typologyVerdict({
    typology: params.typology,
    pathway: zoningMode === "ignore" ? "by_right" : pathway,
    rezoningCloseness: rezoningCloseness(zone, params.typology),
    values,
    zoning: params.ignore.setbacks ? undefined : zone,
    lotWidthFt: Number.isFinite(facts.widthFt[i]) ? facts.widthFt[i] : null,
    pencil: pencilFor(facts, i, params, values),
  });
}

function percentileRanks(scores: Float32Array): Float32Array {
  const order: number[] = [];
  for (let i = 0; i < scores.length; i++) if (!Number.isNaN(scores[i])) order.push(i);
  order.sort((a, b) => scores[a] - scores[b]);
  const ranks = new Float32Array(scores.length).fill(Number.NaN);
  const denom = Math.max(1, order.length - 1);
  order.forEach((i, k) => (ranks[i] = k / denom));
  return ranks;
}

/** The color: the location tier, overridden by the verdict (only red, unless strict). */
function colorOf(rank: number, verdict: VerdictLevel, params: HeatParams): VerdictLevel {
  const tier = tierOf(rank, params.tiers);
  if (params.strict) return worse(tier, verdict);
  return verdict === "red" ? "red" : tier;
}

function tierOf(rank: number, tiers: HeatParams["tiers"]): VerdictLevel {
  if (Number.isNaN(rank)) return "unknown";
  if (rank >= 1 - tiers.green) return "green";
  if (rank < tiers.red) return "red";
  return "yellow";
}

export function areaLevers(facts: Facts, parcels: number[]): AreaLevers {
  const mva: Record<MvaGroup, number> = { robust: 0, steady: 0, transitional: 0, stressed: 0, unclassified: 0 };
  const out: AreaLevers = {
    known: facts.leverCodes != null,
    qct: 0,
    dda: 0,
    oz: 0,
    anyIncentive: 0,
    inclusionary: 0,
    historic: 0,
    parkingReduction: 0,
    cityForSale: 0,
    cityTransfer: 0,
    cityPending: 0,
    cityHeld: 0,
    treasurySale: 0,
    delinquent: 0,
    delinquent3: 0,
    mva,
  };
  const codes = facts.leverCodes;
  if (!codes) return out;
  const L = facts.levers;
  const D = codes.designation_bits;
  const O = codes.overlay_bits;
  const group = (type: string): MvaGroup =>
    (Object.keys(MVA_GROUPS) as (keyof typeof MVA_GROUPS)[]).find((g) => (MVA_GROUPS[g] as readonly string[]).includes(type)) ?? "unclassified";
  for (const i of parcels) {
    const d = L.designations[i];
    if (d & D.qct) out.qct++;
    if (d & D.dda) out.dda++;
    if (d & D.oz) out.oz++;
    if (d) out.anyIncentive++;
    const o = L.overlays[i];
    if (o & O.inclusionary) out.inclusionary++;
    if (o & O.historic) out.historic++;
    if (o & O.parking_reduction) out.parkingReduction++;
    const cls = codes.city_classes[L.city_owned[i]];
    if (cls === "available") out.cityForSale++;
    else if (cls === "transfer") out.cityTransfer++;
    else if (cls === "pending") out.cityPending++;
    else if (cls === "hold") out.cityHeld++;
    if (L.treasury_sale[i]) out.treasurySale++;
    if (L.years_delinquent[i] > 0) out.delinquent++;
    if (L.years_delinquent[i] >= 3) out.delinquent3++;
    mva[group(codes.mva_types[L.mva[i]] ?? "")]++;
  }
  return out;
}

/** True when most of the area's parcels are in Transitional or Stressed markets. */
export const mostlyStressed = (l: AreaLevers) => l.known && l.mva.transitional + l.mva.stressed > (Object.values(l.mva).reduce((a, b) => a + b, 0) || 1) / 2;

const BASE_LADDER = ["R1D", "R1A", "R2", "R3", "RM"];
const DENSITY_LADDER = ["VL", "L", "M", "H", "VH"];

/** 1 = same base district (only density changes), 0.5 = one step up the ladder, 0.2 = anything bigger or off the ladder. */
export function stepCloseness(from: string, to: string): number {
  const [fromBase] = from.split("-");
  const [toBase] = to.split("-");
  if (fromBase === toBase) return 1;
  const a = BASE_LADDER.indexOf(fromBase ?? "");
  const b = BASE_LADDER.indexOf(toBase ?? "");
  return a !== -1 && b !== -1 && Math.abs(a - b) === 1 ? 0.5 : 0.2;
}

/** The smallest rezoning that allows `typology` without a hearing: nearest base district, then nearest density. */
export function smallestChange(zone: string, typology: string): string | null {
  const [base, density] = zone.split("-");
  const baseRank = BASE_LADDER.indexOf(base ?? "");
  const densityRank = DENSITY_LADDER.indexOf(density ?? "M");
  let best: string | null = null;
  let bestCost = Number.POSITIVE_INFINITY;
  for (const target of TARGET_ZONES) {
    if (!PERMITTING.has(DISTRICT_PATHWAYS[target]?.[typology] ?? "")) continue;
    const [tBase, tDensity] = target.split("-");
    const tBaseRank = BASE_LADDER.indexOf(tBase ?? "");
    const baseCost = baseRank === -1 ? 0 : Math.abs(tBaseRank - baseRank);
    const cost = baseCost * 10 + Math.abs(DENSITY_LADDER.indexOf(tDensity ?? "") - (densityRank === -1 ? 2 : densityRank));
    if (cost < bestCost) {
      bestCost = cost;
      best = target;
    }
  }
  return best;
}

export function runHeatmap(facts: Facts, params: HeatParams): HeatResult {
  const t0 = performance.now();
  const n = facts.count;
  const scoreNow = new Float32Array(n).fill(Number.NaN);
  const scoreFree = new Float32Array(n).fill(Number.NaN);
  const verdictNow: VerdictLevel[] = new Array(n);
  const verdictFree: VerdictLevel[] = new Array(n);
  const pathways: (string | undefined)[] = new Array(n);
  const values: Record<string, number | null> = {};

  const closenessCache = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    const zone = facts.zones[facts.zone[i]];
    parcelValues(facts, i, params, values);
    const pathway = DISTRICT_PATHWAYS[zone]?.[params.typology];
    pathways[i] = pathway;

    const s = scoreParcel(values, { pillars: params.weights, legalLevel: legalLevelFor(zone, params.typology, values.site_legal_pathway) });
    if (s.overallBeforeMultipliers != null) {
      const free = s.overallBeforeMultipliers * (s.availability?.multiplier ?? 1) * (s.hazard?.multiplier ?? 1);
      scoreFree[i] = free;
      scoreNow[i] = free * (s.legal?.multiplier ?? 1);
    }

    let closeness = closenessCache.get(zone);
    if (closeness == null) closenessCache.set(zone, (closeness = rezoningCloseness(zone, params.typology)));
    const width = Number.isFinite(facts.widthFt[i]) ? facts.widthFt[i] : null;
    const pencil = pencilFor(facts, i, params, values);
    const common = { typology: params.typology, rezoningCloseness: closeness, values, zoning: params.ignore.setbacks ? undefined : zone, lotWidthFt: width, pencil };
    verdictNow[i] = typologyVerdict({ ...common, pathway }).level;
    verdictFree[i] = typologyVerdict({ ...common, pathway: "by_right" }).level;
  }

  const rankNow = percentileRanks(scoreNow);
  const rankFree = percentileRanks(scoreFree);
  const level = new Uint8Array(n);
  const nowGreen = new Uint8Array(n);
  const unlocked = new Uint16Array(n);
  const targets: (string | null)[] = new Array(n).fill(null);
  const lotAcres = (i: number) => {
    const w = facts.widthFt[i];
    const d = facts.depthFt[i];
    const area = facts.raw.site_lot_area?.[i];
    return (Number.isFinite(area) ? area : Number.isFinite(w) && Number.isFinite(d) ? w * d : 0) / 43560;
  };

  const lotArea = (i: number) => facts.raw.site_lot_area?.[i] ?? Number.NaN;
  const targetCache = new Map<string, string | null>();
  const targetFor = (zone: string) => {
    if (params.rezone.target !== "auto") return PERMITTING.has(DISTRICT_PATHWAYS[params.rezone.target]?.[params.typology] ?? "") ? params.rezone.target : null;
    if (!targetCache.has(zone)) targetCache.set(zone, smallestChange(zone, params.typology));
    return targetCache.get(zone)!;
  };
  // Envelope for lots in districts without dimensional rules (commercial, special): a mid-density RM.
  const FALLBACK_ZONE = "RM-M";

  // Homes today's zoning already allows on the lot: the most of any mainstream type permitted without a hearing.
  const homesAllowedNow = (i: number, zone: string) => {
    const zoneForCapacity = dimensionsFor(zone) ? zone : FALLBACK_ZONE;
    let best = 0;
    for (const t of HEAT_TYPOLOGIES) {
      if (!PERMITTING.has(DISTRICT_PATHWAYS[zone]?.[t] ?? "")) continue;
      best = Math.max(best, capacity(t, zoneForCapacity, facts.widthFt[i], facts.depthFt[i], lotArea(i)) ?? 0);
    }
    return best;
  };

  let homesGreenToday = 0;
  let lockedParcels = 0;
  let acresLocked = 0;
  for (let i = 0; i < n; i++) {
    const zone = facts.zones[facts.zone[i]];
    const now = colorOf(rankNow[i], verdictNow[i], params);
    const free = colorOf(rankFree[i], verdictFree[i], params);
    level[i] = LEVEL_CODE[params.zoning === "ignore" ? free : now];

    const pathway = pathways[i] ?? "";
    if (now === "green" && PERMITTING.has(pathway)) {
      nowGreen[i] = 1;
      const zoneForCapacity = dimensionsFor(zone) ? zone : FALLBACK_ZONE;
      homesGreenToday += capacity(params.typology, zoneForCapacity, facts.widthFt[i], facts.depthFt[i], lotArea(i)) ?? 0;
    }

    // Locked: the zoning-free rating is good, but today's zoning blocks this type.
    const blocked = pathway === "not_permitted" || (params.rezone.hearingsLocked && HEARINGS.has(pathway));
    const goodEnough = free === "green" || (params.rezone.includeYellow && free === "yellow");
    const vacantOk = !params.rezone.vacantOnly || facts.norm.site_parcel_use[i] === VACANT;
    const target = blocked && goodEnough && vacantOk ? targetFor(zone) : null;
    if (target) {
      const homes = (capacity(params.typology, target, facts.widthFt[i], facts.depthFt[i], lotArea(i)) ?? 0) - homesAllowedNow(i, zone);
      if (homes > 0) {
        unlocked[i] = Math.min(homes, 65535);
        targets[i] = target;
        lockedParcels++;
        acresLocked += lotAcres(i);
      }
    }
  }

  const { clusters, cluster } = findClusters(facts, unlocked, targets, params, lotAcres);

  let legend: LegendEntry[];
  if (params.zoning === "delta") {
    legend = DELTA_LEGEND.map((e) => ({ ...e, count: 0 }));
    for (let i = 0; i < n; i++) {
      level[i] = cluster[i] > 0 ? 0 : unlocked[i] > 0 ? 1 : nowGreen[i] ? 2 : 3;
      legend[level[i]].count++;
    }
  } else {
    legend = VERDICT_LEGEND.map((e) => ({ ...e, count: 0 }));
    for (let i = 0; i < n; i++) legend[level[i]].count++;
  }

  const homesUnlocked = clusters.reduce((a, c) => a + c.homes, 0);
  const top = clusters.slice(0, 10);
  return {
    params,
    level,
    legend,
    score: params.zoning === "current" ? scoreNow : scoreFree,
    unlocked,
    cluster,
    clusters,
    summary: {
      parcels: n,
      homesGreenToday,
      lockedParcels,
      homesUnlocked,
      affordableUnlocked: clusters.reduce((a, c) => a + c.affordableHomes, 0),
      acresLocked,
      aligned: clusters.filter((c) => c.levers.anyIncentive > 0 && c.levers.cityForSale + c.levers.cityTransfer + c.levers.cityPending > 0).length,
      top10: {
        homes: top.reduce((a, c) => a + c.homes, 0),
        affordable: top.reduce((a, c) => a + c.affordableHomes, 0),
        acres: top.reduce((a, c) => a + c.acres, 0),
      },
      ms: Math.round(performance.now() - t0),
    },
  };
}

const FT_PER_DEG_LAT = 364_000;

// Single-linkage clustering on a grid hash: parcels within `joinFt` of each
// other (and, optionally, in the same district) end up in one cluster.
function findClusters(
  facts: Facts,
  unlocked: Uint16Array,
  targets: (string | null)[],
  params: HeatParams,
  lotAcres: (i: number) => number,
) {
  const { joinFt, sameDistrict, affordableShare, minHomes, rankBy } = params.rezone;
  const members: number[] = [];
  for (let i = 0; i < unlocked.length; i++) if (unlocked[i] > 0) members.push(i);

  const cosLat = Math.cos((40.44 * Math.PI) / 180);
  const cellLat = joinFt / FT_PER_DEG_LAT;
  const cellLng = cellLat / cosLat;
  const key = (cx: number, cy: number) => `${cx},${cy}`;
  const grid = new Map<string, number[]>();
  const parent = new Int32Array(members.length).map((_, k) => k);
  const find = (k: number): number => {
    while (parent[k] !== k) k = parent[k] = parent[parent[k]];
    return k;
  };

  members.forEach((i, k) => {
    const cx = Math.floor(facts.lng[i] / cellLng);
    const cy = Math.floor(facts.lat[i] / cellLat);
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++) {
        for (const other of grid.get(key(cx + dx, cy + dy)) ?? []) {
          const j = members[other];
          if (sameDistrict && facts.zone[i] !== facts.zone[j]) continue;
          // One map amendment rezones to one district.
          if (targets[i] !== targets[j]) continue;
          const dLat = (facts.lat[i] - facts.lat[j]) * FT_PER_DEG_LAT;
          const dLng = (facts.lng[i] - facts.lng[j]) * FT_PER_DEG_LAT * cosLat;
          if (dLat * dLat + dLng * dLng <= joinFt * joinFt) parent[find(k)] = find(other);
        }
      }
    const cell = key(cx, cy);
    const list = grid.get(cell);
    if (list) list.push(k);
    else grid.set(cell, [k]);
  });

  const groups = new Map<number, number[]>();
  members.forEach((i, k) => {
    const root = find(k);
    const g = groups.get(root);
    if (g) g.push(i);
    else groups.set(root, [i]);
  });

  // Per target base district, a grid of the parcels already in it, for the "extends a neighboring district" check.
  const borderLat = BORDER_FT / FT_PER_DEG_LAT;
  const borderLng = borderLat / cosLat;
  const baseOf = (zone: string) => zone.split("-")[0];
  const gridsByBase = new Map<string, Map<string, number[]>>();
  const touchesDistrict = (i: number, target: string) => {
    const base = baseOf(target);
    let permitting = gridsByBase.get(base);
    if (!permitting) {
      permitting = new Map();
      for (let j = 0; j < facts.count; j++) {
        if (baseOf(facts.zones[facts.zone[j]]) !== base) continue;
        const cell = key(Math.floor(facts.lng[j] / borderLng), Math.floor(facts.lat[j] / borderLat));
        const list = permitting.get(cell);
        if (list) list.push(j);
        else permitting.set(cell, [j]);
      }
      gridsByBase.set(base, permitting);
    }
    const cx = Math.floor(facts.lng[i] / borderLng);
    const cy = Math.floor(facts.lat[i] / borderLat);
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++)
        for (const j of permitting.get(key(cx + dx, cy + dy)) ?? []) {
          const dLat = (facts.lat[i] - facts.lat[j]) * FT_PER_DEG_LAT;
          const dLng = (facts.lng[i] - facts.lng[j]) * FT_PER_DEG_LAT * cosLat;
          if (dLat * dLat + dLng * dLng <= BORDER_FT * BORDER_FT) return true;
        }
    return false;
  };

  const clusters: Cluster[] = [];
  for (const parcels of groups.values()) {
    const homes = parcels.reduce((a, i) => a + unlocked[i], 0);
    if (homes < minHomes) continue;
    const pts = parcels.map((i) => [facts.lng[i], facts.lat[i]] as [number, number]);
    const center: [number, number] = [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];
    const target = targets[parcels[0]]!;
    const zones = [...new Set(parcels.map((i) => facts.zones[facts.zone[i]]))];
    // Worst case across the area's current districts.
    const step = Math.min(...zones.map((z) => stepCloseness(z, target)));
    const approval = Math.min(...zones.map((z) => rezoningLikelihood(z)));
    const borders = parcels.some((i) => touchesDistrict(i, target));
    const ease = EASE_WEIGHTS.step * step + EASE_WEIGHTS.borders * (borders ? 1 : 0) + EASE_WEIGHTS.approval * approval;
    clusters.push({
      id: 0,
      parcels,
      homes,
      affordableHomes: Math.floor(homes * affordableShare),
      acres: parcels.reduce((a, i) => a + lotAcres(i), 0),
      vacant: parcels.filter((i) => facts.norm.site_parcel_use[i] === VACANT).length,
      zones,
      center,
      target,
      ease,
      easeParts: { step, borders, approval },
      levers: areaLevers(facts, parcels),
      hull: paddedHull(pts, center, 60 / FT_PER_DEG_LAT, cosLat),
    });
  }
  const { requireCityLand, requireIncentive, excludeStressed } = params.rezone;
  const kept = clusters.filter(
    (c) =>
      (!requireCityLand || c.levers.cityForSale + c.levers.cityTransfer + c.levers.cityPending > 0) &&
      (!requireIncentive || c.levers.anyIncentive > 0) &&
      (!excludeStressed || !mostlyStressed(c.levers)),
  );
  clusters.length = 0;
  clusters.push(...kept);
  const rankValue = (c: Cluster) => (rankBy === "homes" ? c.homes : rankBy === "ease" ? c.ease : c.homes * c.ease);
  clusters.sort((a, b) => rankValue(b) - rankValue(a) || b.homes - a.homes);
  const cluster = new Uint32Array(unlocked.length);
  clusters.forEach((c, k) => {
    c.id = k + 1;
    for (const i of c.parcels) cluster[i] = c.id;
  });
  return { clusters, cluster };
}

// Andrew's monotone chain, then each vertex pushed `pad` (degrees of latitude)
// away from the center so one- and two-parcel clusters still get an outline.
function paddedHull(points: [number, number][], center: [number, number], pad: number, cosLat: number): [number, number][] {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: [number, number][] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: [number, number][] = [];
  for (const p of pts.reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  let hull = lower.slice(0, -1).concat(upper.slice(0, -1));
  if (hull.length < 3) {
    const [x, y] = center;
    const r = pad;
    hull = Array.from({ length: 8 }, (_, k) => [x + (r * Math.cos((k * Math.PI) / 4)) / cosLat, y + r * Math.sin((k * Math.PI) / 4)] as [number, number]);
    return [...hull, hull[0]];
  }
  const padded = hull.map(([x, y]) => {
    const dx = (x - center[0]) * cosLat;
    const dy = y - center[1];
    const len = Math.hypot(dx, dy) || 1;
    return [x + ((dx / len) * pad) / cosLat, y + (dy / len) * pad] as [number, number];
  });
  return [...padded, padded[0]];
}
