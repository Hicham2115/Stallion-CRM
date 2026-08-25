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
// Responsive shape borrowed from the admin screen: table from md up,
// ClientCard stacks below. No delete anywhere — a rep can create and work a
// client but not remove one (see config/roles.ts): the record carries the
// commission, and the person paid on it shouldn't be able to make it
// disappear.
export function RepClientsView() {
    const { clients, loading, rep } = useRepScope();
    const [query, setQuery] = useState("");
    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle)
            return clients;
        // Phone excluded — needs normalising to match usefully.
        return clients.filter((client) => [client.name, client.company, client.email]
            .join(" ")
            .toLowerCase()
            .includes(needle));
    }, [clients, query]);
    if (loading)
        return <RepSkeleton />;
    if (!rep)
        return <RepMissing />;
    return (<PageShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="deck-nums text-[0.875rem] text-ink-muted">
          {template(content.clients.countLabel, {
            n: formatNumber(filtered.length),
        })}
        </p>

        <div className="flex flex-wrap items-center gap-2.5">
          {features.search && (<ClientSearch query={query} onQueryChange={setQuery} resultCount={filtered.length}/>)}
          {features.addClient && <AddMyClientDialog repId={rep.id}/>}
        </div>
      </div>

      {clients.length === 0 ? (<Panel>
          <EmptyState icon={Users} title={content.clients.emptyTitle} description={content.clients.emptyDescription} action={features.addClient ? <AddMyClientDialog repId={rep.id}/> : undefined}/>
        </Panel>) : filtered.length === 0 ? (
        <Panel>
          <EmptyState icon={SearchX} title={content.clients.noMatchTitle} description={content.clients.noMatchDescription} action={<button type="button" onClick={() => setQuery("")} className="mt-1 inline-flex h-10 items-center rounded-xl border border-hairline bg-white/[0.03] px-4 text-[0.875rem] font-medium text-ink transition-colors hover:border-hairline-strong hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60">
                {content.clients.clearSearch}
              </button>}/>
        </Panel>) : (<>
          <Panel className="hidden md:block">
            <RepClientsTable clients={filtered}/>
          </Panel>

          <div className="flex flex-col gap-3 md:hidden">
            {filtered.map((client) => (<ClientCard key={client.id} client={client} repName={rep.name} href={repConfig.routes.lead(client.id)}/>))}
          </div>
        </>)}
    </PageShell>);
}
