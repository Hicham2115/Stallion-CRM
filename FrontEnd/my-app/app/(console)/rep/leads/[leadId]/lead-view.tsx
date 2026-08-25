"use client";

import { ActivityTimeline } from "@/components/admin/lead/activity-timeline";
import { ContactPanel } from "@/components/admin/lead/contact-panel";
import { NotesPanel } from "@/components/admin/lead/notes-panel";
import { PageShell } from "@/components/console/page-shell";
import { useSetPageTitle } from "@/components/console/page-title";
import { RepLeadHeader } from "@/components/rep/rep-lead-header";
import {
  RepLeadBlocked,
  RepMissing,
  RepSkeleton,
} from "@/components/rep/rep-states";
import { useRepScope } from "@/components/rep/use-rep-scope";
import { repConfig } from "@/config/rep";
import { useCrm } from "@/lib/store/crm-store";
import { selectLeadById } from "@/lib/store/selectors";

const { content, routes } = repConfig;

/**
 * ============================================================================
 *  /rep/leads/[leadId] — ONE OF MY LEADS
 * ============================================================================
 *  Where a rep's day actually happens: read the history, log the call, write
 *  the note, move the stage.
 *
 *  ─────────────────────────────────────────────────────────────────────────
 *  THE OWNERSHIP CHECK IS THE FIRST THING IT DOES
 *  ─────────────────────────────────────────────────────────────────────────
 *  This is the one rep route that takes an id from the URL, so it is the one
 *  route where `/rep/leads/lead-40` is a thing a person can type. A lead that
 *  is not theirs gets a designed "not yours" screen rather than the record.
 *
 *  IT IS NOT SECURITY YET, and the shape is what matters: the check exists, it
 *  is expressed once, and the message is separate from the not-found message so
 *  a reassignment never looks like a bug. It becomes real when the API refuses
 *  to serve the record — see the field table in config/roles.ts.
 *
 *  ─────────────────────────────────────────────────────────────────────────
 *  THREE PANELS FROM THE ADMIN LEAD PAGE, AND THREE DELIBERATELY OMITTED
 *  ─────────────────────────────────────────────────────────────────────────
 *  Contact, Activity and Notes are the same components — a rep and an admin
 *  reading one lead should read the same record.
 *
 *  Milestones, Files and Invoices are left out. They are the DELIVERY half,
 *  written by the dev team and read by the client (see config/roles.ts): a rep
 *  is not the person chasing an invoice or shipping a homepage, and three
 *  panels of someone else's work would push the notes — the thing they came for
 *  — below the fold.
 * ============================================================================
 */
export function RepLeadView({ leadId }: { leadId: string }) {
  const { state } = useCrm();
  // `loading` is deliberately not read: this screen resolves the lead from the
  // route, so the hydration guard below keys off `state.hydrated` and the lead
  // itself rather than off the rep. Destructuring it anyway would leave a
  // variable that looks load-bearing and is not.
  const { rep } = useRepScope();

  const lead = selectLeadById(state, leadId);

  // The record's name in the topbar, with a breadcrumb back to the board. Null
  // while loading, so the route title ("My Pipeline") shows in the meantime
  // rather than an empty bar.
  useSetPageTitle({
    title: lead?.name ?? null,
    subtitle: lead?.company ?? null,
    parent: { label: content.lead.back, href: routes.pipeline },
  });

  // Same ordering as the admin lead page and the dev project page: a record we
  // can already see renders immediately, server-side included, so the common
  // case gets real content and no skeleton flash. Only an UNRESOLVED id waits a
  // frame — it may be a lead created in this browser that lives solely in
  // persisted state.
  if ((!lead || !rep) && !state.hydrated) return <RepSkeleton />;
  if (!rep) return <RepMissing />;
  if (!lead) return <RepLeadBlocked reason="missing" />;

  // Ownership, after existence: "not yours" and "not there" are different
  // answers and the reader deserves the right one.
  if (lead.assignedRepId !== rep.id) {
    return <RepLeadBlocked reason="forbidden" />;
  }

  return (
    <PageShell>
      <RepLeadHeader lead={lead} />

      {/* Contact and history side by side, notes beside them — the three things
          open at once when you are about to pick up the phone. */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <ContactPanel lead={lead} />
        <ActivityTimeline activity={lead.activity} />
        <NotesPanel leadId={lead.id} notes={lead.notes} />
      </div>
    </PageShell>
  );
}
