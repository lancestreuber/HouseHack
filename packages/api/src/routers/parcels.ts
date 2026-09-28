import { sql } from "drizzle-orm";
import z from "zod";

import { publicProcedure } from "../index";
import { type SystemOne, SystemOneError } from "../system-one";
import { buildSiteState, parseZoning, siteFitQuestion, type SiteFit, toSiteFit, TYPOLOGIES, type TypologyId } from "../typology/site-fit";

const SQ_M_TO_SQ_FT = 10.7639;
const M_TO_FT = 3.28084;

const share = z.number().min(0).max(1).nullable().optional();

// Street addresses come from the County's assessment records on WPRDC. Only the
// address fields are requested: the table also has tax-bill mailing
// addresses, which must not be ingested (no PII).
const ASSESSMENTS_URL = "https://data.wprdc.org/api/3/action/datastore_search";
const ASSESSMENTS_RESOURCE = "65855e14-549e-4992-b5be-d629afc676fa";
const ADDRESS_FIELDS = ["PARID", "PROPERTYHOUSENUM", "PROPERTYFRACTION", "PROPERTYADDRESS", "PROPERTYUNIT", "PROPERTYCITY", "PROPERTYSTATE", "PROPERTYZIP"];
const addressCache = new Map<string, string | null>();
const ADDRESS_CACHE_LIMIT = 5000;

type AssessmentAddress = Record<(typeof ADDRESS_FIELDS)[number], string | null>;

const titleCase = (text: string) => text.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase());

/** "4307 Dakota St, Pittsburgh, PA 15213", or null when the record has no street. */
export function formatAddress(r: AssessmentAddress): string | null {
  const part = (v: string | null | undefined) => (v ?? "").trim();
  const street = [part(r.PROPERTYHOUSENUM), part(r.PROPERTYFRACTION), titleCase(part(r.PROPERTYADDRESS))].filter(Boolean).join(" ");
  if (!street) return null;
  const unit = part(r.PROPERTYUNIT);
  const city = titleCase(part(r.PROPERTYCITY));
  const stateZip = [part(r.PROPERTYSTATE), part(r.PROPERTYZIP)].filter(Boolean).join(" ");
  return [unit ? `${street} ${unit}` : street, city, stateZip].filter(Boolean).join(", ");
}

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

// Roughly Allegheny County, used to bias/constrain geocoding results so a
// bare street name doesn't resolve somewhere on the other side of the US.
const COUNTY_VIEWBOX = "-80.36,40.68,-79.69,40.19";

const addressSearchInput = z.object({ query: z.string().min(3).max(200) });

type NominatimResult = { display_name: string; lat: string; lon: string };

