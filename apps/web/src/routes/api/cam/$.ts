import { createFileRoute } from "@tanstack/react-router";

// Same-origin HLS proxy for public traffic-camera streams that are gated by a
// Referer header (PA Turnpike's CloudFront) or lack CORS, so the browser can't
// fetch them directly. We fetch server-side with the right Referer and rewrite
// each playlist's segment URLs to come back through here. Not an open proxy:
// only the hosts below are allowed, and only their video endpoints.
const ALLOWED_HOSTS = [
  /\.cloudfront\.net$/,
  /\.arcadis-ivds\.com$/,
];

// The Referer each upstream expects. Requests without an allowed Referer get a
// 403 from these CDNs.
const REFERER_FOR = (host: string) =>
  host.endsWith("arcadis-ivds.com") ? "https://www.511pa.com/" : "https://www.paturnpike.com/";

function allowed(target: URL) {
  return ALLOWED_HOSTS.some((re) => re.test(target.hostname));
}

const CORS = {
  "access-control-allow-origin": "*",
  "cache-control": "no-store",
};

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
  if (target.protocol !== "https:" || !allowed(target)) {
    return new Response("host not allowed", { status: 403, headers: CORS });
  }

  const upstream = await fetch(target.toString(), {
    headers: { Referer: REFERER_FOR(target.hostname), "User-Agent": "Mozilla/5.0" },
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
      headers: { ...CORS, "content-type": "application/vnd.apple.mpegurl" },
    });
  }

  // Segment / key bytes: stream straight through.
  return new Response(upstream.body, {
    headers: {
      ...CORS,
      "content-type": contentType || "application/octet-stream",
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
