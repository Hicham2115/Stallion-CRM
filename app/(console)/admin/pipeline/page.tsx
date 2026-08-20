import type { Metadata } from "next";

import { PipelineView } from "./pipeline-view";

export const metadata: Metadata = {
  title: "Pipeline",
  description:
    "Drag leads between stages as they move through the Stallion Advertising sales funnel.",
};

/**
 * /admin/pipeline
 *
 * A Server Component owning only the metadata — the board is interactive and
 * reads from the CRM store in the browser.
 *
 * The page heading comes from config/navigation.ts via the topbar.
 */
export default function PipelinePage() {
  return <PipelineView />;
}
