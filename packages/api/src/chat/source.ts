import { homewoodEvals, homewoodReport } from "./fixtures";
import type { ParcelReport, TypologyEval } from "./types";

/**
 * Where the chatbot gets parcel data. It must return exactly what the UI shows
 * (the same `parcels.report` and `jev.evaluate` results), so the chat never
 * disagrees with the cards.
 */
export interface ChatDataSource {
  getReport(pin: string): Promise<ParcelReport | null>;
  getEvals(pin: string): Promise<TypologyEval[]>;
}

/**
 * Interim source backed by mock fixtures. Replace with the real
 * `parcels.report` / `jev.evaluate` implementations once Lane B/J land them.
 */
export const fixtureSource: ChatDataSource = {
  async getReport(pin) {
    return pin === homewoodReport.features.pin ? homewoodReport : null;
  },
  async getEvals(pin) {
    return pin === homewoodReport.features.pin ? homewoodEvals : [];
  },
};
