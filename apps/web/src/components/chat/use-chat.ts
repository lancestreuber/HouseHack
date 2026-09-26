import type { ChatContext, ChatResult, ReplyBlock } from "@HouseHack/api/chat/types";
import { useCallback, useEffect, useRef, useState } from "react";

import { client } from "@/utils/orpc";

import { speakNatural as speak, stopNatural as stopSpeaking } from "./voice";

export type ChatTurn =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "assistant"; result: ChatResult; shownWords: number; totalWords: number };

const WORDS_PER_TICK = 2;
const TICK_MS = 28;

const wordCount = (blocks: ReplyBlock[]) => blocks.reduce((n, b) => n + b.text.split(/\s+/).length, 0);

/** Plain text of a reply, used for read-aloud and the conversation history. */
export function replyText(result: ChatResult): string {
  return result.status === "ok"
    ? result.blocks.map((b) => b.text).join(" ")
    : `${result.reason} ${result.notes.join(" ")}`;
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useChat(context: ChatContext | undefined) {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [thinking, setThinking] = useState(false);
  const [readAloud, setReadAloud] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const nextId = useRef(1);
  const subject = context?.subject ?? "";

  // A different parcel (or view) starts a new conversation.
  useEffect(() => {
    setTurns([]);
    stopSpeaking();
    setSpeaking(false);
  }, [subject]);

  // Reveal the newest reply a couple of words at a time, then read it aloud.
  const revealing = turns.find((t) => t.role === "assistant" && t.shownWords < t.totalWords);
  useEffect(() => {
    if (!revealing) return;
    const timer = setInterval(() => {
      setTurns((all) =>
        all.map((t) =>
          t.id === revealing.id && t.role === "assistant"
            ? { ...t, shownWords: Math.min(t.totalWords, t.shownWords + WORDS_PER_TICK) }
            : t,
        ),
      );
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [revealing?.id]);

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || thinking) return;
      stopSpeaking();
      setSpeaking(false);
      const history = turns.map((t) => ({
        role: t.role,
        text: t.role === "user" ? t.text : replyText(t.result),
      }));
      setTurns((all) => [...all, { id: nextId.current++, role: "user", text: question }]);
      setThinking(true);

      let result: ChatResult;
      try {
        result = await client.chat.ask({
          context,
          messages: [...history, { role: "user" as const, text: question }].slice(-20),
        });
      } catch {
        result = {
          status: "unavailable",
          reason: "I couldn't reach the assistant. Check your connection and try again.",
          notes: [],
          suggestions: [],
        };
      }
      const total = result.status === "ok" ? wordCount(result.blocks) : 0;
      setTurns((all) => [
        ...all,
        {
          id: nextId.current++,
          role: "assistant",
          result,
          totalWords: total,
          shownWords: prefersReducedMotion() ? total : 0,
        },
      ]);
      setThinking(false);
      if (readAloud) {
        setSpeaking(true);
        speak(replyText(result), () => setSpeaking(false));
      }
    },
    [context, thinking, turns, readAloud],
  );

  const toggleReadAloud = useCallback(() => {
    setReadAloud((on) => {
      if (on) {
        stopSpeaking();
        setSpeaking(false);
      }
      return !on;
    });
  }, []);

  const speakTurn = useCallback((result: ChatResult) => {
    setSpeaking(true);
    speak(replyText(result), () => setSpeaking(false));
  }, []);

  const stop = useCallback(() => {
    stopSpeaking();
    setSpeaking(false);
  }, []);

  const clear = useCallback(() => {
    stopSpeaking();
    setSpeaking(false);
    setTurns([]);
  }, []);

  return { turns, thinking, send, clear, readAloud, toggleReadAloud, speaking, speakTurn, stop };
}
