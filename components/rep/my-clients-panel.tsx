import Link from "next/link";
import { Users } from "lucide-react";

import { EmptyState } from "@/components/deck/empty-state";
import { InitialsAvatar } from "@/components/deck/initials-avatar";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { repConfig } from "@/config/rep";
import type { Lead } from "@/lib/types";

const { content, routes } = repConfig;

/**
 * ============================================================================
 *  MY CLIENTS  (dashboard panel)
 * ============================================================================
 *  The rep's own converted clients, as a short list beside their stage
 *  breakdown.
 *
 *  A LIST, NOT A TABLE. The full table lives at /rep/clients with contact
 *  details, source and notes. Repeating those columns in a half-width panel
 *  would truncate every one of them; this answers the only question the
 *  dashboard needs to — WHO — and links onward for the rest.
 *
 *  EVERY ROW IS A LINK into the lead page. The prototype rendered these as
 *  plain text, which made the one panel showing a rep their own wins a dead
 *  end.
 * ============================================================================
 */
export function MyClientsPanel({ clients }: { clients: Lead[] }) {
  const shown = clients.slice(0, content.dashboard.clientsPreviewLimit);
  const hidden = clients.length - shown.length;

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader
        title={content.dashboard.clientsTitle}
        hint={content.dashboard.clientsHint}
      />

      <PanelBody className="flex flex-1 flex-col">
        {clients.length === 0 ? (
          <EmptyState
            icon={Users}
            title={content.dashboard.clientsEmptyTitle}
            description={content.dashboard.clientsEmptyDescription}
          />
        ) : (
          <>
            <ul className="flex flex-col divide-y divide-hairline">
              {shown.map((client) => (
                <li key={client.id}>
                  <Link
                    href={routes.lead(client.id)}
                    className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-white/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
                  >
                    <InitialsAvatar name={client.name} size="lg" />

                    <span className="min-w-0">
                      <span className="block truncate text-[0.9375rem] font-medium text-ink">
                        {client.name}
                      </span>
                      <span className="block truncate text-[0.8125rem] text-ink-muted">
                        {client.company}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Only offered when something is actually hidden — a "see all"
                that leads to the same six rows is a wasted click. */}
            {hidden > 0 && (
              <Link
                href={routes.clients}
                className="mt-auto inline-flex w-fit pt-4 text-[0.8125rem] font-medium text-ink-muted underline-offset-4 transition-colors hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
              >
                {content.dashboard.clientsSeeAll}
              </Link>
            )}
          </>
        )}
      </PanelBody>
    </Panel>
  );
}
