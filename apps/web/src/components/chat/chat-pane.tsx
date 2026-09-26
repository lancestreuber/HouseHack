import { GENERAL_QUESTIONS } from "@HouseHack/api/chat/suggestions";
import type { ChatContext, ChatFact, ChatResult, ReplyBlock } from "@HouseHack/api/chat/types";
import { Button } from "@HouseHack/ui/components/button";
import { cn } from "@HouseHack/ui/lib/utils";
import {
  ArrowUp,
  GripHorizontal,
  Mic,
  PanelRightClose,
  PictureInPicture2,
  RotateCcw,
  Square,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { FactChip } from "./fact-chip";
import { type Edge, useFloatingWindow } from "./floating";
import { canListen, listen } from "./speech";
import { type ChatTurn, useChat } from "./use-chat";
import { PaneCollapseButton } from "../map/pane-collapse-button";

export interface ChatPaneProps {
  /**
   * What the screen is showing: its facts, scoring model and starter questions.
   * Build it from the same data the panel renders so the chat never disagrees
   * with the screen. Omit it for general "how does this work" questions.
   */
  context?: ChatContext;
  className?: string;
  /** Show only as a floating window (no docked state) with a close button. */
  onClose?: () => void;
  /** Docked only: collapses the pane to just its header. */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const EDGES: { edge: Edge; className: string }[] = [
  { edge: "n", className: "inset-x-3 -top-1 h-2 cursor-ns-resize" },
  { edge: "s", className: "inset-x-3 -bottom-1 h-2 cursor-ns-resize" },
  { edge: "e", className: "inset-y-3 -right-1 w-2 cursor-ew-resize" },
  { edge: "w", className: "inset-y-3 -left-1 w-2 cursor-ew-resize" },
  { edge: "nw", className: "-top-1 -left-1 size-4 cursor-nwse-resize" },
  { edge: "se", className: "-right-1 -bottom-1 size-4 cursor-nwse-resize" },
  { edge: "ne", className: "-top-1 -right-1 size-4 cursor-nesw-resize" },
  { edge: "sw", className: "-bottom-1 -left-1 size-4 cursor-nesw-resize" },
];

/**
 * Explain-only assistant. Docked, it fills its container (Lane C's resizable
 * pane sets the size). Popped out, it's a floating window you can drag by its
 * header and resize from any edge or corner; size and position are remembered.
 */
export function ChatPane({ context, className, onClose, collapsed, onToggleCollapse }: ChatPaneProps) {
  const chat = useChat(context);
  const [poppedOut, setFloating] = useState(false);
  const floating = poppedOut || Boolean(onClose);
  const win = useFloatingWindow(floating);
  const hasSubject = Boolean(context?.facts.length);

  const pane = (
    <section
      aria-label="Ask about this parcel"
      className={cn(
        "flex min-h-0 flex-col bg-background text-foreground",
        floating
          ? "fixed z-50 overflow-hidden rounded-xl border border-border shadow-2xl shadow-black/40"
          : "h-full w-full",
        !floating && className,
      )}
      style={floating && win.rect ? { left: win.rect.x, top: win.rect.y, width: win.rect.w, height: win.rect.h } : undefined}
      {...(floating ? win.handlers : {})}
    >
      <header
        className={cn(
          "flex h-12 shrink-0 items-center gap-1 border-b border-border px-4",
          floating && "cursor-grab touch-none select-none active:cursor-grabbing",
        )}
        onPointerDown={floating ? win.begin("move") : undefined}
      >
        {floating && <GripHorizontal className="mr-1 size-4 text-muted-foreground" aria-hidden />}
        <h2 className="mr-auto text-xs font-medium">{hasSubject ? "Ask about this parcel" : "Ask Groundwork"}</h2>
        <IconButton
          label={chat.readAloud ? "Stop reading replies aloud" : "Read replies aloud"}
          pressed={chat.readAloud}
          onClick={chat.toggleReadAloud}
        >
          {chat.readAloud ? <Volume2 /> : <VolumeX />}
        </IconButton>
        {chat.turns.length > 0 && (
          <IconButton label="New conversation" onClick={chat.clear}>
            <RotateCcw />
          </IconButton>
        )}
        {!floating && onToggleCollapse && (
          <PaneCollapseButton collapsed={Boolean(collapsed)} onClick={onToggleCollapse} label="chat" />
        )}
        {onClose ? (
          <IconButton label="Close chat" onClick={onClose}>
            <X />
          </IconButton>
        ) : (
          <IconButton
            label={floating ? "Dock chat back into the panel" : "Pop out into a window you can move and resize"}
            onClick={() => setFloating((f) => !f)}
          >
            {floating ? <PanelRightClose /> : <PictureInPicture2 />}
          </IconButton>
        )}
      </header>
      {!(collapsed && !floating) && (
        <>
          {hasSubject && context?.subject && (
            <p className="shrink-0 truncate border-b border-border px-4 py-2 text-xs text-muted-foreground" title={context.subject}>
              {context.subject}
            </p>
          )}

          <Conversation chat={chat} suggestions={context?.suggestions?.length ? context.suggestions : GENERAL_QUESTIONS} />

          <Composer onSend={chat.send} disabled={chat.thinking} hasParcel={hasSubject} />
        </>
      )}

      {floating &&
        EDGES.map(({ edge, className: edgeClass }) => (
          <div
            key={edge}
            aria-hidden
            className={cn("absolute z-10 touch-none", edgeClass)}
            onPointerDown={win.begin(edge)}
          />
        ))}
    </section>
  );

  // Portaled to <body>: this can be mounted arbitrarily deep (e.g. inside a
  // resizable pane), and `position: fixed` only escapes an ancestor's bounds
  // reliably when there's no risk of that ancestor creating its own
  // containing block (transform/filter/contain). A portal sidesteps that
  // regardless of where the component happens to live.
  if (!floating) return pane;
  if (onClose) return win.rect ? createPortal(pane, document.body) : null;
  return (
    <>
      <div className={cn("flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center", className)}>
        <p className="text-xs text-muted-foreground">The chat is popped out. Drag it anywhere and resize it from any edge.</p>
        <Button variant="outline" onClick={() => setFloating(false)}>
          <PanelRightClose /> Dock it back here
        </Button>
      </div>
      {win.rect && createPortal(pane, document.body)}
    </>
  );
}

function IconButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn("text-muted-foreground [&_svg]:size-4", pressed && "text-foreground")}
    >
      {children}
    </Button>
  );
}

