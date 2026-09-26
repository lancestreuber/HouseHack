// Natural read-aloud: a Gemini voice streamed through `chat.speak` and played
// with the Web Audio API as chunks arrive, so speech starts in well under a
// second. If no audio comes back, it falls back to the browser's own voice.
import { client } from "@/utils/orpc";

import { speak as browserSpeak, stopSpeaking as stopBrowser } from "./speech";

let ctx: AudioContext | null = null;
let session = 0;
let sources: AudioBufferSourceNode[] = [];

function audioContext(): AudioContext {
  ctx ??= new AudioContext();
  return ctx;
}

/** Call from a click or key press so browsers allow audio to play later. */
export function unlockAudio() {
  const c = audioContext();
  if (c.state === "suspended") void c.resume();
}

/** Turns streamed 16-bit little-endian PCM into AudioBuffers, carrying odd bytes between chunks. */
function pcmDecoder(c: AudioContext) {
  let carry: Uint8Array | null = null;
  return (mimeType: string, base64: string): AudioBuffer | null => {
    const rate = Number(/rate=(\d+)/i.exec(mimeType)?.[1] ?? 24000);
    let bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
    if (carry) {
      const joined = new Uint8Array(carry.length + bytes.length);
      joined.set(carry);
      joined.set(bytes, carry.length);
      bytes = joined;
      carry = null;
    }
    if (bytes.length % 2) {
      carry = bytes.slice(-1);
      bytes = bytes.slice(0, -1);
    }
    const samples = bytes.length / 2;
    if (!samples) return null;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const buffer = c.createBuffer(1, samples, rate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < samples; i++) channel[i] = view.getInt16(i * 2, true) / 32768;
    return buffer;
  };
}

/** Read `text` aloud. `onEnd` runs when it finishes (not when stopped). */
export async function speakNatural(text: string, onEnd?: () => void) {
  stopNatural();
  const id = ++session;
  const c = audioContext();
  await c.resume().catch(() => {});
  const decode = pcmDecoder(c);
  let next = c.currentTime + 0.05;
  let last: AudioBufferSourceNode | null = null;

  try {
    const stream = await client.chat.speak({ text });
    for await (const chunk of stream) {
      if (id !== session) return;
      const buffer = decode(chunk.mimeType, chunk.data);
      if (!buffer) continue;
      const source = c.createBufferSource();
      source.buffer = buffer;
      source.connect(c.destination);
      next = Math.max(next, c.currentTime + 0.02);
      source.start(next);
      next += buffer.duration;
      sources.push(source);
      last = source;
    }
  } catch {
    // Fall through: whatever played already stays; nothing played means browser voice.
  }
  if (id !== session) return;

  if (!last) {
    browserSpeak(text, () => id === session && onEnd?.());
    return;
  }
  const finish = () => {
    if (id !== session) return;
    sources = [];
    onEnd?.();
  };
  if (c.currentTime >= next) finish();
  else last.onended = finish;
}

export function stopNatural() {
  session++;
  for (const source of sources) {
    try {
      source.stop();
    } catch {
      // Already stopped.
    }
  }
  sources = [];
  stopBrowser();
}
