/**
 * ============================================================================
 *  PIPELINE STAGES
 * ============================================================================
 *  The single source of truth for the sales funnel. FIVE surfaces derive from
 *  this one list:
 *
 *    1. the Pipeline Breakdown bar chart   (dashboard)
 *    2. the Client Status panel            (dashboard)
 *    3. the kanban columns                 (pipeline)
 *    4. the stage <select> on a lead       (lead detail)
 *    5. the rename / reorder editor        (settings)
 *
 *  Add a stage here and all five update. Nothing reads a stage name from a
 *  string literal anywhere in the codebase.
 *
 *  Quick answers to the usual requests:
 *    - Rename a stage ......... label (the id must NOT change, see below)
 *    - Add a stage ............ push an entry, give it the next `tone`
 *    - Reorder stages ......... reorder the array
 *    - Recolour the ramp ...... --stage-1..5 in app/globals.css
 * ============================================================================
 */

export interface PipelineStage {
  /**
   * Stable machine key. This is what a lead stores and what the API will send,
   * so it must NEVER change once data exists — rename the `label` instead.
   */
  id: string;
  /** Human label. Safe to rename, including from the Settings screen. */
  label: string;
  /**
   * Position on the sequential lime ramp (1 = earliest/darkest,
   * 5 = latest/brightest), or "neutral" for outcomes that are not a step
   * forward.
   *
   * WHY THIS MATTERS: the prototype coloured these by hand and the ramp went
   * backwards at step 3 — "Appointment Set" was darker than "Contacted"
   * despite being further along, which makes the chart read as noise. A tone
   * index makes the progression monotonic by construction. "Lost" is
   * deliberately off the ramp: it is a different KIND of outcome, not a dimmer
   * kind of winning, so it gets its own hue family.
   */
  tone: 1 | 2 | 3 | 4 | 5 | "neutral";
  /** Terminal win. Counts as a client, and is what "Total Clients" measures. */
  isWon?: boolean;
  /** Terminal loss. Excluded from funnel conversion maths. */
  isLost?: boolean;
}

export interface PipelineConfig {
  stages: PipelineStage[];
  /**
   * Where "Convert to Client" sends a lead. Must match a stage id with
   * isWon: true.
   */
  wonStageId: string;
  /** Lead sources offered in the Add Client form and shown as badges.
   *  Deliberately rendered as neutral grey pills, never colour-coded — eight
   *  categories cannot be told apart by hue, so colour would add noise and
   *  nothing else. */
  sources: string[];
}

export const pipelineConfig: PipelineConfig = {
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
export function stageColor(stage: PipelineStage): string {
  return stage.tone === "neutral"
    ? "var(--stage-neutral)"
    : `var(--stage-${stage.tone})`;
}

/** Look a stage up by id. Returns undefined for unknown ids rather than throwing,
 *  so a stale id from persisted data degrades instead of crashing the page. */
export function findStage(
  stages: PipelineStage[],
  id: string,
): PipelineStage | undefined {
  return stages.find((stage) => stage.id === id);
}

/**
 * The stages that represent forward progress, in order — everything that is
 * not a terminal loss.
 *
 * This is what funnel conversion is measured across: including "Lost" would
 * make the funnel widen partway down, which is not a funnel.
 */
export function progressionStages(stages: PipelineStage[]): PipelineStage[] {
  return stages.filter((stage) => !stage.isLost);
}
