// State for the typology heatmap: the user's knobs, the latest run and the one
// before it (for "what changed"). Knob changes re-run the engine in a worker,
// debounced; only the newest run's result is kept. Same useSyncExternalStore
// pattern as pillar-weights-store.ts.

import { useSyncExternalStore } from "react";

import type { Verdict } from "@/lib/pillars/verdict";

import { DEFAULT_PARAMS, type HeatParams, type HeatResult } from "./engine";
import type { WorkerRequest, WorkerResponse } from "./heatmap.worker";

export type HeatBase = {
  pins: string[];
  pinIndex: Map<string, number>;
  lng: Float32Array;
  lat: Float32Array;
  zones: string[];
  zone: Uint8Array;
  built: string;
};

export type HeatState = {
  enabled: boolean;
  params: HeatParams;
  status: "idle" | "loading" | "running" | "ready" | "error";
  error: string | null;
  base: HeatBase | null;
  result: HeatResult | null;
  previous: HeatResult["summary"] | null;
  focusCluster: number | null;
};

let state: HeatState = {
  enabled: false,
  params: DEFAULT_PARAMS,
  status: "idle",
  error: null,
  base: null,
  result: null,
  previous: null,
  focusCluster: null,
};
const listeners = new Set<() => void>();

function set(patch: Partial<HeatState>) {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
}

export function subscribeHeat(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getHeat = () => state;

export function useHeat(): HeatState {
  return useSyncExternalStore(subscribeHeat, getHeat, getHeat);
}

let worker: Worker | null = null;
let nextId = 1;
let latestRun = 0;
let timer: ReturnType<typeof setTimeout> | null = null;
const explainWaiters = new Map<number, (v: Verdict | null) => void>();

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL("./heatmap.worker.ts", import.meta.url), { type: "module" });
  worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const msg = event.data;
    if (msg.type === "loaded") {
      set({ base: { ...msg, pinIndex: new Map(msg.pins.map((pin, i) => [pin, i])) } });
    } else if (msg.type === "ran") {
      if (msg.id !== latestRun) return;
      set({ status: "ready", error: null, previous: state.result?.summary ?? null, result: msg.result });
    } else if (msg.type === "explained") {
      explainWaiters.get(msg.id)?.(msg.verdict);
      explainWaiters.delete(msg.id);
    } else {
      set({ status: "error", error: msg.message });
    }
  };
  worker.onerror = (e) => set({ status: "error", error: e.message || "heatmap worker failed" });
  return worker;
}

function run() {
  const id = nextId++;
  latestRun = id;
  set({ status: state.base ? "running" : "loading" });
  const req: WorkerRequest = { type: "run", id, params: state.params };
  getWorker().postMessage(req);
}

function scheduleRun(delay = 250) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(run, delay);
}

export function setHeatEnabled(enabled: boolean) {
  set({ enabled });
  if (enabled && !state.result) scheduleRun(0);
}

export function setHeatParams(update: (prev: HeatParams) => HeatParams) {
  set({ params: update(state.params) });
  if (state.enabled) scheduleRun();
}

export function rerunHeat() {
  scheduleRun(0);
}

export function focusHeatCluster(id: number | null) {
  set({ focusCluster: id });
}

/** Why one parcel got its color, under the current knobs. */
export function explainHeatParcel(pin: string): Promise<Verdict | null> {
  const id = nextId++;
  return new Promise((resolve) => {
    explainWaiters.set(id, resolve);
    const req: WorkerRequest = { type: "explain", id, pin, params: state.params };
    getWorker().postMessage(req);
  });
}
