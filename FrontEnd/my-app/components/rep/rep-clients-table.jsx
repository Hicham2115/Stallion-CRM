import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { DataCell, DataRow, DataTable } from "@/components/deck/data-table";
import { InitialsAvatar } from "@/components/deck/initials-avatar";
import { SourceBadge } from "@/components/deck/source-badge";
import { repConfig } from "@/config/rep";
import { clientsConfig } from "@/config/clients";
import { template } from "@/lib/format";
const { clientColumns, content, routes } = repConfig;
// A rep's own converted clients. Not ClientsTable-with-props: three
// deliberate differences (no owning-rep line since every row is the reader's
// own, phone+email share one cell since a rep's laptop is narrower, no
// actions column since a rep can't delete a client) made a sibling built
// from the same DataTable primitives cheaper than threading four new props
// through the admin table.
export function RepClientsTable({ clients }) {
    return (<DataTable columns={clientColumns} caption={content.clients.tableCaption} minWidth="46rem" stickyFirstColumn>
      {clients.map((client) => (<DataRow key={client.id} interactive className="group">
          <DataCell sticky className="group-hover:bg-deck-row">
            <Link href={routes.lead(client.id)} className="flex items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand/60">
              <InitialsAvatar name={client.name} size="md"/>
              <span className="block min-w-0 truncate text-[0.875rem] font-medium text-ink">
                {client.name}
              </span>
            </Link>
          </DataCell>

          <DataCell className="hidden text-[0.875rem] text-ink-soft lg:table-cell">
            <span className="block max-w-[12rem] truncate">{client.company}</span>
          </DataCell>

          <DataCell>
            <span className="flex flex-col gap-0.5">
              <a href={`tel:${client.phone.replace(/\s/g, "")}`} title={template(content.clients.callTitle, { name: client.name })} className="deck-nums inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded text-[0.875rem] text-ink-soft transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60">
                <Phone aria-hidden className="size-3.5 shrink-0 text-ink-muted"/>
                {client.phone}
              </a>

              <a href={`mailto:${client.email}`} title={template(content.clients.emailTitle, { name: client.name })} className="inline-flex w-fit max-w-[15rem] items-center gap-1.5 rounded text-[0.8125rem] text-ink-muted transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60">
                <Mail aria-hidden className="size-3.5 shrink-0"/>
                <span className="truncate">{client.email}</span>
              </a>
            </span>
          </DataCell>

          <DataCell className="hidden md:table-cell">
            <SourceBadge source={client.source}/>
          </DataCell>

          <DataCell className="hidden xl:table-cell">
            {client.notes[0] ? (<span title={client.notes[0].body} className="block max-w-[18rem] cursor-help truncate text-[0.8125rem] text-ink-muted">
                {client.notes[0].body}
              </span>) : (<span className="text-[0.8125rem] text-ink-muted">
                {clientsConfig.content.noteColumnEmpty}
              </span>)}
          </DataCell>
        </DataRow>))}
    </DataTable>);
}
