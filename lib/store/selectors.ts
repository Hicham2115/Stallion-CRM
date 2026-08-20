/**
 * ============================================================================
 *  SELECTORS — every derived figure in the console
 * ============================================================================
 *  BACKEND DEVELOPERS: read this file first. Every headline number on the
 *  dashboard is computed here from the raw leads and reps — none of them is a
 *  stored value. If you serve these figures from the API instead, these are the
 *  formulas to reproduce so the UI keeps agreeing with itself.
 *
 *  All functions are pure: same state in, same numbers out, no side effects.
 * ============================================================================
 */

import { pipelineConfig, progressionStages } from "@/config/pipeline";
import type { CrmState, Lead, Rep } from "@/lib/types";

/* --------------------------------------------------------------------------
   Stage counts
   -------------------------------------------------------------------------- */

export interface StageCount {
  id: string;
  label: string;
  count: number;
  /** Share of ALL leads, 0-100. Drives the Client Status bars. */
  share: number;
  /**
   * Share of the PREVIOUS progression stage that reached this one, 0-100.
   * Undefined for the first stage (nothing precedes it) and for terminal
   * losses (they are not a step in the funnel).
   */
  conversionFromPrevious?: number;
}

/**
 * Lead counts per stage, in pipeline order.
 *
 * `conversionFromPrevious` is a FUNNEL figure, not a ratio of the two counts
 * side by side. A lead sitting in "Client" has already passed through
 * "Attended", so the number that matters at each step is how many leads ever
 * reached that stage or beyond — otherwise the funnel appears to widen partway
 * down, which is nonsense.
 */
export function selectStageCounts(state: CrmState): StageCount[] {
  return stageCountsOf(state.leads, state.stageOrder);
}

/**
 * The same figures over an arbitrary lead set.
 *
 * Reports needs stage counts for the leads created inside a date range, not
 * for the whole database, so the arithmetic lives here and `selectStageCounts`
 * is the whole-state convenience wrapper. Keeping one implementation is the
 * point: a second copy would be the thing that eventually disagrees with the
 * dashboard.
 */
export function stageCountsOf(
  leads: Lead[],
  stageOrder: CrmState["stageOrder"],
): StageCount[] {
  const total = leads.length;

  const counts = stageOrder.map((stage) => ({
    id: stage.id,
    label: stage.label,
    count: leads.filter((lead) => lead.stageId === stage.id).length,
  }));

  const progression = progressionStages(pipelineConfig.stages).map((s) => s.id);

  /** How many leads reached this stage or any stage after it. */
  const reachedAtLeast = (stageId: string): number => {
    const from = progression.indexOf(stageId);
    if (from === -1) return 0;
    return progression
      .slice(from)
      .reduce(
        (sum, id) => sum + (counts.find((c) => c.id === id)?.count ?? 0),
        0,
      );
  };

  return counts.map((entry) => {
    const progressionIndex = progression.indexOf(entry.id);
    const previousId =
      progressionIndex > 0 ? progression[progressionIndex - 1] : undefined;

    const previousReach = previousId ? reachedAtLeast(previousId) : 0;

    return {
      ...entry,
      share: total === 0 ? 0 : (entry.count / total) * 100,
      conversionFromPrevious:
        previousId && previousReach > 0
          ? (reachedAtLeast(entry.id) / previousReach) * 100
          : undefined,
    };
  });
}

/* --------------------------------------------------------------------------
   Headline KPIs
   -------------------------------------------------------------------------- */

export interface KpiValues {
  /** Leads sitting in the stage flagged `isWon`. */
  totalClients: number;
  /** Every lead, at any stage. The "of N total leads" figure. */
  totalLeads: number;
  /** Whole percent, 0-100. */
  attendingRate: number;
  /** Whole percent, 0-100. */
  conversionRate: number;
  /** Rounded to a whole number of dials. */
  avgDialsPerRep: number;
}

/**
 * The four dashboard headline figures.
 *
 *   totalClients    leads whose stage is flagged isWon in config/pipeline.ts
 *   conversionRate  totalClients / totalLeads
 *                   -> 14 / 80 = 17.5% -> displays as 18%
 *   attendingRate   of the leads that ever booked an appointment, the share
 *                   that actually turned up. Measured as "reached Attended or
 *                   beyond" over "reached Appointment Set or beyond", NOT
 *                   attended-count over appointment-count — a lead now sitting
 *                   in "Client" attended, and counting it as a no-show would
 *                   punish the team for closing deals.
 *                   -> (10 + 14) / (13 + 10 + 14) = 24 / 37 = 64.9% -> 65%
 *   avgDialsPerRep  total dials across ACTIVE reps / number of active reps
 *                   -> 410 / 8 = 51.25 -> 51
 */
export function selectKpis(state: CrmState): KpiValues {
  return kpisOf(state.leads, state.reps, state.stageOrder);
}

