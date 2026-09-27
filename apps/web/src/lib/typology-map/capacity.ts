// Rough home capacity of one lot for one housing type under one residential
// district: a buildable-envelope estimate, not a site plan. Setbacks and
// heights are Pittsburgh Code §903.03 as amended Ord. 10-2025 (eff.
// 2025-05-07), read on eCode360 2026-09-26
// (research/sources/ecode360-2026-09-26-pittsburgh-903-03-dimensional-standards.md).
// Not modeled: lot coverage, FAR, parking, corner-lot exterior sides,
// contextual setbacks (§925.06), topography.

import config from "@/lib/pillars/pillars.config.json";

type Density = "VL" | "L" | "M" | "H" | "VH";
const R_BASES = ["R1D", "R1A", "R2", "R3"] as const;

const FRONT_R: Record<Density, number> = { VL: 30, L: 30, M: 30, H: 15, VH: 5 };
const REAR_R: Record<Density, number> = { VL: 30, L: 30, M: 30, H: 15, VH: 15 };
const FRONT_REAR_RM: Record<Density, number> = { VL: 30, L: 25, M: 25, H: 25, VH: 25 };
// Stories from max height: 40 ft / 3 stories in R districts; RM-M 55 ft / 4,
// RM-H 85 ft / 9, RM-VH 180 ft (taken as 16 stories at ~11 ft).
const STORIES_RM: Record<Density, number> = { VL: 3, L: 3, M: 4, H: 9, VH: 16 };
const SIDE_TOTAL = config.verdict.side_setbacks.total_ft as Record<string, Record<Density, number>>;

export const CAPACITY_ASSUMPTIONS = {
  /** Share of gross floor area that becomes apartments (halls, stairs, walls take the rest). */
  efficiency: 0.8,
  /** Average apartment size, from the pencil check's multi-unit spec. */
  sfPerApartment: (config.pencil.typologies as Record<string, { sf_per_unit: number }>).multi_unit.sf_per_unit,
  /** Narrowest practical building (verdict.side_setbacks.min_building_width_ft). */
  minBuildingWidthFt: config.verdict.side_setbacks.min_building_width_ft,
  /** Typical Pittsburgh rowhouse width. */
  rowhouseWidthFt: 16,
  /** The legal matrix's multi-unit type is apartments of 4+ (three-unit is its own type). */
  minApartments: 4,
  /** Assumption, not code: at most this share of the lot is building footprint (room for access, parking and open space); also stops odd-shaped lots' bounding rectangles from inflating the footprint. */
  maxCoverage: 0.6,
  note: "Buildable envelope from §903.03 setbacks and heights, with the footprint capped at 60% of lot area (an assumption). FAR, parking, corner lots and contextual setbacks are not modeled; lot width and depth come from the lot's oriented bounding rectangle, so irregular lots are approximate.",
};

export type Dimensions = { front: number; rear: number; sideTotal: number; stories: number };

export function dimensionsFor(zone: string): Dimensions | null {
  const [base, density] = zone.split("-") as [string, Density | undefined];
  if (!density || !(density in FRONT_R)) return null;
  const sideTotal = SIDE_TOTAL[base]?.[density];
  if (sideTotal == null) return null;
  if (base === "RM") return { front: FRONT_REAR_RM[density], rear: FRONT_REAR_RM[density], sideTotal, stories: STORIES_RM[density] };
  if ((R_BASES as readonly string[]).includes(base)) return { front: FRONT_R[density], rear: REAR_R[density], sideTotal, stories: 3 };
  return null;
}

/** Residential districts we have dimensional rules for, densest last. */
export const TARGET_ZONES = ["R1D", "R1A", "R2", "R3", "RM"].flatMap((base) =>
  (["VL", "L", "M", "H", "VH"] as Density[]).map((d) => `${base}-${d}`).filter((z) => dimensionsFor(z) != null),
);

const FIXED_UNITS: Record<string, number> = { single_detached: 1, two_unit: 2, three_unit: 3 };

/** Homes one lot could hold for `typology` under `zone`'s envelope; 0 when it doesn't fit, null when the lot's size is unknown. */
export function capacity(typology: string, zone: string, widthFt: number, depthFt: number, lotAreaSf = Number.NaN): number | null {
  if (!Number.isFinite(widthFt) || !Number.isFinite(depthFt)) return null;
  const dims = dimensionsFor(zone);
  if (!dims) return null;
  const fixed = FIXED_UNITS[typology];
  // One small building per lot; a too-narrow lot is a setback-variance question
  // (the verdict flags it), not zero homes.
  if (fixed != null) return fixed;
  if (typology === "single_attached") return Math.max(1, Math.floor(widthFt / CAPACITY_ASSUMPTIONS.rowhouseWidthFt));
  if (typology !== "multi_unit") return null;
  const buildableWidth = widthFt - dims.sideTotal;
  const buildableDepth = depthFt - dims.front - dims.rear;
  if (buildableWidth < CAPACITY_ASSUMPTIONS.minBuildingWidthFt || buildableDepth <= 0) return 0;
  const envelope = buildableWidth * buildableDepth;
  const footprint = Number.isFinite(lotAreaSf) ? Math.min(envelope, lotAreaSf * CAPACITY_ASSUMPTIONS.maxCoverage) : envelope;
  const units = Math.floor((footprint * dims.stories * CAPACITY_ASSUMPTIONS.efficiency) / CAPACITY_ASSUMPTIONS.sfPerApartment);
  return units >= CAPACITY_ASSUMPTIONS.minApartments ? units : 0;
}
