// Prints the full score breakdown for one or more parcels: legal status, overall,
// every pillar and sub-score with its phrase, and each indicator's raw value,
// normalized score, weight and points. Same numbers as the map panel.
//
//   bun scripts/pillars/explain-parcel.ts 0027C00049000B00 [more pins...]

import config from "../../src/lib/pillars/pillars.config.json";
import { PILLAR_IDS, scoreParcel } from "../../src/lib/pillars/score";

const ROOT = new URL("../../", import.meta.url).pathname;
const index = (await Bun.file(`${ROOT}public/data/pillars/parcels/index.json`).json()) as { indicators: string[] };
const parcels = (await Bun.file(`${ROOT}.cache/pillars/parcels.geojson`).json()) as {
  features: { properties: Record<string, unknown> }[];
};
const meta = new Map(parcels.features.map((f) => [f.properties.pin as string, f.properties]));
const phrases = config.phrases as Record<string, { min: number; text: string }[]>;
const phrase = (key: string, s: number | null) => (s == null ? "" : (phrases[key]?.find((b) => s >= b.min)?.text ?? ""));
const f1 = (v: number | null | undefined) => (v == null ? "—" : v.toFixed(1));

for (const pin of process.argv.slice(2)) {
  const shard = (await Bun.file(`${ROOT}public/data/pillars/parcels/${pin.slice(0, 4)}.json`).json()) as Record<
    string,
    [string, (number | null)[], (number | null)[]]
  >;
  const row = shard[pin];
  if (!row) {
    console.log(`\n${pin}: no scores (not a City parcel?)`);
    continue;
  }
  const norm: Record<string, number | null> = {};
  const raw: Record<string, number | null> = {};
  index.indicators.forEach((id, i) => {
    norm[id] = row[1][i];
    raw[id] = row[2][i];
  });
  const s = scoreParcel(norm);
  const m = meta.get(pin) ?? {};
  console.log(`\n=== ${pin} · ${m.hood ?? "?"} · zoning ${row[0]} · ${m.classdesc ?? ""} / ${m.usedesc ?? ""} · vacant=${m.Vacant ?? "?"} · owner=${m.OwnerCateg ?? "?"} · lot ${Math.round(Number(m.Shape__Area) || 0)} sq ft`);
  console.log(`Legal: ${s.legal?.label ?? "unknown"} (×${s.legal?.multiplier ?? 1})`);
  console.log(`Overall ${f1(s.overall)} (before legal ${f1(s.overallBeforeLegal)}): ${phrase("overall", s.overall)}`);
  for (const p of PILLAR_IDS) {
    const ps = s.pillars[p];
    const def = config.pillars.find((x) => x.id === p)!;
    console.log(`\n  ${def.label}: ${f1(ps.score)} — ${phrase(p, ps.score)}${ps.flags.length ? ` [${ps.flags.join("; ")}]` : ""}`);
    for (const sub of ps.subscores) console.log(`    sub ${sub.id}: ${f1(sub.score)} — ${phrase(sub.id, sub.score)}`);
    const shares = new Map(ps.contributions.map((c) => [c.indicator, c.share]));
    for (const ind of config.indicators.filter((i) => i.pillar === p)) {
      const sub = (ind as { sub?: string }).sub;
      console.log(
        `    - ${ind.id}${sub ? ` [${sub}]` : ""}: raw ${raw[ind.id] ?? "—"} (${(ind as { unit?: string }).unit ?? ""}) → ${norm[ind.id] ?? "missing"}/100, w ${ind.weight}, +${f1(shares.get(ind.id))} pts`,
      );
    }
  }
}
