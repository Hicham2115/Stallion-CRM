"use client";

import { useState } from "react";
import { ArrowRight, LoaderCircle, PhoneCall, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Panel } from "@/components/deck/panel";
import { SourceBadge } from "@/components/deck/source-badge";
import { StatusDot } from "@/components/deck/status-dot";
import { Button } from "@/components/ui/button";
import { clientsConfig } from "@/config/clients";
import { leadConfig } from "@/config/lead";
import { findStage, pipelineConfig, stageColor } from "@/config/pipeline";
import { formatDaysAgo, formatDaysInStage, initialsOf, template } from "@/lib/format";
import { useCrm } from "@/lib/store/crm-store";
import { isStale } from "@/lib/store/selectors";
import type { Lead } from "@/lib/types";

const { content, features } = leadConfig;

/**
 * The lead's identity, status and primary actions.
 *
 * THE BUG THIS FIXES. The prototype showed a stage pill reading "Client" and,
 * directly beside it, a button offering to "Convert to Client" — an action
 * whose only possible effect was to move the record to the stage it was
 * already in. The button is now hidden once the lead is in the won stage,
 * derived from `isWon` in config/pipeline.ts rather than a string comparison,
 * so renaming the stage in Settings cannot bring the bug back.
 */
export function LeadHeader({ lead }: { lead: Lead }) {
  const { state, actions } = useCrm();
  const [converting, setConverting] = useState(false);
  const [logging, setLogging] = useState(false);

  const stage = findStage(pipelineConfig.stages, lead.stageId);
  const rep = state.reps.find((entry) => entry.id === lead.assignedRepId);

  // Derived from the stage flag, never from `stageId === "client"`.
  const isClient = Boolean(stage?.isWon);
  const stale = isStale(lead, clientsConfig.staleAfterDays);

  async function handleConvert() {
    setConverting(true);
    const result = await actions.moveLead(lead, pipelineConfig.wonStageId);
    if (result.ok) {
      toast.success(template(content.convertToast, { name: lead.name }));
    }
    setConverting(false);
  }

  async function handleLogCall() {
    setLogging(true);
    const result = await actions.logCall(lead.id);
    if (result.ok) toast.success(content.logCallToast);
    setLogging(false);
  }

  return (
    <Panel ticks className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* -------------------------------------------------------------- */}
        {/* Identity                                                        */}
        {/* -------------------------------------------------------------- */}
        <div className="flex min-w-0 items-start gap-4">
          <span
            aria-hidden
            className="grid size-12 shrink-0 place-items-center rounded-full bg-brand/15 font-mono text-[0.875rem] font-medium text-brand"
          >
            {initialsOf(lead.name)}
          </span>

          <div className="min-w-0">
            <h2 className="truncate font-display text-[1.375rem] font-semibold tracking-[-0.03em] text-ink">
              {lead.name}
            </h2>
            <p className="mt-0.5 truncate text-[0.875rem] text-ink-muted">
              {lead.company}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {/* Stage. The dot is decoration — the label carries it. */}
              <span className="inline-flex items-center gap-2 rounded-full border border-hairline bg-white/[0.04] px-2.5 py-0.5 text-[0.75rem] text-ink-soft">
                <StatusDot color={stage ? stageColor(stage) : undefined} />
                {stage?.label ?? lead.stageId}
              </span>

              <SourceBadge source={lead.source} />

              <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-muted">
                {content.createdLabel} {formatDaysAgo(lead.createdDaysAgo)}
              </span>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* Actions                                                         */}
        {/* -------------------------------------------------------------- */}
        {features.quickActions && (
          <div className="flex flex-wrap items-center gap-2" data-print="hide">
            <Button
              variant="outline"
              size="lg"
              disabled={logging}
              onClick={handleLogCall}
              className="h-10 rounded-xl"
            >
              {logging ? (
                <LoaderCircle aria-hidden className="deck-spin size-4" />
              ) : (
                <PhoneCall aria-hidden />
              )}
              {content.logCallLabel}
            </Button>

            {/* Hidden once won. See the note at the top of this file. */}
            {!isClient && (
              <Button
                size="lg"
                disabled={converting}
                onClick={handleConvert}
                className="h-10 rounded-xl font-semibold"
              >
                {converting ? (
                  <>
                    <LoaderCircle aria-hidden className="deck-spin size-4" />
                    {content.convertPendingLabel}
                  </>
                ) : (
                  <>
                    {content.convertLabel}
                    <ArrowRight aria-hidden />
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Stage age — amber only when it is actually a problem              */}
      {/* ---------------------------------------------------------------- */}
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-hairline pt-4">
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-muted">
          {content.assignedLabel}{" "}
          <span className="text-ink-soft">
            {rep?.name ?? content.unassignedLabel}
          </span>
        </span>

        <span
          className={`inline-flex items-center gap-1.5 font-mono text-[0.625rem] uppercase tracking-[0.14em] ${
            stale ? "text-[var(--status-warning)]" : "text-ink-muted"
          }`}
        >
          {stale && <TriangleAlert aria-hidden className="size-3" />}
          {formatDaysInStage(lead.daysInStage)}
        </span>

        {stale && (
          <span className="text-[0.75rem] text-[var(--status-warning)]">
            {content.staleWarning}
          </span>
        )}
      </div>
    </Panel>
  );
}
