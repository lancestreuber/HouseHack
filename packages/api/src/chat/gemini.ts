// Minimal Gemini REST client over fetch (no SDK dependency). Server-only.

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

/** Free-tier models, best first. On a rate limit or outage we try the next. */
export const MODELS = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-2.5-flash-lite"] as const;

export type GeminiPart =
  | { text: string; thoughtSignature?: string }
  | { functionCall: { name: string; args: Record<string, unknown> }; thoughtSignature?: string }
  | { functionResponse: { name: string; response: Record<string, unknown> } };

export interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

export interface FunctionDeclaration {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface GenerateRequest {
  system: string;
  contents: GeminiContent[];
  tools?: FunctionDeclaration[];
}

/** The model's turn: its raw parts (kept verbatim for multi-turn tool use). */
export type GenerateFn = (req: GenerateRequest) => Promise<GeminiPart[]>;

export class GeminiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function callModel(apiKey: string, model: string, req: GenerateRequest, cancel?: AbortSignal): Promise<GeminiPart[]> {
  const res = await fetch(`${ENDPOINT}/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    // Kept well under the serverless function's own duration limit: this can
    // retry across up to 3 models (see MODELS below), and a per-call timeout
    // anywhere near that limit risks the platform killing the whole request
    // before a later model gets a chance to answer.
    signal: cancel ? AbortSignal.any([AbortSignal.timeout(12_000), cancel]) : AbortSignal.timeout(12_000),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: req.system }] },
      contents: req.contents,
      tools: req.tools?.length ? [{ functionDeclarations: req.tools }] : undefined,
      generationConfig: { temperature: 0.2, maxOutputTokens: 700 },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new GeminiError(`Gemini ${model} ${res.status}: ${body.slice(0, 200)}`, res.status);
  }
  const data = (await res.json()) as { candidates?: { content?: { parts?: GeminiPart[] } }[] };
  const parts = data.candidates?.[0]?.content?.parts;
  if (!parts?.length) throw new GeminiError(`Gemini ${model} returned no content`, 502);
  return parts;
}

const RETRYABLE = new Set([404, 429, 500, 502, 503, 504]);

// The first model usually answers in about a second but occasionally stalls
// until the 12 s timeout. After this long without an answer, the next model
// starts too and whichever answers first wins (a "hedged" request).
const HEDGE_AFTER_MS = 4_000;

/**
 * A GenerateFn that walks MODELS until one answers: the next model starts when
 * one fails with a retryable error, or when it is still waiting after
 * `hedgeAfterMs`. The first answer wins and the other requests are cancelled.
 */
export function geminiGenerate(apiKey: string, hedgeAfterMs = HEDGE_AFTER_MS): GenerateFn {
  return (req) =>
    new Promise((resolve, reject) => {
      const cancel = new AbortController();
      let next = 0;
      let running = 0;
      let settled = false;
      let last: unknown;
      let hedge: ReturnType<typeof setTimeout> | undefined;

      const finish = (fn: () => void) => {
        settled = true;
        clearTimeout(hedge);
        cancel.abort();
        fn();
      };

      const launch = () => {
        if (settled || next >= MODELS.length) return;
        const model = MODELS[next++]!;
        running++;
        clearTimeout(hedge);
        hedge = setTimeout(launch, hedgeAfterMs);
        callModel(apiKey, model, req, cancel.signal).then(
          (parts) => {
            if (!settled) finish(() => resolve(parts));
          },
          (err: unknown) => {
            running--;
            if (settled) return;
            last = err;
            const retryable = err instanceof GeminiError ? RETRYABLE.has(err.status) : true;
            if (retryable && next < MODELS.length) return launch();
            // A non-retryable error means the request itself is wrong; don't try more models.
            if (!retryable) {
              clearTimeout(hedge);
              next = MODELS.length;
            }
            if (running === 0) finish(() => reject(last));
          },
        );
      };

      launch();
    });
}

/** Speech models, best-sounding first; the lite model (larger free quota) is the backup. */
export const TTS_MODELS = ["gemini-3.8-flash-tts", "gemini-3.8-flash-lite-tts", "gemini-3.1-flash-tts-preview"] as const;
export const DEFAULT_VOICE = "Aoede";

export interface AudioChunk {
  mimeType: string;
  data: string;
}

/**
 * Stream speech for `text` from a Gemini voice as it's generated (first audio
 * in well under a second). Falls through the models only if one fails before
 * producing any audio. Chunks are raw PCM, e.g. `audio/l16; rate=24000`.
 */
export async function* geminiSpeakStream(apiKey: string, text: string, voice = DEFAULT_VOICE): AsyncGenerator<AudioChunk> {
  let last: unknown;
  for (const model of TTS_MODELS) {
    let produced = false;
    try {
      const res = await fetch(`${ENDPOINT}/${model}:streamGenerateContent?alt=sse`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        signal: AbortSignal.timeout(30_000),
        body: JSON.stringify({
          // Send only the words to speak: TTS models sometimes read style instructions aloud.
          contents: [{ parts: [{ text }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
          },
        }),
      });
      if (!res.ok || !res.body) throw new GeminiError(`TTS ${model} ${res.status}`, res.status);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const event = JSON.parse(line.slice(6)) as {
            candidates?: { content?: { parts?: { inlineData?: AudioChunk }[] } }[];
          };
          for (const part of event.candidates?.[0]?.content?.parts ?? []) {
            if (part.inlineData?.data) {
              produced = true;
              yield part.inlineData;
            }
          }
        }
      }
      if (produced) return;
      throw new GeminiError(`TTS ${model} returned no audio`, 502);
    } catch (err) {
      if (produced) throw err; // Mid-stream failure: don't restart with a different voice.
      last = err;
      if (err instanceof GeminiError && !RETRYABLE.has(err.status)) break;
    }
  }
  throw last;
}
