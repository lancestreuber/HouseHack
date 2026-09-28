import { cn } from "@HouseHack/ui/lib/utils";
import { useLocation } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { useState } from "react";

import { ChatPane } from "./chat-pane";
import { useChatContext } from "./chat-context-store";
import { generalChatContext } from "./parcel-context";
import { stopNatural } from "./voice";

// Pages without the map have no parcel, so the chat explains how Yinzone works.
const GENERAL = generalChatContext();

/**
 * Floating "Ask Parceltongue" button on every page; opens the chat window.
 * Closing only hides it, so reopening keeps the conversation.
 */
export function ChatLauncher() {
  const [open, setOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const context = useChatContext() ?? GENERAL;
  const { pathname } = useLocation();

  const close = () => {
    stopNatural();
    setOpen(false);
  };

  // The explorer (home) page docks the chat into its own pane layout instead,
  // so the floating launcher would just be a redundant second chat there.
  if (pathname === "/app") return null;

  return (
    <>
      {/* The pane portals itself into <body>, so it hides itself rather than relying on a wrapper. */}
      {started && <ChatPane context={context} onClose={close} hidden={!open} />}
      {!open && (
        <LaunchButton
          onClick={() => {
            setStarted(true);
            setOpen(true);
          }}
        />
      )}
    </>
  );
}

function LaunchButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "fixed right-5 z-50 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-[15px] font-medium text-primary-foreground shadow-lg shadow-black/30 transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        import.meta.env.DEV ? "bottom-16" : "bottom-5",
      )}
    >
      <MessageCircle className="size-5" aria-hidden />
      Ask Parceltongue
    </button>
  );
}
