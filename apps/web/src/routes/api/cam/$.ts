import { createFileRoute } from "@tanstack/react-router";

// Same-origin proxy for public camera feeds the browser can't fetch directly
// (Referer-gated, mixed-content, or broken CORS). We fetch server-side and, for
// playlists, rewrite segment URLs to come back through here. Not an open proxy:
// each entry pins a host, and a `path` where the host is a shared/multi-tenant
// CDN, so the endpoint can't be used to proxy arbitrary content.
const HLS_PATH = /\.(m3u8|ts)$/;
const ALLOWED: { host: RegExp; path?: RegExp }[] = [
  // Shared CDNs — restrict to HLS stream files so they can't proxy anything else.
  { host: /\.cloudfront\.net$/, path: HLS_PATH }, // PA Turnpike streams
  { host: /\.arcadis-ivds\.com$/, path: HLS_PATH }, // 511PA streams
  // 511PA camera stills live only under /map/Cctv/<id>.
  { host: /^www\.511pa\.com$/, path: /^\/map\/Cctv\// },
  // Single-purpose camera hosts (a dedicated device or image bucket) — host is
  // enough; proxying anything else they serve gains nothing.
  { host: /^96\.69\.79\.178$/ }, // PPG Place StarDot cam (HTTP-only)
  { host: /^usgs-nims-images\.s3\.amazonaws\.com$/ },
  { host: /^images\.weatherstem\.com$/ },
  { host: /^wx\.w3sll\.net$/ },
  { host: /^images\.webcamgalore\.com$/ },
];

// The Referer the gated CDNs expect (a wrong/absent Referer gets a 403). Other
// allowlisted hosts (e.g. the PPG cam) need none.
const REFERER_FOR = (host: string): string | undefined => {
  if (host.endsWith("cloudfront.net")) return "https://www.paturnpike.com/";
  if (host.endsWith("arcadis-ivds.com")) return "https://www.511pa.com/";
  return undefined;
};

function allowed(target: URL) {
  return ALLOWED.some((e) => e.host.test(target.hostname) && (!e.path || e.path.test(target.pathname)));
}

const CORS = { "access-control-allow-origin": "*" };
// The live playlist must always be refetched (its segment window slides every
// few seconds). Segments are immutable — each URL is a unique sequence number —
// so let Vercel's CDN cache them: repeat viewers of the same camera are served
// from the edge instead of re-invoking this function.
const PLAYLIST_CACHE = "no-store";
const SEGMENT_CACHE = "public, max-age=60, s-maxage=60";

async function handle({ request }: { request: Request }) {
  const url = new URL(request.url);
  const raw = url.searchParams.get("u");
  if (!raw) return new Response("missing u", { status: 400, headers: CORS });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new Response("bad u", { status: 400, headers: CORS });
  }
  if (!/^https?:$/.test(target.protocol) || !allowed(target)) {
    return new Response("host not allowed", { status: 403, headers: CORS });
  }

  const referer = REFERER_FOR(target.hostname);
  const upstream = await fetch(target.toString(), {
    headers: { "User-Agent": "Mozilla/5.0", ...(referer ? { Referer: referer } : {}) },
  }).catch(() => null);
  if (!upstream || !upstream.ok) {
    return new Response(`upstream ${upstream?.status ?? "unreachable"}`, { status: 502, headers: CORS });
  }

  const contentType = upstream.headers.get("content-type") ?? "";
  const isPlaylist = /mpegurl/i.test(contentType) || target.pathname.endsWith(".m3u8");

  if (isPlaylist) {
    const text = await upstream.text();
    const self = `${url.origin}/api/cam`;
    // Rewrite every non-comment URI and every URI="..." attribute so segments,
    // keys and sub-playlists all flow back through this proxy.
    const rewrite = (ref: string) => {
      const abs = new URL(ref, target).toString();
      return `${self}?u=${encodeURIComponent(abs)}`;
    };
    const body = text
      .split("\n")
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return line;
        if (trimmed.startsWith("#")) {
          return line.replace(/URI="([^"]+)"/g, (_m, ref) => `URI="${rewrite(ref)}"`);
        }
        return rewrite(trimmed);
      })
      .join("\n");
    return new Response(body, {
      headers: { ...CORS, "content-type": "application/vnd.apple.mpegurl", "cache-control": PLAYLIST_CACHE },
    });
  }

  // Still images must stay fresh (no edge caching); HLS segments are immutable
  // and cacheable. Forward Last-Modified so the viewer can show true frame age.
  const isImage = /^image\//i.test(contentType);
  const lastModified = upstream.headers.get("last-modified");
  return new Response(upstream.body, {
    headers: {
      ...CORS,
      "content-type": contentType || "application/octet-stream",
      "cache-control": isImage ? "no-store" : SEGMENT_CACHE,
      ...(lastModified ? { "last-modified": lastModified } : {}),
    },
  });
}

export const Route = createFileRoute("/api/cam/$")({
  server: {
    handlers: {
      GET: handle,
      HEAD: handle,
    },
  },
});
