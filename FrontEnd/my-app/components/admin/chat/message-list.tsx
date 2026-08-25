"use client";

import { useEffect, useRef } from "react";
import { MessageSquareDashed } from "lucide-react";

import { EmptyState } from "@/components/deck/empty-state";
import { chatConfig } from "@/config/chat";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

const { content, features } = chatConfig;

/**
 * ============================================================================
 *  MESSAGE LIST
 * ============================================================================
 *  THE BIGGEST READABILITY FIX ON THIS SCREEN. In the prototype both sides of
 *  the conversation rendered identically — same alignment, same surface, same
 *  colour — so working out who said what meant reading the byline under every
 *  single message. Chat has one job and that was it.
 *
 *  Own messages now align right on a lime-tinted bubble; the rep's stay left on
 *  deck surface. Side and colour together, not either alone: alignment alone
 *  fails when a message wraps to full width, and colour alone fails in
 *  greyscale. Each bubble also keeps a byline for screen readers, which get
 *  neither cue.
 *
 *  AUTO-SCROLL. Sending a message put it below the fold, so the confirmation
 *  that it sent was off-screen. The pane now jumps to the newest on send and on
 *  thread change.
 * ============================================================================
 */
export function MessageList({
  messages,
  /** Changes when the open thread changes, so the pane re-scrolls. */
  threadId,
}: {
  messages: ChatMessage[];
  threadId: string;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!features.autoScroll) return;
    // "auto" rather than "smooth": on thread change this is a jump to the
    // bottom, not an animation, and smooth-scrolling a long history means
    // watching every message fly past.
    endRef.current?.scrollIntoView({ block: "end", behavior: "auto" });
  }, [threadId, messages.length]);

  if (messages.length === 0) {
    return (
      // The list said "No messages yet" in the preview but the pane showed a
      // blank rectangle, which reads as a failed load rather than a new thread.
      <EmptyState
        icon={MessageSquareDashed}
        title={content.emptyThreadTitle}
        description={content.emptyThreadDescription}
        className="flex-1"
      />
    );
  }

  return (
    <div
      className="deck-scroll flex-1 overflow-y-auto px-4 py-5 sm:px-5"
      role="log"
      aria-label={content.messageLogLabel}
      aria-live="polite"
    >
      <ol className="flex flex-col gap-3">
        {messages.map((message) => (
          <li
            key={message.id}
            className={cn(
              "flex flex-col",
              message.fromMe ? "items-end" : "items-start",
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2.5 sm:max-w-[75%]",
                message.fromMe
                  ? "rounded-br-md bg-brand/[0.14] text-ink"
                  : "rounded-bl-md border border-hairline bg-white/[0.035] text-ink-soft",
              )}
            >
              {/* Alignment and colour are visual cues only. This is what a
                  screen reader gets, and it is why every bubble carries it. */}
              <span className="sr-only">
                {message.fromMe ? content.selfLabel : message.authorName}{" "}
                said:
              </span>

              <p className="whitespace-pre-wrap break-words text-[0.875rem] leading-relaxed">
                {message.body}
              </p>
            </div>

            <p
              className={cn(
                "mt-1 px-1 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-muted",
              )}
            >
              {message.timeLabel}
            </p>
          </li>
        ))}
      </ol>

      {/* Scroll anchor. A zero-height element is cheaper and more reliable than
          measuring the container's scrollHeight on every render. */}
      <div ref={endRef} />
    </div>
  );
}
