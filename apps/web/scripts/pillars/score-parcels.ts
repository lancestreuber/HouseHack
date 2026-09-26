// Scores every parcel with the open weights and writes a CSV. Anyone can pass
// their own weights without touching the published defaults:
//
//   bun scripts/pillars/score-parcels.ts                         # published defaults
//   bun scripts/pillars/score-parcels.ts --preset climate_first  # a named preset
//   bun scripts/pillars/score-parcels.ts --weights my-weights.json --out my-scores.csv
//
// my-weights.json has the same shape as WeightOverrides in src/lib/pillars/score.ts:
//   { "pillars": { "climate": 3 }, "indicators": { "demand_market_strength": 1 }, "overall": "geometric" }

import config from "../../src/lib/pillars/pillars.config.json";
import { PILLAR_IDS, type PillarId, scoreParcel, type WeightOverrides } from "../../src/lib/pillars/score";

const ROOT = new URL("../../", import.meta.url).pathname;
const args = process.argv.slice(2);
const arg = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

let overrides: WeightOverrides = {};
const preset = arg("preset");
if (preset) {
  const weights = (config.presets as Record<string, Partial<Record<PillarId, number>>>)[preset];
  if (!weights) throw new Error(`Unknown preset "${preset}". Options: ${Object.keys(config.presets).join(", ")}`);
  overrides = { pillars: weights };
}
const weightsFile = arg("weights");
if (weightsFile) {
  const custom = (await Bun.file(weightsFile).json()) as WeightOverrides;
  overrides = { ...overrides, ...custom, pillars: { ...overrides.pillars, ...custom.pillars } };
}
const out = arg("out") ?? `${ROOT}public/data/pillars/parcel-scores.csv`;

const data = (await Bun.file(`${ROOT}public/data/pillars/parcel-indicators.json`).json()) as {
  config_version: string;
  missing: number;
  count: number;
  pins: string[];
  zoning: string[];
  indicators: string[];
  columns: Record<string, string>;
};
if (data.config_version !== config.version)
  console.warn(`indicators were built with config ${data.config_version}; current config is ${config.version}. Rebuild if sources changed.`);

const columns = Object.fromEntries(data.indicators.map((id) => [id, Buffer.from(data.columns[id], "base64")]));
const fmt = (v: number | null) => (v == null ? "" : v.toFixed(1));
const lines = [["pin", "zoning", ...PILLAR_IDS, "pillar_blend", "zoning_status", "zoning_x", "site_use", "site_use_x", "overall", "flags"].join(",")];
for (let i = 0; i < data.count; i++) {
  const values: Record<string, number | null> = {};
  for (const id of data.indicators) values[id] = columns[id][i] === data.missing ? null : columns[id][i];
  const s = scoreParcel(values, overrides);
  const flags = PILLAR_IDS.flatMap((p) => s.pillars[p].flags.map((f) => f.text)).join("; ");
  lines.push(
    [
      data.pins[i],
      data.zoning[i],
      ...PILLAR_IDS.map((p) => fmt(s.pillars[p].score)),
      fmt(s.overallBeforeMultipliers),
      s.legal?.id ?? "",
      s.legal?.multiplier ?? "",
      s.availability?.id ?? "",
      s.availability?.multiplier ?? "",
      fmt(s.overall),
      flags ? `"${flags}"` : "",
    ].join(","),
  );
}
await Bun.write(out, `${lines.join("\n")}\n`);
console.log(`scored ${data.count} parcels → ${out}`);
