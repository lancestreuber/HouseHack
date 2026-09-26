import { reportContext } from "@HouseHack/api/chat/facts";
import { homewoodEvals, homewoodReport } from "@HouseHack/api/chat/fixtures";
import { cn } from "@HouseHack/ui/lib/utils";
import { MessageCircle } from "lucide-react";
import { useState } from "react";

import { ChatPane } from "./chat-pane";
import { useChatContext } from "./chat-context-store";
import { stopNatural } from "./voice";

// Until a panel selects a real parcel, the chat explains a sample one so it's
// usable from any page. It's labeled as sample data everywhere it appears.
const EQUAL_WEIGHTS = { lot: 1, zoning: 1, hazards: 1, slope: 1, air: 1, transit: 1, parks: 1, health: 1, schools: 1, shops: 1, demand: 1 };
const SAMPLE = (() => {
  const context = reportContext([{ report: homewoodReport, evals: homewoodEvals }], EQUAL_WEIGHTS);
  return {
    ...context,
    subject: `Sample parcel (demo data): ${context.subject}`,
    notes: ["This is a sample parcel with demo data. Pick a parcel on the map to ask about a real one.", ...(context.notes ?? [])],
  };
})();

/**
 * Floating "Ask Groundwork" button on every page; opens the chat window.
 * Closing only hides it, so reopening keeps the conversation.
 */
export function ChatLauncher() {
  const [open, setOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const context = useChatContext() ?? SAMPLE;

  const close = () => {
    stopNatural();
    setOpen(false);
  };

  return (
    <>
      {started && (
        <div hidden={!open}>
          <ChatPane context={context} onClose={close} />
        </div>
      )}
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
      Ask Groundwork
    </button>
  );
}
