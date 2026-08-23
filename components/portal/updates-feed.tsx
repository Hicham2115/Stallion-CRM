import { MessageSquareDashed } from "lucide-react";

import { EmptyState } from "@/components/deck/empty-state";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { portalConfig } from "@/config/portal";
import { formatDaysAgo } from "@/lib/format";
import type { ProjectUpdate } from "@/lib/types";

const { content } = portalConfig;

/**
 * ============================================================================
 *  LATEST UPDATES
 * ============================================================================
 *  Short notes written by the agency FOR the client.
 *
 *  THIS IS NOT `lead.activity`. The lead's activity timeline is the sales
 *  history — "Lead created", "First dial attempt made", "Signed as client" —
 *  and every line of it is true, internal, and something a paying customer
 *  should never read about themselves. Rendering it here would have been the
 *  cheapest way to fill this panel and the single worst thing on the screen.
 *
 *  So the portal reads `lead.updates`, which is a separate field written in the
 *  client's direction. See the CLIENT-SAFE RULE in config/portal.ts.
 *
 *  TODO(backend): this needs a composer on the agency side — an "update your
 *  client" box on the lead detail page — otherwise the field only ever holds
 *  whatever the seed put there. Until that exists the panel is honest but
 *  static.
 * ============================================================================
 */
export function UpdatesFeed({ updates }: { updates: ProjectUpdate[] }) {
  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader title={content.updates.title} hint={content.updates.hint} />

      <PanelBody className="flex flex-1 flex-col">
        {updates.length === 0 ? (
          <EmptyState
            icon={MessageSquareDashed}
            title={content.updates.emptyTitle}
            description={content.updates.emptyDescription}
          />
        ) : (
          <ul className="flex flex-col gap-4">
            {updates.map((update) => (
              <li
                key={update.id}
                // Left hairline rather than a card per update: five stacked
                // cards inside a card is a box-in-a-box, and the rule is enough
                // to group a title with its body.
                className="border-l border-hairline pl-3.5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <p className="text-[0.875rem] font-medium text-ink">
                    {update.title}
                  </p>
                  <span className="deck-nums shrink-0 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-muted">
                    {formatDaysAgo(update.daysAgo)}
                  </span>
                </div>

                {update.body && (
                  <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-muted">
                    {update.body}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </PanelBody>
    </Panel>
  );
}
