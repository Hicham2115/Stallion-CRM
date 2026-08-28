"use client";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, Mail, Phone, SearchX, Users } from "lucide-react";
import { toast } from "sonner";
import { AddLeadDialog } from "@/components/console/add-lead-dialog";
import { ClientSearch } from "@/components/admin/clients/client-search";
import { LeadDetailsDialog } from "@/components/console/lead-details-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/deck/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/axios";
import { formatNumber, formatShortDate, initialsOf } from "@/lib/format";
import { getErrorMessage } from "@/lib/get-error-message";
import { cn } from "@/lib/utils";

const cellPadding = "px-5 py-3.5 sm:px-6";
const headerCell =
  "px-5 py-3 text-left font-mono text-[0.625rem] font-normal uppercase tracking-[0.16em] text-ink-muted sm:px-6";
const stickyCol = "sticky left-0 z-10 bg-deck-surface";

export function ClientsView() {
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
    <div className="mx-auto flex w-full max-w-[105rem] flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-start gap-3">
          <p className="mt-2 shrink-0 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-muted">
            <span className="deck-nums text-ink">
              {formatNumber(leads.length)}
            </span>{" "}
            leads
          </p>

          <ClientSearch
            query={query}
            onQueryChange={setQuery}
            resultCount={filtered.length}
          />
        </div>

        <AddLeadDialog />
      </div>

      <section className="deck-inset relative rounded-2xl border border-hairline bg-deck-surface">
        {isPending ? (
          <div className="flex flex-col gap-3 p-5 pt-5 sm:p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-5 pt-5 sm:p-6">
            {searching ? (
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
            )}
          </div>
        ) : (
          <div className="mt-5">
            <div className="deck-scroll overflow-x-auto">
              <table
                className="w-full border-collapse text-left"
                style={{ minWidth: "48rem" }}
              >
                <caption className="sr-only">Leads</caption>
                <thead>
                  <tr className="border-y border-hairline">
                    <th
                      scope="col"
                      className={cn(headerCell, "w-[16rem]", stickyCol, "z-20")}
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className={cn(headerCell, "hidden lg:table-cell")}
                    >
                      Business
                    </th>
                    <th scope="col" className={headerCell}>
                      Status
                    </th>
                    <th scope="col" className={headerCell}>
                      Phone
                    </th>
                    <th
                      scope="col"
                      className={cn(headerCell, "hidden xl:table-cell")}
                    >
                      Email
                    </th>
                    <th scope="col" className={headerCell}>
                      Submitted
                    </th>
                    <th scope="col" className={cn(headerCell, "w-[3.5rem]")}>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-hairline transition-colors last:border-b-0"
                    >
                      <td className={cn(cellPadding, stickyCol)}>
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
                      </td>

                      <td
                        className={cn(
                          cellPadding,
                          "hidden text-[0.875rem] text-ink-soft lg:table-cell",
                        )}
                      >
                        {lead.business_type ?? "—"}
                      </td>

                      <td className={cellPadding}>
                        <Badge variant="secondary">{lead.status}</Badge>
                      </td>

                      <td className={cellPadding}>
                        {lead.phone ? (
                          <a
                            href={`tel:${lead.phone.replace(/\s/g, "")}`}
                            className="deck-nums inline-flex items-center gap-1.5 whitespace-nowrap text-[0.875rem] text-ink-soft transition-colors hover:text-brand"
                          >
                            <Phone
                              aria-hidden
                              className="size-3.5 shrink-0 text-ink-muted"
                            />
                            {lead.phone}
                          </a>
                        ) : (
                          <span className="text-[0.875rem] text-ink-soft">
                            —
                          </span>
                        )}
                      </td>

                      <td className={cn(cellPadding, "hidden xl:table-cell")}>
                        <a
                          href={`mailto:${lead.email}`}
                          className="inline-flex max-w-[14rem] items-center gap-1.5 text-[0.875rem] text-ink-soft transition-colors hover:text-brand"
                        >
                          <Mail
                            aria-hidden
                            className="size-3.5 shrink-0 text-ink-muted"
                          />
                          <span className="truncate">{lead.email}</span>
                        </a>
                      </td>

                      <td
                        className={cn(
                          cellPadding,
                          "deck-nums text-[0.875rem] text-ink-soft",
                        )}
                      >
                        {formatShortDate(lead.created_at)}
                      </td>

                      <td className={cn(cellPadding, "text-right")}>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Details — ${lead.full_name}`}
                          className="text-ink-muted hover:text-ink"
                          onClick={() => setSelectedLead(lead)}
                        >
                          <Eye aria-hidden />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <LeadDetailsDialog
        lead={selectedLead}
        open={selectedLead !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedLead(null);
        }}
      />
    </div>
  );
}
