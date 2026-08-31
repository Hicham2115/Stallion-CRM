import Link from "next/link";
import { Users } from "lucide-react";
import { EmptyState } from "@/components/deck/empty-state";
import { InitialsAvatar } from "@/components/deck/initials-avatar";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { repConfig } from "@/config/rep";
const { content, routes } = repConfig;
// A short list, not the full table (that lives at /rep/clients) — this
// panel only answers "who". `onSelect`, when given, opens the real Lead
// Details dialog (same one Clients uses) instead of linking to
// /rep/leads/:id — that per-lead page is still mock-only, so real leads
// (real numeric ids) would 404 there.
export function MyClientsPanel({ clients, onSelect }) {
    const shown = clients.slice(0, content.dashboard.clientsPreviewLimit);
    const hidden = clients.length - shown.length;
    return (<Panel className="flex h-full flex-col">
      <PanelHeader title={content.dashboard.clientsTitle} hint={content.dashboard.clientsHint}/>

      <PanelBody className="flex flex-1 flex-col">
        {clients.length === 0 ? (<EmptyState icon={Users} title={content.dashboard.clientsEmptyTitle} description={content.dashboard.clientsEmptyDescription}/>) : (<>
            <ul className="flex flex-col divide-y divide-hairline">
              {shown.map((client) => (<li key={client.id}>
                  <button type="button" onClick={() => onSelect?.(client.lead ?? client)} className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-md px-2 py-3 text-left transition-colors hover:bg-white/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60">
                    <InitialsAvatar name={client.name} size="lg"/>

                    <span className="min-w-0">
                      <span className="block truncate text-[0.9375rem] font-medium text-ink">
                        {client.name}
                      </span>
                      <span className="block truncate text-[0.8125rem] text-ink-muted">
                        {client.company}
                      </span>
                    </span>
                  </button>
                </li>))}
            </ul>

            {hidden > 0 && (<Link href={routes.clients} className="mt-auto inline-flex w-fit pt-4 text-[0.8125rem] font-medium text-ink-muted underline-offset-4 transition-colors hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60">
                {content.dashboard.clientsSeeAll}
              </Link>)}
          </>)}
      </PanelBody>
    </Panel>);
}
