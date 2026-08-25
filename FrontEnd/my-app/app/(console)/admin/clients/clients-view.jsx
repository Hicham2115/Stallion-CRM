"use client";
import { useMemo, useState } from "react";
import { SearchX, Users } from "lucide-react";
import { toast } from "sonner";
import { AddClientDialog } from "@/components/admin/clients/add-client-dialog";
import { ClientCard } from "@/components/admin/clients/client-card";
import { ClientsTable } from "@/components/admin/clients/clients-table";
import { ClientSearch } from "@/components/admin/clients/client-search";
import { ConfirmDialog, showUndoToast } from "@/components/deck/confirm-dialog";
import { EmptyState } from "@/components/deck/empty-state";
import { Panel, PanelBody } from "@/components/deck/panel";
import { clientsConfig } from "@/config/clients";
import { formatNumber, template } from "@/lib/format";
import { useCrm } from "@/lib/store/crm-store";
import { selectClients } from "@/lib/store/selectors";
import { PageShell } from "@/components/console/page-shell";
const { content, features } = clientsConfig;
// A "client" is not a separate record — it's a lead sitting in the stage
// flagged `isWon`, which is why this screen and the pipeline's Client column
// can never disagree about the count. Delete gets two independent nets: a
// confirm dialog naming the client, and an undo toast — they catch different
// mistakes (the mis-click noticed before vs. a second after confirming).
export function ClientsView() {
    const { state, actions } = useCrm();
    const [query, setQuery] = useState("");
    const [pendingDelete, setPendingDelete] = useState(null);
    const clients = selectClients(state);
    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle)
            return clients;
        // Phone excluded — it'd need normalising (spaces, +212 vs 0) to match
        // usefully.
        return clients.filter((client) => [client.name, client.company, client.email]
            .join(" ")
            .toLowerCase()
            .includes(needle));
    }, [clients, query]);
    function repNameOf(repId) {
        return state.reps.find((rep) => rep.id === repId)?.name ?? content.unassignedLabel;
    }
    // Delete, then offer to put it back — see the TODO in confirm-dialog.tsx
    // for why a real backend needs different undo handling.
    async function handleConfirmDelete() {
        const client = pendingDelete;
        if (!client)
            return;
        // Captured before the delete, so undo restores it to the same spot.
        const index = state.leads.findIndex((lead) => lead.id === client.id);
        const result = await actions.deleteLead(client.id);
        if (!result.ok)
            return;
        if (features.undoDelete) {
            showUndoToast({
                message: template(content.deleteToast, { name: client.name }),
                onUndo: async () => {
                    const restored = await actions.restoreLead(client, index);
                    if (restored.ok) {
                        toast.success(template(content.undoToast, { name: client.name }));
                    }
                },
            });
        }
    }
    const searching = query.trim().length > 0;
    return (<PageShell>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-start gap-3">
          <p className="mt-2 shrink-0 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted">
            <span className="deck-nums text-ink">{formatNumber(clients.length)}</span>{" "}
            {content.countLabel}
          </p>

          {features.search && (<ClientSearch query={query} onQueryChange={setQuery} resultCount={filtered.length}/>)}
        </div>

        {features.addClient && <AddClientDialog />}
      </div>

      <Panel>
        {filtered.length === 0 ? (
        searching ? (<EmptyState icon={SearchX} title={content.noMatchesTitle} description={content.noMatchesDescription}/>) : (<EmptyState icon={Users} title={content.emptyTitle} description={content.emptyDescription}/>)) : (<>
            {/* Phone gets cards — six columns can't shrink to 360px readably. */}
            <PanelBody className="md:hidden">
              <div className="flex flex-col gap-3">
                {filtered.map((client) => (<ClientCard key={client.id} client={client} repName={repNameOf(client.assignedRepId)} onDelete={setPendingDelete}/>))}
              </div>
            </PanelBody>

            <PanelBody flush className="hidden md:block">
              <ClientsTable clients={filtered} repNameOf={repNameOf} onDelete={setPendingDelete}/>
            </PanelBody>
          </>)}
      </Panel>

      {features.confirmDelete && (<ConfirmDialog open={pendingDelete !== null} onOpenChange={(open) => {
                if (!open)
                    setPendingDelete(null);
            }} title={content.deleteTitle} description={content.deleteDescription} recordName={pendingDelete
                ? `${pendingDelete.name} · ${pendingDelete.company}`
                : undefined} confirmLabel={content.deleteConfirmLabel} pendingLabel={content.deletePendingLabel} onConfirm={handleConfirmDelete}/>)}
    </PageShell>);
}
