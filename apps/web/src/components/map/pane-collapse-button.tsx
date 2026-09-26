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
    <button
      type="button"
      onClick={onClick}
      aria-label={collapsed ? `Expand ${label}` : `Collapse ${label}`}
      title={collapsed ? `Expand ${label}` : `Collapse ${label}`}
      className="rounded p-1 text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
    >
      {collapsed ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
    </button>
  );
}
