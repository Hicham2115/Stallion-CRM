"use client";

import { useState } from "react";
import { Columns2, Columns3, Filter } from "lucide-react";

import { FunnelView } from "@/components/admin/pipeline/funnel-view";
import { PipelineBoard } from "@/components/admin/pipeline/pipeline-board";
import { PageShell } from "@/components/console/page-shell";
import { EmptyState } from "@/components/deck/empty-state";
import { Panel } from "@/components/deck/panel";
import { SegmentedControl } from "@/components/deck/segmented-control";
import { RepMissing, RepSkeleton } from "@/components/rep/rep-states";
import { useRepScope } from "@/components/rep/use-rep-scope";
import { boardConfig, type BoardView } from "@/config/board";
import { repConfig } from "@/config/rep";

const { content, features } = repConfig;

/**
 * ============================================================================
 *  /rep/pipeline — MY PIPELINE
 * ============================================================================
 *  The agency board, showing only this rep's leads.
 *
 *  ─────────────────────────────────────────────────────────────────────────
 *  IT IS LITERALLY THE ADMIN'S BOARD
 *  ─────────────────────────────────────────────────────────────────────────
 *  Same `PipelineBoard`, same `FunnelView`, narrowed by a `leads` prop. Not
 *  merely to save code — though a second kanban with its own drag sensors,
 *  drop targets and keyboard path would be the copy that stops getting fixes —
 *  but because a rep and their manager have to be looking at the same
 *  instrument. If "3 days in stage" or a stale marker meant something
 *  marginally different on the two screens, every pipeline review would start
 *  by working out whose version was right.
 *
 *  A DROP STILL GOES THROUGH THE SAME API. `moveLeadToStage` does not know or
 *  care that a rep triggered it, which is correct here and NOT sufficient
 *  later: the server has to check that the lead being moved belongs to the
 *  person moving it. See the field-ownership table in config/roles.ts.
 *
 *  The view switch is `quiet`-toned because the board itself is the screen's
 *  loudest element, and the active kanban column already spends lime.
 * ============================================================================
 */
export function RepPipelineView() {
  const { leads, loading, rep } = useRepScope();
  const [view, setView] = useState<BoardView>(boardConfig.defaultView);

  if (loading) return <RepSkeleton />;
  if (!rep) return <RepMissing />;

  const empty = leads.length === 0;

  return (
    <PageShell>
      {features.funnelView && !empty && (
        <div className="flex flex-wrap items-center justify-end gap-3">
          <SegmentedControl<BoardView>
            tone="quiet"
            label={boardConfig.content.viewSwitchLabel}
            value={view}
            onValueChange={setView}
            options={[
              {
                value: "kanban",
                label: boardConfig.content.kanbanLabel,
                icon: <Columns3 aria-hidden className="size-3.5" />,
              },
              {
                value: "funnel",
                label: boardConfig.content.funnelLabel,
                icon: <Filter aria-hidden className="size-3.5" />,
              },
            ]}
          />
        </div>
      )}

      {empty ? (
        // Its own copy, not the admin's. "No leads in the system" and "none
        // assigned to you" are different situations with different next steps,
        // and telling a rep the database is empty when it is full of other
        // people's leads would be a strange thing to say.
        <Panel>
          <EmptyState
            icon={Columns2}
            title={content.pipeline.emptyTitle}
            description={content.pipeline.emptyDescription}
          />
        </Panel>
      ) : view === "funnel" && features.funnelView ? (
        <FunnelView leads={leads} />
      ) : (
        <PipelineBoard leads={leads} />
      )}
    </PageShell>
  );
}
