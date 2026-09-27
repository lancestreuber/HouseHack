import { sql } from "drizzle-orm";
import z from "zod";

import { publicProcedure } from "../index";

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
        const parcel = await context.db.execute<{ pin: string }>(sql`
          SELECT pin FROM parcel
          WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326))
          LIMIT 1
        `);
        return {
          label: r.display_name,
          lng,
          lat,
          pin: parcel.rows[0]?.pin ?? null,
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
};
