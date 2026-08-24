import type { Metadata } from "next";

import { DevProjectView } from "./project-view";

export const metadata: Metadata = {
  title: "Project",
};

/**
 * /dev/[leadId]
 *
 * NEXT 16 MAKES `params` A PROMISE. Reading `params.leadId` synchronously —
 * which worked in 14 — is gone, so this component is async and awaits it.
 * `PageProps<'/dev/[leadId]'>` is generated from the route literal during
 * `next dev` / `next build`, which is what makes `leadId` a typed key rather
 * than a string index.
 *
 * The record itself lives in the browser store, so the view beside this file
 * does the work.
 *
 * TODO(backend): fetch the project here and call notFound() server-side on a
 * 404 — that returns a real 404 status, which the client-side check in the
 * view cannot do (the response has already begun streaming as a 200 by the
 * time it runs).
 */
export default async function DevProjectPage({
  params,
}: PageProps<"/dev/[leadId]">) {
  const { leadId } = await params;

  return <DevProjectView leadId={leadId} />;
}
