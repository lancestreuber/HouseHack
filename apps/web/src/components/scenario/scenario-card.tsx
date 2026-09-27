// A typology's scenario for the selected parcel: a card beside a pin on the
// map with the tile's score breakdown, its alerts, and up to five pros and five
// cons checked against the parcel's data. Clicking a point shows the map layers
// behind it; the map goes back to how it was when the card closes.
import type { ChatFact, ReplyBlock } from "@HouseHack/api/chat/types";
import { useQuery } from "@tanstack/react-query";
import { MapPin, MessageCircle, X } from "lucide-react";
import { type Map as MapLibreMap, Marker } from "maplibre-gl";
import { useEffect, useMemo, useRef, useState } from "react";

import config from "@/lib/pillars/pillars.config.json";
import { scoreParcel } from "@/lib/pillars/score";
import { orpc } from "@/utils/orpc";

import { askChat } from "../chat/chat-context-store";
import { FactChip } from "../chat/fact-chip";
import { scenarioChatContext, tileScore, typologyScore, useParcelChatContext } from "../chat/parcel-context";
import { Disclaimer } from "../disclaimer";
import { typologyAlerts } from "../map/alerts-panel";
import type { OverlayState } from "../map/overlay-controller";
import { OVERLAYS } from "../map/overlays";
import { PATHWAY_META, TYPOLOGIES } from "../map/overlays/legal-feasibility";
import { DISTRICT_PATHWAYS } from "../map/overlays/legal-matrix.generated";
import { usePillarWeights } from "../map/pillar-weights-store";
import { fmtScore, ScoreBar, scoreColor, useParcelData, useTypologyFit } from "../map/pillars-panel";
import { SHORT_LABEL, SITE_FIT_TYPOLOGY } from "../map/typology-meta";
import { type LayerPick, layersForPoint, scenarioOverlayState } from "./layers";
import { closeScenario } from "./scenario-store";

const CARD_W = 340;
const GAP = 18;
const MARGIN = 8;
// Below this map width the card becomes a bottom sheet instead of floating by the pin.
const SHEET_BELOW = 560;

type Point = ReplyBlock & { side: "pro" | "con"; key: string };

