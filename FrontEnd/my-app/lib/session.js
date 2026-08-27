/**
 * SESSION BOUNDARY — BACKEND DEVELOPERS: READ THIS BEFORE THE PORTAL
 *
 *  Who is signed in, and therefore which half of the app they get.
 *
 *  Today there is no backend, so "who is signed in" is a COOKIE the login
 *  screen writes and the layouts read. That is deliberately the same shape a
 *  real session has — a value on the request, read on the server, available
 *  before the first byte of HTML — so replacing it is a change to two
 *  functions rather than a change to every screen.
 *
 *  THIS IS NOT SECURITY. It is a display switch.
 *  Anyone can edit a cookie in devtools and land in /admin. Every
 *  route under app/(console)/ must be authorised again on the server
 *  by the real backend, and every API response must be filtered to
 *  what that user is allowed to see. Hiding a nav item hides a nav
 *  item.
 *
 *  WHAT TO REPLACE WHEN THE BACKEND LANDS
 *    1. lib/session-server.ts  → readSession() reads your real session
 *       (NextAuth's `auth()`, a Supabase helper, your own signed cookie)
 *       instead of this unsigned one.
 *    2. This file             → delete `writePreviewSession` /
 *       `clearPreviewSession`. A session cookie must be set SERVER-side as
 *       httpOnly + secure + sameSite, which is exactly what a browser-writable
 *       cookie is not.
 *    3. lib/auth.ts           → AUTH_BACKEND_CONNECTED = true, which removes
 *       the role switch from the login card on its own.
 *
 *  This file is isomorphic on purpose: it imports nothing from `next/headers`,
 *  so a Client Component can import the types and the cookie name from it. The
 *  server-only read lives next door in lib/session-server.ts.
 */
import { portalConfig } from "@/config/portal";
import { repConfig } from "@/config/rep";
import { homeForRole, isRole } from "@/config/roles";
/**
 * The cookie the preview build uses to remember the chosen role.
 *
 * Named with the same `stallion-` prefix as the sidebar-collapse cookie so the
 * app's cookies are recognisable as a set in devtools.
 */
export const SESSION_ROLE_COOKIE = "stallion-role";
/**
 * Optional companion cookie naming which demo client is signed in.
 *
 * Absent almost always: `portalConfig.demo.leadId` is the answer, and this
 * exists so a future "view as this client" control has somewhere to write
 * without a second mechanism being invented for it.
 */
export const SESSION_CLIENT_COOKIE = "stallion-client";
/**
 * The same idea for the rep workspace: which of the eight reps to sign in as.
 *
 * Absent almost always — `repConfig.demo.repId` is the answer. It exists so a
 * future "view as this rep" control has somewhere to write.
 */
export const SESSION_REP_COOKIE = "stallion-rep";
/** One year. It is a preview convenience, not a credential. */
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
/**
 * The session a request gets when it carries no cookies at all.
 *
 * Admin, because that is the only fully built surface and because a visitor
 * with no session should land somewhere that explains the product. The moment
 * real auth exists this becomes "no session", and the layouts send them to
 * /login instead.
 */
export const ANONYMOUS_SESSION = {
    role: "admin",
    clientLeadId: portalConfig.demo.leadId,
    repId: repConfig.demo.repId,
};
/**
 * Turn raw cookie values into a Session.
 *
 * Pure, so it can be unit-tested and so both the server read and any future
 * client read produce the same result from the same input. An unrecognised
 * role falls back to the anonymous session rather than throwing: a stale
 * cookie from an older build should log someone out, not white-screen them.
 */
export function parseSession(roleValue, clientValue, repValue) {
    return {
        role: isRole(roleValue) ? roleValue : ANONYMOUS_SESSION.role,
        clientLeadId: clientValue?.trim() || portalConfig.demo.leadId,
        repId: repValue?.trim() || repConfig.demo.repId,
    };
}
/**
 * Where a role belongs after signing in.
 *
 * One lookup for the whole app, so "clients land on /portal" is stated once in
 * config/roles.ts rather than repeated in the login form, the three route
 * guards and the sidebar logo link.
 */
export function homeFor(role) {
    return homeForRole(role);
}
/* PREVIEW-ONLY WRITES
   DELETE THIS SECTION WITH THE PREVIEW BUILD. A real session cookie is set by
   the server with httpOnly, which is precisely what makes it unreadable and
   unwritable from here. */
/**
 * Remember the role chosen on the login card.
 *
 * Browser only — it writes `document.cookie`, so it must be called from an
 * event handler, never during render.
 */
export function writePreviewSession(role, identity) {
    if (typeof document === "undefined")
        return;
    document.cookie = `${SESSION_ROLE_COOKIE}=${role}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
    if (identity?.clientLeadId) {
        document.cookie = `${SESSION_CLIENT_COOKIE}=${identity.clientLeadId}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
    }
    if (identity?.repId) {
        document.cookie = `${SESSION_REP_COOKIE}=${identity.repId}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
    }
}
/**
 * Forget it again — what Log Out calls.
 *
 * Without this, signing out and back in as the other role would land you in
 * the half of the app you just left, and the only way out would be clearing
 * site data by hand.
 */
export function clearPreviewSession() {
    if (typeof document === "undefined")
        return;
    for (const name of [
        SESSION_ROLE_COOKIE,
        SESSION_CLIENT_COOKIE,
        SESSION_REP_COOKIE,
    ]) {
        document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
    }
}
