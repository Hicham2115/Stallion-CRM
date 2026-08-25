"use client";

import { Search, X } from "lucide-react";

import { clientsConfig } from "@/config/clients";
import { template } from "@/lib/format";
import { cn } from "@/lib/utils";

const { content } = clientsConfig;

/**
 * The client search box.
 *
 * Three things the prototype's bare input did not do, all of them about
 * telling the user what just happened:
 *
 *   - a LIVE RESULT COUNT, so a search that narrowed 14 clients to 1 says so
 *     instead of leaving the user to count rows
 *   - a CLEAR BUTTON, because emptying a field by holding backspace is not an
 *     affordance
 *   - an ARIA LIVE REGION on the count, so a screen reader hears the list
 *     change; visually the table just redraws, which is silent
 *
 * Filtering happens as you type, with no debounce. That is fine at this scale —
 * it is an array filter over a few dozen records in memory.
 * TODO(backend): once search hits the API, debounce it (~250ms) and show a
 * pending state, or every keystroke becomes a request.
 */
export function ClientSearch({
  query,
  onQueryChange,
  resultCount,
  className,
}: {
  query: string;
  onQueryChange: (query: string) => void;
  resultCount: number;
  className?: string;
}) {
  const searching = query.trim().length > 0;

  return (
    <div className={cn("min-w-0 flex-1 sm:max-w-sm", className)}>
      <div className="group relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted transition-colors group-focus-within:text-brand"
        />

        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={content.searchPlaceholder}
          aria-label={content.searchPlaceholder}
          aria-describedby="client-search-status"
          className={cn(
            "deck-input h-10 w-full rounded-xl border border-hairline bg-white/[0.02] pl-10 text-[0.875rem] text-ink caret-brand outline-none transition duration-200",
            "placeholder:text-ink-muted hover:border-hairline-strong hover:bg-white/[0.035]",
            "focus:border-brand/55 focus:bg-white/[0.05] focus:ring-4 focus:ring-brand/10",
            // Room for the clear button only when there is one, so the
            // placeholder is not permanently indented around empty space.
            searching ? "pr-10" : "pr-3.5",
            // Safari paints its own clear affordance on type="search"; ours is
            // the one that matches the deck.
            "[&::-webkit-search-cancel-button]:appearance-none",
          )}
        />

        {searching && (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            aria-label={content.searchClearLabel}
            className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-ink-muted transition hover:bg-white/[0.06] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
          >
            <X aria-hidden className="size-3.5" />
          </button>
        )}
      </div>

      {/* Always mounted, so assistive tech announces the change rather than the
          insertion of a new node. Empty when not searching, so it is silent
          until there is something to say. */}
      <p
        id="client-search-status"
        aria-live="polite"
        className="mt-2 min-h-[1rem] text-[0.75rem] text-ink-muted"
      >
        {searching &&
          template(content.searchResultLabel, {
            n: `${resultCount} ${
              resultCount === 1
                ? content.searchResultUnit
                : content.searchResultUnitPlural
            }`,
            q: `“${query.trim()}”`,
          })}
      </p>
    </div>
  );
}
