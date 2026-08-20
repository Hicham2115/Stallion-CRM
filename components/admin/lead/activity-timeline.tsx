import { Activity } from "lucide-react";

import { EmptyState } from "@/components/deck/empty-state";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { leadConfig } from "@/config/lead";
import { formatDaysAgo } from "@/lib/format";
import type { ActivityEvent } from "@/lib/types";

const { content } = leadConfig;

/**
 * The lead's history, as a timeline.
 *
 * THE SPINE IS THE POINT. In the prototype each entry was a dot and a line of
 * text, floating with no relationship to the one above it — six separate rows
 * the eye had to assemble into a sequence by reading every timestamp. A single
 * hairline running through the dots does that assembly for you: the eye follows
 * the line and reads it as one story, in order.
 *
 * That is the Command Deck instrument language doing real work rather than
 * decoration — the same hairline vocabulary as the tick ruler and the panel
 * borders, used here to carry meaning.
 *
 * Entries are stored oldest-first (see the note on `Lead.activity`), so the
 * timeline reads top to bottom in the order things happened.
 */
export function ActivityTimeline({ activity }: { activity: ActivityEvent[] }) {
  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader title={content.activityTitle} hint={content.activityHint} />

      <PanelBody className="flex flex-1 flex-col">
        {activity.length === 0 ? (
          <EmptyState icon={Activity} title={content.activityEmpty} />
        ) : (
          <ol className="relative flex flex-col gap-5">
            {activity.map((event, index) => {
              const last = index === activity.length - 1;

              return (
                <li key={event.id} className="relative flex gap-3.5">
                  {/* Dot + the segment of spine below it. The segment is drawn
                      per-item rather than as one absolutely positioned rule, so
                      it stops exactly at the last dot instead of trailing off
                      past the end of the list. */}
                  <span
                    aria-hidden
                    className="relative flex w-2 shrink-0 justify-center"
                  >
                    <span
                      className={`mt-1.5 size-2 shrink-0 rounded-full ring-4 ring-deck-surface ${
                        // The newest entry is the live one and gets the accent;
                        // history recedes. The label beside it carries the
                        // meaning regardless, so this is never load-bearing.
                        last ? "bg-brand" : "bg-ink-faint"
                      }`}
                    />
                    {!last && (
                      <span className="absolute left-1/2 top-4 h-[calc(100%+0.75rem)] w-px -translate-x-1/2 bg-hairline" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1 pb-0.5">
                    <p className="text-[0.875rem] leading-snug text-ink-soft">
                      {event.label}
                    </p>
                    <p className="mt-1 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-muted">
                      {/* "1 days ago" in the prototype. formatDaysAgo renders
                          "Today" / "Yesterday" and pluralises properly. */}
                      {formatDaysAgo(event.daysAgo)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </PanelBody>
    </Panel>
  );
}
