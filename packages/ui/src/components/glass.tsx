import { cn } from "@HouseHack/ui/lib/utils";
import * as React from "react";

export type GlassEdge = "left" | "right" | "top" | "bottom" | "none";

const EDGE_DIRECTION: Record<GlassEdge, string> = {
  left: "to left",
  right: "to right",
  top: "to top",
  bottom: "to bottom",
  none: "to right",
};

/**
 * The translucent, blurred surface every pane and floating overlay is made of.
 * `edge` names the edge that touches the map: that edge's Scrim is see-through
 * while the body (where text sits) is dense. `edge="none"` renders a flat fill.
 */
export function GlassSurface({
  edge = "none",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { edge?: GlassEdge }) {
  return (
    <div
      className={cn("glass-surface overflow-hidden rounded-xl", edge === "none" && "glass-surface--flat", className)}
      style={{ "--glass-dir": EDGE_DIRECTION[edge] } as React.CSSProperties}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * The lighter second layer inside a pane that groups one topic under a title
 * row with an optional right-side action.
 */
export function SectionCard({
  title,
  action,
  className,
  children,
  ...props
}: React.ComponentProps<"section"> & {
  title?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section
      className={cn("rounded-lg border border-glass-border bg-glass-card p-3", className)}
      {...props}
    >
      {(title != null || action != null) && (
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-[13px] font-semibold tracking-[-0.01em]">{title}</h3>
          {action != null && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}