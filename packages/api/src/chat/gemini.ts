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

async function callModel(apiKey: string, model: string, req: GenerateRequest): Promise<GeminiPart[]> {
  const res = await fetch(`${ENDPOINT}/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    signal: AbortSignal.timeout(20_000),
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

/** A GenerateFn that walks MODELS until one answers. */
export function geminiGenerate(apiKey: string): GenerateFn {
  return async (req) => {
    let last: unknown;
    for (const model of MODELS) {
      try {
        return await callModel(apiKey, model, req);
      } catch (err) {
        last = err;
        const retryable = err instanceof GeminiError ? RETRYABLE.has(err.status) : true;
        if (!retryable) break;
      }
    }
    throw last;
  };
}

/** Natural-sounding speech models, best first. */
export const TTS_MODELS = ["gemini-3.8-flash-tts", "gemini-3.8-flash-lite-tts", "gemini-3.1-flash-tts-preview"] as const;
export const DEFAULT_VOICE = "Aoede";

/** Speak `text` with a Gemini voice. Returns WAV audio as base64. */
export async function geminiSpeak(apiKey: string, text: string, voice = DEFAULT_VOICE): Promise<{ mimeType: string; data: string }> {
  let last: unknown;
  for (const model of TTS_MODELS) {
    try {
      const res = await fetch(`${ENDPOINT}/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        signal: AbortSignal.timeout(25_000),
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Read this aloud in a warm, natural, conversational tone, like a helpful local guide: ${text}` }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
          },
        }),
      });
      if (!res.ok) throw new GeminiError(`TTS ${model} ${res.status}`, res.status);
      const body = (await res.json()) as {
        candidates?: { content?: { parts?: { inlineData?: { mimeType: string; data: string } }[] } }[];
      };
      const audio = body.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData;
      if (!audio) throw new GeminiError(`TTS ${model} returned no audio`, 502);
      return audio;
    } catch (err) {
      last = err;
      if (err instanceof GeminiError && !RETRYABLE.has(err.status)) break;
    }
  }
  throw last;
}
