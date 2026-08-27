/**
 * SELECTORS — every derived figure in the console
 *
 * BACKEND DEVELOPERS: read this file first. Every headline number on the
 * dashboard is computed here from the raw leads and reps — none of them is a
 * stored value. If you serve these figures from the API instead, these are the
 * formulas to reproduce so the UI keeps agreeing with itself.
 *
 * All functions are pure: same state in, same numbers out, no side effects.
 */
import { devConfig } from "@/config/dev";
import { pipelineConfig, progressionStages } from "@/config/pipeline";
import { portalConfig } from "@/config/portal";
import { roleDefinitions } from "@/config/roles";
/**
 * Lead counts per stage, in pipeline order.
 *
 * `conversionFromPrevious` is a FUNNEL figure, not a ratio of the two counts
 * side by side. A lead sitting in "Client" has already passed through
 * "Attended", so the number that matters at each step is how many leads ever
 * reached that stage or beyond — otherwise the funnel appears to widen partway
 * down, which is nonsense.
 */
export function selectStageCounts(state) {
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
export function stageCountsOf(leads, stageOrder) {
    const total = leads.length;
    const counts = stageOrder.map((stage) => ({
        id: stage.id,
        label: stage.label,
        count: leads.filter((lead) => lead.stageId === stage.id).length,
    }));
    const progression = progressionStages(pipelineConfig.stages).map((s) => s.id);
    /** How many leads reached this stage or any stage after it. */
    const reachedAtLeast = (stageId) => {
        const from = progression.indexOf(stageId);
        if (from === -1)
            return 0;
        return progression
            .slice(from)
            .reduce((sum, id) => sum + (counts.find((c) => c.id === id)?.count ?? 0), 0);
    };
    return counts.map((entry) => {
        const progressionIndex = progression.indexOf(entry.id);
        const previousId = progressionIndex > 0 ? progression[progressionIndex - 1] : undefined;
        const previousReach = previousId ? reachedAtLeast(previousId) : 0;
        return Object.assign(Object.assign({}, entry), { share: total === 0 ? 0 : (entry.count / total) * 100, conversionFromPrevious: previousId && previousReach > 0
                ? (reachedAtLeast(entry.id) / previousReach) * 100
                : undefined });
    });
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
export function selectKpis(state) {
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
export function kpisOf(leads, reps, stageOrder) {
    const totalLeads = leads.length;
    const wonStage = pipelineConfig.stages.find((stage) => stage.isWon);
    const totalClients = wonStage
        ? leads.filter((lead) => lead.stageId === wonStage.id).length
        : 0;
    const counts = stageCountsOf(leads, stageOrder);
    const progression = progressionStages(pipelineConfig.stages).map((s) => s.id);
    const reachedAtLeast = (stageId) => {
        const from = progression.indexOf(stageId);
        if (from === -1)
            return 0;
        return progression
            .slice(from)
            .reduce((sum, id) => sum + (counts.find((c) => c.id === id)?.count ?? 0), 0);
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
        avgDialsPerRep: activeReps.length === 0 ? 0 : Math.round(totalDials / activeReps.length),
    };
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
export function selectLeaderboard(state, metric = "dials") {
    const ranked = state.reps
        .filter((rep) => rep.active)
        .slice()
        .sort((a, b) => b[metric] - a[metric]);
    const top = ranked[0]?.[metric] ?? 0;
    return ranked.map((rep, index) => (Object.assign(Object.assign({}, rep), { rank: index + 1, relative: top === 0 ? 0 : (rep[metric] / top) * 100 })));
}
// Lookups
/** Leads in the won stage — what the Clients screen lists. */
export function selectClients(state) {
    return state.leads.filter((lead) => lead.stageId === pipelineConfig.wonStageId);
}
export function selectLeadById(state, id) {
    return state.leads.find((lead) => lead.id === id);
}
export function selectRepById(state, id) {
    if (!id)
        return undefined;
    return state.reps.find((rep) => rep.id === id);
}
/** Leads in one stage, for a kanban column. */
export function selectLeadsByStage(state, stageId) {
    return state.leads.filter((lead) => lead.stageId === stageId);
}
// Date ranges
//
// Everything on the Reports screen derives from one of these two windows. In
// the prototype the date range changed nothing at all — leads carried no
// creation date, so a 7-day report and a 90-day report returned byte-identical
// figures and the control was decoration. `Lead.createdDaysAgo` is what makes
// it real.
/**
 * Leads created within the last `days` days.
 *
 * `days = 0` means all time, which is how the "All time" range option is
 * expressed — a range with no lower bound rather than a special case the
 * callers have to remember to handle.
 *
 * This is the lead set every other figure on Reports is computed from.
 */
export function selectInRange(state, days) {
    if (days <= 0)
        return state.leads;
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
export function selectInPreviousRange(state, days) {
    if (days <= 0)
        return [];
    return state.leads.filter((lead) => lead.createdDaysAgo > days && lead.createdDaysAgo <= days * 2);
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
export function selectSourceBreakdown(leads) {
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
// Revenue
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
export function selectRevenueEstimate(leads) {
    return leads.reduce((total, lead) => total + lead.invoices.reduce((sum, invoice) => sum + invoice.amount, 0), 0);
}
/** Outstanding balance — everything not yet paid. Used on the lead detail
 *  invoices panel, where "what do they still owe" is the actual question. */
export function selectOutstanding(lead) {
    return lead.invoices
        .filter((invoice) => invoice.status !== "paid")
        .reduce((sum, invoice) => sum + invoice.amount, 0);
}
/**
 * Reps ranked by dials, carrying their conversion efficiency alongside.
 *
 * Bars scale to the TOTAL dialled rather than to the top rep, for the same
 * reason the source bars do — so the width of a bar is a quantity you can
 * read, not a comparison against one arbitrary rep.
 */
export function selectRepEfficiency(state) {
    const active = state.reps.filter((rep) => rep.active);
    const totalDials = active.reduce((sum, rep) => sum + rep.dials, 0);
    return active
        .slice()
        .sort((a, b) => b.dials - a.dials)
        .map((rep, index) => (Object.assign(Object.assign({}, rep), { rank: index + 1, share: totalDials === 0 ? 0 : (rep.dials / totalDials) * 100, efficiency: rep.dials === 0 ? 0 : (rep.conversions / rep.dials) * 100 })));
}
// Stale leads
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
export function isStale(lead, staleAfterDays) {
    const stage = pipelineConfig.stages.find((entry) => entry.id === lead.stageId);
    if (stage?.isWon || stage?.isLost)
        return false;
    return lead.daysInStage >= staleAfterDays;
}
/**
 * How far along a client project is.
 *
 * DERIVED FROM THE MILESTONES, never stored. The prototype printed a hard-coded
 * "100%" above a list of four milestones, which is a number that is right
 * exactly once and silently wrong forever after.
 *
 * `percent` counts COMPLETED stages only — a stage that is in progress
 * contributes nothing. Counting it as a half would put a figure on the screen
 * that no row underneath it justifies, and "50%" next to two Complete pills and
 * two Not-started pills is the kind of arithmetic a client checks.
 */
export function selectProjectProgress(lead) {
    const total = lead.milestones.length;
    const done = lead.milestones.filter((m) => m.status === "done").length;
    return {
        done,
        total,
        percent: total === 0 ? 0 : Math.round((done / total) * 100),
        current: lead.milestones.find((m) => m.status === "in_progress") ?? null,
        next: lead.milestones.find((m) => m.status === "pending") ?? null,
        launched: total > 0 && done === total,
    };
}
/**
 * The one record a signed-in client is allowed to see.
 *
 * Takes the id from the SESSION, never from a route param or a query string —
 * `/portal?client=lead-7` must not be a way to read someone else's project.
 * That is also why the portal has no `[clientId]` segment: there is nothing to
 * put in it that the session does not already know.
 *
 * TODO(backend): the real version fetches by the session's client id on the
 * server and returns a client-shaped record. Until then this reaches into the
 * same local store the admin console uses, which is exactly why the CLIENT-SAFE
 * RULE in config/portal.ts exists — the internal fields are present on this
 * object and simply must not be rendered.
 */
export function selectClientLead(state, session) {
    return state.leads.find((lead) => lead.id === session.clientLeadId);
}
/**
 * Who the chrome should say is signed in.
 *
 * The store holds ONE `currentUser` (the agency admin from the seed), because
 * that is what a mock has. A client session has to show the client instead —
 * their name in the topbar, their company under it, a CLIENT badge beside it —
 * so the identity is resolved here from the session rather than written into
 * state. Persisted state therefore never has to be migrated when the role
 * changes, and signing out of one role cannot leave the other role's name in
 * the bar.
 *
 * TODO(backend): the real session carries the display name, so this collapses
 * to reading it off `session`.
 */
export function selectSessionUser(state, session) {
    if (session.role === "sales") {
        // The rep's own record is the identity. Falling back to the store's
        // `currentUser` would put the sales MANAGER's name in a rep's topbar,
        // which is the one identity mix-up nobody would question on sight.
        const rep = selectSessionRep(state, session);
        return {
            id: rep?.id ?? session.repId,
            name: rep?.name ?? state.currentUser.name,
            title: rep?.role ?? state.currentUser.title,
            roleBadge: roleDefinitions.sales.badge,
            role: "sales",
        };
    }
    if (session.role === "dev") {
        // One shared "Dev Team" login, matching the design — see `DevIdentity` in
        // config/dev.ts for why that is a decision rather than a placeholder.
        const identity = devConfig.identity;
        return {
            id: "dev-team",
            name: identity.name,
            title: identity.title,
            roleBadge: identity.roleBadge,
            role: "dev",
        };
    }
    if (session.role !== "client")
        return state.currentUser;
    const lead = selectClientLead(state, session);
    const identity = portalConfig.content.identity;
    return {
        id: lead?.id ?? session.clientLeadId,
        name: lead?.name ?? identity.nameFallback,
        // Their company, not their job title. "Client" is already on the badge
        // beside it, and printing it twice tells the reader nothing new.
        title: lead?.company || identity.titleFallback,
        roleBadge: identity.roleBadge,
        role: "client",
    };
}
// Sales rep workspace
//
// The agency's own figures, narrowed to ONE PERSON. Every function here is a
// scoped call into arithmetic that already exists — `kpisOf`, `stageCountsOf`
// — rather than a second definition of the same rate. That is the whole point:
// a rep's conversion rate and their manager's view of it have to be the same
// number computed the same way, or the first commission conversation goes
// badly.
/** The signed-in rep's own record. `undefined` if the id no longer resolves. */
export function selectSessionRep(state, session) {
    return state.reps.find((rep) => rep.id === session.repId);
}
/**
 * The leads assigned to one rep.
 *
 * THE SCOPE THE WHOLE WORKSPACE IS BUILT ON. Every rep screen goes through
 * this — dashboard, pipeline, clients, lead detail — so "my" has exactly one
 * definition and a new screen cannot accidentally widen it.
 *
 * TODO(backend): this filter must ALSO run server-side. Filtering in the
 * browser means the whole database was sent to the browser first, which is
 * fine for a mock and is not fine for a commission-bearing figure.
 */
export function selectRepLeads(state, repId) {
    return state.leads.filter((lead) => lead.assignedRepId === repId);
}
/** The rep's own converted clients, in the store's order. */
export function selectRepClients(state, repId) {
    const wonStage = pipelineConfig.stages.find((stage) => stage.isWon);
    if (!wonStage)
        return [];
    return selectRepLeads(state, repId).filter((lead) => lead.stageId === wonStage.id);
}
/**
 * A rep's own performance.
 *
 *   dialsToday      straight off the rep record — see the TODO on `Rep` in
 *                   lib/types.ts about why a counter is the weak part here
 *   appointments    likewise
 *   conversionRate  MY clients / MY leads, via `kpisOf` — the same formula the
 *                   admin dashboard uses over the whole database
 *   attendingRate   likewise: of my leads that ever booked, the share that
 *                   turned up
 *
 * ── WHY `rep.conversions` IS NOT USED HERE ──────────────────────────────────
 * The rep record carries its own `conversions` counter, and in the seed it does
 * not agree with the leads: Sara B. is recorded with 4 conversions and has 2
 * leads in the Client stage. On the admin screens those two figures never
 * appear together so the disagreement is invisible; on a rep's own dashboard
 * "My Conversion Rate" would sit inches from "My Clients" and the rep would
 * spot it immediately.
 *
 * So the rate is derived from the LEADS, which are the source of truth for who
 * converted. The counter stays for the admin leaderboard until the backend
 * replaces both with dated records.
 */
export function selectRepKpis(state, repId) {
    const rep = state.reps.find((entry) => entry.id === repId);
    const leads = selectRepLeads(state, repId);
    // Reusing kpisOf is the point — same definitions, narrower lead set.
    const kpis = kpisOf(leads, rep ? [rep] : [], state.stageOrder);
    return {
        dialsToday: rep?.dialsToday ?? 0,
        dials: rep?.dials ?? 0,
        appointments: rep?.appointments ?? 0,
        conversionRate: kpis.conversionRate,
        attendingRate: kpis.attendingRate,
        totalLeads: kpis.totalLeads,
        totalClients: kpis.totalClients,
    };
}
// Chat
/**
 * Re-derive "did I write this" for whoever is reading.
 *
 * `ChatMessage.fromMe` is stored, and that was fine while the console had one
 * viewer: the seed wrote it from the sales manager's point of view. The rep
 * workspace opens the SAME threads from the other side, where every one of
 * those flags is backwards — a rep would see their own messages painted as the
 * manager's, on the one screen whose entire job is telling the two apart.
 *
 * `fromMe` is not a property of a message. It is a property of a message AND A
 * READER, so it is computed at render time from the author.
 *
 * TODO(backend): drop the stored flag. A message carries an author id; the
 * client compares it to the session and this function goes away. Matching on
 * NAME is a mock-only shortcut — two people called "Sara B." would break it.
 */
export function messagesForViewer(messages, viewerName) {
    return messages.map((message) => (Object.assign(Object.assign({}, message), { fromMe: message.authorName === viewerName })));
}
/**
 * Every project the dev team can work on: the paying clients.
 *
 * A lead that has not converted has no delivery to do, which is why this is
 * `selectClients()` and not `state.leads`. A developer looking at a list that
 * included prospects would be looking at work that does not exist.
 */
export function selectProjects(state, today) {
    return selectClients(state).map((lead) => ({
        lead,
        progress: selectProjectProgress(lead),
        previewCount: lead.previews.length,
        live: Boolean(lead.liveUrl),
        overdue: countOverdue(lead, today),
    }));
}
/**
 * How many unfinished steps are past their target date.
 *
 * `today` IS A REQUIRED-ISH ARGUMENT ON PURPOSE. Reading the clock inside a
 * selector would make this function return different answers on the server and
 * on the client for any project due today, which React reports as a hydration
 * mismatch — intermittent, environment-dependent, and miserable to chase. See
 * the date note at the top of lib/types.ts.
 *
 * So the caller passes a date it obtained AFTER hydration (in an effect), and
 * omitting it yields 0 — the honest answer for a render that cannot know what
 * day it is. The projects grid renders without overdue markers for one frame
 * and then with them, which is correct: "nothing is late" is a safer thing to
 * show for 16ms than a number that might be wrong.
 */
export function countOverdue(lead, today) {
    if (!today)
        return 0;
    const cutoff = today.toISOString().slice(0, 10);
    return lead.milestones.filter((milestone) => milestone.status !== "done" &&
        milestone.targetDate !== null &&
        milestone.targetDate < cutoff).length;
}
/** Is this one step late? Same clock caveat as `countOverdue`. */
export function isStepOverdue(milestone, today) {
    if (!today || !milestone.targetDate || milestone.status === "done") {
        return false;
    }
    return milestone.targetDate < today.toISOString().slice(0, 10);
}
