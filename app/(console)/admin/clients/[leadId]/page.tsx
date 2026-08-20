import type { Metadata } from "next";

import { LeadDetailView } from "./lead-detail-view";

export const metadata: Metadata = {
  title: "Lead detail",
};

/**
 * /admin/clients/[leadId]
 *
 * NEXT 16 MAKES `params` A PROMISE. Reading `params.leadId` synchronously —
 * which worked in 14 — is gone, so this component is async and awaits it.
 * `PageProps<'/admin/clients/[leadId]'>` is generated from the route literal
 * during `next dev` / `next build`, which is what makes `leadId` a typed key
 * rather than a string index.
 *
 * The record itself lives in the browser store, so the view beside this file
 * does the work.
 *
 * TODO(backend): once the API is live, fetch the lead here and call notFound()
 * server-side on a 404 — that returns a real 404 status, which the client-side
 * check in the view cannot do (the response has already begun streaming as a
 * 200 by the time it runs).
 */
export default async function LeadDetailPage({
  params,
}: PageProps<"/admin/clients/[leadId]">) {
  const { leadId } = await params;

  return <LeadDetailView leadId={leadId} />;
}
