// Audits every registered overlay against its data: file exists, feature count,
// and for each property a style/filter reads, how many features have a value.
// Run from apps/web: `bun scripts/data/audit-overlays.ts`.

import path from "node:path";

import { OVERLAYS } from "../../src/components/map/overlays";

const PUBLIC = path.resolve(import.meta.dirname, "../../public");

function getRefs(expr: unknown, out: Set<string>) {
  if (!Array.isArray(expr)) return;
  if (expr[0] === "get" && typeof expr[1] === "string") out.add(expr[1]);
  for (const e of expr) getRefs(e, out);
}

for (const def of OVERLAYS) {
  const metrics = def.metrics ?? [undefined];
  const src = def.source;
  if (src.kind !== "static") {
    console.log(`${def.id} [${def.group}] ${src.kind} source (checked separately)`);
    continue;
  }
  const file = Bun.file(path.join(PUBLIC, src.url));
  if (!(await file.exists())) {
    console.log(`✗ ${def.id}: MISSING FILE ${src.url}`);
    continue;
  }
  const fc = (await file.json()) as { features: { properties: Record<string, unknown>; geometry: unknown }[] };
  const n = fc.features.length;
  const noGeom = fc.features.filter((f) => !f.geometry).length;
  const lines: string[] = [];
  for (const metric of metrics) {
    const refs = new Set<string>();
    for (const layer of def.layers("x", metric as never)) {
      const l = layer as { paint?: Record<string, unknown>; filter?: unknown };
      for (const v of Object.values(l.paint ?? {})) getRefs(v, refs);
      getRefs(l.filter, refs);
    }
    for (const r of refs) {
      const has = fc.features.filter((f) => f.properties?.[r] != null && f.properties?.[r] !== "").length;
      const flag = has === 0 ? "✗ ALL NULL" : has / n < 0.5 ? "⚠ <50%" : "";
      lines.push(`   ${metric ? `${metric.id}: ` : ""}${r} ${has}/${n} ${flag}`);
    }
    const sample = fc.features.find((f) => f.properties) ?? fc.features[0];
    try {
      const tip = sample ? def.tooltip(sample.properties, metric as never) : [];
      if (tip.some((t) => /undefined|NaN|null|\[object/.test(String(t)))) lines.push(`   ⚠ tooltip: ${JSON.stringify(tip)}`);
    } catch (e) {
      lines.push(`   ✗ tooltip throws: ${e}`);
    }
    if (!def.legend(metric as never).length) lines.push("   ✗ empty legend");
  }
  const bad = lines.some((l) => l.includes("✗") || l.includes("⚠"));
  console.log(`${bad ? "!" : "✓"} ${def.id} [${def.group}] ${n} features${noGeom ? ` (${noGeom} no geometry)` : ""}`);
  for (const l of lines) if (bad ? true : false) console.log(l);
  if (bad) continue;
}
