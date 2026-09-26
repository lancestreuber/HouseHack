import "varlock/auto-load";
import { Readable } from "node:stream";

import { neon } from "@neondatabase/serverless";
import { chain } from "stream-chain";
import { parser } from "stream-json";
import { pick } from "stream-json/filters/pick.js";
import { streamArray } from "stream-json/streamers/stream-array.js";

// Streams the countywide Allegheny County parcel GeoJSON (~444MB, ~500k+
// features) straight from WPRDC into Postgres without ever buffering the
// whole file in memory. Source geometries are in EPSG:2272 (PA State Plane
// South, feet) and are reprojected to EPSG:4326 (lon/lat) in the DB via
// ST_Transform so they can be rendered on a standard web map.
const SOURCE_URL =
  "https://data.wprdc.org/dataset/709e4e52-6f82-4cd0-a848-f3e2b3f5d22b/resource/3f50d47a-ab54-4da2-9f03-8519006e9fc9/download/alleghenycounty_parcels202609.geojson";
const SOURCE_SRID = 2272;
const BATCH_SIZE = 2000;
const LOG_EVERY = 10_000;

type Feature = {
  geometry: unknown;
  properties: Record<string, unknown>;
};

async function insertBatch(
  sql: { query: (text: string, params: unknown[]) => Promise<unknown> },
  batch: Feature[],
): Promise<void> {
  if (batch.length === 0) return;

  const pins: string[] = [];
  const properties: string[] = [];
  const geojsonStrings: string[] = [];

  for (const feature of batch) {
    const pin = String(feature.properties.PIN ?? feature.properties.FID);
    pins.push(pin);
    properties.push(JSON.stringify(feature.properties));
    geojsonStrings.push(JSON.stringify(feature.geometry));
  }

  await sql.query(
    `
      INSERT INTO parcel (pin, properties, geom)
      SELECT
        t.pin,
        t.properties::jsonb,
        ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON(t.geojson), $2), 4326)
      FROM unnest($1::text[], $3::text[], $4::text[]) AS t(pin, properties, geojson)
      ON CONFLICT (pin) DO NOTHING
    `,
    [pins, SOURCE_SRID, properties, geojsonStrings],
  );
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");
  const sql = neon(databaseUrl);

  console.log(`Downloading + streaming ${SOURCE_URL}`);
  const response = await fetch(SOURCE_URL);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to fetch source geojson: ${response.status}`);
  }

  const pipeline = chain([
    Readable.fromWeb(response.body as never),
    parser(),
    pick({ filter: "features" }),
    streamArray(),
  ]);

  let batch: Feature[] = [];
  let total = 0;
  const start = Date.now();

  for await (const { value } of pipeline as AsyncIterable<{
    value: Feature;
  }>) {
    batch.push(value);
    if (batch.length >= BATCH_SIZE) {
      await insertBatch(sql, batch);
      total += batch.length;
      batch = [];
      if (total % LOG_EVERY < BATCH_SIZE) {
        const elapsed = ((Date.now() - start) / 1000).toFixed(0);
        console.log(`imported ${total} parcels (${elapsed}s elapsed)`);
      }
    }
  }
  await insertBatch(sql, batch);
  total += batch.length;

  console.log(`Done. Imported ${total} parcels.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
