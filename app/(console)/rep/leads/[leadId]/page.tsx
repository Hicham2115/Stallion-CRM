import type { Metadata } from "next";

import { RepLeadView } from "./lead-view";

export const metadata: Metadata = { title: "Lead" };

/**
 * /rep/leads/[leadId]
 *
 * NEXT 16 MAKES `params` A PROMISE, so this component is async and awaits it.
 * `PageProps<'/rep/leads/[leadId]'>` is generated from the route literal during
 * `next dev` / `next build`, which is what makes `leadId` a typed key.
 *
 * TODO(backend): fetch the lead here, scoped to the session's rep, and call
 * notFound() server-side when it does not resolve. That returns a real 404
 * status, which the client-side check in the view cannot do — and it is also
 * where the ownership check stops being cosmetic.
 */
export default async function RepLeadPage({
  params,
}: PageProps<"/rep/leads/[leadId]">) {
  const { leadId } = await params;

  return <RepLeadView leadId={leadId} />;
}
