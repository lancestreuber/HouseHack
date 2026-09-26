// Natural read-aloud: Gemini voices via `chat.speak`, played sentence by
// sentence so speech starts quickly. Any piece that can't be fetched falls back
// to the browser's own voice, so reading never just stops.
import { client } from "@/utils/orpc";

import { speak as browserSpeak, chunkForSpeech, stopSpeaking as stopBrowser } from "./speech";

let session = 0;
let current: HTMLAudioElement | null = null;
const urls: string[] = [];

/** Wrap raw 16-bit PCM (e.g. `audio/L16;rate=24000`) in a WAV header so browsers can play it. */
function toPlayableBlob(mimeType: string, base64: string): Blob {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  if (!/audio\/(l16|pcm)/i.test(mimeType)) return new Blob([bytes], { type: mimeType });
  const rate = Number(/rate=(\d+)/.exec(mimeType)?.[1] ?? 24000);
  const header = new DataView(new ArrayBuffer(44));
  const write = (o: number, s: string) => [...s].forEach((c, i) => header.setUint8(o + i, c.charCodeAt(0)));
  write(0, "RIFF");
  header.setUint32(4, 36 + bytes.length, true);
  write(8, "WAVEfmt ");
  header.setUint32(16, 16, true);
  header.setUint16(20, 1, true);
  header.setUint16(22, 1, true);
  header.setUint32(24, rate, true);
  header.setUint32(28, rate * 2, true);
  header.setUint16(32, 2, true);
  header.setUint16(34, 16, true);
  write(36, "data");
  header.setUint32(40, bytes.length, true);
  return new Blob([header.buffer, bytes], { type: "audio/wav" });
}

function play(blob: Blob, id: number): Promise<void> {
  return new Promise((resolve) => {
    if (id !== session) return resolve();
    const url = URL.createObjectURL(blob);
    urls.push(url);
    const audio = new Audio(url);
    current = audio;
    audio.onended = () => resolve();
    audio.onerror = () => resolve();
    audio.play().catch(() => resolve());
  });
}

function sayWithBrowser(text: string, id: number): Promise<void> {
  return new Promise((resolve) => (id === session ? browserSpeak(text, resolve) : resolve()));
}

/** Read `text` aloud. Resolves `onEnd` when finished or stopped. */
export async function speakNatural(text: string, onEnd?: () => void) {
  stopNatural();
  const id = ++session;
  const chunks = chunkForSpeech(text);
  // Request every chunk now; they generate in parallel while earlier ones play.
  const pending = chunks.map((chunk) => client.chat.speak({ text: chunk }).catch(() => null));
  for (const [i, chunk] of chunks.entries()) {
    const audio = await pending[i];
    if (id !== session) return;
    if (audio) await play(toPlayableBlob(audio.mimeType, audio.data), id);
    else await sayWithBrowser(chunk, id);
  }
  if (id === session) onEnd?.();
}

export function stopNatural() {
  session++;
  current?.pause();
  current = null;
  stopBrowser();
  for (const url of urls.splice(0)) URL.revokeObjectURL(url);
}
