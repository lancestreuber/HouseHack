// Browser speech helpers (Web Speech API). No dependencies; everything
// degrades to "unsupported" on browsers without it.

interface RecognitionResultEvent {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
}

interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start(): void;
  stop(): void;
}

type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const canListen = () => recognitionCtor() !== null;
export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

/**
 * Start listening. `onText` receives the running transcript; `onDone` gets the
 * final text (empty if nothing was heard). Returns a stop function.
 */
export function listen(onText: (text: string) => void, onDone: (text: string) => void): () => void {
  const Ctor = recognitionCtor();
  if (!Ctor) {
    onDone("");
    return () => {};
  }
  const rec = new Ctor();
  rec.lang = "en-US";
  rec.continuous = false;
  rec.interimResults = true;
  let transcript = "";
  rec.onresult = (e) => {
    transcript = Array.from(e.results)
      .map((r) => r[0]?.transcript ?? "")
      .join("")
      .trim();
    onText(transcript);
  };
  rec.onerror = () => {};
  rec.onend = () => onDone(transcript);
  rec.start();
  return () => rec.stop();
}

function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
  return (
    voices.find((v) => /natural|neural|premium|enhanced/i.test(v.name)) ??
    voices.find((v) => v.lang === "en-US" && v.localService) ??
    voices[0]
  );
}

export function speak(text: string, onEnd?: () => void) {
  if (!canSpeak() || !text) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickVoice();
  if (voice) u.voice = voice;
  u.rate = 1.02;
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel();
}
