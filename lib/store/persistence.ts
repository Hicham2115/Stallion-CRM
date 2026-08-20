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

import type { CrmState } from "@/lib/types";

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
 */
export const STORE_VERSION = 2;

const STORAGE_KEY = `stallion-crm:state:v${STORE_VERSION}`;

/** Fields that are recomputed at boot and must never be restored from disk. */
type PersistedState = Omit<CrmState, "hydrated">;

/**
 * Read the saved state, or null if there is nothing usable.
 *
 * Everything is wrapped, because localStorage throws rather than returning
 * null in several real situations: Safari private browsing, a full quota, and
 * blocked third-party storage. A corrupt payload is treated the same way as no
 * payload — fall back to the seed rather than take the app down.
 */
export function readPersistedState(): PersistedState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as PersistedState;

    // Cheap shape check. Enough to catch a truncated write or a hand-edited
    // value without pretending to be a schema validator.
    if (!parsed || !Array.isArray(parsed.leads) || !Array.isArray(parsed.reps)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/** Save the state. Silently gives up if storage is unavailable or full —
 *  losing persistence is an inconvenience, throwing here would break the UI. */
export function writePersistedState(state: CrmState): void {
  if (typeof window === "undefined") return;

  try {
    // `hydrated` is a runtime flag, not data — persisting it would restore a
    // state that claims to already be hydrated before the effect has run.
    const persistable: PersistedState = {
      currentUser: state.currentUser,
      reps: state.reps,
      leads: state.leads,
      threads: state.threads,
      stageOrder: state.stageOrder,
      teamDialsHistory: state.teamDialsHistory,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
  } catch {
    // Quota exceeded or storage blocked. Nothing useful to do about it.
  }
}

/** Wipe the saved state — what "Reset demo data" calls before reseeding. */
export function clearPersistedState(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore, same reasoning as above.
  }
}