function Conversation({ chat, suggestions }: { chat: ReturnType<typeof useChat>; suggestions: string[] }) {
  const end = useRef<HTMLDivElement>(null);
  const last = chat.turns.at(-1);
  const progress = last?.role === "assistant" ? last.shownWords : 0;

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [chat.turns.length, chat.thinking, progress]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" aria-live="polite">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-5">
        {chat.turns.length === 0 ? (
          <Welcome suggestions={suggestions} onPick={chat.send} />
        ) : (
          chat.turns.map((turn) =>
            turn.role === "user" ? (
              <UserTurn key={turn.id} text={turn.text} />
            ) : (
              <AssistantTurn
                key={turn.id}
                turn={turn}
                onFollowUp={chat.send}
                isLast={turn.id === last?.id}
                onListen={() => (chat.speaking ? chat.stop() : chat.speakTurn(turn.result))}
                speaking={chat.speaking}
              />
            ),
          )
        )}
        {chat.thinking && <TypingDots />}
        <div ref={end} />
      </div>
    </div>
  );
}

function Welcome({ suggestions, onPick }: { suggestions: string[]; onPick: (q: string) => void }) {
  return (
    <div className="flex flex-col gap-5 pt-2">
      <p className="text-xs text-muted-foreground">
        Ask me anything about what you're seeing. I'll explain it in plain language, using only this tool's data, and
        show you where each answer comes from.
      </p>
      {suggestions.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">Top questions</p>
          {suggestions.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onPick(q)}
              className="rounded-lg border border-border px-4 py-3 text-left text-xs transition-colors hover:border-foreground/30 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function UserTurn({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <p className="max-w-[85%] rounded-2xl rounded-br-md bg-muted px-4 py-2.5 text-xs whitespace-pre-wrap">
        {text}
      </p>
    </div>
  );
}

/** Cut blocks down to the first `words` words so replies appear progressively. */
function revealed(blocks: ReplyBlock[], words: number): { block: ReplyBlock; text: string; done: boolean }[] {
  const out: { block: ReplyBlock; text: string; done: boolean }[] = [];
  let left = words;
  for (const block of blocks) {
    if (left <= 0) break;
    const all = block.text.split(/\s+/);
    out.push({ block, text: all.slice(0, left).join(" "), done: left >= all.length });
    left -= all.length;
  }
  return out;
}

function AssistantTurn({
  turn,
  onFollowUp,
  isLast,
  onListen,
  speaking,
}: {
  turn: Extract<ChatTurn, { role: "assistant" }>;
  onFollowUp: (q: string) => void;
  isLast: boolean;
  onListen: () => void;
  speaking: boolean;
}) {
  const { result } = turn;
  if (result.status === "unavailable") return <Unavailable result={result} />;

  const facts = new Map(result.facts.map((f) => [f.id, f]));
  const shown = revealed(result.blocks, turn.shownWords);
  const done = turn.shownWords >= turn.totalWords;

  // Consecutive bullets render as one list.
  const groups: { bullets: boolean; items: typeof shown }[] = [];
  for (const item of shown) {
    const bullets = item.block.type === "bullet";
    const group = groups.at(-1);
    if (group && group.bullets === bullets && bullets) group.items.push(item);
    else groups.push({ bullets, items: [item] });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 text-xs">
        {groups.map((g, i) =>
          g.bullets ? (
            <ul key={i} className="flex flex-col gap-1.5 pl-5 [&>li]:list-disc [&>li]:marker:text-muted-foreground">
              {g.items.map((item, j) => (
                <li key={j}>
                  <BlockText text={item.text} ids={item.done ? item.block.fact_ids : []} facts={facts} />
                </li>
              ))}
            </ul>
          ) : (
            g.items.map((item, j) => (
              <p key={`${i}-${j}`}>
                <BlockText text={item.text} ids={item.done ? item.block.fact_ids : []} facts={facts} />
              </p>
            ))
          ),
        )}
      </div>

      {done && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onListen}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            {speaking ? <Square className="size-3.5" /> : <Volume2 className="size-3.5" />}
            {speaking ? "Stop" : "Listen"}
          </button>
        </div>
      )}

      {done && isLast && result.suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {result.suggestions.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onFollowUp(q)}
              className="rounded-full border border-border px-3.5 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BlockText({ text, ids, facts }: { text: string; ids: string[]; facts: Map<string, ChatFact> }) {
  return (
    <>
      {text}
      {ids.map((id) => {
        const fact = facts.get(id);
        return fact ? (
          <span key={id} className="ml-1.5 inline-block">
            <FactChip fact={fact} />
          </span>
        ) : null;
      })}
    </>
  );
}

function Unavailable({ result }: { result: Extract<ChatResult, { status: "unavailable" }> }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs">
      <p className="text-muted-foreground">{result.reason}</p>
      {result.notes.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1 pl-5 [&>li]:list-disc">
          {result.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-2" role="status" aria-label="Assistant is thinking">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-2 animate-bounce rounded-full bg-muted-foreground/70 motion-reduce:animate-pulse"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: "900ms" }}
        />
      ))}
    </div>
  );
}

