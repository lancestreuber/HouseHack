import { sql } from "drizzle-orm";
import z from "zod";

import { publicProcedure } from "../index";
import { type SystemOne, SystemOneError } from "../system-one";
import {
  buildSiteState,
  gateFor,
  parseZoning,
  siteFitQuestion,
  type SiteFit,
  toSiteFit,
  TYPOLOGIES,
  type TypologyId,
} from "../typology/site-fit";

const SQ_M_TO_SQ_FT = 10.7639;
const M_TO_FT = 3.28084;

const share = z.number().min(0).max(1).nullable().optional();

const typologyFitInput = z.object({
  pin: z.string().regex(/^[0-9A-Z]{8,20}$/),
  // From the pillars shard the client already loaded; public data, only used as decision input.
  zoning: z.string().max(20).nullable().optional(),
  hazards: z
    .object({ floodway: share, floodplain: share, steepSlope: share, landslideProne: share, undermined: share })
    .optional(),
});

type FitResult =
  | { status: "ok"; model: string; fits: Partial<Record<TypologyId, SiteFit>> }
  | { status: "unavailable"; reason: "not_configured" | "error" };

// Ratings for the same facts don't change between clicks, so keep recent ones in memory.
const fitCache = new Map<string, FitResult>();
const FIT_CACHE_LIMIT = 500;

// Below this many degrees^2 of viewport area, a bbox query stays cheap
// (bounded row count via LIMIT); above it we skip the query entirely so a
// zoomed-out view of the whole county never triggers a huge table scan.
const MAX_BBOX_AREA_DEGREES = 0.05;
const MAX_FEATURES = 5000;

const boundsInput = z.object({
  minLng: z.number(),
  minLat: z.number(),
  maxLng: z.number(),
  maxLat: z.number(),
});

export const parcelsRouter = {
  getByBounds: publicProcedure.input(boundsInput).handler(async ({ input, context }) => {
    const { minLng, minLat, maxLng, maxLat } = input;
    const area = Math.abs(maxLng - minLng) * Math.abs(maxLat - minLat);
    if (area > MAX_BBOX_AREA_DEGREES) {
      return { type: "FeatureCollection", features: [] } as const;
    }

    const result = await context.db.execute<{
      pin: string;
      properties: Record<string, unknown>;
      geojson: string;
    }>(sql`
      SELECT pin, properties, ST_AsGeoJSON(geom) AS geojson
      FROM parcel
      WHERE ST_Intersects(geom, ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326))
      LIMIT ${MAX_FEATURES}
    `);

    return {
      type: "FeatureCollection" as const,
      features: result.rows.map((row) => ({
        type: "Feature" as const,
        geometry: JSON.parse(row.geojson),
        properties: { pin: row.pin, ...row.properties },
      })),
    };
  }),

  // Ranks housing types on one parcel: the legal gate comes from the zoning use
  // table in code; physical site fit comes from the System One decision layer.
  typologyFit: publicProcedure.input(typologyFitInput).handler(async ({ input, context }) => {
    const result = await context.db.execute<{ area_m2: number | null; side_a: number | null; side_b: number | null }>(sql`
      WITH p AS (
        SELECT geom, ST_ExteriorRing(ST_OrientedEnvelope(geom)) AS ring FROM parcel WHERE pin = ${input.pin}
      )
      SELECT
        ST_Area(geom::geography) AS area_m2,
        ST_Distance(ST_PointN(ring, 1)::geography, ST_PointN(ring, 2)::geography) AS side_a,
        ST_Distance(ST_PointN(ring, 2)::geography, ST_PointN(ring, 3)::geography) AS side_b
      FROM p
    `);
    const row = result.rows[0];
    const sides = [row?.side_a, row?.side_b].filter((s): s is number => s != null && s > 0);
    const lot = {
      areaSf: row?.area_m2 != null ? row.area_m2 * SQ_M_TO_SQ_FT : null,
      widthFt: sides.length === 2 ? Math.min(...sides) * M_TO_FT : null,
      depthFt: sides.length === 2 ? Math.max(...sides) * M_TO_FT : null,
    };

    const zoning = parseZoning(input.zoning);
    const typologies = TYPOLOGIES.map((t) => ({
      id: t.id,
      category: t.category,
      label: t.label,
      gate: gateFor(t.id, zoning, lot.areaSf),
    }));
    const rated = typologies.filter((t) => t.gate.status !== "not_permitted").map((t) => t.id);
    const state = buildSiteState(lot, zoning, input.hazards ?? {});

    const cacheKey = JSON.stringify([context.systemOne.model, state, rated]);
    let jev = fitCache.get(cacheKey);
    if (!jev) {
      jev = await rateSiteFit(context.systemOne, state, rated);
      if (jev.status === "ok") {
        if (fitCache.size >= FIT_CACHE_LIMIT) fitCache.delete(fitCache.keys().next().value!);
        fitCache.set(cacheKey, jev);
      }
    }

    return {
      pin: input.pin,
      lot,
      zoning,
      facts: state,
      jev: jev.status === "ok" ? { status: "ok" as const, model: jev.model } : jev,
      typologies: typologies.map((t) => ({ ...t, fit: jev.status === "ok" ? (jev.fits[t.id] ?? null) : null })),
    };
  }),
};

async function rateSiteFit(
  systemOne: SystemOne,
  state: ReturnType<typeof buildSiteState>,
  typologies: TypologyId[],
): Promise<FitResult> {
  if (!systemOne.configured) return { status: "unavailable", reason: "not_configured" };
  if (typologies.length === 0) return { status: "ok", model: systemOne.model, fits: {} };
  try {
    const questions = Object.fromEntries(typologies.map((id) => [id, siteFitQuestion(id)]));
    const { answers, model } = await systemOne.decide({ state, questions });
    const fits: Partial<Record<TypologyId, SiteFit>> = {};
    for (const id of typologies) {
      const answer = answers[id];
      if (answer) fits[id] = toSiteFit(answer);
    }
    return { status: "ok", model, fits };
  } catch (error) {
    // Fall back to gates only; never present a failed request as a rating.
    const detail = error instanceof SystemOneError ? `${error.code}: ${error.message}` : "unexpected error";
    console.error(`[system-one] site fit failed (${detail})`);
    return { status: "unavailable", reason: "error" };
  }
}
