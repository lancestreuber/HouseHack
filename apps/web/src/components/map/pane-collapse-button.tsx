import { Button } from "@HouseHack/ui/components/button";
import { ChevronDown, ChevronUp } from "lucide-react";

/** Small icon button for a pane header that collapses/expands its
 * ResizablePanel. `collapsed` only drives which chevron shows -- the actual
 * collapse/expand call is the caller's (it owns the panelRef). */
export function PaneCollapseButton({
  collapsed,
  onClick,
  label,
}: {
  collapsed: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      onClick={onClick}
      aria-label={collapsed ? `Expand ${label}` : `Collapse ${label}`}
      title={collapsed ? `Expand ${label}` : `Collapse ${label}`}
      className="text-muted-foreground hover:text-foreground"
    >
      {collapsed ? <ChevronDown /> : <ChevronUp />}
    </Button>
  );
}