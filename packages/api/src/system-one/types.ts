// Typed questions and answers for a System One decision API (TypeSafe's Jev,
// or anything wire-compatible with `POST /v1/systemone`). The model returns
// typed decisions with probabilities, never free text, so there is no JSON
// prompting or parsing of natural-language output here.

/** Yes/no, answered as a probability of "yes". The API calls this type `noul`. */
export type NoulQuestion = {
  type: "noul";
  instructions: string;
};

/** Pick one option. `criteria` maps option ids to a description (or null). */
export type ChoiceQuestion<Option extends string = string> = {
  type: "choice";
  instructions?: string;
  criteria: Record<Option, string | null>;
};

/** Rate along an ordered rubric of 2–10 levels, lowest first. */
export type ScoreQuestion = {
  type: "score";
  instructions: string;
  criteria: readonly string[];
};

export type Question = NoulQuestion | ChoiceQuestion | ScoreQuestion;
export type Questions = Record<string, Question>;

export type NoulAnswer = {
  type: "noul";
  /** Probability of "yes", 0–1. There is no separate confidence: this number is the belief. */
  probability: number;
};

export type ChoiceAnswer<Option extends string = string> = {
  type: "choice";
  choice: Option;
  probabilities: Record<Option, number>;
  confidence: number;
};

export type ScoreAnswer = {
  type: "score";
  /** Probability-weighted position on the rubric, 0 … levels−1. Can land between levels. */
  score: number;
  /** `score` rescaled to 0–1. */
  normalized: number;
  /** The rubric level nearest to `score`. */
  label: string;
  /** Probability of each rubric level, in rubric order. */
  probabilities: number[];
  confidence: number;
};

export type AnswerFor<Q extends Question> = Q extends NoulQuestion
  ? NoulAnswer
  : Q extends ChoiceQuestion<infer Option>
    ? ChoiceAnswer<Option>
    : ScoreAnswer;

export type Decisions<Qs extends Questions> = { [K in keyof Qs]: AnswerFor<Qs[K]> };

export type DecideInput<Qs extends Questions> = {
  /** What the questions are about. Keep it short: pre-compute numbers in code. */
  state: string | Record<string, unknown>;
  questions: Qs;
};

export type DecideResult<Qs extends Questions> = {
  answers: Decisions<Qs>;
  model: string;
  usage?: { inputTokens: number; cost?: number };
};

export type SystemOneConfig = {
  apiKey: string | undefined;
  /** Base URL without the `/v1/systemone` path, e.g. `https://openrouter.ai/api`. */
  baseURL: string;
  model: string;
  timeoutMs?: number;
  /** Injected for tests. Defaults to the global `fetch`. */
  fetch?: typeof fetch;
};

export type SystemOne = {
  readonly configured: boolean;
  readonly model: string;
  decide<Qs extends Questions>(input: DecideInput<Qs>): Promise<DecideResult<Qs>>;
};
