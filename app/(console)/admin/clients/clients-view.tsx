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
import type { Lead } from "@/lib/types";
import { PageShell } from "@/components/console/page-shell";

const { content, features } = clientsConfig;

/**
 * ============================================================================
 *  CLIENTS
 * ============================================================================
 *  The list of everyone who has converted. A "client" is not a separate record
 *  — it is a lead sitting in the stage flagged `isWon` — which is why this
 *  screen and the pipeline's Client column can never disagree about the count.
 *
 *  DELETE IS THE RISK ON THIS SCREEN, and it gets two independent nets:
 *  a confirmation dialog that NAMES the client, and an undo on the toast that
 *  follows. They catch different mistakes — the dialog catches the mis-click
 *  you notice before confirming, undo catches the one you notice a second
 *  after. See components/deck/confirm-dialog.tsx.
 * ============================================================================
 */
export function ClientsView() {
  const { state, actions } = useCrm();
  const [query, setQuery] = useState("");

  /** The client queued for deletion, or null when the dialog is closed. */
  const [pendingDelete, setPendingDelete] = useState<Lead | null>(null);

  const clients = selectClients(state);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return clients;

    // Name, company and email — the three things someone actually searches by.
    // Phone is excluded on purpose: it would need normalising (spaces, +212 vs
    // 0) to match usefully, and half-matching a phone number is worse than not
    // offering it.
    return clients.filter((client) =>
      [client.name, client.company, client.email]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [clients, query]);

  function repNameOf(repId: string | null): string {
    return (
      state.reps.find((rep) => rep.id === repId)?.name ?? content.unassignedLabel
    );
  }

  /**
   * Delete, then offer to put it back.
   *
   * Undo re-adds the exact record we removed, which works because the mock
   * delete is not real. See the TODO in confirm-dialog.tsx for what a real
   * backend has to do differently — a re-POST would mint a new id and leave the
   * audit trail showing a delete followed by a create.
   */
  async function handleConfirmDelete() {
    const client = pendingDelete;
    if (!client) return;

    // Captured BEFORE the delete, so undo can put the row back where it was
    // rather than at the top of the list.
    const index = state.leads.findIndex((lead) => lead.id === client.id);

    const result = await actions.deleteLead(client.id);
    if (!result.ok) return;

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

  return (
    <PageShell>
      {/* ------------------------------------------------------------------ */}
      {/* Toolbar                                                             */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-start gap-3">
          <p className="mt-2 shrink-0 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted">
            <span className="deck-nums text-ink">{formatNumber(clients.length)}</span>{" "}
            {content.countLabel}
          </p>

          {features.search && (
            <ClientSearch
              query={query}
              onQueryChange={setQuery}
              resultCount={filtered.length}
            />
          )}
        </div>

        {features.addClient && <AddClientDialog />}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* The list                                                            */}
      {/* ------------------------------------------------------------------ */}
      <Panel>
        {filtered.length === 0 ? (
          // Two genuinely different empty states. "No clients yet" and "nothing
          // matched that search" call for opposite next actions, and showing
          // the first when the user has typed a query reads as data loss.
          searching ? (
            <EmptyState
              icon={SearchX}
              title={content.noMatchesTitle}
              description={content.noMatchesDescription}
            />
          ) : (
            <EmptyState
              icon={Users}
              title={content.emptyTitle}
              description={content.emptyDescription}
            />
          )
        ) : (
          <>
            {/* Phone: cards. Six columns of contact details cannot shrink to
                360px without becoming unreadable — see client-card.tsx. */}
            <PanelBody className="md:hidden">
              <div className="flex flex-col gap-3">
                {filtered.map((client) => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    repName={repNameOf(client.assignedRepId)}
                    onDelete={setPendingDelete}
                  />
                ))}
              </div>
            </PanelBody>

            {/* Tablet and up: the table. */}
            <PanelBody flush className="hidden md:block">
              <ClientsTable
                clients={filtered}
                repNameOf={repNameOf}
                onDelete={setPendingDelete}
              />
            </PanelBody>
          </>
        )}
      </Panel>

      {/* ------------------------------------------------------------------ */}
      {/* Destructive confirmation                                            */}
      {/* ------------------------------------------------------------------ */}
      {features.confirmDelete && (
        <ConfirmDialog
          open={pendingDelete !== null}
          onOpenChange={(open) => {
            if (!open) setPendingDelete(null);
          }}
          title={content.deleteTitle}
          description={content.deleteDescription}
          // The name is the whole point: "delete this client?" cannot be
          // answered safely, because the risk IS that the wrong row was hit.
          recordName={
            pendingDelete
              ? `${pendingDelete.name} · ${pendingDelete.company}`
              : undefined
          }
          confirmLabel={content.deleteConfirmLabel}
          pendingLabel={content.deletePendingLabel}
          onConfirm={handleConfirmDelete}
        />
      )}
    </PageShell>
  );
}
