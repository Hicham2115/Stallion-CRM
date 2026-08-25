"use client";

import { useSyncExternalStore } from "react";

/**
 * ============================================================================
 *  TODAY, SAFELY
 * ============================================================================
 *  Today's date — but `undefined` on the server and on the first client render,
 *  and only real once React has committed.
 *
 *  ──────────────────────────────────────────────────────────────────────────
 *  WHY IT IS NOT JUST `new Date()`
 *  ──────────────────────────────────────────────────────────────────────────
 *  Anything that compares a stored date to the clock is a hydration mismatch
 *  waiting for the right moment: the server renders at 23:59:58, the client
 *  hydrates at 00:00:01, a target date flips from "due" to "overdue", and React
 *  reports that the markup does not match. It happens once a day to a fraction
 *  of users — frequent enough to be reported, rare enough to be
 *  unreproducible.
 *
 *  Returning `undefined` first means the overdue treatment is simply absent for
 *  one frame, and every consumer is written to accept that (see `countOverdue`
 *  in lib/store/selectors.ts). "Nothing is late" is a safe thing to show for
 *  16ms; a number that might be wrong is not.
 *
 *  ──────────────────────────────────────────────────────────────────────────
 *  WHY useSyncExternalStore AND NOT useState + useEffect
 *  ──────────────────────────────────────────────────────────────────────────
 *  The obvious version is `useState(undefined)` plus an effect that sets the
 *  date on mount. It works, but it is a setState in an effect body purely to
 *  say "the server and the client disagree here" — which is precisely the
 *  problem this hook exists for, and precisely what
 *  `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)` is built
 *  to express. React reads the server snapshot while rendering on the server
 *  and during hydration, then the client snapshot afterwards, with no extra
 *  render pass and no lint rule to argue with.
 *
 *  THE SNAPSHOT MUST BE STABLE. `getSnapshot` is called on every render and its
 *  result compared with `Object.is`; returning a fresh `new Date()` each time
 *  would be a new object every render and an infinite loop. Hence the cache.
 *
 *  IT DOES NOT TICK. `subscribe` never fires, so the value is captured once. A
 *  console left open overnight calls yesterday "today" until it is reloaded —
 *  a trade nobody has ever noticed, and cheaper than a timer running on every
 *  page for the sake of a date label.
 * ============================================================================
 */

/** Captured once per browser session. See THE SNAPSHOT MUST BE STABLE above. */
let cachedToday: Date | undefined;

/** No subscription: nothing re-publishes "today" while the tab is open. */
function subscribe(): () => void {
  return () => {};
}

function getSnapshot(): Date | undefined {
  cachedToday ??= new Date();
  return cachedToday;
}

/** The server has no "today" it can safely commit to. */
function getServerSnapshot(): Date | undefined {
  return undefined;
}

export function useToday(): Date | undefined {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
