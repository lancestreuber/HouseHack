// Global pillar weights (spec: PLAN.md C3/D5 -- a weights button in the top
// bar, one slider per consideration, live-updating the Parcel Score). Shared
// across the navbar (which owns the control) and the map/scores pane (which
// reads it), the same useSyncExternalStore pattern as chat-context-store.ts.
import type { PillarId } from "@/lib/pillars/score";
import { useSyncExternalStore } from "react";

export type PillarWeights = Partial<Record<PillarId, number>>;

let current: PillarWeights = {};
const listeners = new Set<() => void>();

export function setPillarWeights(next: PillarWeights) {
  current = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPillarWeights(): PillarWeights {
  return current;
}

export function usePillarWeights(): PillarWeights {
  return useSyncExternalStore(subscribe, getPillarWeights, () => ({}));
}

// Compact ?w= encoding: "id:value,id:value", only pillars that differ from
// their published default. Order-independent, no JSON/URI-escaping noise.
export function encodeWeights(weights: PillarWeights): string | undefined {
  const entries = Object.entries(weights).filter(([, v]) => v !== undefined);
  if (!entries.length) return undefined;
  return entries.map(([id, v]) => `${id}:${v}`).join(",");
}

export function decodeWeights(raw: string | undefined): PillarWeights {
  if (!raw) return {};
  const out: PillarWeights = {};
  for (const pair of raw.split(",")) {
    const [id, value] = pair.split(":");
    const n = Number(value);
    if (id && Number.isFinite(n)) out[id as PillarId] = n;
  }
  return out;
}
