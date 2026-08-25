import Link from "next/link";
import { Mail, Phone } from "lucide-react";

import { DataCell, DataRow, DataTable } from "@/components/deck/data-table";
import { InitialsAvatar } from "@/components/deck/initials-avatar";
import { SourceBadge } from "@/components/deck/source-badge";
import { repConfig } from "@/config/rep";
import { clientsConfig } from "@/config/clients";
import { template } from "@/lib/format";
import type { Lead } from "@/lib/types";

const { clientColumns, content, routes } = repConfig;

/**
 * ============================================================================
 *  MY CLIENTS TABLE  (md and up)
 * ============================================================================
 *  A rep's own converted clients.
 *
 *  ─────────────────────────────────────────────────────────────────────────
 *  WHY THIS IS NOT `ClientsTable` WITH PROPS
 *  ─────────────────────────────────────────────────────────────────────────
 *  It nearly was. The admin table would have needed four new props to work
 *  here — a link builder, an optional delete, a way to drop the owning-rep
 *  sub-line, and a way to merge phone and email — and at that point the two
 *  tables share styling, not behaviour. Both are built from the same
 *  `DataTable` primitives, which is where the actual design lives, so a
 *  restyle still lands in one place.
 *
 *  Three deliberate differences from the admin table:
 *
 *   1. NO OWNING-REP LINE under the name. Every row here belongs to the person
 *      reading it. Printing their own name eighty times is noise.
 *   2. PHONE AND EMAIL SHARE ONE CELL. A rep's list is short and their laptop
 *      is not wide; two columns pushed Notes off the screen entirely.
 *   3. NO ACTIONS COLUMN. A rep cannot delete a client — see the field table in
 *      config/roles.ts — so a menu holding one disabled item would be a control
 *      that exists to refuse.
 *
 *  Phone and email stay `tel:` and `mailto:` links. This is a sales team;
 *  calling from the record IS the job, and plain text makes them copy a number
 *  by hand.
 * ============================================================================
 */
export function RepClientsTable({ clients }: { clients: Lead[] }) {
  return (
    <DataTable
      columns={clientColumns}
      caption={content.clients.tableCaption}
      minWidth="46rem"
      stickyFirstColumn
    >
      {clients.map((client) => (
        <DataRow key={client.id} interactive className="group">
          {/* ---- Identity: the link into the lead page ---- */}
          <DataCell sticky className="group-hover:bg-deck-row">
            <Link
              href={routes.lead(client.id)}
              className="flex items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
            >
              <InitialsAvatar name={client.name} size="md" />
              <span className="block min-w-0 truncate text-[0.875rem] font-medium text-ink">
                {client.name}
              </span>
            </Link>
          </DataCell>

          <DataCell className="hidden text-[0.875rem] text-ink-soft lg:table-cell">
            <span className="block max-w-[12rem] truncate">{client.company}</span>
          </DataCell>

          {/* ---- Contact: two actionable lines in one column ---- */}
          <DataCell>
            <span className="flex flex-col gap-0.5">
              <a
                href={`tel:${client.phone.replace(/\s/g, "")}`}
                title={template(content.clients.callTitle, { name: client.name })}
                className="deck-nums inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded text-[0.875rem] text-ink-soft transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
              >
                <Phone aria-hidden className="size-3.5 shrink-0 text-ink-muted" />
                {client.phone}
              </a>

              <a
                href={`mailto:${client.email}`}
                title={template(content.clients.emailTitle, { name: client.name })}
                className="inline-flex w-fit max-w-[15rem] items-center gap-1.5 rounded text-[0.8125rem] text-ink-muted transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
              >
                <Mail aria-hidden className="size-3.5 shrink-0" />
                <span className="truncate">{client.email}</span>
              </a>
            </span>
          </DataCell>

          <DataCell className="hidden md:table-cell">
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
                {clientsConfig.content.noteColumnEmpty}
              </span>
            )}
          </DataCell>
        </DataRow>
      ))}
    </DataTable>
  );
}
