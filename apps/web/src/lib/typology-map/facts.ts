// Decodes public/data/typology/facts.bin.gz (built by
// packages/db/src/scripts/build-typology-facts.ts): citywide parcel facts, one
// typed array per column. Facts only; every score is computed from them live.

export const FACTS_URL = "/data/typology/facts.bin.gz";

type ColumnSpec = { name: string; type: "u8" | "f32"; offset: number };
type Header = {
  format: string;
  built: string;
  pillars_config_version: string;
  count: number;
  missing_u8: number;
  indicators: string[];
  zones: string[];
  pins: string[];
  columns: ColumnSpec[];
};

export type Facts = {
  count: number;
  built: string;
  pins: string[];
  zones: string[];
  zone: Uint8Array;
  lng: Float32Array;
  lat: Float32Array;
  widthFt: Float32Array;
  depthFt: Float32Array;
  indicators: string[];
  missing: number;
  norm: Record<string, Uint8Array>;
  raw: Record<string, Float32Array>;
};

export function decodeFacts(buffer: ArrayBuffer): Facts {
  const view = new DataView(buffer);
  const headerLength = view.getUint32(0, true);
  const header = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 4, headerLength))) as Header;
  if (header.format !== "typology-facts/1") throw new Error(`unknown facts format ${header.format}`);
  const start = Math.ceil((4 + headerLength) / 4) * 4;
  const n = header.count;
  const cols = new Map<string, Uint8Array | Float32Array>();
  for (const c of header.columns) {
    cols.set(c.name, c.type === "u8" ? new Uint8Array(buffer, start + c.offset, n) : new Float32Array(buffer, start + c.offset, n));
  }
  const pick = <T>(name: string) => {
    const col = cols.get(name);
    if (!col) throw new Error(`facts file has no column ${name}`);
    return col as T;
  };
  const norm: Record<string, Uint8Array> = {};
  const raw: Record<string, Float32Array> = {};
  for (const name of cols.keys()) {
    if (name.startsWith("norm:")) norm[name.slice(5)] = pick<Uint8Array>(name);
    if (name.startsWith("raw:")) raw[name.slice(4)] = pick<Float32Array>(name);
  }
  return {
    count: n,
    built: header.built,
    pins: header.pins,
    zones: header.zones,
    zone: pick<Uint8Array>("zone"),
    lng: pick<Float32Array>("lng"),
    lat: pick<Float32Array>("lat"),
    widthFt: pick<Float32Array>("width_ft"),
    depthFt: pick<Float32Array>("depth_ft"),
    indicators: header.indicators,
    missing: header.missing_u8,
    norm,
    raw,
  };
}

// Static hosts may or may not add Content-Encoding for a .gz file, so check
// the gzip magic bytes rather than trusting headers.
export async function gunzipIfNeeded(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  const head = new Uint8Array(buffer, 0, 2);
  if (head[0] !== 0x1f || head[1] !== 0x8b) return buffer;
  const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).arrayBuffer();
}

export async function loadFacts(url = FACTS_URL): Promise<Facts> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`facts file ${url}: HTTP ${response.status}`);
  return decodeFacts(await gunzipIfNeeded(await response.arrayBuffer()));
}