function Composer({
  onSend,
  disabled,
  hasParcel,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
  hasParcel: boolean;
}) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const stopListening = useRef<(() => void) | null>(null);
  const box = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [text]);

  const submit = (value = text) => {
    if (!value.trim() || disabled) return;
    onSend(value);
    setText("");
  };

  const toggleMic = () => {
    if (listening) {
      stopListening.current?.();
      return;
    }
    setListening(true);
    stopListening.current = listen(setText, (final) => {
      setListening(false);
      stopListening.current = null;
      if (final) submit(final);
    });
  };

  return (
    <form
      className="shrink-0 border-t border-border p-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-border bg-muted/20 px-3 py-2 focus-within:border-foreground/30">
        <textarea
          ref={box}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={listening ? "Listening…" : hasParcel ? "Ask anything about this parcel…" : "Ask how this tool works…"}
          aria-label="Your question"
          className="max-h-[180px] min-h-7 flex-1 resize-none bg-transparent py-1 text-xs outline-none placeholder:text-muted-foreground"
        />
        {canListen() && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={listening ? "Stop listening" : "Speak your question"}
            title={listening ? "Stop listening" : "Speak your question"}
            aria-pressed={listening}
            onClick={toggleMic}
            className={cn(
              "shrink-0 rounded-full text-muted-foreground [&_svg]:size-4",
              listening && "animate-pulse bg-red-500/15 text-red-400",
            )}
          >
            <Mic />
          </Button>
        )}
        <Button
          type="submit"
          size="icon"
          aria-label="Send"
          disabled={disabled || !text.trim()}
          className="shrink-0 rounded-full [&_svg]:size-4"
        >
          <ArrowUp />
        </Button>
      </div>
    </form>
  );
}
