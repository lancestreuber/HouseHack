// Public live cameras in Allegheny County, each with a feed the browser can
// show directly when a point is clicked.
// - Traffic: PennDOT and PA Turnpike cameras published on 511PA. The site's
//   own camera list gives each camera's still image, refreshed about every
//   10 s and served with CORS open. Their HLS video needs a per-session token
//   and was failing on 511PA itself when checked, so only stills are used.
// - Everything else (webcams, river locks, air-quality smoke cams, stream
//   gauges, airport weather cams, ...): hand-verified list in
//   inputs/cameras/curated.json.
// - ALPR (license plate reader) locations from OpenStreetMap: location only,
//   no feed, written to a separate file (inputs/cameras/alpr.json).
// Only feeds their owners publish on purpose. No unsecured private cameras.

import path from "node:path";

import { writeOverlay, type GeoJSONFeature } from "./arcgis";
import { polygonIndex } from "./geo";

const DIR = path.resolve(import.meta.dirname, "inputs/cameras");
const COUNTY =
  "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/1/query?where=GEOID%3D%2742003%27&outFields=GEOID&outSR=4326&f=geojson";
const PA511 = "https://www.511pa.com";
// PA Turnpike publishes working HLS video (unlike PennDOT's own cameras, whose
// stream server 401s even on 511PA's site). These roadways touch the county.
const TURNPIKE_ROADWAYS = [
  "ef2829cb-fea1-4083-af4c-9bfbd85b8568", // I-76 mainline
  "2e8b2a93-1f81-4fed-8919-58b33b638eb8", // PA-576 Southern Beltway
];
// The Turnpike CDN is Referer-gated, so play it through our same-origin proxy.
const hlsProxy = (streamUrl: string) => `/api/cam?u=${encodeURIComponent(streamUrl)}`;

const round = (v: number) => Math.round(v * 1e5) / 1e5;
const distMeters = (aLat: number, aLon: number, bLat: number, bLon: number) => {
  const dLat = (aLat - bLat) * 111_320;
  const dLon = (aLon - bLon) * 111_320 * Math.cos((aLat * Math.PI) / 180);
  return Math.hypot(dLat, dLon);
};

export type FeedType = "jpeg" | "mjpeg" | "hls" | "youtube" | "iframe" | "link";

// One row of inputs/cameras/curated.json.
export type CuratedCamera = {
  id: string;
  name: string;
  operator: string;
  category: string;
  lat: number;
  lon: number;
  coord_quality?: "exact" | "approx";
  feed_type: FeedType;
  feed_url: string;
  page_url: string;
  refresh_s?: number;
  attribution?: string;
  verified_at?: string;
};

type Pa511Image = { id: number; imageUrl: string; disabled: boolean; blocked: boolean };
type Pa511Site = {
  id: number;
  source: string;
  roadway: string;
  direction: string;
  location: string;
  latLng: { geography: { wellKnownText: string } };
  images: Pa511Image[];
};

type TurnpikeCam = { CameraName: string; DisplayName: string; Description: string; Latitude: number; Longitude: number; StreamURL: string | null };

async function fetchTurnpike(): Promise<TurnpikeCam[]> {
  const cams: TurnpikeCam[] = [];
  for (const roadway of TURNPIKE_ROADWAYS) {
    const res = await fetch(`https://www.paturnpike.com/traveling/traffic-cameras/getbyroadway?roadwayId=${roadway}`, {
      headers: { "X-Requested-With": "XMLHttpRequest", Referer: "https://www.paturnpike.com/", "User-Agent": "Mozilla/5.0" },
    });
    if (!res.ok) throw new Error(`turnpike ${roadway}: HTTP ${res.status}`);
    const data = ((await res.json()) as { Data: unknown }).Data;
    const list = (Array.isArray(data) ? data : Object.values(data as Record<string, unknown>).find(Array.isArray)) as TurnpikeCam[];
    for (const cam of list ?? []) if (cam.StreamURL) cams.push(cam);
  }
  return cams;
}

async function fetch511pa(): Promise<Pa511Site[]> {
  const sites: Pa511Site[] = [];
  // The list endpoint caps pages at 100 rows.
  for (let start = 0; ; start += 100) {
    const query = JSON.stringify({ columns: [{ data: null, name: "" }], start, length: 100 });
    const res = await fetch(`${PA511}/List/GetData/Cameras?query=${encodeURIComponent(query)}&lang=en-US`, {
      headers: { "User-Agent": "Mozilla/5.0 (HouseHack map build)" },
    });
    if (!res.ok) throw new Error(`511PA cameras: HTTP ${res.status}`);
    const page = (await res.json()) as { data: Pa511Site[]; recordsTotal: number };
    sites.push(...page.data);
    if (page.data.length < 100 || sites.length >= page.recordsTotal) break;
  }
  return sites;
}

