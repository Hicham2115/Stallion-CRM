import { Building2, Mail, Phone } from "lucide-react";

import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { leadConfig } from "@/config/lead";
import type { Lead } from "@/lib/types";

const { content } = leadConfig;

/**
 * Phone, email and company.
 *
 * Phone and email are ACTIONABLE, not printed text. This is a sales team and
 * the record is opened in order to make contact — a number you have to select
 * and copy is a number that gets misdialled.
 */
export function ContactPanel({ lead }: { lead: Lead }) {
  const rows = [
    {
      icon: Phone,
      label: content.callAction,
      value: lead.phone,
      // Strip spaces: tel: handles them inconsistently across dialers.
      href: `tel:${lead.phone.replace(/\s/g, "")}`,
      mono: true,
    },
    {
      icon: Mail,
      label: content.emailAction,
      value: lead.email,
      href: `mailto:${lead.email}`,
      mono: false,
    },
    {
      icon: Building2,
      label: null,
      value: lead.company,
      href: null,
      mono: false,
    },
  ];

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader title={content.contactTitle} hint={content.contactHint} />

      <PanelBody className="flex flex-1 flex-col">
        <ul className="flex flex-col gap-3.5">
          {rows.map((row) => {
            const Icon = row.icon;

            return (
              <li key={row.value} className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="grid size-8 shrink-0 place-items-center rounded-lg border border-hairline bg-white/[0.03] text-ink-muted"
                >
                  <Icon className="size-3.5" />
                </span>

                {row.href ? (
                  <a
                    href={row.href}
                    className={`min-w-0 flex-1 truncate rounded text-[0.875rem] text-ink-soft transition-colors hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 ${
                      row.mono ? "deck-nums" : ""
                    }`}
                  >
                    {row.value}
                  </a>
                ) : (
                  <span className="min-w-0 flex-1 truncate text-[0.875rem] text-ink-soft">
                    {row.value}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </PanelBody>
    </Panel>
  );
}
