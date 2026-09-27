import { createFileRoute } from "@tanstack/react-router";

// Same-origin HLS proxy for public traffic-camera streams that are gated by a
// Referer header (PA Turnpike's CloudFront) or lack CORS, so the browser can't
// fetch them directly. We fetch server-side with the right Referer and rewrite
// each playlist's segment URLs to come back through here. Not an open proxy:
// only the hosts below are allowed, and only their video endpoints.
const ALLOWED_HOSTS = [
  /\.cloudfront\.net$/,
  /\.arcadis-ivds\.com$/,
  // PPG Place downtown plaza cam (StarDot), HTTP-only — proxied so it works on
  // an HTTPS page without mixed-content blocking.
  /^96\.69\.79\.178$/,
  // Still-image cameras. These send ACAO:* but pair it with
  // Allow-Credentials:true, which browsers reject, so a direct fetch() fails —
  // proxying makes them same-origin and lets us read their Last-Modified.
  /^www\.511pa\.com$/,
  /^usgs-nims-images\.s3\.amazonaws\.com$/,
  /^images\.weatherstem\.com$/,
  /^wx\.w3sll\.net$/,
];

// The Referer the gated CDNs expect (a wrong/absent Referer gets a 403). Other
// allowlisted hosts (e.g. the PPG cam) need none.
const REFERER_FOR = (host: string): string | undefined => {
  if (host.endsWith("cloudfront.net")) return "https://www.paturnpike.com/";
  if (host.endsWith("arcadis-ivds.com")) return "https://www.511pa.com/";
  return undefined;
};

function allowed(target: URL) {
  return ALLOWED_HOSTS.some((re) => re.test(target.hostname));
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
