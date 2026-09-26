import { reportContext } from "@HouseHack/api/chat/facts";
import { homewoodEvals, homewoodReport } from "@HouseHack/api/chat/fixtures";
import { createFileRoute } from "@tanstack/react-router";

import { ChatPane } from "@/components/chat/chat-pane";

// Dev preview of the chat pane with mock parcel data (Lane E). Remove once the
// pane is mounted in the real Explorer layout.
export const Route = createFileRoute("/chat-preview")({
  component: ChatPreview,
});

const WEIGHTS = { lot: 1, zoning: 1, hazards: 1, slope: 1, air: 1, transit: 1, parks: 1, health: 1, schools: 1, shops: 1, demand: 1 };
const context = reportContext([{ report: homewoodReport, evals: homewoodEvals }], WEIGHTS);

function ChatPreview() {
  return (
    <div className="grid h-full min-h-0 grid-cols-1 md:grid-cols-[1fr_minmax(360px,440px)]">
      <div className="hidden items-center justify-center border-r border-border text-sm text-muted-foreground md:flex">
        Map and report panes go here. Mock parcel: {context.subject}
      </div>
      <ChatPane context={context} />
    </div>
  );
}
