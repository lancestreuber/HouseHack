// The chat's map tool: turn map layers on and off for the user. The page sends
// its layer catalog and what the map shows now; every call is checked against
// that catalog here, so the model can only pick layers that exist.
import type { FunctionDeclaration } from "./gemini";
import type { ChatContext, MapLayerInfo, MapView } from "./types";

type MapInfo = NonNullable<ChatContext["map"]>;

export const MAP_TOOL = "show_map_layers";

function catalog(layers: MapLayerInfo[]): string {
  return layers
    .map(
      (l) =>
        `${l.id}: ${l.label} [${l.heat ? "background" : l.group}]${l.metrics?.length ? ` (metrics: ${l.metrics.map((m) => `${m.id} = ${m.label}`).join("; ")})` : ""}`,
    )
    .join("\n");
}

export function mapTool(map: MapInfo): FunctionDeclaration {
  const heat = map.layers.filter((l) => l.heat).map((l) => l.id);
  const stack = map.layers.filter((l) => !l.heat).map((l) => l.id);
  return {
    name: MAP_TOOL,
    description: `Change which layers the map beside the chat shows. Use it when the user asks to see, show, hide, turn on or off, or map something, or what the map would look like with certain conditions. One "background" layer colors the whole map at a time (optionally with one of its metrics); any number of other layers can be stacked on top. Layers:\n${catalog(map.layers)}`,
    parameters: {
      type: "object",
      properties: {
        background: {
          type: "string",
          description: 'The one background layer to color the map with, or "none" to remove it. Leave out to keep the current one.',
          enum: [...heat, "none"],
        },
        metric: { type: "string", description: "For a background layer with metrics: the metric id to color by." },
        show: { type: "array", items: { type: "string", enum: stack }, description: "Stacked layers to turn on." },
        hide: { type: "array", items: { type: "string", enum: stack }, description: "Stacked layers to turn off." },
        only: {
          type: "boolean",
          description: "true to turn off every stacked layer not listed in show; false (default) keeps the others on.",
        },
      },
    },
  };
}

const find = (layers: MapLayerInfo[], raw: unknown) => {
  const key = String(raw ?? "").trim().toLowerCase();
  return layers.find((l) => l.id.toLowerCase() === key) ?? layers.find((l) => l.label.toLowerCase() === key);
};
const list = (raw: unknown) => (Array.isArray(raw) ? raw : raw == null || raw === "" ? [] : [raw]);

function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

/** Plain words for a map view, e.g. for the fact the chat cites. */
export function describeView(view: MapView, map: MapInfo): string {
  const layer = (id: string) => map.layers.find((l) => l.id === id);
  const heat = view.heat && layer(view.heat.id);
  const metric = heat && view.heat?.metric ? heat.metrics?.find((m) => m.id === view.heat?.metric) : undefined;
  const background = heat ? `${heat.label}${metric ? ` (${metric.label})` : ""} as the colored background` : "no colored background layer";
  const stacked = view.stack.map((id) => layer(id)?.label ?? id);
  const text = `${background}${stacked.length ? `, plus ${joinNames(stacked)}` : ", and no other layers"}`;
  // Layers that only draw close up would look missing when zoomed out.
  const later = [heat, ...view.stack.map(layer)].filter(
    (l): l is MapLayerInfo => Boolean(l?.minZoom && (map.zoom == null || map.zoom < l.minZoom)),
  );
  return `${text}.${later.length ? ` ${joinNames(later.map((l) => l.label))} ${later.length > 1 ? "appear" : "appears"} only once the map is zoomed in closer.` : ""}`;
}

export type MapCallResult = { ok: true; view: MapView; text: string } | { ok: false; error: string };

/** Apply one tool call to the current view, or explain what was wrong with it. */
export function resolveMapCall(args: Record<string, unknown>, map: MapInfo): MapCallResult {
  const unknown: string[] = [];
  let heat = map.current.heat ? { ...map.current.heat } : null;
  let stack = args.only === true ? [] : [...map.current.stack];

  if (args.background != null && args.background !== "") {
    if (String(args.background).toLowerCase() === "none") heat = null;
    else {
      const layer = find(map.layers, args.background);
      if (!layer) unknown.push(String(args.background));
      else if (!layer.heat) stack.push(layer.id);
      else heat = { id: layer.id, metric: heat?.id === layer.id ? heat.metric : undefined };
    }
  }
  for (const raw of list(args.hide)) {
    const layer = find(map.layers, raw);
    if (!layer) unknown.push(String(raw));
    else if (layer.heat && heat?.id === layer.id) heat = null;
    else stack = stack.filter((id) => id !== layer.id);
  }
  for (const raw of list(args.show)) {
    const layer = find(map.layers, raw);
    if (!layer) unknown.push(String(raw));
    // A background layer asked for as a stacked one becomes the background.
    else if (layer.heat) heat = { id: layer.id };
    else if (!stack.includes(layer.id)) stack.push(layer.id);
  }
  if (unknown.length) return { ok: false, error: `No map layer called ${unknown.join(", ")}. Use layer ids from the list, or tell the user the map doesn't have that data.` };

  if (heat) {
    const layer = map.layers.find((l) => l.id === heat?.id)!;
    const metrics = layer.metrics ?? [];
    if (args.metric != null && args.metric !== "") {
      const key = String(args.metric).toLowerCase();
      const metric = metrics.find((m) => m.id.toLowerCase() === key) ?? metrics.find((m) => m.label.toLowerCase() === key);
      if (!metric) {
        return {
          ok: false,
          error: metrics.length
            ? `${layer.label} has no metric ${args.metric}. Its metrics: ${metrics.map((m) => m.id).join(", ")}.`
            : `${layer.label} has no metrics; leave metric out.`,
        };
      }
      heat.metric = metric.id;
    }
    // No choice given: keep the map's current metric, else the layer's first.
    if (!heat.metric && metrics.length) heat.metric = metrics[0]!.id;
  }

  const view: MapView = { heat, stack };
  // What each shown layer means, so the reply can explain what they're looking at.
  const shown = [heat?.id, ...stack].map((id) => map.layers.find((l) => l.id === id)).filter((l) => l?.description);
  const meaning = shown.map((l) => `${l!.label}: ${l!.description!.trim().replace(/\.?$/, ".")}`).join(" ");
  return { ok: true, view, text: `The map now shows ${describeView(view, map)}${meaning ? ` What these show: ${meaning}` : ""}` };
}
