"use client";
import { useEffect, useRef } from "react";
import { MessageSquareDashed } from "lucide-react";
import { EmptyState } from "@/components/deck/empty-state";
import { chatConfig } from "@/config/chat";
import { cn } from "@/lib/utils";
const { content, features } = chatConfig;
// Own messages align right on a lime-tinted bubble; the rep's stay left on
// deck surface — side and colour together, since alignment alone fails on a
// full-width wrap and colour alone fails in greyscale (each bubble also
// keeps a sr-only byline). Auto-scrolls to newest on send/thread change so
// the just-sent confirmation isn't below the fold.
export function MessageList({ messages,
/** Changes when the open thread changes, so the pane re-scrolls. */
threadId, }) {
    const endRef = useRef(null);
    useEffect(() => {
        if (!features.autoScroll)
            return;
        // "auto" not "smooth" — a thread change is a jump, not an animation.
        endRef.current?.scrollIntoView({ block: "end", behavior: "auto" });
    }, [threadId, messages.length]);
    if (messages.length === 0) {
        return (<EmptyState icon={MessageSquareDashed} title={content.emptyThreadTitle} description={content.emptyThreadDescription} className="flex-1"/>);
    }
    return (<div className="deck-scroll flex-1 overflow-y-auto px-4 py-5 sm:px-5" role="log" aria-label={content.messageLogLabel} aria-live="polite">
      <ol className="flex flex-col gap-3">
        {messages.map((message) => (<li key={message.id} className={cn("flex flex-col", message.fromMe ? "items-end" : "items-start")}>
            <div className={cn("max-w-[85%] rounded-md px-3.5 py-2.5 sm:max-w-[75%]", message.fromMe
                ? "rounded-br-md bg-brand/[0.14] text-ink"
                : "rounded-bl-md border border-hairline bg-white/[0.035] text-ink-soft")}>
              <span className="sr-only">
                {message.fromMe ? content.selfLabel : message.authorName}{" "}
                said:
              </span>

              <p className="whitespace-pre-wrap break-words text-[0.875rem] leading-relaxed">
                {message.body}
              </p>
            </div>

            <p className={cn("mt-1 px-1 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-muted")}>
              {message.timeLabel}
            </p>
          </li>))}
      </ol>

      <div ref={endRef}/>
    </div>);
}
