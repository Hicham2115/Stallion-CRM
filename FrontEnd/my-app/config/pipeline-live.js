/**
 * The real pipeline — mirrors `Lead::STAGES` / `config('leads.stages')` on
 * the backend exactly (same ids, same order). Kept separate from
 * config/pipeline.js on purpose: that file drives the still-mock dashboard
 * breakdown, client-status panel, funnel view and settings editor (6 fake
 * stages) — none of that is in scope here, so this doesn't touch it.
 *
 * `tone` picks a color off the existing --stage-1..5 lime ramp in
 * globals.css — no new colors introduced. Progress buckets into the ramp
 * (new_lead/contacted both read as "early", won/in_delivery/delivered all
 * read as "the deal is done") since there are only 5 tones for 9 forward
 * stages.
 */
/** Mirrors Lead::WON_STAGES on the backend — a deal that reaches `won`
 *  stays a won customer even after moving on to in_delivery/delivered.
 *  Used by any historical/count KPI computed client-side (Reports); current-
 *  state views (the Kanban columns) use an exact stage match instead. */
export const WON_STAGE_IDS = ["won", "in_delivery", "delivered"];

export const LIVE_STAGES = [
  { id: "new_lead", label: "New Lead", tone: 1 },
  { id: "contacted", label: "Contacted", tone: 1 },
  { id: "consult_booked", label: "Consult Booked", tone: 2 },
  { id: "consult_completed", label: "Consult Completed", tone: 2 },
  { id: "mvp_in_progress", label: "MVP In Progress", tone: 3 },
  { id: "closing_booked", label: "Closing Booked", tone: 4 },
  { id: "won", label: "Won", tone: 5 },
  { id: "in_delivery", label: "In Delivery", tone: 5 },
  { id: "delivered", label: "Delivered", tone: 5 },
  { id: "lost", label: "Lost", tone: "neutral", isLost: true },
];

export function liveStageColor(stage) {
  return stage.tone === "neutral"
    ? "var(--stage-neutral)"
    : `var(--stage-${stage.tone})`;
}

export function liveStageLabel(stageId) {
  return LIVE_STAGES.find((s) => s.id === stageId)?.label ?? stageId;
}

/**
 * Real per-stage counts, in LIVE_STAGES order — the same {id, label, count,
 * share} shape the mock dashboard widgets (PipelineBreakdown, ClientStatus)
 * already consume, so those components didn't need a rewrite, just a real
 * data source. `conversionFromPrevious` is deliberately omitted: that's a
 * CUMULATIVE REACH figure ("% of leads that ever got past the previous
 * stage"), which needs stage-history aggregation this doesn't do — current
 * distribution only, same current-state semantics as KpiService::funnel()
 * on the backend.
 */
export function liveStageCountsOf(leads) {
  const total = leads.length;
  return LIVE_STAGES.map((stage) => {
    const count = leads.filter((lead) => lead.stage === stage.id).length;
    return {
      id: stage.id,
      label: stage.label,
      isLost: stage.isLost === true,
      count,
      share: total === 0 ? 0 : (count / total) * 100,
    };
  });
}

export const LOST_REASONS = [
  { value: "price", label: "Price" },
  { value: "timing", label: "Timing" },
  { value: "trust", label: "Trust" },
  { value: "scope", label: "Scope" },
  { value: "went_elsewhere", label: "Went elsewhere" },
  { value: "no_response", label: "No response" },
  { value: "not_qualified", label: "Not qualified" },
  { value: "other", label: "Other" },
];

/**
 * Which existing timestamp best represents "when this lead entered its
 * current stage" — used for the "N days in stage" figure. No field exists
 * per-stage (Prompt 1 didn't add one for every stage, and inventing new
 * columns is out of scope here), so this falls back to the safest thing
 * available rather than fabricating a number, per stage:
 *
 *   new_lead            application_completed_at, else created_at
 *   contacted           first_contact_at, else created_at
 *   consult_booked      consult_booked_at, else created_at
 *   consult_completed   consult_scheduled_for (the consult that just
 *                       happened), else consult_booked_at, else created_at
 *   mvp_in_progress     no dedicated timestamp — consult_scheduled_for is
 *                       the closest thing to "when this phase started".
 *                       (Prompt 3 evaluated adding mvp_started_at for this
 *                       and deliberately didn't — no KPI formula needs it.)
 *   won / in_delivery   closed_at, else created_at
 *   delivered           delivered_at (Prompt 3 — auto-stamped the first
 *                       time a lead enters this stage), else closed_at,
 *                       else created_at
 *   lost                lost_at (Prompt 3 — same auto-stamping), else
 *                       updated_at for leads moved to lost before that
 *                       column existed, else created_at
 */
export function stageEnteredAt(lead) {
  switch (lead.stage) {
    case "new_lead":
      return lead.application_completed_at ?? lead.created_at;
    case "contacted":
      return lead.first_contact_at ?? lead.created_at;
    case "consult_booked":
      return lead.consult_booked_at ?? lead.created_at;
    case "consult_completed":
      return (
        lead.consult_scheduled_for ?? lead.consult_booked_at ?? lead.created_at
      );
    case "mvp_in_progress":
      return lead.consult_scheduled_for ?? lead.created_at;
    case "closing_booked":
      return lead.closing_meeting_scheduled_for ?? lead.created_at;
    case "won":
    case "in_delivery":
      return lead.closed_at ?? lead.created_at;
    case "delivered":
      return lead.delivered_at ?? lead.closed_at ?? lead.created_at;
    case "lost":
      return lead.lost_at ?? lead.updated_at ?? lead.created_at;
    default:
      return lead.created_at;
  }
}

export function daysInStage(lead) {
  const at = stageEnteredAt(lead);
  if (!at) return 0;
  const ms = Date.now() - new Date(at).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

/**
 * The one real-data KPI formula, shared by the admin dashboard (KpiCluster)
 * and Reports (all-time vs date-ranged, same math either way) — mirrors
 * what KpiService computes on the backend (consult_show_rate,
 * consult_to_mvp_rate, WON_STAGE_IDS), just done client-side over an
 * already-fetched /api/leads list. Living in one place here (not copied
 * into each component) is the whole point: the dashboard and Reports
 * showing two different numbers for "the same" KPI is exactly the bug this
 * fixes.
 */
export function liveKpisOf(leads) {
  const totalLeads = leads.length;
  const won = leads.filter((lead) => WON_STAGE_IDS.includes(lead.stage)).length;

  const consultsScheduled = leads.filter((lead) => lead.consult_scheduled_for).length;
  const consultsAttended = leads.filter(
    (lead) => lead.consult_scheduled_for && lead.consult_attended === true,
  ).length;

  const consultsCompleted = leads.filter((lead) => lead.consult_completed_at).length;
  const agreedMvp = leads.filter((lead) => lead.consult_outcome === "agreed_mvp").length;

  return {
    totalLeads,
    totalClients: won,
    appointments: consultsScheduled,
    conversionRate: totalLeads === 0 ? 0 : (won / totalLeads) * 100,
    attendingRate: consultsScheduled === 0 ? 0 : (consultsAttended / consultsScheduled) * 100,
    consultToMvpRate: consultsCompleted === 0 ? 0 : (agreedMvp / consultsCompleted) * 100,
    needsSecondMeeting: leads.filter(
      (lead) => lead.needs_second_meeting && !lead.second_meeting_scheduled_for,
    ).length,
  };
}
