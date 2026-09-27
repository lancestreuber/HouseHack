// Engine types mirrored from PLAN.md §2b so the chatbot can be built before
// `packages/scoring` lands. When it does, replace this block with
// `export type { ... } from "@HouseHack/scoring"` and delete the copies.

export type TypologyId = "sfd" | "adu" | "duplex" | "townhome" | "apartments" | "senior";
export type ConsiderationId =
  | "lot"
  | "zoning"
  | "hazards"
  | "slope"
  | "air"
  | "transit"
  | "parks"
  | "health"
  | "schools"
  | "shops"
  | "demand";
export type Legal = "by_right" | "needs_approval" | "not_allowed" | "uncertain";
export type Severity = "ok" | "consider" | "warn";
export type Label = "evidence" | "assumption";

export interface ParcelFeatures {
  pin: string;
  hood_id: string;
  address: string | null;
  zoning: string;
  lot_sqft: number;
  is_vacant: boolean | null;
  city_owned: boolean;
  slope25_share: number;
  landslide_prone: boolean;
  landslide_events_500m: number;
  flood_zone: boolean;
  undermined: boolean;
  emissions_2km_tpy: number;
  aqi_nearest: number | null;
  m_to_transit: number;
  m_to_park: number;
  m_to_school: number;
  m_to_fire: number;
  m_to_hospital: number;
  shops_800m: number | null;
}

export interface NeighborhoodMetrics {
  hood_id: string;
  name: string;
  pct_65_plus: number;
  pct_under_18: number;
  avg_hh_size: number;
  pct_single_person_hh: number;
  vacancy_rate: number;
  median_income: number;
  median_rent: number;
  permits_3yr_per_1k_units: number;
}

export interface Consideration {
  id: ConsiderationId;
  name: string;
  score: number | null;
  severity: Severity;
  value: string;
  comment: string;
  source: string;
  source_url: string;
  as_of: string;
  kind: Label;
}

export interface Note {
  severity: Severity;
  text: string;
  typology?: TypologyId;
}

export type Weights = Record<ConsiderationId, number>;

export interface TypologyEval {
  typology: TypologyId;
  legal: Legal;
  legal_reason: string;
  demands: ConsiderationId[];
  failing_demands: ConsiderationId[];
  fit: number | null;
  confidence: number | null;
  source: "jev" | "rules";
  major_concern_p?: number;
}

export interface ParcelReport {
  features: ParcelFeatures;
  hood: NeighborhoodMetrics;
  considerations: Consideration[];
  notes: Note[];
  context: { label: string; value: string; source_url: string }[];
}

// ---- Chatbot-specific types ----

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

/** How a fact is known. Matches pillars.config.json `evidence` plus the plan's labels. */
export type FactKind = Label | "observed" | "policy" | "value" | "definition";

/** A fact a screen panel hands to the chat: exactly what the user is looking at. */
export interface ContextFact {
  id: string;
  text: string;
  source: string;
  source_url: string;
  as_of: string;
  kind: FactKind;
}

/** One citable fact. `numbers` are the numeric tokens a reply may quote from it. */
export interface ChatFact extends ContextFact {
  numbers: string[];
}

/** Enough of the scoring model to answer "what if I change the weights" exactly. */
export interface ScoringModel {
  method: "geometric" | "arithmetic";
  floor: number;
  /** A part with no score counts as `impute` when given, else it's left out. */
  parts: { id: string; label: string; score: number | null; weight: number; impute?: number | null }[];
  /** Applied to the blended score (e.g. zoning and site-availability factors). */
  multiplier?: number;
}

/** What the screen shows right now. Every panel that wants chat support builds one. */
export interface ChatContext {
  subject: string;
  facts: ContextFact[];
  scoring?: ScoringModel;
  suggestions?: string[];
  /** Plain notes shown if the assistant is unavailable. */
  notes?: string[];
}

/** A rendered unit of a reply: a paragraph or one bullet, with the facts it cites. */
export interface ReplyBlock {
  type: "paragraph" | "bullet";
  text: string;
  fact_ids: string[];
}

export type ChatResult =
  | { status: "ok"; blocks: ReplyBlock[]; facts: ChatFact[]; suggestions: string[] }
  | { status: "unavailable"; reason: string; notes: string[]; suggestions: string[] };
