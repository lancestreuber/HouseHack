import { ExternalLink, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { type CameraFeed, openCamera, subscribeCamera } from "./camera-viewer-store";

function withCacheBust(url: string, tick: number) {
  return `${url}${url.includes("?") ? "&" : "?"}_=${tick}`;
}

// Auto-refreshing still. These CDNs (511PA/CloudFront, USGS S3) ignore
// cache-busting query strings and cache each frame ~60s, so a plain <img> that
// swaps its src looks frozen. Instead we fetch the bytes ourselves, read the
// real Last-Modified, and only swap the picture when the frame actually changes
// — and we show the true frame age so it's honest about how live it is.
function RefreshingImage({ camera }: { camera: CameraFeed }) {
  const [src, setSrc] = useState<string | null>(null);
  // Real capture time from Last-Modified; null until first successful load.
  const [frameAt, setFrameAt] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  // Poll often enough to catch the next ~60s frame promptly, but back off for
  // slow sources (e.g. a 30-min weather-cam cache) so we don't hammer them.
  const pollMs = ((camera.refresh_s ?? 15) > 300 ? 60 : 15) * 1000;

  useEffect(() => {
    let cancelled = false;
    let lastModified = "";
    let objectUrl: string | null = null;
    let everLoaded = false;

    const tick = async () => {
      try {
        const res = await fetch(withCacheBust(camera.feed_url, Date.now()), { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const lm = res.headers.get("last-modified") ?? "";
        const blob = await res.blob();
        if (cancelled) return;
        everLoaded = true;
        setFailed(false);
        // Swap when the frame is genuinely new. Some cams send no Last-Modified
        // (empty lm) — treat every fetch as fresh so they still animate.
        if (!lm || lm !== lastModified || !objectUrl) {
          lastModified = lm;
          if (objectUrl) URL.revokeObjectURL(objectUrl);
          objectUrl = URL.createObjectURL(blob);
          setSrc(objectUrl);
          setFrameAt(lm ? Date.parse(lm) : Date.now());
        }
      } catch {
        if (!cancelled && !everLoaded) setFailed(true);
      }
    };

    void tick();
    const poll = setInterval(tick, pollMs);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      cancelled = true;
      clearInterval(poll);
      clearInterval(clock);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [camera.feed_url, pollMs]);

  if (failed && !src) return <p className="p-4 text-center text-muted-foreground">Feed is offline right now.</p>;
  return (
    <div className="relative">
      {src ? (
        <img src={src} alt={camera.name} className="block w-full bg-black" />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-black text-[10px] text-white/70">loading…</div>
      )}
      {frameAt && (
        <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-[10px] text-white">
          frame {Math.max(0, Math.round((now - frameAt) / 1000))}s old
        </span>
      )}
    </div>
  );
}

function HlsVideo({ url, poster }: { url: string; poster?: string | null }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    setFailed(false);
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      return;
    }
    let destroy: (() => void) | undefined;
    let cancelled = false;
    void import("hls.js").then(({ default: Hls }) => {
      if (cancelled) return;
      if (!Hls.isSupported()) return setFailed(true);
      const hls = new Hls({ liveSyncDurationCount: 2 });
      hls.on(Hls.Events.ERROR, (_e, data) => data.fatal && setFailed(true));
      hls.loadSource(url);
      hls.attachMedia(video);
      destroy = () => hls.destroy();
    });
    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [url]);
  // If the live stream drops, fall back to the auto-refreshing still.
  if (failed) {
    return poster ? (
      <RefreshingImage camera={{ feed_url: poster, refresh_s: 10 } as CameraFeed} />
    ) : (
      <p className="p-4 text-center text-muted-foreground">Stream is offline right now.</p>
    );
  }
  return <video ref={ref} poster={poster ?? undefined} className="block w-full bg-black" autoPlay muted playsInline controls />;
}

function youtubeEmbed(url: string) {
  const u = new URL(url);
  u.searchParams.set("autoplay", "1");
  u.searchParams.set("mute", "1");
  return u.toString();
}

function Feed({ camera }: { camera: CameraFeed }) {
  switch (camera.feed_type) {
    case "jpeg":
      return <RefreshingImage camera={camera} />;
    case "mjpeg":
      return <img src={camera.feed_url} alt={camera.name} className="block w-full bg-black" />;
    case "hls":
      return <HlsVideo url={camera.feed_url} poster={camera.snapshot_url} />;
    case "youtube":
    case "iframe":
      return (
        <iframe
          src={camera.feed_type === "youtube" ? youtubeEmbed(camera.feed_url) : camera.feed_url}
          title={camera.name}
          className="block aspect-video w-full bg-black"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          // Some embeds (e.g. EarthCam's Warhol cam) are full web pages with a
          // frame-buster that does `top.location = ...` to hijack the whole tab.
          // Sandbox without allow-top-navigation lets the player run but blocks
          // it from navigating our page. (YouTube's embed doesn't need this but
          // works fine under it.)
          sandbox="allow-scripts allow-same-origin allow-popups allow-presentation allow-forms"
        />
      );
    default:
      return (
        <a href={camera.page_url} target="_blank" rel="noreferrer" className="block p-4 text-center underline">
          This feed only plays on the owner's site. Open it ↗
        </a>
      );
  }
}

export function CameraViewer() {
  const [camera, setCamera] = useState<CameraFeed | null>(null);
  useEffect(() => subscribeCamera(setCamera), []);
  if (!camera) return null;

  return (
    <div className="absolute bottom-10 right-2 z-20 w-[min(420px,calc(100%-1rem))] overflow-hidden rounded-md border bg-background/95 text-xs shadow-lg backdrop-blur">
      <div className="flex items-start gap-2 border-b px-2 py-1.5">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 font-medium">
            <span className="inline-block h-2 w-2 shrink-0 animate-pulse rounded-full bg-red-500" />
            <span className="truncate">{camera.name}</span>
          </p>
          <p className="truncate text-muted-foreground">{camera.attribution ?? camera.operator}</p>
        </div>
        <a href={camera.page_url} target="_blank" rel="noreferrer" title="Open on source site" className="p-0.5">
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <button type="button" onClick={() => openCamera(null)} title="Close" className="p-0.5">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <Feed key={camera.id} camera={camera} />
      {camera.coord_quality === "approx" && (
        <p className="px-2 py-1 text-muted-foreground">Map position is approximate.</p>
      )}
    </div>
  );
}