export function ScenarioCard({
  map,
  pin,
  typologyId,
  overlayState,
  setOverlayState,
}: {
  map: MapLibreMap | null;
  pin: string;
  typologyId: string;
  overlayState: OverlayState;
  setOverlayState: (state: OverlayState) => void;
}) {
  const name = SHORT_LABEL[typologyId] ?? TYPOLOGIES.find(([id]) => id === typologyId)?.[1] ?? typologyId;
  const { data } = useParcelData(pin);
  const fit = useTypologyFit(pin, data);
  const weights = usePillarWeights();
  const parcelContext = useParcelChatContext(pin);
  // The overall score, zoning factor and what-ifs follow this type, not the easiest one.
  const context = useMemo(
    () => (parcelContext && data ? scenarioChatContext(parcelContext, data, weights, typologyId) : parcelContext),
    [parcelContext, data, weights, typologyId],
  );

  // Everything about this typology on this parcel, as the panels show it.
  const zoning = data?.zoning ?? "";
  const pathway = PATHWAY_META[DISTRICT_PATHWAYS[zoning]?.[typologyId] ?? ""];
  const tile = data ? tileScore(zoning, typologyId) : null;
  const siteFitId = SITE_FIT_TYPOLOGY[typologyId];
  const siteFit = siteFitId ? fit.data?.typologies.find((t) => t.id === siteFitId)?.fit : undefined;
  const alerts = fit.data && siteFitId ? (typologyAlerts(fit.data).find((a) => a.id === siteFitId)?.notes ?? []) : [];
  const ownScore = useMemo(() => (data ? typologyScore(data, weights, typologyId) : null), [data, weights, typologyId]);
  const score = useMemo(() => ownScore ?? (data ? scoreParcel(data.norm, { pillars: weights }) : null), [ownScore, data, weights]);

  // Pros and cons, once the site-fit facts (Jev, alerts) are in the context.
  const focus = context
    ? [`overall.${typologyId}`, `t.${typologyId}`, `verdict.${typologyId}`, `fit.${typologyId}`, ...(siteFitId ? [`alert.${siteFitId}`] : [])].filter((id) => context.facts.some((f) => f.id === id))
    : [];
  const result = useQuery({
    ...orpc.chat.scenario.queryOptions({ input: { context: context!, typology: { id: typologyId, name }, focus } }),
    enabled: Boolean(context) && !fit.isPending,
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });
  const points: Point[] =
    result.data?.status === "ok"
      ? [
          ...result.data.pros.map((p, i) => ({ ...p, side: "pro" as const, key: `pro-${i}` })),
          ...result.data.cons.map((p, i) => ({ ...p, side: "con" as const, key: `con-${i}` })),
        ]
      : [];
  const facts = result.data?.status === "ok" ? result.data.facts : [];
  const factText = (id: string) => context?.facts.find((f) => f.id === id)?.text ?? "";

  // The map: where this type is legal, plus the hazard layers behind the cons;
  // a clicked point shows just its own layers. Restored on close.
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => setActive(null), [typologyId]);
  // The map as it was before any scenario opened; switching typology keeps it.
  const before = useRef(overlayState);
  const defaultLayers = useMemo<LayerPick>(() => {
    const stack = new Set<string>();
    for (const p of points.filter((p) => p.side === "con")) {
      for (const id of layersForPoint(p.fact_ids, typologyId, factText).stack) {
        if (OVERLAYS.find((o) => o.id === id)?.group === "hazard") stack.add(id);
      }
    }
    return { stack: [...stack] };
    // Points are rebuilt each render; their source is `result.data`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.data, typologyId]);
  const activePoint = points.find((p) => p.key === active);
  const layers = activePoint ? layersForPoint(activePoint.fact_ids, typologyId, factText) : defaultLayers;
  const layerKey = JSON.stringify(layers);
  useEffect(() => {
    setOverlayState(scenarioOverlayState(before.current, typologyId, layers));
    // `layers` is keyed by value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layerKey, typologyId, setOverlayState]);
  useEffect(() => () => setOverlayState(before.current), [setOverlayState]);

  // The pin, and the card's place beside it.
  const centroid = useQuery({ ...orpc.parcels.getCentroid.queryOptions({ input: { pin } }), staleTime: Number.POSITIVE_INFINITY });
  const at = centroid.data;
  const [place, setPlace] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  useEffect(() => {
    if (!map || !at) return;
    const marker = new Marker({ color: "#F2C230" }).setLngLat([at.lng, at.lat]).addTo(map);
    const box = map.getContainer();
    // Center on the parcel, shifted so the floating card (to its left) doesn't cover the pin.
    const floatsButCramped = box.clientWidth >= SHEET_BELOW && box.clientWidth < 2 * (CARD_W + GAP + MARGIN);
    const shift = floatsButCramped ? (CARD_W + GAP) / 2 : 0;
    if (map.getZoom() < 16 || !map.getBounds().contains([at.lng, at.lat]) || shift) {
      map.flyTo({ center: [at.lng, at.lat], zoom: Math.max(map.getZoom(), 17), offset: [shift, 0] });
    }
    const update = () => {
      const p = map.project([at.lng, at.lat]);
      setPlace({ x: p.x, y: p.y, w: box.clientWidth, h: box.clientHeight });
    };
    update();
    map.on("move", update);
    map.on("resize", update);
    return () => {
      map.off("move", update);
      map.off("resize", update);
      marker.remove();
    };
  }, [map, at?.lng, at?.lat]);

  const card = useRef<HTMLDivElement>(null);
  const sheet = !place || place.w < SHEET_BELOW;
  const style = (() => {
    if (sheet || !place) return undefined;
    const h = card.current?.offsetHeight ?? 320;
    const right = place.x + GAP + CARD_W <= place.w - MARGIN;
    const left = right ? place.x + GAP : Math.max(MARGIN, place.x - GAP - CARD_W);
    const top = Math.min(Math.max(place.y - 60, MARGIN), Math.max(MARGIN, place.h - h - MARGIN));
    return { left, top, width: CARD_W, maxHeight: place.h - 2 * MARGIN };
  })();

  const question = `What should I know about the ${name} scenario for this parcel?`;

  return (
    <div
      ref={card}
      role="dialog"
      aria-label={`${name} scenario`}
      style={style}
      className={
        sheet
          ? "absolute inset-x-2 bottom-2 z-20 max-h-[60%] overflow-y-auto rounded-lg border bg-background/95 text-xs shadow-xl backdrop-blur"
          : "absolute z-20 overflow-y-auto rounded-lg border bg-background/95 text-xs shadow-xl backdrop-blur"
      }
    >
      <header className="sticky top-0 flex items-start justify-between gap-2 border-b bg-background/95 p-3">
        <div>
          <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            <MapPin className="size-3" aria-hidden /> Scenario · Parcel {pin}
          </p>
          <h3 className="text-sm font-semibold">Building: {name}</h3>
        </div>
        <button type="button" onClick={closeScenario} aria-label="Close scenario" className="rounded p-1 hover:bg-foreground/10">
          <X className="size-4" />
        </button>
      </header>

      <div className="space-y-3 p-3">
        <section className="grid grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-1.5">
          <span className="text-2xl font-semibold tabular-nums" style={{ color: scoreColor(tile) }}>
            {tile ?? "—"}
          </span>
          <span className="text-muted-foreground">Typology score · {pathway?.label ?? "Unresolved in the code"}</span>

          <span className="text-muted-foreground">Site fit</span>
          <span>
            {fit.isPending ? (
              <span className="text-muted-foreground">Checking with Jev…</span>
            ) : siteFit ? (
              <span className="flex items-center gap-1.5">
                <span className="w-16">
                  <ScoreBar score={siteFit.fit * 100} />
                </span>
                {siteFit.label}, {Math.round(siteFit.confidence * 100)}% confidence
                {siteFit.needsReview && <span className="text-yellow-500"> · needs review</span>}
              </span>
            ) : (
              <span className="text-muted-foreground">{siteFitId ? "Jev isn't available right now" : "Jev doesn't rate this type"}</span>
            )}
          </span>

          <span className="text-muted-foreground">Overall</span>
          <span>
            <span className="font-medium tabular-nums">{fmtScore(score?.overall ?? null)}</span> of 100 {ownScore ? `for a ${name} here` : "for this parcel (zoning factor: easiest mainstream type)"}
            {score && (score.legal || score.availability || score.hazard) && (
              <span className="text-muted-foreground">
                {" "}
                · zoning ×{score.legal?.multiplier ?? 1}, site ×{score.availability?.multiplier ?? 1}
                {score.hazard && `, hazard ×${score.hazard.multiplier}`}
              </span>
            )}
          </span>
        </section>

        {alerts.length > 0 && (
          <section className="space-y-1">
            {alerts.map((note) => (
              <p key={note} className="rounded border border-yellow-400/30 bg-yellow-400/10 px-2 py-1 text-yellow-600 dark:text-yellow-400">
                {note}
              </p>
            ))}
          </section>
        )}

        {result.isPending || !context || fit.isPending ? (
          <section className="space-y-1.5" aria-busy>
            <p className="text-muted-foreground">Weighing pros and cons from this parcel's data…</p>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-3 animate-pulse rounded bg-foreground/10" />
            ))}
          </section>
        ) : result.isError || result.data?.status !== "ok" ? (
          <section className="space-y-1.5">
            <p className="text-muted-foreground">
              {result.data?.status === "unavailable" ? result.data.reason : "Couldn't load pros and cons right now."}
            </p>
            <button type="button" onClick={() => void result.refetch()} className="rounded border px-2 py-0.5 hover:bg-foreground/10">
              Try again
            </button>
          </section>
        ) : (
          <>
            <PointList title="Pros" empty="No clear pros in this parcel's data." points={points.filter((p) => p.side === "pro")} facts={facts} active={active} onPick={setActive} />
            <PointList title="Cons" empty="No clear cons in this parcel's data." points={points.filter((p) => p.side === "con")} facts={facts} active={active} onPick={setActive} />
            <p className="text-muted-foreground">
              {active ? "Showing this point's map layers. Click it again for the full view." : `The map shows where ${name} is allowed. Click a point to see its layers.`}
            </p>
          </>
        )}

        <div className="flex items-center justify-between gap-2 border-t pt-2">
          <button type="button" onClick={() => askChat(question)} className="flex items-center gap-1 rounded border px-2 py-1 hover:bg-foreground/10">
            <MessageCircle className="size-3.5" aria-hidden /> Ask the chat about this
          </button>
          <span className="text-[10px] text-muted-foreground">Weights: {weightsLabel(weights)}</span>
        </div>
        <Disclaimer />
      </div>
    </div>
  );
}

