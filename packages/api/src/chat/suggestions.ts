import { TYPOLOGY_NAMES } from "./facts";
import type { ParcelReport, TypologyEval } from "./types";

/** Starter questions people most often need, shown when a chat opens. */
export const GENERAL_QUESTIONS = [
  "How does this tool decide what fits a parcel?",
  "What does \"needs approval\" mean?",
  "What can't this tool tell me?",
];

/**
 * Three questions tailored to the parcel on screen, built from its data so
 * they always have an answer: the top pick, the biggest concern, and a what-if.
 */
export function suggestionsFor(report: ParcelReport | null, evals: TypologyEval[]): string[] {
  if (!report) return GENERAL_QUESTIONS;
  const ranked = evals.filter((e) => e.fit !== null).sort((a, b) => (b.fit ?? 0) - (a.fit ?? 0));
  const top = ranked[0];
  const worst = report.considerations
    .filter((c) => c.severity !== "ok" && c.score !== null)
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))[0];

  const questions: string[] = [];
  if (top) questions.push(`Why is ${TYPOLOGY_NAMES[top.typology].toLowerCase()} the best fit here?`);
  if (worst) questions.push(`Should I worry about ${worst.name.toLowerCase()} on this lot?`);
  questions.push(
    worst ? `What happens if I weight ${worst.name.toLowerCase()} higher?` : "What could I build here without a hearing?",
  );
  for (const q of GENERAL_QUESTIONS) if (questions.length < 3) questions.push(q);
  return questions.slice(0, 3);
}
