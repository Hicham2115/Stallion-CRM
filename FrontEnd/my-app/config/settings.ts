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

export interface SettingsFeatureFlags {
  createAccount: boolean;
  /** "Quick Add (no login)", grouped inside the create panel. */
  quickAdd: boolean;
  repManagement: boolean;
  stageEditor: boolean;
  /** Show/hide toggle and generator on the password field. */
  passwordTools: boolean;
  /**
   * "Reset demo data".
   *
   * REQUIRED while the console runs on mocks. State persists to localStorage,
   * so it survives refreshes and looks exactly like real data — there has to be
   * a way back to a known-good dataset. This is the guardrail that pairs with
   * the MOCK DATA chip in the topbar.
   */
  resetDemoData: boolean;
}

export interface SettingsConfig {
  features: SettingsFeatureFlags;
  generatedPasswordLength: number;
  content: {
    createTitle: string;
    createHint: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    passwordHint: string;
    generateLabel: string;
    showPasswordLabel: string;
    hidePasswordLabel: string;
    createSubmitLabel: string;
    createPendingLabel: string;
    createToast: string;
    quickAddTitle: string;
    quickAddHint: string;
    quickAddLabel: string;
    quickAddPendingLabel: string;

    repsTitle: string;
    repsHint: string;
    repColumn: string;
    /** Screen-reader caption for the rep table. */
    repsCaption: string;
    emailColumn: string;
    statusColumn: string;
    actionsColumn: string;
    activeLabel: string;
    inactiveLabel: string;
    editLabel: string;
    saveLabel: string;
    cancelLabel: string;
    rowActionsLabel: string;
    deactivateLabel: string;
    reactivateLabel: string;
    deleteRepLabel: string;
    deleteRepTitle: string;
    deleteRepDescription: string;
    deleteRepConfirmLabel: string;
    deactivateToast: string;
    reactivateToast: string;
    deleteRepToast: string;
    saveRepToast: string;
    emptyReps: string;

    stagesTitle: string;
    stagesHint: string;
    /** Replaces the alarming "applies everywhere instantly". */
    stagesReassurance: string;
    stageNameLabel: string;
    moveUpLabel: string;
    moveDownLabel: string;
    renameToast: string;
    reorderToast: string;
    /** Live-region text on reorder. `{name}`, `{position}`, `{total}`. */
    reorderAnnouncement: string;

    resetTitle: string;
    resetHint: string;
    resetLabel: string;
    resetDialogTitle: string;
    resetDialogDescription: string;
    resetConfirmLabel: string;
    resetToast: string;
  };
}

export const settingsConfig: SettingsConfig = {
  features: {
    createAccount: true,
    quickAdd: true,
    repManagement: true,
    stageEditor: true,
    passwordTools: true,
    resetDemoData: true,
  },

  generatedPasswordLength: 16,

  content: {
    createTitle: "Create Team Account",
    createHint: "Adds a rep with sign-in access",
    nameLabel: "Full name",
    namePlaceholder: "Youssef Karim",
    emailLabel: "Work email",
    emailPlaceholder: "youssef@stallionadvertising.ma",
    passwordLabel: "Temporary password",
    passwordPlaceholder: "Generate or type one",
    passwordHint: "They will be asked to change it on first sign-in.",
    generateLabel: "Generate",
    showPasswordLabel: "Show password",
    hidePasswordLabel: "Hide password",
    createSubmitLabel: "Create account",
    createPendingLabel: "Creating…",
    createToast: "Created an account for {name}",

    quickAddTitle: "Quick add",
    // The prototype left this control floating with no explanation of how it
    // differed from the form above it. Grouped here, the difference is the
    // whole label.
    quickAddHint: "Add a rep for tracking only, with no sign-in.",
    quickAddLabel: "Quick add (no login)",
    quickAddPendingLabel: "Adding…",

    repsTitle: "Sales Reps",
    repsHint: "Edit, deactivate or remove",
    repColumn: "Rep",
    repsCaption: "Sales reps, with their sign-in email and account status",
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
    deleteRepDescription:
      "Their dial and conversion history goes with them, and any leads assigned to them become unassigned. Deactivating keeps the history instead.",
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
    stagesReassurance:
      "Renaming is safe: leads reference the stage id, not its label, so nothing is reassigned.",
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
    resetDialogDescription:
      "Every change you have made in this browser — added clients, moved leads, messages, renamed stages — is discarded and the original sample data comes back. This cannot be undone.",
    resetConfirmLabel: "Reset everything",
    resetToast: "Demo data restored",
  },
};
