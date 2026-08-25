/**
 * ============================================================================
 *  DEV WORKSPACE CONFIGURATION
 * ============================================================================
 *  Single source of truth for everything under app/(console)/dev/ — the
 *  surface the agency's developers work on once a lead becomes a client and
 *  delivery starts.
 *
 *  ──────────────────────────────────────────────────────────────────────────
 *  WHAT THIS SCREEN IS FOR
 *  ──────────────────────────────────────────────────────────────────────────
 *  It is the WRITE SIDE of the client portal. Almost nothing here is for the
 *  developer's own benefit — every control publishes something a client will
 *  read minutes later on /portal:
 *
 *      dev ticks a step        ->  client's progress rail moves
 *      dev adds a preview      ->  client's "Preview your project" turns on
 *      dev sets the live URL   ->  client's "Your live site" card turns on
 *      dev posts an update     ->  client's "Latest updates" feed
 *
 *  That is why the panels say so out loud. A developer who does not realise a
 *  half-finished screenshot goes straight in front of the client will post
 *  one, and no amount of undo fixes the email that follows.
 *
 *  The full picture of which role writes which field is in config/roles.ts —
 *  read that before adding anything here.
 *
 *  ──────────────────────────────────────────────────────────────────────────
 *  THE THREE-STATE BRIDGE
 *  ──────────────────────────────────────────────────────────────────────────
 *  A developer sees a CHECKBOX per step: done, or not done. A client sees
 *  THREE states: Complete, In progress, Not started. Those are the same data.
 *
 *  The middle state is DERIVED, never set by hand: after any edit, the first
 *  step that is not done becomes "in progress" and everything after it is
 *  "not started" — see `normalizeMilestones()` in lib/crm-api.ts. So a
 *  developer just ticks things off, and the client's "We're working on
 *  Development" line keeps itself honest. Nobody has to remember to move a
 *  second marker, which is the version of this that goes stale in a week.
 *
 *  Quick answers to the usual requests:
 *    - Hide a panel ................... features.<panel> = false
 *    - Change upload limits ........... uploads
 *    - Reword anything ................ `content`
 *    - Rename the workspace route ..... routes (then move the folder)
 * ============================================================================
 */
