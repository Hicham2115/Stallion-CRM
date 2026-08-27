/**
 * ============================================================================
 *  LOCAL PERSISTENCE
 * ============================================================================
 *  Keeps the mock console state in localStorage so changes survive a refresh
 *  and the app can be demoed properly.
 *
 *  DELETE THIS FILE once the API is live — persistence becomes the server's
 *  job, and leaving a stale local cache in place would silently shadow real
 *  data.
 * ============================================================================
 */
/**
 * Bump this whenever the shape of CrmState changes.
 *
 * The version is part of the storage key, so an old payload is simply never
 * read — the app falls back to a fresh seed instead of crashing on a record
 * that is missing a field it now expects. Without this, every teammate who had
 * the app open before your change gets a white screen after pulling.
 *
 * v1 -> v2: `Lead` gained `createdDaysAgo`, which the Reports date range reads
 * on every lead. A v1 payload has no such field, so every lead would have read
 * as `undefined` days old and fallen out of every range — Reports would have
 * rendered permanently empty for anyone who had the console open before this
 * change, with nothing on screen to explain why.
 *
 * v2 -> v3: `Lead` gained the four client-visible project fields
 * (`projectSummary`, `previews`, `liveUrl`, `updates`) that the client portal
 * renders, and the milestone seed changed so a project can actually reach
 * 100%. A v2 payload carries none of them, so every portal screen would have
 * read `lead.previews.length` off `undefined` and thrown — the client would
 * have met an error boundary on their own project page.
 *
 * v3 -> v4: `Milestone` gained `targetDate`, and screenshots dropped in the
 * dev workspace are now stored as data URLs on `Lead.previews[].imageUrl`. A
 * v3 payload has no `targetDate`, which the date control would have read as
 * `undefined` and rendered as an empty input that silently discards the value
 * on first edit.
 *
 * v4 -> v5: `Rep` gained `dialsToday`, which is the headline figure on the rep
 * workspace dashboard and in their sidebar. A v4 payload has no such field, so
 * every rep would have opened their own dashboard to "NaN dials" — the one
 * number on the screen they are measured on.
 */
export const STORE_VERSION = 5;
const STORAGE_KEY = `stallion-crm:state:v${STORE_VERSION}`;
/**
 * Read the saved state, or null if there is nothing usable.
 *
 * Everything is wrapped, because localStorage throws rather than returning
 * null in several real situations: Safari private browsing, a full quota, and
 * blocked third-party storage. A corrupt payload is treated the same way as no
 * payload — fall back to the seed rather than take the app down.
 */
export function readPersistedState() {
    if (typeof window === "undefined")
        return null;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw)
            return null;
        const parsed = JSON.parse(raw);
        // Cheap shape check. Enough to catch a truncated write or a hand-edited
        // value without pretending to be a schema validator.
        if (!parsed || !Array.isArray(parsed.leads) || !Array.isArray(parsed.reps)) {
            return null;
        }
        return parsed;
    }
    catch (_a) {
        return null;
    }
}
/**
 * Save the state. Never throws — throwing here would break the UI over a
 * storage problem the user can do nothing about mid-render.
 *
 * IT REPORTS FAILURE NOW, THOUGH. This used to swallow the error entirely,
 * which was fine while the store held only text: a full quota was unlikely and
 * the cost of missing it was small. Since the dev workspace can store
 * screenshots (as downscaled data URLs — see lib/image-upload.ts) a
 * QuotaExceededError is a REALISTIC outcome, and swallowing it produces the
 * worst possible failure: the console keeps working perfectly on screen and
 * quietly stops saving, so every change since is lost on refresh with nothing
 * anywhere to explain why.
 *
 * The caller (CrmProvider) turns `false` into a visible warning once.
 *
 * @returns true if the state was written.
 */
export function writePersistedState(state) {
    if (typeof window === "undefined")
        return false;
    try {
        // `hydrated` is a runtime flag, not data — persisting it would restore a
        // state that claims to already be hydrated before the effect has run.
        const persistable = {
            currentUser: state.currentUser,
            reps: state.reps,
            leads: state.leads,
            threads: state.threads,
            stageOrder: state.stageOrder,
            teamDialsHistory: state.teamDialsHistory,
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
        return true;
    }
    catch (error) {
        // Quota exceeded, or storage blocked (Safari private browsing, a locked-
        // down profile). The console goes to the developer; the caller is
        // responsible for telling the person looking at the screen.
        console.warn("[persistence] could not save console state", error);
        return false;
    }
}
/** Wipe the saved state — what "Reset demo data" calls before reseeding. */
export function clearPersistedState() {
    if (typeof window === "undefined")
        return;
    try {
        window.localStorage.removeItem(STORAGE_KEY);
    }
    catch (_a) {
        // Ignore, same reasoning as above.
    }
}
