import { MessageSquareDashed } from "lucide-react";
import { EmptyState } from "@/components/deck/empty-state";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { portalConfig } from "@/config/portal";
import { formatDaysAgo } from "@/lib/format";
const { content } = portalConfig;
// Reads lead.updates, not lead.activity — the activity timeline is internal
// sales history ("First dial attempt made", ...) that a paying client should
// never see. See the CLIENT-SAFE RULE in config/portal.ts.
//
// TODO(backend): needs a composer on the agency side (an "update your
// client" box on the lead detail page) — until then this field only holds
// whatever the seed put there.
export function UpdatesFeed({ updates }) {
    return (<Panel className="flex h-full flex-col">
      <PanelHeader title={content.updates.title} hint={content.updates.hint}/>

      <PanelBody className="flex flex-1 flex-col">
        {updates.length === 0 ? (<EmptyState icon={MessageSquareDashed} title={content.updates.emptyTitle} description={content.updates.emptyDescription}/>) : (<ul className="flex flex-col gap-4">
            {updates.map((update) => (<li key={update.id} className="border-l border-hairline pl-3.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <p className="text-[0.875rem] font-medium text-ink">
                    {update.title}
                  </p>
                  <span className="deck-nums shrink-0 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-muted">
                    {formatDaysAgo(update.daysAgo)}
                  </span>
                </div>

                {update.body && (<p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-muted">
                    {update.body}
                  </p>)}
              </li>))}
          </ul>)}
      </PanelBody>
    </Panel>);
}
