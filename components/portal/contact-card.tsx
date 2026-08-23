import { Mail, MessageCircle, Phone, UserRoundSearch, type LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/deck/empty-state";
import { InitialsAvatar } from "@/components/deck/initials-avatar";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { portalConfig } from "@/config/portal";
import { template } from "@/lib/format";
import type { Rep } from "@/lib/types";

const { contact, content, features } = portalConfig;

/**
 * ============================================================================
 *  YOUR STALLION CONTACT
 * ============================================================================
 *  A named person, with three ways to reach them.
 *
 *  WHY THIS IS ON THE PORTAL AT ALL. Every other panel answers a question the
 *  client already had. This one answers the question they will have next — "who
 *  do I ask about that?" — and a portal that shows a client their project but
 *  no way to respond to it is a read-only receipt.
 *
 *  MAILTO / TEL / WA.ME, NOT A MESSAGE THREAD. There is no backend, so a
 *  composer here would take a message and drop it on the floor. These three are
 *  real, working links today, and they hand the conversation to the channel the
 *  agency already answers on. A messaging thread is the right thing to build
 *  when there is a server to hold the messages.
 *
 *  WHAT IS SHOWN AND WHAT IS NOT. The rep's NAME and EMAIL, because the client
 *  is entitled to know who is looking after their project. Never their dials,
 *  appointments or conversions — that is the agency's own performance data and
 *  it lives on the same `Rep` record. See the CLIENT-SAFE RULE in
 *  config/portal.ts.
 *
 *  The phone and WhatsApp numbers are the AGENCY's, from `portalConfig.contact`,
 *  not the rep's — reps have no phone field, and a client should reach a company
 *  that always answers rather than one person's mobile.
 * ============================================================================
 */
export function ContactCard({
  rep,
  /** Used to prefill the email subject, so the reply lands with context. */
  projectName,
}: {
  rep: Rep | undefined;
  projectName: string;
}) {
  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader title={content.contact.title} hint={content.contact.hint} />

      <PanelBody className="flex flex-1 flex-col">
        {!rep ? (
          // An unassigned client is a real state, and saying so beats an empty
          // box — which reads as a failed load rather than as "we are on it".
          <EmptyState
            icon={UserRoundSearch}
            title={content.contact.unassignedTitle}
            description={content.contact.unassignedDescription}
          />
        ) : (
          <>
            <div className="flex items-center gap-3.5">
              <InitialsAvatar name={rep.name} size="xl" />

              <div className="min-w-0">
                <p className="truncate text-[0.9375rem] font-medium text-ink">
                  {rep.name}
                </p>
                <p className="text-[0.8125rem] text-ink-muted">
                  {content.contact.roleLabel}
                </p>
              </div>
            </div>

            {features.contactActions && (
              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                <ContactAction
                  icon={Mail}
                  label={content.contact.emailAction}
                  // encodeURIComponent, because a project name can carry an
                  // ampersand ("Brand & web") and an unescaped one truncates
                  // the subject at that character.
                  href={`mailto:${rep.email}?subject=${encodeURIComponent(
                    template(content.contact.emailSubject, {
                      project: projectName,
                    }),
                  )}`}
                />

                {/* An empty number in config removes the action rather than
                    rendering a button that dials nothing. */}
                {contact.phone && (
                  <ContactAction
                    icon={Phone}
                    label={content.contact.callAction}
                    href={`tel:${contact.phone}`}
                  />
                )}

                {contact.whatsapp && (
                  <ContactAction
                    icon={MessageCircle}
                    label={content.contact.whatsappAction}
                    href={`https://wa.me/${contact.whatsapp}`}
                    external
                  />
                )}
              </div>
            )}
          </>
        )}
      </PanelBody>
    </Panel>
  );
}

/** One outline action. Quiet by design — none of the three outranks the others,
 *  and the screen's lime is already spent on the preview or live link. */
function ContactAction({
  icon: Icon,
  label,
  href,
  external = false,
}: {
  icon: LucideIcon;
  label: string;
  href: string;
  /** Only http(s) destinations open in a new tab; mailto: and tel: must not. */
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="inline-flex h-10 items-center gap-2 rounded-xl border border-hairline bg-white/[0.03] px-3.5 text-[0.875rem] font-medium text-ink transition-colors hover:border-hairline-strong hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-deck-surface"
    >
      <Icon aria-hidden className="size-4 text-ink-muted" />
      {label}
    </a>
  );
}
