<?php

namespace App\Observers;

use App\Models\Lead;
use App\Models\LeadStageHistory;
use Illuminate\Validation\ValidationException;

class LeadObserver
{
    /**
     * Fires on every create and update, before the row is written. Four
     * independent jobs, all "foundation" for the pipeline — none of them
     * depend on a Pipeline UI or a stage-change endpoint existing yet:
     *
     *   1. Derive `track` from `product_type` when it wasn't set explicitly.
     *   2. Refuse to save a `lost` stage without a `lost_reason`.
     *   3. Stamp the funnel timestamp for a stage the first time it's entered.
     *   4. Stamp consult_completed_at when consult_attended is marked true
     *      directly (Prompt 4) — the consult can be completed without a
     *      matching stage move, so this is a second, independent trigger for
     *      the same column, not a duplicate of #3.
     */
    public function saving(Lead $lead): void
    {
        $this->deriveTrack($lead);
        $this->requireLostReason($lead);
        $this->stampStageTimestamps($lead);
        $this->stampConsultCompletion($lead);
    }

    /**
     * The full stage-change audit trail (LeadStageHistory) — separate from
     * saving() because it needs `$lead->id`, which doesn't exist yet on a
     * brand-new lead until after the insert. Logs the very first stage on
     * creation, then one row per stage change after that — including a
     * repeat visit to a stage already seen, unlike STAGE_TIMESTAMP_EVENTS
     * which only ever stamps the first.
     */
    public function saved(Lead $lead): void
    {
        if ($lead->wasRecentlyCreated || $lead->wasChanged('stage')) {
            LeadStageHistory::create([
                'lead_id' => $lead->id,
                'stage' => $lead->stage,
                'entered_at' => now(),
            ]);
        }
    }

    /** Manual override wins — this only fills in when `track` is empty. */
    private function deriveTrack(Lead $lead): void
    {
        if (! empty($lead->track) || empty($lead->product_type)) {
            return;
        }

        $lead->track = Lead::trackForProductType($lead->product_type);
    }

    private function requireLostReason(Lead $lead): void
    {
        if ($lead->stage === 'lost' && empty($lead->lost_reason)) {
            throw ValidationException::withMessages([
                'lost_reason' => 'A lost reason is required when the stage is "lost".',
            ]);
        }
    }

    /**
     * Only on the transition INTO a stage (not every save while already in
     * it), and only if that timestamp is still empty — never overwrites one
     * that's already set. Driven by Lead::STAGE_TIMESTAMP_EVENTS so this and
     * the KPI stage-duration calculations (config/pipeline-live.js on the
     * frontend, KpiService on the backend) can't drift apart.
     */
    private function stampStageTimestamps(Lead $lead): void
    {
        if (! $lead->isDirty('stage')) {
            return;
        }

        $column = Lead::STAGE_TIMESTAMP_EVENTS[$lead->stage] ?? null;
        if ($column === null) {
            return;
        }

        $lead->{$column} ??= now();
    }

    /** Same never-overwrite rule as stampStageTimestamps, just triggered by
     *  a field edit (recording attendance) instead of a stage move. */
    private function stampConsultCompletion(Lead $lead): void
    {
        if (! $lead->isDirty('consult_attended') || $lead->consult_attended !== true) {
            return;
        }

        $lead->consult_completed_at ??= now();
    }
}
