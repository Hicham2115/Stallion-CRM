/**
 * ============================================================================
 *  CLIENTS SCREEN CONFIGURATION
 * ============================================================================
 *  Columns, copy, validation rules and feature flags for /admin/clients and
 *  the lead detail page beneath it.
 *
 *  Quick answers to the usual requests:
 *    - Reorder / drop a column ........ `columns`
 *    - Reword anything ................ `content`
 *    - Change validation .............. `validation`
 *    - Hide the Add Client button ..... features.addClient = false
 *    - Turn off delete confirmation ... features.confirmDelete = false (don't)
 *    - Change when a lead reads stale.. staleAfterDays
 * ============================================================================
 */
export const clientsConfig = {
    features: {
        addClient: true,
        search: true,
        confirmDelete: true,
        undoDelete: true,
        contactLinks: true,
    },
    columns: [
        { key: "name", label: "Client", width: "w-[16rem]" },
        { key: "company", label: "Company", hideBelow: "lg" },
        { key: "phone", label: "Phone" },
        { key: "email", label: "Email", hideBelow: "xl" },
        { key: "source", label: "Source" },
        // Fixed width and single-line truncation. Notes grow without limit as reps
        // type into them, and an unconstrained cell drags the row to three lines
        // and pushes every other column off the screen.
        { key: "note", label: "Latest note", width: "w-[18rem]", hideBelow: "xl" },
        { key: "actions", label: "Actions", srOnly: true, width: "w-[3.5rem]" },
    ],
    staleAfterDays: 10,
    validation: {
        emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
        // Digits, spaces, +, -, ( and ), 8 characters or more. Deliberately loose:
        // this app is used in Morocco but takes international numbers, and a strict
        // national pattern rejects the +33 and +34 numbers the agency really does
        // have on file. The server should normalise rather than the form refuse.
        phonePattern: /^[+()\d][\d\s\-()]{7,}$/,
        minNameLength: 2,
    },
    content: {
        countLabel: "clients",
        addLabel: "Add Client",
        searchPlaceholder: "Search clients, companies, emails…",
        searchClearLabel: "Clear search",
        searchResultLabel: "{n} matching {q}",
        searchResultUnit: "client",
        searchResultUnitPlural: "clients",
        noMatchesTitle: "No clients match your search",
        noMatchesDescription: "Try a different name, company or email — or clear the search to see everyone.",
        emptyTitle: "No clients yet",
        emptyDescription: "Convert a lead from the pipeline, or add a client directly.",
        noteColumnEmpty: "—",
        unassignedLabel: "Unassigned",
        callLabel: "Call",
        emailLabel: "Email",
        rowActionsLabel: "Client actions",
        tableCaption: "Paying clients, with contact details and their most recent note",
        deleteLabel: "Delete client",
        deleteTitle: "Delete this client?",
        deleteDescription: "This removes the client along with their notes, files and invoices. You can undo it for a few seconds afterwards.",
        deleteConfirmLabel: "Delete client",
        deletePendingLabel: "Deleting…",
        deleteToast: "Deleted {name}",
        undoToast: "Restored {name}",
        dialog: {
            title: "Add a client",
            description: "Creates a record already marked as a paying client. To add someone earlier in the funnel, start them on the pipeline instead.",
            nameLabel: "Full name",
            namePlaceholder: "Soukaina Berrada",
            companyLabel: "Company",
            companyPlaceholder: "Rif Organics",
            phoneLabel: "Phone",
            phonePlaceholder: "+212 6 12 34 56 78",
            emailLabel: "Email",
            emailPlaceholder: "soukaina@example.com",
            sourceLabel: "Source",
            noteLabel: "First note",
            notePlaceholder: "Referred by an existing client, warm lead.",
            noteHint: "Optional",
            submitLabel: "Add client",
            submitPendingLabel: "Adding…",
            cancelLabel: "Cancel",
            successToast: "Added {name}",
            errors: {
                nameRequired: "Enter the client's name.",
                nameTooShort: "That name looks too short.",
                companyRequired: "Enter a company name.",
                phoneRequired: "Enter a phone number.",
                phoneInvalid: "That does not look like a phone number.",
                emailRequired: "Enter an email address.",
                emailInvalid: "Enter a valid email address.",
                unexpected: "Something went wrong. Please try again.",
            },
        },
    },
};
