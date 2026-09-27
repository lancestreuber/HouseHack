// What the chat is looking at. Any panel calls `setChatContext` with the facts
// it is showing (e.g. the map when a parcel is clicked); the launcher picks it
// up. `null` means nothing is selected, so the launcher uses its sample.
import type { ChatContext } from "@HouseHack/api/chat/types";
import { useSyncExternalStore } from "react";

let current: ChatContext | null = null;
const listeners = new Set<() => void>();

export function setChatContext(context: ChatContext | null) {
  current = context;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useChatContext(): ChatContext | null {
  return useSyncExternalStore(subscribe, () => current, () => null);
}

// Questions sent to the chat from elsewhere on the page (e.g. a scenario card's
// "Ask the chat about this"). The docked chat pane sends them as if typed.
const askListeners = new Set<(question: string) => void>();

export function askChat(question: string) {
  for (const listener of askListeners) listener(question);
}

export function onAskChat(listener: (question: string) => void) {
  askListeners.add(listener);
  return () => {
    askListeners.delete(listener);
  };
}
