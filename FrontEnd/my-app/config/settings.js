/**
 * ============================================================================
 *  SETTINGS CONFIGURATION
 * ============================================================================
 *  Copy and flags for /admin/settings.
 *
 *  Quick answers to the usual requests:
 *    - Hide a panel ................... features.<panel> = false
 *    - Change password length ......... generatedPasswordLength
 *    - Hide "Reset demo data" ......... features.resetDemoData = false
 *                                       (do NOT ship the demo without it)
 * ============================================================================
 */
export const settingsConfig = {
    features: {
        profile: true,
        createAccount: true,
        repManagement: true,
        // Both disabled — the pipeline is real now (Lead::STAGES, fixed
        // server-side), and there's real lead data to protect from an
        // "undo everything" reset button meant for the old mock demo.
        stageEditor: false,
        passwordTools: true,
        resetDemoData: false,
    },
    generatedPasswordLength: 16,
    roleOptions: [
        { value: "sales", label: "Sales" },
        { value: "dev", label: "Developer" },
    ],
    roleLabels: {
        sales: "Sales Rep",
        dev: "Developer",
    },
    content: {
        createTitle: "Create Team Account",
        createHint: "Adds a sales rep or developer with sign-in access",
        nameLabel: "Full name",
        namePlaceholder: "Youssef Karim",
        emailLabel: "Work email",
        emailPlaceholder: "youssef@stallionadvertising.ma",
        roleLabel: "Role",
        passwordLabel: "Temporary password",
        passwordPlaceholder: "Generate or type one",
        passwordHint: "They will be asked to change it on first sign-in.",
        generateLabel: "Generate",
        showPasswordLabel: "Show password",
        hidePasswordLabel: "Hide password",
        createSubmitLabel: "Create account",
        createPendingLabel: "Creating…",
        createToast: "Created an account for {name}",
        repsTitle: "Team Accounts",
        repsHint: "Edit, deactivate or remove",
        repColumn: "Name",
        repsCaption: "Sales and dev team members, with their sign-in email and account status",
        emailColumn: "Email",
        statusColumn: "Status",
        actionsColumn: "Actions",
        activeLabel: "Active",
        inactiveLabel: "Inactive",
        editLabel: "Edit",
        saveLabel: "Save",
        cancelLabel: "Cancel",
        rowActionsLabel: "Rep actions",
        deactivateLabel: "Deactivate",
        reactivateLabel: "Reactivate",
        deleteRepLabel: "Delete rep",
        deleteRepTitle: "Delete this rep?",
        deleteRepDescription: "Their dial and conversion history goes with them, and any leads assigned to them become unassigned. Deactivating keeps the history instead.",
        deleteRepConfirmLabel: "Delete rep",
        deactivateToast: "{name} deactivated",
        reactivateToast: "{name} reactivated",
        deleteRepToast: "Deleted {name}",
        saveRepToast: "Saved {name}",
        emptyReps: "No reps yet. Create one above.",
        stagesTitle: "Pipeline Stages",
        stagesHint: "Rename and reorder",
        // The prototype promised changes "apply everywhere instantly", which reads
        // as a warning that renaming might break something. It cannot — and saying
        // WHY is what makes the panel safe to use.
        stagesReassurance: "Renaming is safe: leads reference the stage id, not its label, so nothing is reassigned.",
        stageNameLabel: "Stage name",
        moveUpLabel: "Move up",
        moveDownLabel: "Move down",
        renameToast: "Renamed to {name}",
        reorderToast: "Stage order saved",
        reorderAnnouncement: "{name} moved to position {position} of {total}.",
        resetTitle: "Demo Data",
        resetHint: "Restore the sample dataset",
        resetLabel: "Reset demo data",
        resetDialogTitle: "Reset demo data?",
        resetDialogDescription: "Every change you have made in this browser — added clients, moved leads, messages, renamed stages — is discarded and the original sample data comes back. This cannot be undone.",
        resetConfirmLabel: "Reset everything",
        resetToast: "Demo data restored",
    },
};
