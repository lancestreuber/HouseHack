// Small derived tables built from the raw inputs. Run before build-indicators.ts:
//   bun scripts/pillars/derive-inputs.ts

import { parseCSV } from "../data/geo";

const INPUTS = new URL("./inputs/", import.meta.url).pathname;
const num = (v: string | undefined) => (v == null || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));

// Home sales per 100 owner-occupied units (2024–25). Dividing by all housing
// units made turnover mostly a measure of homeownership share.
const acs = new Map(parseCSV(await Bun.file(`${INPUTS}allegheny_demand_acs_tract.csv`).text()).map((r) => [r.tract, r]));
const rows = ["tract,owner_units,n_sales_2024_2025,sales_per_100_owner_units"];
for (const s of parseCSV(await Bun.file(`${INPUTS}allegheny_tract_sales_2019_2025.csv`).text())) {
  const a = acs.get(s.tract);
  const hh = num(a?.households);
  const own = num(a?.pct_owner);
  const sales = num(s.n_2024_2025);
  const ownerUnits = hh != null && own != null ? Math.round(hh * own) : null;
  const rate = ownerUnits != null && ownerUnits >= 150 && sales != null ? ((sales / ownerUnits) * 100).toFixed(2) : "";
  rows.push([s.tract, ownerUnits ?? "", sales ?? "", rate].join(","));
}
await Bun.write(`${INPUTS}derived_tract_turnover.csv`, `${rows.join("\n")}\n`);
console.log(`derived_tract_turnover.csv: ${rows.length - 1} tracts`);
