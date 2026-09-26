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
};
