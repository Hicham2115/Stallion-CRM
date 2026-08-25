import type { Metadata } from "next";

import { ProjectsView } from "./projects-view";

export const metadata: Metadata = {
  title: "Projects",
};

/**
 * /dev — the dev workspace home.
 *
 * A thin Server Component: the records live in the browser store today, so the
 * view beside this file does the work. The route is already guarded by
 * app/(console)/dev/layout.tsx, so there is no check to repeat here.
 *
 * TODO(backend): fetch the projects HERE, on the server, filtered to what this
 * developer is allowed to see. Today the workspace shows every client, which
 * is right for a four-person agency and wrong the moment there are contractors
 * — at which point add an assignment and filter on it server-side, not in the
 * component.
 */
export default function DevProjectsPage() {
  return <ProjectsView />;
}
