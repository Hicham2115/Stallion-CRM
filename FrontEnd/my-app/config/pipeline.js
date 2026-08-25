/**
 * PIPELINE STAGES
 *
 * The single source of truth for the sales funnel. FIVE surfaces derive from
 * this one list:
 *
 *   1. the Pipeline Breakdown bar chart   (dashboard)
 *   2. the Client Status panel            (dashboard)
 *   3. the kanban columns                 (pipeline)
 *   4. the stage <select> on a lead       (lead detail)
 *   5. the rename / reorder editor        (settings)
 *
 * Add a stage here and all five update. Nothing reads a stage name from a
 * string literal anywhere in the codebase.
 *
 * Quick answers to the usual requests:
 *   - Rename a stage ......... label (the id must NOT change, see below)
 *   - Add a stage ............ push an entry, give it the next `tone`
 *   - Reorder stages ......... reorder the array
 *   - Recolour the ramp ...... --stage-1..5 in app/globals.css
 */
export const pipelineConfig = {
    stages: [
        { id: "new", label: "New", tone: 1 },
        { id: "contacted", label: "Contacted", tone: 2 },
        { id: "appointment_set", label: "Appointment Set", tone: 3 },
        { id: "attended", label: "Attended", tone: 4 },
        { id: "client", label: "Client", tone: 5, isWon: true },
        { id: "lost", label: "Lost", tone: "neutral", isLost: true },
    ],
    wonStageId: "client",
    sources: [
        "Website",
        "Google Ads",
        "Cold Outreach",
        "WhatsApp",
        "Walk-in",
        "Instagram",
        "Facebook Ads",
        "Referral",
    ],
};
/**
 * The CSS colour for a stage. Resolves to the ramp variables in globals.css, so
 * recolouring the whole funnel is a change to five custom properties and
 * nothing else.
 */
export function stageColor(stage) {
    return stage.tone === "neutral"
        ? "var(--stage-neutral)"
        : `var(--stage-${stage.tone})`;
}
/** Look a stage up by id. Returns undefined for unknown ids rather than throwing,
 *  so a stale id from persisted data degrades instead of crashing the page. */
export function findStage(stages, id) {
    return stages.find((stage) => stage.id === id);
}
/**
 * The stages that represent forward progress, in order — everything that is
 * not a terminal loss.
 *
 * This is what funnel conversion is measured across: including "Lost" would
 * make the funnel widen partway down, which is not a funnel.
 */
export function progressionStages(stages) {
    return stages.filter((stage) => !stage.isLost);
}
