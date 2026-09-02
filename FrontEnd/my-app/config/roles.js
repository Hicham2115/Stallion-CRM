import { adminConfig } from "@/config/admin";
import { devConfig } from "@/config/dev";
import { portalConfig } from "@/config/portal";
import { repConfig } from "@/config/rep";
const NOTHING = [];

export const roleDefinitions = {
    admin: {
        id: "admin",
        home: "/admin",
        badge: "Admin",
        purpose: "Runs the agency: pipeline health, rep performance, stages, billing.",
        writes: [
            "name", "company", "phone", "email", "source", "stageId",
            "assignedRepId", "notes", "invoices", "files", "projectSummary",
        ],
        neverReads: NOTHING,
        sidebarStat: "team",
        leadRoute: adminConfig.routes.client,
    },
    sales: {
        id: "sales",
        home: repConfig.routes.home,
        badge: "Sales rep",
        purpose: "Works their OWN leads day to day: dials, stage moves, notes, appointments.",
        writes: [
            "name", "company", "phone", "email", "source", "stageId", "notes",
            "activity (via log-a-call)", "assignedRepId (themselves, on create)",
        ],
        // Not a privacy boundary the way the client's is — a rep may legitimately
        // learn a colleague's figures over lunch. It is a SCOPE: their screens are
        // built around one pipeline, and a rep reading the whole database is
        // looking at a manager's screen. Commission disputes start there.
        // ONE DELIBERATE EXCEPTION, added with /rep/analysis (2026-09-01):
        // acquisition cost and campaign return. Everything else in this list
        // is per-PERSON data a rep could use to compare themselves against a
        // colleague; Analysis is per-CAMPAIGN and has no rep dimension at all
        // (ad spend is not attributed to a rep — see KpiService's
        // adSpendTotal), so it cannot answer "how am I doing against Sara".
        // It is the numbers a rep needs to know which leads are expensive.
        // User decision, 2026-09-01. The team KPIs, the leaderboard, Reports
        // and Settings all stay closed.
        neverReads: [
            "other reps' leads",
            "team-wide KPIs",
            "rep leaderboard",
            "reports",
            "settings",
        ],
        // Their own dials, never the team average: a rep cannot act on an average
        // and would spend a week wondering why "their" number never matched what
        // they did.
        sidebarStat: "own",
        leadRoute: repConfig.routes.lead,
    },
    dev: {
        id: "dev",
        home: devConfig.routes.home,
        badge: "Dev team",
        purpose: "Delivers the work once a lead converts, and publishes progress to the client.",
        writes: [
            "milestones", "previews", "liveUrl", "updates", "files", "projectSummary",
        ],
        // A developer has no reason to see the funnel, and every reason not to
        // repeat it to a client.
        neverReads: ["source", "stageId", "notes", "activity", "daysInStage"],
        // A sales KPI on a delivery screen is noise that has to be learned and
        // then ignored.
        sidebarStat: "none",
        // To a developer, a lead IS the project.
        leadRoute: devConfig.routes.project,
    },
    client: {
        id: "client",
        home: portalConfig.routes.home,
        badge: portalConfig.content.identity.roleBadge,
        purpose: "Sees their own project: progress, previews, the live link, files, invoices.",
        // A client writes nothing today. When they do — approving a preview,
        // uploading a brief — add it here first and build it second.
        writes: NOTHING,
        neverReads: [
            "source", "stageId", "notes", "activity", "daysInStage",
            "createdDaysAgo", "assignedRepId (beyond the rep's name and email)",
        ],
        // The agency's own performance data, in the sidebar of a screen a paying
        // customer opens. Never.
        sidebarStat: "none",
        // A client has exactly one project and reaches it from the session, never
        // by id. Anything else here would be a URL worth trying.
        leadRoute: () => portalConfig.routes.home,
    },
};
/** Every role, in the order they appear through a project's life. */
export const allRoles = ["admin", "sales", "dev", "client"];
/**
 * Where a role belongs after signing in.
 *
 * Falls back to the admin console for an unrecognised role rather than
 * throwing: a stale cookie from an older build should land somewhere real, not
 * white-screen the app.
 */
export function homeForRole(role) {
    return roleDefinitions[role]?.home ?? roleDefinitions.admin.home;
}
/** Whether a string is a role this build knows about. Used when parsing the
 *  session cookie, where the value is whatever the browser happened to send. */
export function isRole(value) {
    return typeof value === "string" && value in roleDefinitions;
}
