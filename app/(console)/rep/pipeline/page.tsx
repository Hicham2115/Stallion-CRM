import type { Metadata } from "next";

import { RepPipelineView } from "./pipeline-view";

export const metadata: Metadata = { title: "My Pipeline" };

/** /rep/pipeline — see app/(console)/rep/page.tsx for the pattern. */
export default function RepPipelinePage() {
  return <RepPipelineView />;
}
