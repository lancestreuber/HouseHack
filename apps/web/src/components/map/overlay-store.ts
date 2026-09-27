import { useSyncExternalStore } from "react";

import { INITIAL_OVERLAY_STATE, type OverlayState } from "./overlay-controller";

// Overlay selection plus the map view facts the layers sidebar badges need
// (zoom, loading overlays). Shared between the map (which owns the MapLibre
// instance) and the docked sidebar (which renders the registry), same
// useSyncExternalStore pattern as pillar-weights-store.ts.
type OverlayView = {
  state: OverlayState;
  zoom: number;
  loadingIds: string[];
};

let current: OverlayView = { state: INITIAL_OVERLAY_STATE, zoom: 0, loadingIds: [] };
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function setOverlayState(next: OverlayState) {
  current = { ...current, state: next };
  emit();
}

export function setOverlayView(patch: Partial<Omit<OverlayView, "state">>) {
  current = { ...current, ...patch };
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getOverlayView(): OverlayView {
  return current;
}

export function useOverlayView(): OverlayView {
  return useSyncExternalStore(subscribe, getOverlayView, () => current);
}
