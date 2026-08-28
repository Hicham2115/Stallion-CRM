"use client";
import { LivePipelineBoard } from "@/components/admin/pipeline/live-pipeline-board";
import { PageShell } from "@/components/console/page-shell";
import { repConfig } from "@/config/rep";

// The exact same real pipeline as /admin/pipeline (GET /api/leads, real
// drag-and-drop, real 10-stage Lead::STAGES) — not a second implementation,
// and not scoped to `mine` either: every lead the company has, converted or
// not, same as admin sees. Each role just gets its own workspace around the
// same shared board.
export function RepPipelineView() {
  return (
    <PageShell>
      <LivePipelineBoard
        emptyTitle={repConfig.content.pipeline.emptyTitle}
        emptyDescription={repConfig.content.pipeline.emptyDescription}
      />
    </PageShell>
  );
}
