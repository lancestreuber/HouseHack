// The user's pencil-check assumptions (construction $/sf, site cost), shared by
// every pane that shows a verdict and remembered in localStorage. The server
// always renders the defaults.
import { useSyncExternalStore } from "react";

import { DEFAULT_PENCIL, type PencilAssumptions } from "./pencil";

const KEY = "pencil-assumptions-v1";

let current: PencilAssumptions | null = null;
const listeners = new Set<() => void>();

function load(): PencilAssumptions {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (saved && typeof saved === "object") return { ...DEFAULT_PENCIL, ...saved };
  } catch {}
  return DEFAULT_PENCIL;
}

export function setPencilAssumptions(next: PencilAssumptions) {
  current = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePencilAssumptions(): PencilAssumptions {
  return useSyncExternalStore(
    subscribe,
    () => (current ??= load()),
    () => DEFAULT_PENCIL,
  );
}
