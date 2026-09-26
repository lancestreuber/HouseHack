import { ExternalLink, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { type CameraFeed, openCamera, subscribeCamera } from "./camera-viewer-store";

function withCacheBust(url: string, tick: number) {
  return `${url}${url.includes("?") ? "&" : "?"}_=${tick}`;
}

// Still image that re-fetches every refresh_s seconds.
function RefreshingImage({ camera }: { camera: CameraFeed }) {
  const [tick, setTick] = useState(() => Date.now());
  const [failed, setFailed] = useState(false);
  const [loadedAt, setLoadedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const refreshMs = (camera.refresh_s ?? 10) * 1000;

  useEffect(() => {
    const refresh = setInterval(() => setTick(Date.now()), refreshMs);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(refresh);
      clearInterval(clock);
    };
  }, [refreshMs]);

  if (failed) return <p className="p-4 text-center text-muted-foreground">Feed is offline right now.</p>;
  return (
    <div className="relative">
      <img
        src={withCacheBust(camera.feed_url, tick)}
        alt={camera.name}
        className="block w-full bg-black"
        onLoad={() => setLoadedAt(Date.now())}
        onError={() => setFailed(true)}
      />
      {loadedAt && (
        <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-[10px] text-white">
          updated {Math.max(0, Math.round((now - loadedAt) / 1000))}s ago · every {refreshMs / 1000}s
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
