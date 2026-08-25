import type { Metadata } from "next";

import { RepDashboardView } from "./dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your own dials, appointments and pipeline at Stallion Advertising.",
};

/**
 * /rep — the sales rep's home.
 *
 * A thin Server Component: the records live in the browser store today, so the
 * view beside this file does the work. The route is already guarded by
 * app/(console)/rep/layout.tsx.
 *
 * TODO(backend): fetch this rep's leads HERE, on the server, filtered by the
 * session's rep id — never by a query param. `selectRepKpis()` in
 * lib/store/selectors.ts documents every figure the API would need to return.
 */
export default function RepDashboardPage() {
  return <RepDashboardView />;
}
