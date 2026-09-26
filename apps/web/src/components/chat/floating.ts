import { useCallback, useEffect, useRef, useState } from "react";

export type Rect = { x: number; y: number; w: number; h: number };
export type Edge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const STORAGE_KEY = "groundwork.chat.window";
const MIN_W = 340;
const MIN_H = 380;
const MARGIN = 8;

function defaultRect(): Rect {
  const w = Math.min(460, window.innerWidth - 2 * MARGIN);
  const h = Math.min(640, window.innerHeight - 2 * MARGIN);
  return { x: window.innerWidth - w - 24, y: window.innerHeight - h - 24, w, h };
}

/** Keep the window fully on screen and at least the minimum size. */
export function clampRect(r: Rect, vw: number, vh: number): Rect {
  const w = Math.min(Math.max(r.w, Math.min(MIN_W, vw - 2 * MARGIN)), vw - 2 * MARGIN);
  const h = Math.min(Math.max(r.h, Math.min(MIN_H, vh - 2 * MARGIN)), vh - 2 * MARGIN);
  const x = Math.min(Math.max(r.x, MARGIN), vw - w - MARGIN);
  const y = Math.min(Math.max(r.y, MARGIN), vh - h - MARGIN);
  return { x, y, w, h };
}

function load(): Rect | null {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Rect | null;
    return saved && [saved.x, saved.y, saved.w, saved.h].every(Number.isFinite) ? saved : null;
  } catch {
    return null;
  }
}

function save(r: Rect) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(r));
  } catch {
    // Storage can be unavailable (private mode); position just won't persist.
  }
}

/** Position and size of a draggable, resizable window, persisted per browser. */
export function useFloatingWindow(active: boolean) {
  const [rect, setRect] = useState<Rect | null>(null);
  const gesture = useRef<{ kind: "move" | Edge; start: Rect; px: number; py: number } | null>(null);

  useEffect(() => {
    if (!active) return;
    setRect(clampRect(load() ?? defaultRect(), window.innerWidth, window.innerHeight));
    const onResize = () => setRect((r) => (r ? clampRect(r, window.innerWidth, window.innerHeight) : r));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active]);

  const begin = useCallback(
    (kind: "move" | Edge) => (e: React.PointerEvent) => {
      if (!rect || e.button !== 0) return;
      // Clicks on header buttons shouldn't start a drag.
      if (kind === "move" && (e.target as HTMLElement).closest("button, a, input, textarea")) return;
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      gesture.current = { kind, start: rect, px: e.clientX, py: e.clientY };
    },
    [rect],
  );

  const move = useCallback((e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g) return;
    const dx = e.clientX - g.px;
    const dy = e.clientY - g.py;
    const s = g.start;
    let next: Rect;
    if (g.kind === "move") next = { ...s, x: s.x + dx, y: s.y + dy };
    else {
      next = { ...s };
      if (g.kind.includes("e")) next.w = s.w + dx;
      if (g.kind.includes("s")) next.h = s.h + dy;
      if (g.kind.includes("w")) {
        next.w = Math.max(MIN_W, s.w - dx);
        next.x = s.x + s.w - next.w;
      }
      if (g.kind.includes("n")) {
        next.h = Math.max(MIN_H, s.h - dy);
        next.y = s.y + s.h - next.h;
      }
    }
    setRect(clampRect(next, window.innerWidth, window.innerHeight));
  }, []);

  const end = useCallback(() => {
    if (!gesture.current) return;
    gesture.current = null;
    setRect((r) => {
      if (r) save(r);
      return r;
    });
  }, []);

  const handlers = { onPointerMove: move, onPointerUp: end, onPointerCancel: end };
  return { rect, begin, handlers };
}
