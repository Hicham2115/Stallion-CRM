/**
 * ============================================================================
 *  LEAD DETAIL CONFIGURATION
 * ============================================================================
 *  Copy and feature flags for /admin/clients/[leadId].
 *
 *  Quick answers to the usual requests:
 *    - Hide a panel ................... features.<panel> = false
 *    - Reword anything ................ `content`
 *    - Change the milestone wording ... content.milestoneSummary
 * ============================================================================
 */
export const leadConfig = {
    features: {
        quickActions: true,
        activity: true,
        notes: true,
        milestones: true,
        files: true,
        invoices: true,
        milestoneProgress: true,
        invoiceOutstanding: true,
    },
    content: {
        backToClients: "Clients",
        convertLabel: "Convert to Client",
        convertPendingLabel: "Converting…",
        convertToast: "{name} is now a client",
        logCallLabel: "Log a call",
        logCallToast: "Call logged",
        addNoteLabel: "Add note",
        addNotePlaceholder: "What happened on this call?",
        addNoteSubmit: "Save note",
        addNoteToast: "Note added",
        stageLabel: "Stage",
        assignedLabel: "Assigned to",
        unassignedLabel: "Unassigned",
        sourceLabel: "Source",
        createdLabel: "Created",
        inStageLabel: "In stage",
        staleWarning: "This lead has not moved in a while.",
        contactTitle: "Contact",
        contactHint: "Phone · email · company",
        callAction: "Call",
        emailAction: "Email",
        activityTitle: "Activity",
        activityHint: "Oldest first",
        activityEmpty: "Nothing has happened yet.",
        notesTitle: "Notes",
        notesHint: "Newest first",
        notesEmpty: "No notes yet.",
        milestonesTitle: "Milestones",
        milestonesHint: "Delivery progress",
        milestoneSummary: "{done} of {total} complete",
        // Milestones, files and invoices only exist once a lead converts. Saying
        // so beats rendering an empty box, which reads as a loading failure.
        milestonesEmptyTitle: "No project yet",
        milestonesEmptyDescription: "Delivery milestones appear once this lead becomes a paying client.",
        milestoneStatus: {
            done: "Done",
            in_progress: "In progress",
            pending: "Pending",
        },
        filesTitle: "Files",
        filesHint: "Contracts and briefs",
        filesEmptyTitle: "No files yet",
        filesEmptyDescription: "Signed contracts and briefs are attached once this lead becomes a client.",
        fileDownloadLabel: "Download",
        fileDownloadUnavailable: "File downloads arrive with the backend",
        invoicesTitle: "Invoices",
        invoicesHint: "Billing history",
        invoicesEmptyTitle: "No invoices yet",
        invoicesEmptyDescription: "Invoices appear once this lead becomes a paying client.",
        invoiceStatus: { paid: "Paid", pending: "Pending", overdue: "Overdue" },
        outstandingLabel: "Outstanding",
        allSettledLabel: "All invoices settled",
        notFoundTitle: "That lead does not exist",
        notFoundDescription: "It may have been deleted, or the link may be out of date.",
        notFoundAction: "Back to Clients",
    },
};
