// Which typology's scenario card is open, if any. A typology tile opens it;
// the explorer map shows it for the selected parcel.
import { useSyncExternalStore } from "react";

export type OpenScenario = { typologyId: string };

let current: OpenScenario | null = null;
const listeners = new Set<() => void>();

function set(next: OpenScenario | null) {
  current = next;
  for (const listener of listeners) listener();
}

export const openScenario = (typologyId: string) => set({ typologyId });
export const closeScenario = () => set(null);

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useScenario(): OpenScenario | null {
  return useSyncExternalStore(subscribe, () => current, () => null);
}
