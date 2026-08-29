import { UserRoundSearch } from "lucide-react";
import { EmptyState } from "@/components/deck/empty-state";
import { InitialsAvatar } from "@/components/deck/initials-avatar";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { portalConfig } from "@/config/portal";
const { content } = portalConfig;

// The developer actually assigned to this project (Lead::developers, via
// PortalController) — separate from ContactCard's account/billing contact,
// since "who's building this" and "who do I email about my invoice" are
// two different people. Only rendered for a real (Sanctum) client session —
// see usePortalLead().
export function DeveloperCard({ developer }) {
  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader title={content.developer.title} hint={content.developer.hint} />
      <PanelBody className="flex flex-1 flex-col">
        {!developer ? (
          <EmptyState
            icon={UserRoundSearch}
            title={content.developer.unassignedTitle}
            description={content.developer.unassignedDescription}
          />
        ) : (
          <div className="flex items-center gap-3.5">
            <InitialsAvatar name={developer.name} size="xl" />
            <div className="min-w-0">
              <p className="truncate text-[0.9375rem] font-medium text-ink">{developer.name}</p>
              <p className="text-[0.8125rem] text-ink-muted">{content.developer.roleLabel}</p>
            </div>
          </div>
        )}
      </PanelBody>
    </Panel>
  );
}
