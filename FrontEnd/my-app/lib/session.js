/**
 * SESSION BOUNDARY
 *
 *  Who is signed in, and therefore which half of the app they get.
 *
 *  Two pieces, two storage mechanisms, on purpose:
 *   - role      → a cookie. app/(console)/*\/layout.tsx read it on the
 *                 server via lib/session-server.ts, before the first byte of
 *                 HTML — a Server Component can't read localStorage.
 *   - token     → the Zustand store in lib/store/auth-store.ts, persisted to
 *                 localStorage. Only ever read client-side, by lib/axios.ts,
 *                 to authorize API calls.
 *
 *  THIS IS NOT SECURITY. Anyone can edit the cookie or localStorage from
 *  devtools. Every route under app/(console)/ must be authorised again on
 *  the server by the real backend, and every API response must be filtered
 *  to what that user is allowed to see. Hiding a nav item hides a nav item.
 *
 *  A hardened version moves both behind an httpOnly cookie set by a
 *  server-side route, so neither is readable from the page's own scripts.
 *
 *  This file is isomorphic on purpose: it imports nothing from `next/headers`,
 *  so a Client Component can import the types and the cookie name from it. The
 *  server-only read lives next door in lib/session-server.ts.
 */
import { portalConfig } from "@/config/portal";
import { repConfig } from "@/config/rep";
import { homeForRole, isRole } from "@/config/roles";
import { useAuthStore } from "@/lib/store/auth-store";
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
const backendUrl = process.env.NEXT_PUBLIC_LARAVEL_API_URL || "http://localhost:8000";
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
/**
 * NOT SECURITY — same caveat as the rest of this file. Anyone can read the
 * role cookie or the token in localStorage from devtools; the token
 * authorises API calls, it does not protect them.
 */
/**
 * Forget it again — what Log Out calls.
 *
 * Revokes the token on the server first (so it can't be replayed), then
 * clears it from the store and clears every session cookie. Without the
 * clear, signing out and back in as another role would land you in the half
 * of the app you just left.
 */
export async function endSession() {
    const token = useAuthStore.getState().token;
    if (token) {
        await fetch(`${backendUrl}/api/logout`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        }).catch(() => {});
    }
    useAuthStore.getState().clearToken();
    if (typeof document === "undefined")
        return;
    for (const name of [SESSION_ROLE_COOKIE, SESSION_CLIENT_COOKIE, SESSION_REP_COOKIE]) {
        document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
    }
}
