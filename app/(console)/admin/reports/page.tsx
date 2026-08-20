import type { Metadata } from "next";

import { ReportsView } from "./reports-view";

export const metadata: Metadata = {
  title: "Reports",
  description:
    "Performance across sources, stages and reps for the Stallion Advertising sales team.",
};

/**
 * /admin/reports
 *
 * A Server Component that owns nothing but the metadata. Every figure on this
 * screen derives from the CRM store, which lives in the browser, so the work
 * happens in the client view beside this file.
 *
 * TODO(backend): once the API is live this page should take the range from
 * `searchParams`, fetch on the server and pass the figures down — which also
 * makes a report URL shareable. See the note in reports-view.tsx.
 *
 * The page heading comes from config/navigation.ts via the topbar, which is why
 * there is no <h1> here.
 */
export default function ReportsPage() {
  return <ReportsView />;
}
