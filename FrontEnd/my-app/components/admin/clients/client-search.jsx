"use client";
import { Search, X } from "lucide-react";
import { clientsConfig } from "@/config/clients";
import { template } from "@/lib/format";
import { cn } from "@/lib/utils";
const { content } = clientsConfig;
// No debounce — fine at this scale (an in-memory array filter).
// TODO(backend): once search hits the API, debounce it (~250ms) and show a
// pending state, or every keystroke becomes a request.
export function ClientSearch({ query, onQueryChange, resultCount, className, }) {
    const searching = query.trim().length > 0;
    return (<div className={cn("min-w-0 flex-1 sm:max-w-sm", className)}>
      <div className="group relative">
        <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted transition-colors group-focus-within:text-brand"/>

        <input type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={content.searchPlaceholder} aria-label={content.searchPlaceholder} aria-describedby="client-search-status" className={cn("deck-input h-10 w-full rounded-xl border border-hairline bg-white/[0.02] pl-10 text-[0.875rem] text-ink caret-brand outline-none transition duration-200", "placeholder:text-ink-muted hover:border-hairline-strong hover:bg-white/[0.035]", "focus:border-brand/55 focus:bg-white/[0.05] focus:ring-4 focus:ring-brand/10", searching ? "pr-10" : "pr-3.5",
        // Safari paints its own clear affordance on type="search"; hide it
        // in favor of ours.
        "[&::-webkit-search-cancel-button]:appearance-none")}/>

        {searching && (<button type="button" onClick={() => onQueryChange("")} aria-label={content.searchClearLabel} className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-ink-muted transition hover:bg-white/[0.06] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50">
            <X aria-hidden className="size-3.5"/>
          </button>)}
      </div>

      <p id="client-search-status" aria-live="polite" className="mt-2 min-h-[1rem] text-[0.75rem] text-ink-muted">
        {searching &&
            template(content.searchResultLabel, {
                n: `${resultCount} ${resultCount === 1
                    ? content.searchResultUnit
                    : content.searchResultUnitPlural}`,
                q: `“${query.trim()}”`,
            })}
      </p>
    </div>);
}