function feature(lon: number, lat: number, properties: Record<string, unknown>): GeoJSONFeature {
  return { type: "Feature", geometry: { type: "Point", coordinates: [round(lon), round(lat)] }, properties };
}

export async function buildCameras() {
  const county = (await fetch(COUNTY).then((r) => r.json())) as { features: GeoJSONFeature[] };
  const index = polygonIndex([{ key: true, geometry: county.features[0].geometry as never }]);
  const inCounty = (lon: number, lat: number) => index(lon, lat) === true;

  const features: GeoJSONFeature[] = [];

  // PA Turnpike cams that have a working HLS stream and fall inside the county.
  const turnpike = (await fetchTurnpike()).filter((c) => inCounty(c.Longitude, c.Latitude));

  const sites = await fetch511pa();
  let skipped = 0;
  let upgraded = 0;
  for (const site of sites) {
    const [lon, lat] = (site.latLng.geography.wellKnownText.match(/-?[\d.]+/g) ?? []).map(Number);
    if (!inCounty(lon, lat)) continue;
    const image = site.images.find((i) => !i.disabled && !i.blocked);
    if (!image) {
      skipped++;
      continue;
    }
    const operator = site.source === "PTC" ? "PA Turnpike Commission" : "PennDOT";
    const snapshotUrl = `${PA511}${image.imageUrl}`;
    // If this is a Turnpike camera, pair it with the Turnpike CDN stream so it
    // plays as real video, with the 511PA still as the poster/fallback.
    const stream =
      site.source === "PTC"
        ? turnpike.find((c) => distMeters(lat, lon, c.Latitude, c.Longitude) < 250)
        : undefined;
    if (stream) upgraded++;
    features.push(
      feature(lon, lat, {
        id: `511pa-${site.id}`,
        name: site.location.trim(),
        operator,
        category: "traffic",
        feed_type: stream ? "hls" : "jpeg",
        feed_url: stream ? hlsProxy(stream.StreamURL!) : snapshotUrl,
        snapshot_url: stream ? snapshotUrl : null,
        page_url: `${PA511}/map#Cameras-${site.id}`,
        refresh_s: stream ? null : 10,
        coord_quality: "exact",
        attribution: `${operator} via 511PA`,
      }),
    );
  }
  // Turnpike cams that 511PA doesn't list, added straight from the Turnpike feed.
  const matched = new Set(
    turnpike.filter((c) => sites.some((s) => {
      const [lon, lat] = (s.latLng.geography.wellKnownText.match(/-?[\d.]+/g) ?? []).map(Number);
      return s.source === "PTC" && distMeters(lat, lon, c.Latitude, c.Longitude) < 250;
    })).map((c) => c.CameraName),
  );
  for (const cam of turnpike) {
    if (matched.has(cam.CameraName)) continue;
    features.push(
      feature(cam.Longitude, cam.Latitude, {
        id: `paturnpike-${cam.CameraName}`,
        name: `PA Turnpike ${cam.DisplayName} — ${cam.Description}`.trim(),
        operator: "PA Turnpike Commission",
        category: "traffic",
        feed_type: "hls",
        feed_url: hlsProxy(cam.StreamURL!),
        snapshot_url: null,
        page_url: "https://www.paturnpike.com/traveling/traffic-cameras",
        refresh_s: null,
        coord_quality: "exact",
        attribution: "PA Turnpike Commission",
      }),
    );
  }
  console.log(`511PA: ${features.length - (turnpike.length - matched.size)} county cameras (${upgraded} Turnpike upgraded to live video, ${skipped} disabled/blocked); +${turnpike.length - matched.size} Turnpike-only video cams`);

  const curated = (await Bun.file(`${DIR}/curated.json`).json()) as CuratedCamera[];
  for (const cam of curated) {
    if (!inCounty(cam.lon, cam.lat)) console.warn(`curated camera outside county line, kept: ${cam.id}`);
    const { lat, lon, ...rest } = cam;
    features.push(feature(lon, lat, { coord_quality: "exact", refresh_s: null, ...rest }));
  }

  await writeOverlay("cameras.geojson", {
    type: "FeatureCollection",
    features,
    metadata: { sources: [`${PA511}/cctv`, "inputs/cameras/curated.json"], builtAt: new Date().toISOString() },
  });

  const alpr = (await Bun.file(`${DIR}/alpr.json`).json()) as { lat: number; lon: number; [k: string]: unknown }[];
  await writeOverlay("alpr-cameras.geojson", {
    type: "FeatureCollection",
    features: alpr.filter((a) => inCounty(a.lon, a.lat)).map(({ lat, lon, ...props }) => feature(lon, lat, props)),
    metadata: { source: "OpenStreetMap (ODbL) via Overpass; inputs/cameras/alpr.json", builtAt: new Date().toISOString() },
  });
}

if (import.meta.main) await buildCameras();
