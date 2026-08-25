import { Mail, MessageCircle, Phone, UserRoundSearch } from "lucide-react";
import { EmptyState } from "@/components/deck/empty-state";
import { InitialsAvatar } from "@/components/deck/initials-avatar";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { portalConfig } from "@/config/portal";
import { template } from "@/lib/format";
const { contact, content, features } = portalConfig;
// mailto/tel/wa.me rather than a message thread — there's no backend to hold
// messages, so these hand off to a channel the agency already answers on.
// Shows the rep's name/email (client is entitled to know who's on their
// project) but never dials/appointments/conversions — that's the agency's
// own performance data. Phone/WhatsApp numbers are the agency's own, from
// portalConfig.contact, not the rep's (reps have no phone field).
export function ContactCard({ rep,
/** Used to prefill the email subject, so the reply lands with context. */
projectName, }) {
    return (<Panel className="flex h-full flex-col">
      <PanelHeader title={content.contact.title} hint={content.contact.hint}/>

      <PanelBody className="flex flex-1 flex-col">
        {!rep ? (
        <EmptyState icon={UserRoundSearch} title={content.contact.unassignedTitle} description={content.contact.unassignedDescription}/>) : (<>
            <div className="flex items-center gap-3.5">
              <InitialsAvatar name={rep.name} size="xl"/>

              <div className="min-w-0">
                <p className="truncate text-[0.9375rem] font-medium text-ink">
                  {rep.name}
                </p>
                <p className="text-[0.8125rem] text-ink-muted">
                  {content.contact.roleLabel}
                </p>
              </div>
            </div>

            {features.contactActions && (<div className="mt-auto flex flex-wrap gap-2 pt-5">
                <ContactAction icon={Mail} label={content.contact.emailAction}
            // encodeURIComponent since a project name can carry an
            // ampersand, which would otherwise truncate the subject.
            href={`mailto:${rep.email}?subject=${encodeURIComponent(template(content.contact.emailSubject, {
                    project: projectName,
                }))}`}/>

                {contact.phone && (<ContactAction icon={Phone} label={content.contact.callAction} href={`tel:${contact.phone}`}/>)}

                {contact.whatsapp && (<ContactAction icon={MessageCircle} label={content.contact.whatsappAction} href={`https://wa.me/${contact.whatsapp}`} external/>)}
              </div>)}
          </>)}
      </PanelBody>
    </Panel>);
}
function ContactAction({ icon: Icon, label, href, external = false, }) {
    return (<a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className="inline-flex h-10 items-center gap-2 rounded-xl border border-hairline bg-white/[0.03] px-3.5 text-[0.875rem] font-medium text-ink transition-colors hover:border-hairline-strong hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-deck-surface">
      <Icon aria-hidden className="size-4 text-ink-muted"/>
      {label}
    </a>);
}
