// The user's pillar weights ("Your priorities"), shared by every pane that
// scores a parcel (the scores panel and the chat) and remembered in
// localStorage. The server always renders the defaults.
import { useSyncExternalStore } from "react";

import config from "./pillars.config.json";
import type { PillarId } from "./score";

export type PillarWeights = Record<PillarId, number>;

const WEIGHTS_KEY = "pillars-weights-v1";
export const DEFAULT_WEIGHTS = Object.fromEntries(config.pillars.map((p) => [p.id, p.weight])) as PillarWeights;

let current: PillarWeights | null = null;
const listeners = new Set<() => void>();

function load(): PillarWeights {
  try {
    const saved = JSON.parse(localStorage.getItem(WEIGHTS_KEY) ?? "null");
    if (saved && typeof saved === "object") return { ...DEFAULT_WEIGHTS, ...saved };
  } catch {}
  return DEFAULT_WEIGHTS;
}

export function setPillarWeights(weights: PillarWeights) {
  current = weights;
  try {
    localStorage.setItem(WEIGHTS_KEY, JSON.stringify(weights));
  } catch {}
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePillarWeights(): PillarWeights {
  return useSyncExternalStore(
    subscribe,
    () => (current ??= load()),
    () => DEFAULT_WEIGHTS,
  );
}
