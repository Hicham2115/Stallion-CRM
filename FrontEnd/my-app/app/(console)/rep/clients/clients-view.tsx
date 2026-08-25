"use client";

import { useMemo, useState } from "react";
import { SearchX, Users } from "lucide-react";

import { ClientCard } from "@/components/admin/clients/client-card";
import { ClientSearch } from "@/components/admin/clients/client-search";
import { PageShell } from "@/components/console/page-shell";
import { EmptyState } from "@/components/deck/empty-state";
import { Panel } from "@/components/deck/panel";
import { AddMyClientDialog } from "@/components/rep/add-my-client-dialog";
import { RepClientsTable } from "@/components/rep/rep-clients-table";
import { RepMissing, RepSkeleton } from "@/components/rep/rep-states";
import { useRepScope } from "@/components/rep/use-rep-scope";
import { repConfig } from "@/config/rep";
import { formatNumber, template } from "@/lib/format";

const { content, features } = repConfig;

/**
 * ============================================================================
 *  /rep/clients — MY CLIENTS
 * ============================================================================
 *  Everyone this rep has personally converted.
 *
 *  RESPONSIVE SHAPE, borrowed wholesale from the admin screen: a table from
 *  `md` up, and `ClientCard` stacks below it. A five-column table on a 360px
 *  phone is a horizontal scroll nobody performs, and reps are the people most
 *  likely to open this on a phone between calls.
 *
 *  NO DELETE ANYWHERE. A rep may create and work a client but not remove one —
 *  see the field-ownership table in config/roles.ts. That is a deliberate
 *  asymmetry: the record carries the commission, and the person paid on it
 *  should not be the person who can make it disappear.
 * ============================================================================
 */
export function RepClientsView() {
  const { clients, loading, rep } = useRepScope();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return clients;

    // Name, company and email — the three things someone actually searches by.
    // Phone is excluded for the same reason as the admin screen: matching it
    // usefully needs normalising, and half-matching a number is worse than not
    // offering it at all.
    return clients.filter((client) =>
      [client.name, client.company, client.email]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [clients, query]);

  if (loading) return <RepSkeleton />;
  if (!rep) return <RepMissing />;

  return (
    <PageShell>
      {/* ------------------------------------------------------------------ */}
      {/* Toolbar                                                             */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="deck-nums text-[0.875rem] text-ink-muted">
          {template(content.clients.countLabel, {
            n: formatNumber(filtered.length),
          })}
        </p>

        <div className="flex flex-wrap items-center gap-2.5">
          {features.search && (
            <ClientSearch
              query={query}
              onQueryChange={setQuery}
              resultCount={filtered.length}
            />
          )}
          {features.addClient && <AddMyClientDialog repId={rep.id} />}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* The list                                                            */}
      {/* ------------------------------------------------------------------ */}
      {clients.length === 0 ? (
        <Panel>
          <EmptyState
            icon={Users}
            title={content.clients.emptyTitle}
            description={content.clients.emptyDescription}
            action={
              features.addClient ? <AddMyClientDialog repId={rep.id} /> : undefined
            }
          />
        </Panel>
      ) : filtered.length === 0 ? (
        // Distinct from "no clients at all". Telling someone their SEARCH is
        // empty, and offering to clear it, is the difference between a dead end
        // and a wrong turn.
        <Panel>
          <EmptyState
            icon={SearchX}
            title={content.clients.noMatchTitle}
            description={content.clients.noMatchDescription}
            action={
              <button
                type="button"
                onClick={() => setQuery("")}
                className="mt-1 inline-flex h-10 items-center rounded-xl border border-hairline bg-white/[0.03] px-4 text-[0.875rem] font-medium text-ink transition-colors hover:border-hairline-strong hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
              >
                {content.clients.clearSearch}
              </button>
            }
          />
        </Panel>
      ) : (
        <>
          {/* Table from md up. */}
          <Panel className="hidden md:block">
            <RepClientsTable clients={filtered} />
          </Panel>

          {/* Cards below it. `repNameOf` returns the rep's own name, which the
              card renders as a caption — harmless here, and it keeps the shared
              card component free of a rep-specific branch. */}
          <div className="flex flex-col gap-3 md:hidden">
            {filtered.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                repName={rep.name}
                href={repConfig.routes.lead(client.id)}
              />
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
}
