"use client";

import Link from "next/link";
import { Mail, MoreHorizontal, Phone, Trash2 } from "lucide-react";

import {
  DataCell,
  DataRow,
  DataTable,
} from "@/components/deck/data-table";
import { SourceBadge } from "@/components/deck/source-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { clientsConfig } from "@/config/clients";
import { initialsOf } from "@/lib/format";
import type { Lead } from "@/lib/types";

const { columns, content, features } = clientsConfig;

/**
 * ============================================================================
 *  CLIENTS TABLE  (md and up — see client-card.tsx for the phone layout)
 * ============================================================================
 *  Four things changed from the prototype, all of them about the row being
 *  usable rather than merely visible:
 *
 *  1. ROWS ARE LINKS. The lead detail page said "Back to Clients" but nothing
 *     on this screen opened it — the detail page was unreachable except by
 *     typing the URL. The name cell is now a link to /admin/clients/[leadId].
 *
 *  2. THE DELETE CONTROL IS OUTSIDE THE LINK. A nested interactive element
 *     inside a link is both invalid HTML and a trap: activating it with a
 *     keyboard navigates instead of deleting. So the link wraps the NAME CELL
 *     rather than the row, and the actions column sits outside it. The
 *     whole-row hover tint still tells you the row is a target.
 *
 *  3. PHONE AND EMAIL ARE tel: AND mailto: LINKS. This is a sales team;
 *     calling from the record is the entire job, and plain text makes them
 *     copy a number by hand.
 *
 *  4. DELETE IS BEHIND A MENU AND A CONFIRMATION. In the prototype a bare
 *     trash icon sat in every row and deleted instantly on click.
 * ============================================================================
 */
export function ClientsTable({
  clients,
  repNameOf,
  onDelete,
}: {
  clients: Lead[];
  repNameOf: (repId: string | null) => string;
  /** Opens the confirmation dialog — never deletes directly. */
  onDelete: (client: Lead) => void;
}) {
  return (
    <DataTable
      columns={columns}
      caption="Paying clients, with contact details and their most recent note"
      minWidth="52rem"
      stickyFirstColumn
    >
      {clients.map((client) => (
        <DataRow key={client.id} interactive className="group">
          {/* ---------------------------------------------------------- */}
          {/* Identity — the link into the detail page                     */}
          {/* ---------------------------------------------------------- */}
          <DataCell sticky className="group-hover:bg-deck-row">
            <Link
              href={`/admin/clients/${client.id}`}
              className="flex items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
            >
              <span
                aria-hidden
                className="grid size-8 shrink-0 place-items-center rounded-full bg-brand/15 font-mono text-[0.625rem] font-medium text-brand"
              >
                {initialsOf(client.name)}
              </span>

              <span className="min-w-0">
                <span className="block truncate text-[0.875rem] font-medium text-ink">
                  {client.name}
                </span>
                <span className="block truncate text-[0.75rem] text-ink-muted">
                  {repNameOf(client.assignedRepId)}
                </span>
              </span>
            </Link>
          </DataCell>

          <DataCell className="hidden text-[0.875rem] text-ink-soft lg:table-cell">
            <span className="block max-w-[12rem] truncate">{client.company}</span>
          </DataCell>

          {/* ---------------------------------------------------------- */}
          {/* Contact — actionable, not decorative                         */}
          {/* ---------------------------------------------------------- */}
          <DataCell>
            {features.contactLinks ? (
              <a
                href={`tel:${client.phone.replace(/\s/g, "")}`}
                title={`${content.callLabel} ${client.name}`}
                className="deck-nums inline-flex items-center gap-1.5 whitespace-nowrap rounded text-[0.875rem] text-ink-soft transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
              >
                <Phone aria-hidden className="size-3.5 shrink-0 text-ink-muted" />
                {client.phone}
              </a>
            ) : (
              <span className="deck-nums text-[0.875rem] text-ink-soft">
                {client.phone}
              </span>
            )}
          </DataCell>

          <DataCell className="hidden xl:table-cell">
            {features.contactLinks ? (
              <a
                href={`mailto:${client.email}`}
                title={`${content.emailLabel} ${client.name}`}
                className="inline-flex max-w-[14rem] items-center gap-1.5 rounded text-[0.875rem] text-ink-soft transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
              >
                <Mail aria-hidden className="size-3.5 shrink-0 text-ink-muted" />
                <span className="truncate">{client.email}</span>
              </a>
            ) : (
              <span className="text-[0.875rem] text-ink-soft">{client.email}</span>
            )}
          </DataCell>

          <DataCell>
            <SourceBadge source={client.source} />
          </DataCell>

          {/* Fixed width, one line, full text on hover. An unbounded note cell
              drags every row to three lines as reps type into it. */}
          <DataCell className="hidden xl:table-cell">
            {client.notes[0] ? (
              <span
                title={client.notes[0].body}
                className="block max-w-[18rem] cursor-help truncate text-[0.8125rem] text-ink-muted"
              >
                {client.notes[0].body}
              </span>
            ) : (
              <span className="text-[0.8125rem] text-ink-muted">
                {content.noteColumnEmpty}
              </span>
            )}
          </DataCell>

          {/* ---------------------------------------------------------- */}
          {/* Actions — outside the row link, deliberately                 */}
          {/* ---------------------------------------------------------- */}
          <DataCell className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${content.rowActionsLabel} — ${client.name}`}
                    className="text-ink-muted hover:text-ink"
                  />
                }
              >
                <MoreHorizontal aria-hidden />
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="min-w-[11rem] border border-hairline bg-deck-card"
              >
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(client)}
                >
                  <Trash2 aria-hidden />
                  {content.deleteLabel}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </DataCell>
        </DataRow>
      ))}
    </DataTable>
  );
}
