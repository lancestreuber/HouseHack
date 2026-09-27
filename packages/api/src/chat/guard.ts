import type { ReplyBlock } from "./types";

const BULLET = /^\s*(?:[-*•]|\d+[.)])\s+(.*)$/;
const HEADING = /^\s*#{1,6}\s+(.*)$/;
const CITATION = /\[([^[\]]+)\]/g;
const CITATION_ID = /^(?:f:)?[a-z0-9_.:-]+$/i;

/** Remove markdown syntax so only plain words reach the chat pane. */
function stripMarkdown(line: string): string {
  return line
    .replace(/\[([^\]]+)\]\((?:[^)]+)\)/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\*(\S[^*]*?)\*/g, "$1")
    .replace(/(^|\W)_(\S[^_]*?)_(?=\W|$)/g, "$1$2")
    .replace(/`([^`]*)`/g, "$1");
}

/** Pull `[id, id]` citation tags out of a line, keeping only ids in `known`. */
function extractCitations(line: string, known: Set<string>): { text: string; ids: string[] } {
  const ids: string[] = [];
  const text = line.replace(CITATION, (match, inner: string) => {
    const parts = inner.split(",").map((p) => p.trim());
    if (!parts.every((p) => CITATION_ID.test(p))) return match;
    for (const part of parts) {
      const id = part.replace(/^f:/, "");
      if (known.has(id) && !ids.includes(id)) ids.push(id);
    }
    return "";
  });
  return { text, ids };
}

function tidy(text: string): string {
  return text
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Turn raw model output into paragraphs and bullets of plain text, each with
 * the (verified) fact ids it cites. Citations to unknown facts are dropped.
 */
export function parseReply(raw: string, knownFactIds: string[]): ReplyBlock[] {
  const known = new Set(knownFactIds);
  const blocks: ReplyBlock[] = [];
  // Each line is its own block: models separate thoughts with single newlines.
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const heading = HEADING.exec(line);
    const bullet = heading ? null : BULLET.exec(line);
    const { text, ids } = extractCitations(stripMarkdown(heading?.[1] ?? bullet?.[1] ?? line), known);
    const clean = tidy(text);
    if (clean) blocks.push({ type: bullet ? "bullet" : "paragraph", text: clean, fact_ids: ids });
  }
  return blocks;
}

/** Numeric tokens in a string, with thousands separators, currency and % removed. */
export function numbersIn(text: string): string[] {
  const matches = text.match(/\d[\d,]*(?:\.\d+)?/g) ?? [];
  return matches.map((m) => normalize(m.replace(/,/g, "")));
}

function normalize(n: string): string {
  const value = Number(n);
  return Number.isFinite(value) ? String(value) : n;
}

/**
 * Numbers in `text` that no fact states. Small counting numbers (0–10) are
 * allowed, and a fraction like 0.81 also allows its percent form (81).
 */
export function unverifiedNumbers(text: string, allowedNumbers: string[]): string[] {
  const allowed = new Set<string>();
  for (const raw of allowedNumbers) {
    const n = normalize(raw.replace(/,/g, ""));
    allowed.add(n);
    const value = Number(n);
    if (value > 0 && value <= 1) allowed.add(String(Math.round(value * 100)));
  }
  return numbersIn(text).filter((n) => {
    const value = Number(n);
    if (Number.isInteger(value) && value >= 0 && value <= 10) return false;
    return !allowed.has(n);
  });
}

/** Split a paragraph into sentences, keeping the terminal punctuation. */
export function sentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+(?=[A-Z0-9"'(])/).filter(Boolean);
}

/**
 * Keep only the sentences whose numbers all appear in `allowedNumbers`.
 * Returns null when nothing verifiable is left in the block.
 */
export function keepVerified(block: ReplyBlock, allowedNumbers: string[]): ReplyBlock | null {
  const kept = sentences(block.text).filter((s) => unverifiedNumbers(s, allowedNumbers).length === 0);
  return kept.length ? { ...block, text: kept.join(" ") } : null;
}
