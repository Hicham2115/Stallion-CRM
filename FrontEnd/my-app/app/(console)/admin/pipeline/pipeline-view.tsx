"use client";

import { useState } from "react";
import { Columns3, Filter, Columns2 } from "lucide-react";

import { FunnelView } from "@/components/admin/pipeline/funnel-view";
import { PipelineBoard } from "@/components/admin/pipeline/pipeline-board";
import { EmptyState } from "@/components/deck/empty-state";
import { Panel } from "@/components/deck/panel";
import { SegmentedControl } from "@/components/deck/segmented-control";
import { boardConfig, type BoardView } from "@/config/board";
import { useCrm } from "@/lib/store/crm-store";
import { PageShell } from "@/components/console/page-shell";

const { content, features } = boardConfig;

/**
 * /admin/pipeline — the board.
 *
 * Two views over one dataset: the kanban, where leads are moved, and the
 * funnel, where drop-off is read. Neither is a filter of the other — they
 * answer different questions, which is why this is a view switch and not a
 * toggle that hides columns.
 */
export function PipelineView() {
  const { state } = useCrm();
  const [view, setView] = useState<BoardView>(boardConfig.defaultView);

  const empty = state.leads.length === 0;

  return (
    <PageShell>
      {features.funnelView && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedControl<BoardView>
            label={content.viewSwitchLabel}
            value={view}
            onValueChange={setView}
            options={[
              {
                value: "kanban",
                label: content.kanbanLabel,
                icon: <Columns3 aria-hidden className="size-3.5" />,
              },
              {
                value: "funnel",
                label: content.funnelLabel,
                icon: <Filter aria-hidden className="size-3.5" />,
              },
            ]}
          />
        </div>
      )}

      {empty ? (
        <Panel>
          <EmptyState
            icon={Columns2}
            title={content.emptyBoardTitle}
            description={content.emptyBoardDescription}
          />
        </Panel>
      ) : view === "funnel" && features.funnelView ? (
        <FunnelView />
      ) : (
        <PipelineBoard />
      )}
    </PageShell>
  );
}
