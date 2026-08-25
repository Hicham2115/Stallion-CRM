"use client";
import { useSyncExternalStore } from "react";
// Today's date, but `undefined` on the server and first client render — not
// `new Date()` directly, because comparing a stored date to the clock is a
// hydration mismatch waiting to happen (server renders at 23:59:58, client
// hydrates at 00:00:01, "due" flips to "overdue", markup disagrees). Every
// consumer treats `undefined` as "nothing is late yet" for one frame.
//
// Uses useSyncExternalStore rather than useState+useEffect so React reads
// the server snapshot during SSR/hydration and the client snapshot after,
// with no extra render pass. getSnapshot must return a stable reference
// (compared with Object.is) or it would loop, hence the cache — and it never
// re-publishes, so the date is captured once per session and won't tick over
// if a tab is left open past midnight.
let cachedToday;
function subscribe() {
    return () => { };
}
function getSnapshot() {
    cachedToday ?? (cachedToday = new Date());
    return cachedToday;
}
function getServerSnapshot() {
    return undefined;
}
export function useToday() {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
