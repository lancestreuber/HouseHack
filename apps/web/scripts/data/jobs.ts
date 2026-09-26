// Local economy by census block group:
// - Where jobs are: LEHD LODES8 Workplace Area Characteristics 2023 (public domain),
//   block-level counts summed to block groups.
// - Jobs reachable by transit: UMN Accessibility Observatory, Access Across America:
//   Transit 2024 (CC BY-NC 4.0), block-group weighted average, 30 and 45 minutes.
// - Job change 2019–2023, resident workers and in-commuters: LODES WAC/RAC/OD,
//   from the extract in inputs/ (made by inputs/jobs_extract.py).

import path from "node:path";

import { writeOverlay, type GeoJSONFeature } from "./arcgis";
import { parseCSV } from "./geo";

const WAC = "https://lehd.ces.census.gov/data/lodes/LODES8/pa/wac/pa_wac_S000_JT00_2023.csv.gz";
const UMN_ZIP = "https://conservancy.umn.edu/server/api/core/bitstreams/82f5db0b-5e6b-495b-9685-374219785c17/content";
const UMN_MEMBER = "Pennsylvania_42_transit_block_group_2024.csv";
const CR_GEO = "https://api.censusreporter.org/1.0/geo/show/latest?geo_ids=150|05000US42003";

const DEMAND = path.resolve(import.meta.dirname, "inputs/allegheny_jobs_demand_bg_2023.csv");

const SQ_M_PER_SQ_MI = 2_589_988;
// Percent change on a small 2019 base is mostly noise.
const MIN_BASE_JOBS = 50;

async function gunzipText(url: string) {
  const buf = new Uint8Array(await (await fetch(url)).arrayBuffer());
  return new TextDecoder().decode(Bun.gunzipSync(buf));
}

// The UMN release is a zip; extract one member with the system unzip tool.
async function unzipMember(url: string, member: string) {
  const zipPath = `${Bun.env.TMPDIR ?? "/tmp"}/umn-transit-access.zip`;
  const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (HouseHack map builder)" } });
  if (!res.ok) throw new Error(`UMN zip: HTTP ${res.status}`);
  await Bun.write(zipPath, await res.arrayBuffer());
  const out = Bun.spawnSync(["unzip", "-p", zipPath, member]);
  if (out.exitCode !== 0) throw new Error(`unzip failed: ${out.stderr.toString()}`);
  return out.stdout.toString();
}

export async function buildJobs() {
  const jobs = new Map<string, { total: number; retailFood: number; health: number; lowWage: number }>();
  for (const r of parseCSV(await gunzipText(WAC))) {
    if (!r.w_geocode?.startsWith("42003")) continue;
    const bg = r.w_geocode.slice(0, 12);
    const acc = jobs.get(bg) ?? { total: 0, retailFood: 0, health: 0, lowWage: 0 };
    acc.total += Number(r.C000);
    acc.retailFood += Number(r.CNS07) + Number(r.CNS18);
    acc.health += Number(r.CNS16);
    acc.lowWage += Number(r.CE01);
    jobs.set(bg, acc);
  }

  const access = new Map<string, { t30?: number; t45?: number }>();
  for (const r of parseCSV(await unzipMember(UMN_ZIP, UMN_MEMBER))) {
    const id = r["Census ID"];
    if (!id?.startsWith("42003") || (r.Threshold !== "30" && r.Threshold !== "45")) continue;
    const acc = access.get(id) ?? {};
    acc[r.Threshold === "30" ? "t30" : "t45"] = Math.round(Number(r.Weighted_average_total_jobs));
    access.set(id, acc);
  }

  const demand = new Map(parseCSV(await Bun.file(DEMAND).text()).map((r) => [r.geoid, r]));
  const num = (v: string | undefined) => (v == null || v === "" ? null : Number(v));

  const geo = await fetch(CR_GEO).then((r) => r.json() as Promise<{ features: GeoJSONFeature[] }>);
  const features = geo.features.map((f) => {
    const id = String(f.properties.geoid).replace(/^15000US/, "");
    const j = jobs.get(id);
    const landSqMi = Number(f.properties.aland ?? 0) / SQ_M_PER_SQ_MI;
    const a = access.get(id);
    const d = demand.get(id);
    const base = num(d?.jobs_2019);
    const share = num(d?.in_commuter_share);
    return {
      type: "Feature" as const,
      geometry: f.geometry,
      properties: {
        geoid: id,
        jobs: j?.total ?? 0,
        jobs_per_sq_mi: landSqMi > 0 ? Math.round((j?.total ?? 0) / landSqMi) : null,
        retail_food_jobs: j?.retailFood ?? 0,
        health_jobs: j?.health ?? 0,
        low_wage_share_pct: j && j.total > 0 ? Math.round((j.lowWage / j.total) * 1000) / 10 : null,
        transit_jobs_30: a?.t30 ?? null,
        transit_jobs_45: a?.t45 ?? null,
        jobs_2019: base,
        jobs_change: num(d?.jobs_change),
        jobs_change_pct:
          base != null && base >= MIN_BASE_JOBS && d?.jobs_change_pct ? Math.round(Number(d.jobs_change_pct) * 1000) / 10 : null,
        resident_workers: num(d?.resident_workers),
        jobs_per_resident_worker: num(d?.jobs_per_resident_worker),
        in_commuter_share_pct: share == null ? null : Math.round(share * 1000) / 10,
      },
    };
  });
  await writeOverlay("jobs.geojson", {
    type: "FeatureCollection",
    features,
    metadata: { sources: [WAC, UMN_ZIP, "inputs/allegheny_jobs_demand_bg_2023.csv"], builtAt: new Date().toISOString() },
  });
}

if (import.meta.main) await buildJobs();
