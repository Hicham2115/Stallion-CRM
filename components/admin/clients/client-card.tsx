"use client";

import Link from "next/link";
import { ChevronRight, Mail, Phone, Trash2 } from "lucide-react";

import { SourceBadge } from "@/components/deck/source-badge";
import { Button } from "@/components/ui/button";
import { adminConfig } from "@/config/admin";
import { clientsConfig } from "@/config/clients";
import { initialsOf } from "@/lib/format";
import type { Lead } from "@/lib/types";

const { content, features } = clientsConfig;

/**
 * One client as a card — the layout below `md`.
 *
 * WHY A SEPARATE COMPONENT RATHER THAN A RESPONSIVE TABLE. Six columns of
 * contact details cannot usefully shrink: below about 640px a table either
 * scrolls sideways (so the row identity leaves the screen) or wraps every cell
 * to three lines (so one client fills the viewport). Neither is readable on a
 * phone, and this is a screen a rep uses standing in a corridor.
 *
 * The card keeps the same information in a stacked order — identity, contact,
 * source, note — and keeps calling and emailing one tap away, because that is
 * what the phone layout is FOR.
 */
export function ClientCard({
  client,
  repName,
  onDelete,
  href,
}: {
  client: Lead;
  /** Caption under the name. On a rep's own list this is always themselves. */
  repName: string;
  /**
   * Opens the confirmation dialog. OMIT IT to render a card with no delete
   * control at all — which is what the rep workspace does, because a rep may
   * work a client but not remove one (see config/roles.ts). A disabled bin
   * icon would be a control that exists only to refuse.
   */
  onDelete?: (client: Lead) => void;
  /**
   * Where the card leads. Defaults to the admin lead page; the rep workspace
   * passes its own route, since /admin is a URL a rep cannot open.
   */
  href?: string;
}) {
  return (
    <article className="relative rounded-xl border border-hairline bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-full bg-brand/15 font-mono text-[0.6875rem] font-medium text-brand"
        >
          {initialsOf(client.name)}
        </span>

        <div className="min-w-0 flex-1">
          {/* The card's primary target. `after:absolute inset-0` stretches the
              hit area to the whole card without nesting the delete button
              inside a link — the same reason the table keeps them apart. */}
          <Link
            href={href ?? adminConfig.routes.client(client.id)}
            className="rounded outline-none after:absolute after:inset-0 after:content-[''] focus-visible:ring-2 focus-visible:ring-brand/60"
          >
            <h3 className="truncate text-[0.9375rem] font-medium text-ink">
              {client.name}
            </h3>
          </Link>

          <p className="mt-0.5 truncate text-[0.8125rem] text-ink-muted">
            {client.company} · {repName}
          </p>
        </div>

        <ChevronRight
          aria-hidden
          className="mt-1 size-4 shrink-0 text-ink-muted"
        />
      </div>

      {/* Contact actions. `relative z-10` lifts them above the stretched link
          overlay, so tapping "call" calls rather than opening the record. */}
      <div className="relative z-10 mt-3.5 flex flex-wrap items-center gap-2">
        {features.contactLinks && (
          <>
            <a
              href={`tel:${client.phone.replace(/\s/g, "")}`}
              className="deck-nums inline-flex h-9 items-center gap-2 rounded-lg border border-hairline bg-white/[0.03] px-3 text-[0.8125rem] text-ink-soft transition-colors hover:border-brand/40 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
            >
              <Phone aria-hidden className="size-3.5" />
              {content.callLabel}
            </a>

            <a
              href={`mailto:${client.email}`}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-hairline bg-white/[0.03] px-3 text-[0.8125rem] text-ink-soft transition-colors hover:border-brand/40 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
            >
              <Mail aria-hidden className="size-3.5" />
              {content.emailLabel}
            </a>
          </>
        )}

        <SourceBadge source={client.source} className="ml-auto" />

        {onDelete && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`${content.deleteLabel} — ${client.name}`}
            onClick={() => onDelete(client)}
            className="text-ink-muted hover:text-destructive"
          >
            <Trash2 aria-hidden />
          </Button>
        )}
      </div>

      {client.notes[0] && (
        <p className="relative z-10 mt-3 line-clamp-2 border-t border-hairline pt-3 text-[0.8125rem] leading-relaxed text-ink-muted">
          {client.notes[0].body}
        </p>
      )}
    </article>
  );
}
