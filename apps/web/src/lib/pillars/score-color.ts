// Score colors carry meaning (good / mid / bad / none) and are derived from a
// 0–100 score. Returns CSS variable references so light mode gets the darker,
// AA-contrast set for free (see globals.css --score-*).
import type { CSSProperties } from "react";

export function scoreColor(score: number | null): string {
  if (score == null) return "var(--score-none)";
  if (score >= 70) return "var(--score-good)";
  if (score >= 45) return "var(--score-mid)";
  return "var(--score-bad)";
}

// The five decorative accent hues, in pillar config order: teal, blue, purple,
// amber, pink. Chips carry no meaning; they are aria-hidden decoration.
export const ACCENT_HUES = ["teal", "blue", "purple", "amber", "pink"] as const;
export type AccentHue = (typeof ACCENT_HUES)[number];

export function accentHue(index: number): AccentHue {
  return ACCENT_HUES[index % ACCENT_HUES.length] ?? "teal";
}

// The gradient square behind a pillar or typology icon: the hue at 90% opacity
// on top fading to 60% at the bottom.
export function accentChipStyle(hue: AccentHue): CSSProperties {
  const color = `var(--hue-${hue})`;
  return {
    background: `linear-gradient(180deg, color-mix(in oklch, ${color} 90%, transparent), color-mix(in oklch, ${color} 60%, transparent))`,
  };
}