export const devConfig = {
    features: {
        steps: true,
        stepReorder: true,
        stepRename: true,
        stepTargetDates: true,
        previews: true,
        previewUploads: true,
        liveUrl: true,
        updates: true,
        newProject: true,
        search: true,
        statusFilter: true,
    },
    routes: {
        home: "/dev",
        project: (leadId) => `/dev/${leadId}`,
    },
    uploads: {
        accept: "image/png,image/jpeg,image/webp",
        acceptLabel: "PNG, JPG or WebP",
        // 8MB in, ~120KB out. The gap is the point: people drop retina screenshots.
        maxSourceBytes: 8 * 1024 * 1024,
        maxEdge: 1400,
        quality: 0.72,
        maxStoredBytes: 400 * 1024,
        maxPerProject: 8,
        maxLabelLength: 60,
    },
    identity: {
        name: "Dev Team",
        title: "Developer",
        roleBadge: "Dev team",
    },
    content: {
        list: {
            searchPlaceholder: "Search a client or company…",
            searchLabel: "Search projects",
            filterLabel: "Filter projects by status",
            filterAll: "All",
            filterActive: "Active",
            filterLaunched: "Launched",
            newProject: "New project",
            stepCount: "{done} / {total} steps",
            previewCount: "{n} shared",
            previewNone: "No previews",
            liveChip: "Live",
            overdueChip: "{n} overdue",
            emptyTitle: "No projects yet",
            emptyDescription: "A project appears here as soon as a client is signed. You can also start one yourself.",
            noMatchTitle: "Nothing matches",
            noMatchDescription: "Try a different name, or clear the filter to see every project.",
            clearFilters: "Clear filters",
            resultCount: "Showing {n} of {total} projects",
        },
        newProject: {
            trigger: "New project",
            title: "Start a project",
            description: "Creates the client record and an empty project. You can add the steps straight after.",
            nameLabel: "Client name",
            namePlaceholder: "Soukaina Berrada",
            companyLabel: "Company",
            companyPlaceholder: "Rif Organics",
            emailLabel: "Email (optional)",
            emailPlaceholder: "name@company.ma",
            summaryLabel: "What are we building? (optional)",
            summaryPlaceholder: "A new website and a brand refresh.",
            // Nobody should discover after the fact that this wrote to the sales
            // database as well.
            footnote: "This also creates the client in the agency console, with no sales history attached.",
            submit: "Create project",
            submitPending: "Creating…",
            cancel: "Cancel",
            toast: "{name} added",
            errors: {
                nameRequired: "Enter the client's name.",
                companyRequired: "Enter the company.",
                emailInvalid: "That does not look like a valid email address.",
            },
        },
        detail: {
            back: "Back to Projects",
            visibilityNote: "Everything on this page is visible to the client on their own dashboard.",
            progressDetail: "{done} of {total} steps complete",
        },
        steps: {
            title: "Project Steps",
            hint: "Tick as you finish",
            toggleLabel: "Mark {label} complete",
            renameLabel: "Rename step",
            removeLabel: "Remove",
            dragLabel: "Reorder {label}",
            addPlaceholder: "Add a project step…",
            addSubmit: "Add Step",
            targetLabel: "Target date",
            targetPlaceholder: "Set a date",
            targetClear: "Clear date",
            overdueLabel: "Overdue",
            emptyTitle: "No steps yet",
            emptyDescription: "Add the stages of this project. The client sees them as their progress.",
            doneToast: "{label} marked complete",
            undoneToast: "{label} reopened",
            addToast: "Step added",
            removeToast: "Step removed",
            renameToast: "Step renamed",
            reorderToast: "Steps reordered",
            reorderAnnouncement: "{label} moved to position {position} of {total}.",
            removeTitle: "Remove this step?",
            removeDescription: "It disappears from the client's progress, and their percentage changes.",
            removeConfirm: "Remove step",
            removePending: "Removing…",
        },
        previews: {
            title: "Client Previews",
            hint: "The client sees these",
            description: "Drop a screenshot to upload it directly, or share a preview link below — the client sees both on their dashboard.",
            dropTitle: "Drop a screenshot",
            dropHint: "or choose a file",
            dropBrowse: "Choose a screenshot",
            dropActive: "Release to add it",
            dropLimits: "{accept}, up to {max}",
            uploading: "Preparing…",
            labelPlaceholder: "Label (e.g. Homepage v1)",
            urlPlaceholder: "Preview link URL…",
            addSubmit: "Add",
            imageOnly: "Screenshot only",
            linkOnly: "Link only",
            openLabel: "Open",
            removeLabel: "Remove",
            emptyTitle: "Nothing shared yet",
            emptyDescription: "Screenshots and preview links you add here appear on the client's dashboard.",
            addToast: "Shared with the client",
            removeToast: "Preview removed",
            removeTitle: "Remove this preview?",
            removeDescription: "It disappears from the client's dashboard.",
            removeConfirm: "Remove preview",
            removePending: "Removing…",
            errors: {
                labelRequired: "Give it a label the client will understand.",
                sourceRequired: "Add a screenshot or a link.",
                urlInvalid: "Enter a full link, starting with https://",
                fileType: "That file is not an image we can use.",
                fileTooLarge: "That image is over {max}. Export a smaller one.",
                stillTooLarge: "That screenshot is too detailed to store here — it is still over {max} after resizing.",
                tooMany: "This project already has {max} previews. Remove one first.",
                readFailed: "We could not read that file. Try again.",
            },
        },
        live: {
            title: "Live site",
            hint: "The public version",
            description: "Add this at launch. It turns on the client's “Your live site” card.",
            placeholder: "https://client-site.ma",
            save: "Save link",
            saving: "Saving…",
            clear: "Clear",
            liveNow: "This project is live.",
            notLive: "Not live yet.",
            earlyWarning: "{n} steps are still open. A live link tells the client the work is finished.",
            openLabel: "Open",
            saveToast: "Live site saved",
            clearToast: "Live site cleared",
            urlInvalid: "Enter a full link, starting with https://",
            clearTitle: "Clear the live link?",
            clearDescription: "The client's “Your live site” card turns off and goes back to “Not live yet”.",
            clearConfirm: "Clear link",
            clearPending: "Clearing…",
        },
        updates: {
            title: "Post an update",
            hint: "Goes to the client",
            description: "A short note in the client's own words. It appears at the top of their dashboard.",
            titleLabel: "Headline",
            titlePlaceholder: "Design approved — build starts Monday",
            bodyLabel: "Detail (optional)",
            bodyPlaceholder: "One or two sentences. No jargon.",
            submit: "Post update",
            submitPending: "Posting…",
            recentLabel: "Recently posted",
            recentLimit: 3,
            emptyDescription: "Nothing posted yet.",
            toast: "Update posted to the client",
            errors: { titleRequired: "Write a headline first." },
        },
        missingTitle: "That project does not exist",
        missingDescription: "It may have been deleted, or the link may be out of date.",
        missingAction: "Back to Projects",
    },
};
