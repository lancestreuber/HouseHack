// Recomputes the default-weight score quantiles in public/data/pillars/parcels/index.json
// from the existing indicator build, for when only weights, gates or multipliers
// in pillars.config.json change (build-indicators.ts does this too, but needs every source).
//
//   bun scripts/pillars/rebuild-quantiles.ts   (needs public/data/pillars/parcel-indicators.json)

import config from "../../src/lib/pillars/pillars.config.json";
import { type PillarId, scoreParcel } from "../../src/lib/pillars/score";

const ROOT = new URL("../../", import.meta.url).pathname;
const INDEX = `${ROOT}public/data/pillars/parcels/index.json`;

const data = (await Bun.file(`${ROOT}public/data/pillars/parcel-indicators.json`).json()) as {
  config_version: string;
  missing: number;
  count: number;
  indicators: string[];
  columns: Record<string, string>;
};
const index = await Bun.file(INDEX).json();
if (data.config_version !== index.config_version)
  throw new Error(`indicator build ${data.config_version} doesn't match the shards (${index.config_version}); run build-indicators.ts`);

const columns = Object.fromEntries(data.indicators.map((id) => [id, Buffer.from(data.columns[id], "base64")]));
const dist: Record<string, number[]> = { overall: [] };
for (const p of config.pillars) dist[p.id] = [];
for (let i = 0; i < data.count; i++) {
  const values: Record<string, number | null> = {};
  for (const id of data.indicators) values[id] = columns[id][i] === data.missing ? null : columns[id][i];
  const s = scoreParcel(values);
  if (s.overall != null) dist.overall.push(s.overall);
  for (const p of config.pillars) {
    const v = s.pillars[p.id as PillarId].score;
    if (v != null) dist[p.id].push(v);
  }
}
const quantiles = Object.fromEntries(
  Object.entries(dist).map(([k, v]) => {
    v.sort((a, b) => a - b);
    return [k, Array.from({ length: 101 }, (_, q) => Number(v[Math.min(v.length - 1, Math.floor((q / 100) * (v.length - 1)))].toFixed(2)))];
  }),
);
await Bun.write(INDEX, JSON.stringify({ ...index, scoring_config_version: config.version, quantiles }));
console.log(`rewrote quantiles for ${dist.overall.length} parcels (scoring config ${config.version})`);