function weightsLabel(weights: Partial<Record<string, number>>) {
  return config.pillars.every((p) => (weights[p.id] ?? p.weight) === p.weight) ? "equal" : "your priorities";
}

function PointList({
  title,
  empty,
  points,
  facts,
  active,
  onPick,
}: {
  title: "Pros" | "Cons";
  empty: string;
  points: Point[];
  facts: ChatFact[];
  active: string | null;
  onPick: (key: string | null) => void;
}) {
  const tone = title === "Pros" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
  return (
    <section className="space-y-1">
      <h4 className={`font-semibold ${tone}`}>{title}</h4>
      {points.length === 0 && <p className="text-muted-foreground">{empty}</p>}
      <ul className="space-y-1">
        {points.map((p) => (
          <li key={p.key}>
            <button
              type="button"
              aria-pressed={active === p.key}
              onClick={() => onPick(active === p.key ? null : p.key)}
              className={`w-full rounded px-2 py-1 text-left leading-snug transition-colors hover:bg-foreground/5 ${active === p.key ? "bg-foreground/10 ring-1 ring-foreground/20" : ""}`}
            >
              {p.text}
            </button>
            <span className="flex flex-wrap gap-1 px-2">
              {p.fact_ids.map((id) => {
                const fact = facts.find((f) => f.id === id);
                return fact ? <FactChip key={id} fact={fact} /> : null;
              })}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
