"use client";
import Link from "next/link";
import { Mail, MoreHorizontal, Phone, Trash2 } from "lucide-react";
import { DataCell, DataRow, DataTable, } from "@/components/deck/data-table";
import { SourceBadge } from "@/components/deck/source-badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { adminConfig } from "@/config/admin";
import { clientsConfig } from "@/config/clients";
import { initialsOf } from "@/lib/format";
const { columns, content, features } = clientsConfig;
// Delete control lives outside the row link (name cell only) deliberately —
// a nested interactive element inside a link is invalid HTML and a keyboard
// trap (activating it navigates instead of deleting).
export function ClientsTable({ clients, repNameOf, onDelete, }) {
    return (<DataTable columns={columns} caption={content.tableCaption} minWidth="52rem" stickyFirstColumn>
      {clients.map((client) => (<DataRow key={client.id} interactive className="group">
          <DataCell sticky className="group-hover:bg-deck-row">
            <Link href={adminConfig.routes.client(client.id)} className="flex items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand/60">
              <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-brand/15 font-mono text-[0.625rem] font-medium text-brand">
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

          <DataCell>
            {features.contactLinks ? (<a href={`tel:${client.phone.replace(/\s/g, "")}`} title={`${content.callLabel} ${client.name}`} className="deck-nums inline-flex items-center gap-1.5 whitespace-nowrap rounded text-[0.875rem] text-ink-soft transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60">
                <Phone aria-hidden className="size-3.5 shrink-0 text-ink-muted"/>
                {client.phone}
              </a>) : (<span className="deck-nums text-[0.875rem] text-ink-soft">
                {client.phone}
              </span>)}
          </DataCell>

          <DataCell className="hidden xl:table-cell">
            {features.contactLinks ? (<a href={`mailto:${client.email}`} title={`${content.emailLabel} ${client.name}`} className="inline-flex max-w-[14rem] items-center gap-1.5 rounded text-[0.875rem] text-ink-soft transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60">
                <Mail aria-hidden className="size-3.5 shrink-0 text-ink-muted"/>
                <span className="truncate">{client.email}</span>
              </a>) : (<span className="text-[0.875rem] text-ink-soft">{client.email}</span>)}
          </DataCell>

          <DataCell>
            <SourceBadge source={client.source}/>
          </DataCell>

          <DataCell className="hidden xl:table-cell">
            {client.notes[0] ? (<span title={client.notes[0].body} className="block max-w-[18rem] cursor-help truncate text-[0.8125rem] text-ink-muted">
                {client.notes[0].body}
              </span>) : (<span className="text-[0.8125rem] text-ink-muted">
                {content.noteColumnEmpty}
              </span>)}
          </DataCell>

          <DataCell className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`${content.rowActionsLabel} — ${client.name}`} className="text-ink-muted hover:text-ink"/>}>
                <MoreHorizontal aria-hidden/>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="min-w-[11rem] border border-hairline bg-deck-card">
                <DropdownMenuItem variant="destructive" onClick={() => onDelete(client)}>
                  <Trash2 aria-hidden/>
                  {content.deleteLabel}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </DataCell>
        </DataRow>))}
    </DataTable>);
}
