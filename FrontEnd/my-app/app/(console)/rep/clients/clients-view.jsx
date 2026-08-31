"use client";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, Mail, Phone, SearchX, Users } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/console/page-shell";
import { AddLeadDialog } from "@/components/console/add-lead-dialog";
import { ClientSearch } from "@/components/admin/clients/client-search";
import { LeadDetailsDialog } from "@/components/console/lead-details-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataCell, DataRow, DataTable } from "@/components/deck/data-table";
import { EmptyState } from "@/components/deck/empty-state";
import { Panel, PanelBody } from "@/components/deck/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/axios";
import { formatNumber, formatShortDate, initialsOf } from "@/lib/format";
import { getErrorMessage } from "@/lib/get-error-message";

const COLUMNS = [
  { key: "name", label: "Name", width: "w-[16rem]" },
  { key: "business", label: "Business", hideBelow: "lg" },
  { key: "status", label: "Status" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email", hideBelow: "xl" },
  { key: "submitted", label: "Submitted" },
  { key: "actions", label: "Actions", srOnly: true, width: "w-[3.5rem]" },
];

// Real leads — the same list admin's Clients page sees (GET /api/leads is
// unscoped here on purpose; only /rep/pipeline asks for the rep-scoped
// variant, via the `mine` param).
export function RepClientsView() {
  const [query, setQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState(null);

  const {
    data: leads = [],
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => (await api.get("/api/leads")).data,
  });

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error));
  }, [isError, error]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return leads;
    return leads.filter((lead) =>
      [lead.full_name, lead.email, lead.business_type]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [leads, query]);

  const searching = query.trim().length > 0;

  return (
    <PageShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="deck-nums text-[0.875rem] text-ink-muted">
          {formatNumber(leads.length)} leads
        </p>

        <div className="flex items-center gap-4">
          <ClientSearch
            query={query}
            onQueryChange={setQuery}
            resultCount={filtered.length}
          />
          <AddLeadDialog />
        </div>
      </div>

      <Panel>
        {isPending ? (
          <PanelBody className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </PanelBody>
        ) : filtered.length === 0 ? (
          searching ? (
            <EmptyState
              icon={SearchX}
              title="No leads match your search"
              description="Try a different name, business or email."
            />
          ) : (
            <EmptyState
              icon={Users}
              title="No leads yet"
              description="Leads submitted from the site will show up here."
            />
          )
        ) : (
          <PanelBody flush>
            <DataTable columns={COLUMNS} caption="Leads" minWidth="48rem" stickyFirstColumn>
              {filtered.map((lead) => (
                <DataRow key={lead.id}>
                  <DataCell sticky>
                    <span className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="grid size-8 shrink-0 place-items-center rounded-full bg-brand/15 font-mono text-[0.625rem] font-medium text-brand"
                      >
                        {initialsOf(lead.full_name)}
                      </span>
                      <span className="truncate text-[0.875rem] font-medium text-ink">
                        {lead.full_name}
                      </span>
                    </span>
                  </DataCell>

                  <DataCell className="hidden text-[0.875rem] text-ink-soft lg:table-cell">
                    {lead.business_type ?? "—"}
                  </DataCell>

                  <DataCell>
                    <Badge variant="secondary">{lead.status}</Badge>
                  </DataCell>

                  <DataCell>
                    {lead.phone ? (
                      <a
                        href={`tel:${lead.phone.replace(/\s/g, "")}`}
                        className="deck-nums inline-flex items-center gap-1.5 whitespace-nowrap text-[0.875rem] text-ink-soft transition-colors hover:text-brand"
                      >
                        <Phone aria-hidden className="size-3.5 shrink-0 text-ink-muted" />
                        {lead.phone}
                      </a>
                    ) : (
                      <span className="text-[0.875rem] text-ink-soft">—</span>
                    )}
                  </DataCell>

                  <DataCell className="hidden xl:table-cell">
                    <a
                      href={`mailto:${lead.email}`}
                      className="inline-flex max-w-[14rem] items-center gap-1.5 text-[0.875rem] text-ink-soft transition-colors hover:text-brand"
                    >
                      <Mail aria-hidden className="size-3.5 shrink-0 text-ink-muted" />
                      <span className="truncate">{lead.email}</span>
                    </a>
                  </DataCell>

                  <DataCell className="deck-nums text-[0.875rem] text-ink-soft">
                    {formatShortDate(lead.created_at)}
                  </DataCell>

                  <DataCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Details — ${lead.full_name}`}
                      className="text-ink-muted hover:text-ink"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <Eye aria-hidden />
                    </Button>
                  </DataCell>
                </DataRow>
              ))}
            </DataTable>
          </PanelBody>
        )}
      </Panel>

      <LeadDetailsDialog
        lead={selectedLead}
        open={selectedLead !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedLead(null);
        }}
      />
    </PageShell>
  );
}