/**
 * The same four figures over an arbitrary lead set.
 *
 * Reports computes them for one date range and again for the range before it,
 * to produce the period-over-period deltas. Same reasoning as `stageCountsOf`:
 * one implementation, two entry points.
 *
 * NOTE that `avgDialsPerRep` does NOT narrow with the lead set. Reps carry
 * running dial totals rather than dated call records, so there is no honest way
 * to say how many dials happened inside a window — see `reportsConfig.kpis` in
 * config/reports.ts, which leaves the card off the Reports screen for exactly
 * this reason rather than showing an all-time figure under a date range.
 */
export function kpisOf(
  leads: Lead[],
  reps: Rep[],
  stageOrder: CrmState["stageOrder"],
): KpiValues {
  const totalLeads = leads.length;

  const wonStage = pipelineConfig.stages.find((stage) => stage.isWon);
  const totalClients = wonStage
    ? leads.filter((lead) => lead.stageId === wonStage.id).length
    : 0;

  const counts = stageCountsOf(leads, stageOrder);
  const progression = progressionStages(pipelineConfig.stages).map((s) => s.id);

  const reachedAtLeast = (stageId: string): number => {
    const from = progression.indexOf(stageId);
    if (from === -1) return 0;
    return progression
      .slice(from)
      .reduce(
        (sum, id) => sum + (counts.find((c) => c.id === id)?.count ?? 0),
        0,
      );
  };

  // The two stages the attending rate compares. Named by position in the
  // progression so renaming or reordering stages in Settings keeps this honest.
  const appointmentStage = progression[2];
  const attendedStage = progression[3];

  const booked = appointmentStage ? reachedAtLeast(appointmentStage) : 0;
  const attended = attendedStage ? reachedAtLeast(attendedStage) : 0;

  const activeReps = reps.filter((rep) => rep.active);
  const totalDials = activeReps.reduce((sum, rep) => sum + rep.dials, 0);

  return {
    totalClients,
    totalLeads,
    attendingRate: booked === 0 ? 0 : (attended / booked) * 100,
    conversionRate: totalLeads === 0 ? 0 : (totalClients / totalLeads) * 100,
    avgDialsPerRep:
      activeReps.length === 0 ? 0 : Math.round(totalDials / activeReps.length),
  };
}

/* --------------------------------------------------------------------------
   Leaderboard
   -------------------------------------------------------------------------- */

export type LeaderboardMetric = "dials" | "appointments" | "conversions";

export interface LeaderboardRow extends Rep {
  /** 1-based position after sorting. */
  rank: number;
  /** This rep's metric as a share of the top rep's, 0-100. Drives the bar. */
  relative: number;
}

/**
 * Reps ranked by a metric, highest first.
 *
 * The design shows the reps in the order they were created, which is not a
 * leaderboard — the top performer was fourth from the top. Sorting is the
 * whole point of the panel.
 *
 * Ties keep their input order (Array.prototype.sort is stable), so equal reps
 * do not shuffle between renders.
 */
export function selectLeaderboard(
  state: CrmState,
  metric: LeaderboardMetric = "dials",
): LeaderboardRow[] {
  const ranked = state.reps
    .filter((rep) => rep.active)
    .slice()
    .sort((a, b) => b[metric] - a[metric]);

  const top = ranked[0]?.[metric] ?? 0;

  return ranked.map((rep, index) => ({
    ...rep,
    rank: index + 1,
    relative: top === 0 ? 0 : (rep[metric] / top) * 100,
  }));
}

/* --------------------------------------------------------------------------
   Lookups
   -------------------------------------------------------------------------- */

/** Leads in the won stage — what the Clients screen lists. */
export function selectClients(state: CrmState): Lead[] {
  return state.leads.filter(
    (lead) => lead.stageId === pipelineConfig.wonStageId,
  );
}

export function selectLeadById(state: CrmState, id: string): Lead | undefined {
  return state.leads.find((lead) => lead.id === id);
}

export function selectRepById(state: CrmState, id: string | null): Rep | undefined {
  if (!id) return undefined;
  return state.reps.find((rep) => rep.id === id);
}

/** Leads in one stage, for a kanban column. */
export function selectLeadsByStage(state: CrmState, stageId: string): Lead[] {
  return state.leads.filter((lead) => lead.stageId === stageId);
}

/* --------------------------------------------------------------------------
   Date ranges
   --------------------------------------------------------------------------
   Everything on the Reports screen derives from one of these two windows. In
   the prototype the date range changed nothing at all — leads carried no
   creation date, so a 7-day report and a 90-day report returned byte-identical
   figures and the control was decoration. `Lead.createdDaysAgo` is what makes
   it real.
   -------------------------------------------------------------------------- */

/**
 * Leads created within the last `days` days.
 *
 * `days = 0` means all time, which is how the "All time" range option is
 * expressed — a range with no lower bound rather than a special case the
 * callers have to remember to handle.
 *
 * This is the lead set every other figure on Reports is computed from.
 */
export function selectInRange(state: CrmState, days: number): Lead[] {
  if (days <= 0) return state.leads;
  return state.leads.filter((lead) => lead.createdDaysAgo <= days);
}

