/**
 * ============================================================================
 *  CLIENT PORTAL CONFIGURATION
 * ============================================================================
 *  Single source of truth for everything under app/(console)/portal/ — the
 *  half of the product a PAYING CLIENT signs in to.
 *
 *  Nothing user-facing is hard-coded in the portal's JSX. To change what a
 *  client reads, edit this file only.
 *
 *  ──────────────────────────────────────────────────────────────────────────
 *  THE CLIENT-SAFE RULE  ←←← read this before adding anything to the portal
 *  ──────────────────────────────────────────────────────────────────────────
 *  The portal renders a `Lead`, and a Lead carries the agency's private view
 *  of that person. These fields MUST NEVER reach a portal screen:
 *
 *    lead.notes         "Currently working with a competitor agency."
 *    lead.source        "Cold Outreach" — how we found them
 *    lead.stageId       "Attended", "Lost" — our funnel, not their project
 *    lead.activity      "First dial attempt made" — the sales timeline
 *    rep figures        dials, appointments, conversions
 *    any other lead     a client sees their own record and nothing else
 *
 *  The portal shows the CLIENT-VISIBLE fields instead: `projectSummary`,
 *  `milestones`, `previews`, `liveUrl`. That split is documented on the
 *  types themselves in lib/types.ts.
 *
 *  TODO(backend): enforce this on the SERVER. Filtering in the UI is a
 *  courtesy; the portal's API must return a client-shaped record that never
 *  contained the internal fields in the first place, so a mistake in one
 *  component cannot leak them.
 *
 *  ──────────────────────────────────────────────────────────────────────────
 *  ON LANGUAGE
 *  ──────────────────────────────────────────────────────────────────────────
 *  No jargon reaches this surface. There is no "staging", no "deploy", no
 *  "environment", no "stage", no "lead". A client gets "preview" for the
 *  version we are building and "live" for the one their own customers use —
 *  see `content.links`. If a word would need explaining on a phone call, it
 *  does not belong here.
 *
 *  Quick answers to the usual requests:
 *    - Hide a panel ..................... features.<panel> = false
 *    - Point the demo at another client . demo.leadId
 *    - Reword anything .................. `content`
 *    - Add a portal page ................ add a NavItem with roles ["client"]
 *                                         in config/navigation.ts, then a
 *                                         folder under app/(console)/portal/
 * ============================================================================
 */
export const portalConfig = {
    features: {
        projectLinks: true,
        previewGallery: true,
        milestones: true,
        stepTargetDates: true,
    },
    routes: {
        home: "/portal",
        previews: "/portal/previews",
    },
    demo: {
        leadId: "lead-1",
    },
    content: {
        header: {
            titleTemplate: "{name}’s project",
            summaryFallback: "Your project with Stallion Advertising.",
            progressLabel: "Overall progress",
            progressAccessibleLabel: "Overall project progress",
            progressDetail: "{done} of {total} stages complete",
        },
        links: {
            title: "Your links",
            hint: "Preview",
            previewBadge: "Work in progress",
            previewTitle: "Preview your project",
            previewBody: "A private link to what we are building. It changes as we work, so expect things to move around.",
            previewAction: "Open preview",
            previewUpdated: "Updated {when}",
            previewEmptyTitle: "No preview yet",
            previewEmptyBody: "As soon as there is something to look at, the link appears here.",
            privacyNote: "The preview link is private — please keep it inside your team.",
            newTabLabel: "opens in a new tab",
        },
        previews: {
            title: "Previews",
            // Not a restatement of the topbar subtitle above it. The subtitle says
            // what the screen is; the hint says how to read the list.
            hint: "Newest first",
            seeAll: "See all previews",
            openLabel: "Open",
            noScreenshot: "Screenshot coming soon",
            emptyTitle: "Nothing shared yet",
            emptyDescription: "When we have something for you to look at, it shows up here first.",
        },
        milestones: {
            title: "Your project stages",
            hint: "Start to launch",
            // "Not started" rather than "Pending" — pending sounds like something is
            // waiting on the client, and none of these are.
            status: {
                done: "Complete",
                in_progress: "In progress",
                pending: "Not started",
            },
            expectedBy: "Expected by {date}",
            emptyTitle: "No stages yet",
            emptyDescription: "Your project plan appears here once we have agreed the scope.",
        },
        developer: {
            title: "Your developer",
            hint: "Building your project",
            roleLabel: "Building your project",
            unassignedTitle: "Not assigned yet",
            unassignedDescription: "We will introduce your developer as soon as one is assigned.",
        },
        identity: {
            roleBadge: "Client",
            titleFallback: "Client",
            nameFallback: "Your account",
        },
        missingTitle: "We cannot find your project",
        missingDescription: "The link may be out of date. Sign in again, or contact us and we will sort it out.",
        missingAction: "Back to sign in",
        noProjectTitle: "Your project has not started yet",
        noProjectDescription: "As soon as we kick off, your stages and previews appear here.",
    },
};
