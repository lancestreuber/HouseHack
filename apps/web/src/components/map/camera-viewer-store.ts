// Bridges a click on a camera point (handled by the overlay registry, outside
// React) to the floating live viewer mounted next to the map.

export type CameraFeed = {
  id: string;
  name: string;
  operator: string;
  category: string;
  feed_type: "jpeg" | "mjpeg" | "hls" | "youtube" | "iframe" | "link";
  feed_url: string;
  snapshot_url?: string | null;
  page_url: string;
  refresh_s?: number | null;
  coord_quality?: string;
  attribution?: string;
};

type Listener = (camera: CameraFeed | null) => void;
const listeners = new Set<Listener>();

export function openCamera(camera: CameraFeed | null) {
  for (const listener of listeners) listener(camera);
}

export function subscribeCamera(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