/**
 * Leads created in the window of equal length immediately BEFORE the current
 * one — days 30-60 for a 30-day range.
 *
 * This is the comparison behind every delta chip, and it is the entire reason a
 * report has a date range at all: "18% conversion" is a number, "18%, up 4.2
 * points on the previous 30 days" is a finding.
 *
 * Returns nothing for the all-time range, because there is no earlier period to
 * compare against — the UI drops the delta chips rather than inventing one.
 */
export function selectInPreviousRange(state: CrmState, days: number): Lead[] {
  if (days <= 0) return [];
  return state.leads.filter(
    (lead) => lead.createdDaysAgo > days && lead.createdDaysAgo <= days * 2,
  );
}

/* --------------------------------------------------------------------------
   Source breakdown
   -------------------------------------------------------------------------- */

export interface SourceBreakdown {
  source: string;
  count: number;
  /** Share of the leads in the range, 0-100. */
  share: number;
}

/**
 * Where the leads came from, biggest source first.
 *
 * `share` is a share of the TOTAL, not of the largest source. That difference
 * is the whole bug the Reports prototype exposed: the bars were scaled against
 * the maximum, so the top source always filled the track completely and every
 * bar's width contradicted the percentage printed next to it. Scaling to the
 * total means a bar that looks like a fifth of the row IS a fifth of the leads.
 *
 * Sources with no leads in the range are dropped rather than drawn as empty
 * rows — eight zero-length bars is not a chart.
 */
export function selectSourceBreakdown(leads: Lead[]): SourceBreakdown[] {
  const total = leads.length;

  return pipelineConfig.sources
    .map((source) => {
      const count = leads.filter((lead) => lead.source === source).length;
      return {
        source,
        count,
        share: total === 0 ? 0 : (count / total) * 100,
      };
    })
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count);
}

/* --------------------------------------------------------------------------
   Revenue
   -------------------------------------------------------------------------- */

/**
 * Every invoice on every client in the set, added up — paid, pending and
 * overdue alike.
 *
 * This is BILLED revenue, not collected revenue, and the two are very
 * different numbers to run a business on. The prototype printed the figure with
 * no label at all, so there was no way to tell which one it meant; the KPI card
 * now states it in the foot (`reportsConfig.kpis`), because a money figure
 * nobody can define is worse than no money figure.
 *
 * TODO(backend): if the API can distinguish collected from billed, this should
 * become two figures rather than one.
 */
export function selectRevenueEstimate(leads: Lead[]): number {
  return leads.reduce(
    (total, lead) =>
      total + lead.invoices.reduce((sum, invoice) => sum + invoice.amount, 0),
    0,
  );
}

/** Outstanding balance — everything not yet paid. Used on the lead detail
 *  invoices panel, where "what do they still owe" is the actual question. */
export function selectOutstanding(lead: Lead): number {
  return lead.invoices
    .filter((invoice) => invoice.status !== "paid")
    .reduce((sum, invoice) => sum + invoice.amount, 0);
}

/* --------------------------------------------------------------------------
   Rep efficiency
   -------------------------------------------------------------------------- */

export interface RepEfficiencyRow extends Rep {
  rank: number;
  /** Dials as a share of the total dialled, 0-100. Drives the bar. */
  share: number;
  /**
   * Conversions per 100 dials. Whole percent.
   *
   * The dashboard already ranks reps by raw dial volume. Repeating that panel
   * on Reports would spend a third of the analysis screen restating something
   * the user saw two clicks ago, so this adds the second dimension: the
   * loudest rep and the most effective rep are usually not the same person,
   * and only this figure tells them apart.
   */
  efficiency: number;
}

/**
 * Reps ranked by dials, carrying their conversion efficiency alongside.
 *
 * Bars scale to the TOTAL dialled rather than to the top rep, for the same
 * reason the source bars do — so the width of a bar is a quantity you can
 * read, not a comparison against one arbitrary rep.
 */
export function selectRepEfficiency(state: CrmState): RepEfficiencyRow[] {
  const active = state.reps.filter((rep) => rep.active);
  const totalDials = active.reduce((sum, rep) => sum + rep.dials, 0);

  return active
    .slice()
    .sort((a, b) => b.dials - a.dials)
    .map((rep, index) => ({
      ...rep,
      rank: index + 1,
      share: totalDials === 0 ? 0 : (rep.dials / totalDials) * 100,
      efficiency: rep.dials === 0 ? 0 : (rep.conversions / rep.dials) * 100,
    }));
}

/* --------------------------------------------------------------------------
   Stale leads
   -------------------------------------------------------------------------- */

/**
 * Has this lead sat in its current stage longer than the pipeline allows?
 *
 * A stale lead is the single most actionable thing on the kanban board, and in
 * the prototype "13 days in stage" was styled exactly like "1 day in stage" —
 * the most urgent card on the screen looked like every other card.
 *
 * Terminal stages are never stale: a won client and a lost lead are finished,
 * not neglected, and flagging them would train people to ignore the marker.
 */
export function isStale(lead: Lead, staleAfterDays: number): boolean {
  const stage = pipelineConfig.stages.find((entry) => entry.id === lead.stageId);
  if (stage?.isWon || stage?.isLost) return false;
  return lead.daysInStage >= staleAfterDays;
}
