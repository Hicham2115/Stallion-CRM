"use client";

import { ChevronRight } from "lucide-react";

import { chatConfig } from "@/config/chat";
import { initialsOf } from "@/lib/format";
import type { ChatThread, Rep } from "@/lib/types";
import { cn } from "@/lib/utils";

const { content } = chatConfig;

/**
 * The rep list, with a preview of the last message in each thread.
 *
 * Rendered as a listbox-style set of buttons rather than links: opening a
 * thread is a state change within the screen, not a navigation, so a URL would
 * promise a shareable address that does not exist.
 */
export function ThreadList({
  reps,
  threads,
  selectedThreadId,
  onSelect,
}: {
  reps: Rep[];
  threads: ChatThread[];
  selectedThreadId: string | null;
  onSelect: (threadId: string) => void;
}) {
  return (
    <ul className="deck-scroll flex-1 overflow-y-auto p-2">
      {reps.map((rep) => {
        const thread = threads.find((entry) => entry.repId === rep.id);
        if (!thread) return null;

        const last = thread.messages[thread.messages.length - 1];
        const selected = thread.id === selectedThreadId;

        return (
          <li key={thread.id}>
            <button
              type="button"
              onClick={() => onSelect(thread.id)}
              aria-current={selected ? "true" : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60",
                selected
                  ? "bg-brand/[0.1] ring-1 ring-brand/25"
                  : "hover:bg-white/[0.04]",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  // Tinted whether or not the thread is selected. The row
                  // itself already carries the selection (lime wash + ring),
                  // and a filled disc here was a third lime fill on a screen
                  // that also has the active nav item and the Send button.
                  // See The One Lime Answer Rule in DESIGN.md.
                  "grid size-9 shrink-0 place-items-center rounded-full bg-brand/15 font-mono text-[0.625rem] font-medium text-brand",
                  // A deactivated rep is dimmed here too, so the chat list and
                  // the Settings roster tell the same story.
                  !rep.active && "opacity-50",
                )}
              >
                {initialsOf(rep.name)}
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span
                    className={cn(
                      "truncate text-[0.875rem] font-medium",
                      selected ? "text-ink" : "text-ink-soft",
                    )}
                  >
                    {rep.name}
                  </span>

                  {last && (
                    <span className="shrink-0 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-ink-muted">
                      {last.timeLabel}
                    </span>
                  )}
                </span>

                <span className="mt-0.5 block truncate text-[0.75rem] text-ink-muted">
                  {last
                    ? `${last.fromMe ? "You: " : ""}${last.body}`
                    : content.noPreview}
                </span>
              </span>

              {/* Only on phones, where selecting pushes to a full-screen pane
                  and the chevron is the affordance for that. */}
              <ChevronRight
                aria-hidden
                className="size-4 shrink-0 text-ink-muted md:hidden"
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
