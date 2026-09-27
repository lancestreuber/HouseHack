// Shared presentation for the typology verdict (packages/api's `verdictFor`):
// a plain red/yellow/green/unknown read of "can this be built?", computed
// from gates, hazards and site fit only -- never from the weighted pillar
// score, so a deal-killer can't be averaged away. Used by both the typology
// tiles (bottom panel) and the Alerts pane so the colors always agree.
export type VerdictLevel = "red" | "yellow" | "green" | "unknown";

export const VERDICT_DOT: Record<VerdictLevel, string> = {
  red: "bg-red-500",
  yellow: "bg-yellow-400",
  green: "bg-green-500",
  unknown: "bg-neutral-500",
};

export const VERDICT_LABEL: Record<VerdictLevel, string> = {
  red: "Not developable as-is",
  yellow: "Needs approval or added cost",
  green: "Developable as-is",
  unknown: "Zoning unknown",
};

export function fmtUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(n / 1000)}k`;
}
