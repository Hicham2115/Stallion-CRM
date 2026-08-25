"use client";
import { ChevronRight } from "lucide-react";
import { chatConfig } from "@/config/chat";
import { initialsOf } from "@/lib/format";
import { cn } from "@/lib/utils";
const { content } = chatConfig;
// Buttons, not links — opening a thread is a state change within the
// screen, not a navigation, so a URL would promise a shareable address that
// doesn't exist.
export function ThreadList({ reps, threads, selectedThreadId, onSelect, }) {
    return (<ul className="deck-scroll flex-1 overflow-y-auto p-2">
      {reps.map((rep) => {
            const thread = threads.find((entry) => entry.repId === rep.id);
            if (!thread)
                return null;
            const last = thread.messages[thread.messages.length - 1];
            const selected = thread.id === selectedThreadId;
            return (<li key={thread.id}>
            <button type="button" onClick={() => onSelect(thread.id)} aria-current={selected ? "true" : undefined} className={cn("flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60", selected
                    ? "bg-brand/[0.1] ring-1 ring-brand/25"
                    : "hover:bg-white/[0.04]")}>
              <span aria-hidden className={cn("grid size-9 shrink-0 place-items-center rounded-full bg-brand/15 font-mono text-[0.625rem] font-medium text-brand",
                // Deactivated reps are dimmed here too, to match Settings.
                !rep.active && "opacity-50")}>
                {initialsOf(rep.name)}
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className={cn("truncate text-[0.875rem] font-medium", selected ? "text-ink" : "text-ink-soft")}>
                    {rep.name}
                  </span>

                  {last && (<span className="shrink-0 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-ink-muted">
                      {last.timeLabel}
                    </span>)}
                </span>

                <span className="mt-0.5 block truncate text-[0.75rem] text-ink-muted">
                  {last
                    ? `${last.fromMe ? "You: " : ""}${last.body}`
                    : content.noPreview}
                </span>
              </span>

              <ChevronRight aria-hidden className="size-4 shrink-0 text-ink-muted md:hidden"/>
            </button>
          </li>);
        })}
    </ul>);
}
