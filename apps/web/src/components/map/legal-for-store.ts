// Which housing type the overall score's zoning factor follows: "easiest" (the
// easiest of the mainstream types, the published default) or one type picked in
// the Parcel Score panel. Shared so the chat scores the parcel the same way the
// panel does; the same useSyncExternalStore pattern as pillar-weights-store.ts.
import { useSyncExternalStore } from "react";

export const EASIEST = "easiest";

let current = EASIEST;
const listeners = new Set<() => void>();

export function setLegalFor(next: string) {
  current = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLegalFor(): string {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => EASIEST,
  );
}
