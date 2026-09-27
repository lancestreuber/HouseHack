import { describe, expect, test } from "bun:test";

import { verdictFor } from "./typology-meta";

// Real buildings from Pro-Housing Pittsburgh's "You Can't Build That Here"
// series (https://www.prohousingpgh.org/ycbth), which a hackathon SME pointed
// teams to. Each apartment building sits in a residential district that no
// longer allows it, so the verdict for apartments on its parcel must be red for
// a zoning reason. Parcels and districts: research/sweeps/r9-sme-pointed-resources.md.
// Cases whose blocker is height, FAR or lot area per unit (e.g. Carson Towers,
// the Clark Building) are not caught; limitations.md says so.
const DATA = new URL("../../../public/data/pillars/parcels", import.meta.url).pathname;
const index = (await Bun.file(`${DATA}/index.json`).json()) as { indicators: string[] };
type Row = [string, (number | null)[], (number | null)[]];

async function parcel(pin: string) {
  const row = ((await Bun.file(`${DATA}/${pin.slice(0, 4)}.json`).json()) as Record<string, Row>)[pin];
  if (!row) throw new Error(`no parcel ${pin}`);
  const norm: Record<string, number | null> = {};
  const raw: Record<string, number | null> = {};
  index.indicators.forEach((id, i) => {
    norm[id] = row[1][i];
    raw[id] = row[2][i];
  });
  return { zoning: row[0], data: { norm, raw } };
}

const CASES: [string, string, string][] = [
  ["5176 Margaret Morrison St", "0053C00093000000", "R2-L"],
  ["732-734 S Millvale Ave", "0051J00037000000", "R2-M"],
  ["The Eaglemoor, 1137 N Highland Ave", "0082M00167000000", "R1D-L"],
  ["School House Apts, 500 Tripoli St", "0023M00196000000", "R1A-VH"],
  ["1703 Broadway Ave", "0035K00192000000", "R1D-H"],
  ["3525 Beechwood Blvd", "0088B00044000000", "R2-M"],
];

describe("verdict on You Can't Build That Here apartment buildings", () => {
  for (const [name, pin, district] of CASES) {
    test(`${name} (${district}): apartments are red, not permitted`, async () => {
      const { zoning, data } = await parcel(pin);
      expect(zoning).toBe(district);
      const v = verdictFor(zoning, "multi_unit", data);
      expect(v.level).toBe("red");
      expect(v.reasons[0].text).toStartWith("Not permitted");
    });
  }
});
