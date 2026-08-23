"use client";

import { useState } from "react";
import { LoaderCircle, PhoneCall } from "lucide-react";
import { toast } from "sonner";

import { Panel } from "@/components/deck/panel";
import { SourceBadge } from "@/components/deck/source-badge";
import { StatusDot } from "@/components/deck/status-dot";
import { WarningChip } from "@/components/deck/warning-chip";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { clientsConfig } from "@/config/clients";
import { findStage, pipelineConfig, stageColor } from "@/config/pipeline";
import { leadConfig } from "@/config/lead";
import { repConfig } from "@/config/rep";
import { formatDaysAgo, formatDaysInStage, template } from "@/lib/format";
import { useCrm } from "@/lib/store/crm-store";
import { isStale } from "@/lib/store/selectors";
import type { Lead } from "@/lib/types";
import { cn } from "@/lib/utils";

const { content, features } = repConfig;

/**
 * ============================================================================
 *  LEAD HEADER  (rep workspace)
 * ============================================================================
 *  Who this lead is, where they are in the funnel, and the one action a rep
 *  takes most: logging a call.
 *
 *  ─────────────────────────────────────────────────────────────────────────
 *  WHY NOT THE ADMIN'S `LeadHeader`
 *  ─────────────────────────────────────────────────────────────────────────
 *  Three of its controls are things a rep must not have: reassigning the lead
 *  to another rep, deleting it, and the rep-picker itself. Passing three
 *  "hide this" props would leave the admin header mostly made of conditionals,
 *  and the remaining shared part — a name, a company and a stage select — is
 *  the cheap half. So this is its own component built from the same deck
 *  primitives, and the two stay visually identical because both take their
 *  stage colours, stale rule and copy from the same config.
 *
 *  ─────────────────────────────────────────────────────────────────────────
 *  THE STALE CHIP IS THE POINT OF THE HEADER
 *  ─────────────────────────────────────────────────────────────────────────
 *  A lead that has not moved in `staleAfterDays` is the single most actionable
 *  thing on a rep's screen, and it is invisible in a list of dates. `isStale()`
 *  is the same rule the kanban card uses, so a card flagged on the board is
 *  flagged here too.
 * ============================================================================
 */
export function RepLeadHeader({ lead }: { lead: Lead }) {
  const { state, actions } = useCrm();
  const [movingStage, setMovingStage] = useState(false);
  const [logging, setLogging] = useState(false);

  const stage = findStage(pipelineConfig.stages, lead.stageId);
  const stale = isStale(lead, clientsConfig.staleAfterDays);

  async function handleStage(stageId: string) {
    if (stageId === lead.stageId) return;

    setMovingStage(true);
    const result = await actions.moveLead(lead, stageId);
    setMovingStage(false);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    const moved = state.stageOrder.find((entry) => entry.id === stageId);
    toast.success(
      template(content.lead.stageToast, {
        name: lead.name,
        stage: moved?.label ?? stageId,
      }),
    );
  }

  async function handleLogCall() {
    setLogging(true);
    const result = await actions.logCall(lead.id);
    setLogging(false);

    if (result.ok) toast.success(leadConfig.content.logCallToast);
    else toast.error(result.message);
  }

  return (
    <Panel ticks className="px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <h2 className="font-display text-[1.5rem] font-semibold tracking-[-0.03em] text-ink">
            {lead.name}
          </h2>
          <p className="mt-0.5 text-[0.9375rem] text-ink-soft">{lead.company}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <SourceBadge source={lead.source} />

            <span className="deck-nums text-[0.75rem] text-ink-muted">
              {formatDaysInStage(lead.daysInStage)}
            </span>
            <span aria-hidden className="text-ink-faint">
              ·
            </span>
            <span className="deck-nums text-[0.75rem] text-ink-muted">
              {leadConfig.content.createdLabel} {formatDaysAgo(lead.createdDaysAgo)}
            </span>

            {stale && (
              <WarningChip
                label={leadConfig.content.staleWarning}
                className="normal-case tracking-normal"
              />
            )}
          </div>
        </div>

        {/* ---- Controls ---- */}
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2.5 sm:w-auto">
          {features.stageControl && (
            <span className="flex min-w-0 items-center gap-2">
              {/* The dot is decoration — the select beside it names the stage in
                  words, which is what carries the meaning. */}
              <StatusDot
                color={stage ? stageColor(stage) : "var(--stage-neutral)"}
              />

              <Select
                value={lead.stageId}
                // Guarded, not cast — see the note on the source Select in
                // components/rep/add-my-client-dialog.tsx. A cleared stage is
                // not a thing a lead can be in.
                onValueChange={(value) => {
                  if (value) void handleStage(value);
                }}
                disabled={movingStage}
              >
                <SelectTrigger
                  aria-label={content.lead.stageLabel}
                  className={cn(
                    "deck-input h-10 w-[11rem] justify-between rounded-xl border border-hairline bg-white/[0.03] px-3.5 text-[0.875rem] text-ink",
                    "hover:border-hairline-strong focus-visible:ring-2 focus-visible:ring-brand/50",
                  )}
                >
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {state.stageOrder.map((entry) => (
                    <SelectItem key={entry.id} value={entry.id}>
                      {entry.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </span>
          )}

          {features.quickActions && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => void handleLogCall()}
              disabled={logging}
              className="h-10 rounded-xl font-medium"
            >
              {logging ? (
                <LoaderCircle aria-hidden className="deck-spin size-4" />
              ) : (
                <PhoneCall aria-hidden className="size-4" />
              )}
              {leadConfig.content.logCallLabel}
            </Button>
          )}
        </div>
      </div>
    </Panel>
  );
}
