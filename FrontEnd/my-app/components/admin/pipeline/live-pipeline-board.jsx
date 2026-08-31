"use client";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { toast } from "sonner";
import { Columns2 } from "lucide-react";
import { LiveLeadCard } from "@/components/admin/pipeline/live-lead-card";
import { LiveStageColumn } from "@/components/admin/pipeline/live-stage-column";
import { LostReasonDialog } from "@/components/admin/pipeline/lost-reason-dialog";
import { PipelineFilters } from "@/components/admin/pipeline/pipeline-filters";
import { LeadDetailsDialog } from "@/components/console/lead-details-dialog";
import { EmptyState } from "@/components/deck/empty-state";
import { Panel } from "@/components/deck/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { LIVE_STAGES } from "@/config/pipeline-live";
import { api } from "@/lib/axios";
import { getErrorMessage } from "@/lib/get-error-message";

// The real pipeline board — same drag/drop mechanics as the mock
// components/admin/pipeline/pipeline-board.jsx (dnd-kit, closestCorners,
// isOver resolved by the board rather than per-column useDroppable().isOver),
// data and mutation swapped for the real API. Shared by BOTH /admin/pipeline
// and /rep/pipeline — `mine` (rep only) asks LeadController::index() for
// just `assigned_sales_id = you` via `?mine=1`; admin (and every other real
// leads list — Clients, Reports, the dashboard) stays on the plain
// unscoped GET /api/leads. Kept on its OWN query key (["leads","mine"])
// rather than the shared ["leads"] one so a rep's private-queue fetch can
// never collide with the everyone-sees-this cache every other screen reads.
export function LivePipelineBoard({
  mine = false,
  emptyTitle = "No leads yet",
  emptyDescription = "Leads submitted from the site will show up here.",
} = {}) {
  const queryClient = useQueryClient();
  const queryKey = mine ? ["leads", "mine"] : ["leads"];

  const {
    data: leads = [],
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => (await api.get("/api/leads", mine ? { params: { mine: 1 } } : undefined)).data,
  });

  useEffect(() => {
    if (isError) toast.error(getErrorMessage(error));
  }, [isError, error]);

  const [track, setTrack] = useState("all");
  const [productType, setProductType] = useState("all");
  const [activeId, setActiveId] = useState(null);
  const [overStageId, setOverStageId] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [lostTarget, setLostTarget] = useState(null);

  const filtered = useMemo(() => {
    return leads.filter((lead) => {
      if (track !== "all" && lead.track !== track) return false;
      if (productType !== "all" && lead.product_type !== productType) return false;
      return true;
    });
  }, [leads, track, productType]);

  const moveMutation = useMutation({
    mutationFn: async ({ leadId, stage, lostReason }) =>
      (
        await api.patch(`/api/leads/${leadId}/stage`, {
          stage,
          ...(lostReason ? { lost_reason: lostReason } : {}),
        })
      ).data,
    onMutate: async ({ leadId, stage }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old) =>
        old?.map((l) => (l.id === leadId ? { ...l, stage } : l)) ?? old,
      );
      return { previous };
    },
    onError: (mutationError, variables, context) => {
      // Revert — the optimistic move didn't actually happen backend-side.
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast.error(getErrorMessage(mutationError));
    },
    onSettled: () => {
      // Both keys: this board's own cache, and the plain ["leads"] every
      // other real screen (admin board, Clients, Reports) reads — a stage
      // move should invalidate whichever of the two it didn't already hit.
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads", "mine"] });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const leadOf = (id) => (id ? filtered.find((l) => l.id === id) : undefined);

  function resolveStageId(overId) {
    if (LIVE_STAGES.some((s) => s.id === overId)) return overId;
    return filtered.find((l) => l.id === overId)?.stage ?? overId;
  }

  function handleDragStart(event) {
    const id = Number(event.active.id);
    setActiveId(id);
    setOverStageId(leadOf(id)?.stage ?? null);
  }

  function handleDragOver(event) {
    const { over } = event;
    setOverStageId(over ? resolveStageId(over.id) : null);
  }

  function clearDrag() {
    setActiveId(null);
    setOverStageId(null);
  }

  function handleDragEnd(event) {
    clearDrag();
    const { active, over } = event;
    if (!over) return;

    const lead = leadOf(Number(active.id));
    if (!lead) return;

    const targetStage = resolveStageId(over.id);
    if (targetStage === lead.stage) return;

    // Lost needs a reason before anything is sent — see LostReasonDialog.
    if (targetStage === "lost") {
      setLostTarget(lead);
      return;
    }

    moveMutation.mutate({ leadId: lead.id, stage: targetStage });
  }

  const columns = LIVE_STAGES.map((stage) => ({
    stage,
    leads: filtered.filter((lead) => lead.stage === stage.id),
  }));
  const activeLead = leadOf(activeId);

  if (isPending) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[24rem] min-w-[15rem] flex-1 rounded-md" />
        ))}
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <Panel>
        <EmptyState icon={Columns2} title={emptyTitle} description={emptyDescription} />
      </Panel>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PipelineFilters
        track={track}
        onTrackChange={setTrack}
        productType={productType}
        onProductTypeChange={setProductType}
      />

      <DndContext
        id="live-pipeline-board"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={clearDrag}
      >
        <div className="deck-scroll -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
          {columns.map((column) => (
            <LiveStageColumn
              key={column.stage.id}
              stage={column.stage}
              leads={column.leads}
              activeId={activeId}
              isOver={overStageId === column.stage.id}
              activeLead={activeLead}
              onOpenDetails={setSelectedLead}
              dimmed={column.stage.isLost}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeLead ? <LiveLeadCard lead={activeLead} overlay /> : null}
        </DragOverlay>
      </DndContext>

      <LeadDetailsDialog
        lead={selectedLead}
        open={selectedLead !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedLead(null);
        }}
      />

      <LostReasonDialog
        lead={lostTarget}
        open={lostTarget !== null}
        pending={moveMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setLostTarget(null);
        }}
        onConfirm={(reason) => {
          moveMutation.mutate(
            { leadId: lostTarget.id, stage: "lost", lostReason: reason },
            {
              onSuccess: () => {
                toast.success(`${lostTarget.full_name} moved to Lost`);
                setLostTarget(null);
              },
            },
          );
        }}
      />
    </div>
  );
}