export const parcelsRouter = {
  // Used to fly the map to a parcel restored from the URL on page load --
  // we only have its PIN at that point, not a screen position.
  getCentroid: publicProcedure.input(z.object({ pin: z.string() })).handler(async ({ input, context }) => {
    const result = await context.db.execute<{ lng: number; lat: number }>(sql`
      SELECT ST_X(ST_Centroid(geom)) AS lng, ST_Y(ST_Centroid(geom)) AS lat
      FROM parcel
      WHERE pin = ${input.pin}
      LIMIT 1
    `);
    const row = result.rows[0];
    return row ? { lng: row.lng, lat: row.lat } : null;
  }),
  // The County assessor's municipality code for a parcel; the app only
  // covers City of Pittsburgh parcels (codes 101-132, one per ward).
  getMunicode: publicProcedure.input(z.object({ pin: z.string() })).handler(async ({ input, context }) => {
    const result = await context.db.execute<{ municode: string | null }>(sql`
      SELECT properties->>'MUNICODE' AS municode FROM parcel WHERE pin = ${input.pin} LIMIT 1
    `);
    const code = Number(result.rows[0]?.municode);
    return { municode: Number.isFinite(code) && code > 0 ? code : null };
  }),
  /** Street addresses for up to 50 parcels, keyed by PIN (null when the County has none). */
  getAddresses: publicProcedure
    .input(z.object({ pins: z.array(z.string().regex(/^[0-9A-Z]{8,20}$/)).max(50) }))
    .handler(async ({ input }) => {
      const missing = [...new Set(input.pins)].filter((p) => !addressCache.has(p));
      if (missing.length) {
        const url = new URL(ASSESSMENTS_URL);
        url.searchParams.set("resource_id", ASSESSMENTS_RESOURCE);
        url.searchParams.set("filters", JSON.stringify({ PARID: missing }));
        url.searchParams.set("fields", ADDRESS_FIELDS.join(","));
        url.searchParams.set("limit", String(missing.length));
        try {
          const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
          if (response.ok) {
            const body = (await response.json()) as { result?: { records?: AssessmentAddress[] } };
            const found = new Map((body.result?.records ?? []).map((r) => [String(r.PARID), formatAddress(r)]));
            if (addressCache.size + missing.length > ADDRESS_CACHE_LIMIT) addressCache.clear();
            for (const p of missing) addressCache.set(p, found.get(p) ?? null);
          }
        } catch {
          // WPRDC down or slow: show no address rather than fail the page.
        }
      }
      return Object.fromEntries(input.pins.map((p) => [p, addressCache.get(p) ?? null]));
    }),
  // Simplified outlines for the dashboard's parcel thumbnails (public boundary data only).
  getOutlines: publicProcedure
    .input(z.object({ pins: z.array(z.string().max(20)).max(100) }))
    .handler(async ({ input, context }) => {
      if (!input.pins.length) return {};
      const result = await context.db.execute<{ pin: string; geojson: string }>(sql`
        SELECT pin, ST_AsGeoJSON(ST_SimplifyPreserveTopology(geom, 0.000003), 6) AS geojson
        FROM parcel
        WHERE pin IN (${sql.join(
          input.pins.map((p) => sql`${p}`),
          sql`, `,
        )})
      `);
      return Object.fromEntries(result.rows.map((row) => [row.pin, JSON.parse(row.geojson) as { type: "Polygon" | "MultiPolygon"; coordinates: unknown }]));
    }),
  searchAddress: publicProcedure.input(addressSearchInput).handler(async ({ input, context }) => {
    // Free, no-API-key geocoder. Usage policy requires a real identifying
    // User-Agent and caps at ~1 req/sec, which the command palette's input
    // debounce already respects.
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "5");
    url.searchParams.set("countrycodes", "us");
    url.searchParams.set("viewbox", COUNTY_VIEWBOX);
    url.searchParams.set("bounded", "1");
    url.searchParams.set("q", `${input.query}, Allegheny County, PA`);

    const response = await fetch(url, {
      headers: { "User-Agent": "HouseHack-Explorer/1.0 (github.com/matmanna/HouseHack)" },
    });
    if (!response.ok) return [];
    const results = (await response.json()) as NominatimResult[];

    return Promise.all(
      results.map(async (r) => {
        const lng = Number(r.lon);
        const lat = Number(r.lat);
        const parcel = await context.db.execute<{ pin: string; municode: string | null }>(sql`
          SELECT pin, properties->>'MUNICODE' AS municode FROM parcel
          WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326))
          LIMIT 1
        `);
        return {
          label: r.display_name,
          lng,
          lat,
          pin: parcel.rows[0]?.pin ?? null,
          municode: parcel.rows[0]?.municode ? Number(parcel.rows[0].municode) : null,
        };
      }),
    );
  }),
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

  // Rates physical site fit for every housing type on one parcel via the
  // System One decision layer. Legal permission is decided entirely
  // client-side (apps/web's typology-meta.ts, from the full 57-district
  // DISTRICT_PATHWAYS table), not here.
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
    const typologies = TYPOLOGIES.map((t) => ({ id: t.id, category: t.category, label: t.label }));
    // Rate physical fit for every typology, even legally "not_permitted"
    // ones: physical fit doesn't depend on zoning, and knowing a lot would
    // comfortably fit a duplex is exactly the fact that makes a rezoning
    // ask worth pursuing rather than a dead end.
    const rated = typologies.map((t) => t.id);
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
      if (answer) fits[id] = toSiteFit(answer, id);
    }
    return { status: "ok", model, fits };
  } catch (error) {
    // Fall back to gates only; never present a failed request as a rating.
    const detail = error instanceof SystemOneError ? `${error.code}: ${error.message}` : "unexpected error";
    console.error(`[system-one] site fit failed (${detail})`);
    return { status: "unavailable", reason: "error" };
  }
}
