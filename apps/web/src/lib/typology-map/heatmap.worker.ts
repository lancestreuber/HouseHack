/// <reference lib="webworker" />
// Runs the typology heatmap off the main thread: loads the citywide facts once,
// then re-runs the engine on every knob change (about a second for ~142k parcels).

import { type HeatParams, parcelVerdict, runHeatmap } from "./engine";
import { type Facts, loadFacts } from "./facts";

export type WorkerRequest =
  | { type: "run"; id: number; params: HeatParams }
  | { type: "explain"; id: number; pin: string; params: HeatParams };

export type WorkerResponse =
  | { type: "loaded"; pins: string[]; lng: Float32Array; lat: Float32Array; zones: string[]; zone: Uint8Array; built: string }
  | { type: "ran"; id: number; result: ReturnType<typeof runHeatmap> }
  | { type: "explained"; id: number; pin: string; verdict: ReturnType<typeof parcelVerdict> | null }
  | { type: "error"; id?: number; message: string };

const scope = self as unknown as DedicatedWorkerGlobalScope;
let facts: Promise<Facts> | null = null;
let pinIndex: Map<string, number> | null = null;

function ensureFacts() {
  facts ??= loadFacts().then((f) => {
    pinIndex = new Map(f.pins.map((pin, i) => [pin, i]));
    const msg: WorkerResponse = { type: "loaded", pins: f.pins, lng: f.lng.slice(), lat: f.lat.slice(), zones: f.zones, zone: f.zone.slice(), built: f.built };
    scope.postMessage(msg);
    return f;
  });
  return facts;
}

scope.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;
  try {
    const f = await ensureFacts();
    if (req.type === "run") {
      const result = runHeatmap(f, req.params);
      const msg: WorkerResponse = { type: "ran", id: req.id, result };
      scope.postMessage(msg, [result.level.buffer, result.score.buffer, result.unlocked.buffer, result.cluster.buffer]);
    } else {
      const i = pinIndex?.get(req.pin);
      const msg: WorkerResponse = { type: "explained", id: req.id, pin: req.pin, verdict: i == null ? null : parcelVerdict(f, i, req.params) };
      scope.postMessage(msg);
    }
  } catch (error) {
    const msg: WorkerResponse = { type: "error", id: req.id, message: error instanceof Error ? error.message : String(error) };
    scope.postMessage(msg);
  }
};
