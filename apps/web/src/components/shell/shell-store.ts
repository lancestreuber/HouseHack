import { useSyncExternalStore } from "react";

// Shell-level UI state (layers sidebar / inspector visibility), shared between
// the nav rail (which restores them) and the explorer panes (which hide them).
// Same hand-rolled useSyncExternalStore pattern as pillar-weights-store.ts.
type ShellState = {
  sidebarOpen: boolean;
  inspectorOpen: boolean;
};

let current: ShellState = { sidebarOpen: true, inspectorOpen: true };
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function setShellState(patch: Partial<ShellState>) {
  current = { ...current, ...patch };
  emit();
}

export function toggleSidebar() {
  setShellState({ sidebarOpen: !current.sidebarOpen });
}

export function toggleInspector() {
  setShellState({ inspectorOpen: !current.inspectorOpen });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getShellState(): ShellState {
  return current;
}

export function useShellState(): ShellState {
  return useSyncExternalStore(subscribe, getShellState, () => current);
}
