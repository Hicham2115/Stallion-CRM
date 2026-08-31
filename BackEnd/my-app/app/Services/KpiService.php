<?php

namespace App\Services;

use App\Models\AdSpend;
use App\Models\Lead;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

/**
 * ============================================================================
 *  KPI / ANALYTICS FOUNDATION — Prompt 3, extended in Prompt 4
 * ============================================================================
 *  Every method here returns real numbers computed from the `leads` /
 *  `ad_spend` / `users` tables, or `null` where the required data doesn't
 *  exist yet. Nothing is ever hardcoded or guessed — see each section's
 *  comments for exactly what's missing and why a figure is null.
 *
 *  DATE BASIS (spec section 13) — which date column each figure is filtered
 *  and counted by. Documented once here rather than re-explained per metric:
 *    - leads / applications-started   application_started_at
 *    - applications completed         application_completed_at
 *    - leads count, CPL denominator   created_at
 *    - bookings                       consult_booked_at
 *    - consult attendance             consult_scheduled_for
 *    - MVP delivery                   mvp_delivered_at
 *    - closed deals / revenue / CAC   closed_at (see wonLeads() doc)
 *    - project delivery               delivered_at (not project_delivered_date
 *      — see wonLeads()/developerPerformance() docs for the distinction)
 *    - lost                           lost_at
 *  Every other date-bearing figure documents its own column inline.
 *
 *  NULL VS ZERO (spec section 12) — every ratio with a zero or unknown
 *  denominator returns `null`, never 0 and never a fabricated number. 0 would
 *  be indistinguishable from "really is 0%"; null means "not enough data".
 *  Enforced in one place: safeDivide().
 *
 *  "WON" (Prompt 4, section 2) — a lead that reaches `won` stays a won
 *  customer even after moving on to in_delivery/delivered. Every HISTORICAL
 *  commercial figure (revenue, CAC denominator, deal counts, LTV, close
 *  rates, deposit collection, MVP-type revenue/win breakdowns, segment
 *  conversion) goes through wonLeads(), which matches
 *  stage IN Lead::WON_STAGES. CURRENT-STATE snapshots — funnel() (the Kanban
 *  column counts) and developerPerformance()'s active_project_load — stay on
 *  an exact stage match instead: a delivered lead isn't "currently in the
 *  Won column", and widening those would double-count it against its actual
 *  current column.
 * ============================================================================
 */
class KpiService
{
    public function build(array $filters): array
    {
        return [
            'acquisition' => $this->acquisition($filters),
            'middle_funnel' => $this->middleFunnel($filters),
            'bottom_funnel' => $this->bottomFunnel($filters),
            'economics' => $this->economics($filters),
            'sales' => $this->salesPerformance($filters),
            'developers' => $this->developerPerformance($filters),
            'timing' => $this->timing($filters),
            'funnel' => $this->funnel($filters),
            'campaigns' => $this->campaignPerformance($filters),
            'creatives' => $this->creativePerformance($filters),
        ];
    }

    // ── FILTERS ──────────────────────────────────────────────────────────

    /** Dimension filters (not date) — same set applied to every metric's
     *  base population, regardless of which date column that metric uses. */
    private function baseLeads(array $filters): Builder
    {
        return Lead::query()
            ->when($filters['track'] ?? null, fn ($q, $v) => $q->where('track', $v))
            ->when($filters['product_type'] ?? null, fn ($q, $v) => $q->where('product_type', $v))
            ->when($filters['segment_community'] ?? null, fn ($q, $v) => $q->where('segment_community', $v))
            ->when($filters['country'] ?? null, fn ($q, $v) => $q->where('country', $v))
            ->when($filters['assigned_sales'] ?? null, fn ($q, $v) => $q->where('assigned_sales_id', $v))
            // Prompt 5 — the three advertising dimensions live on
            // lead_attributions, not leads itself, so these go through the
            // relation rather than a plain where().
            ->when($filters['campaign'] ?? null, fn ($q, $v) => $q->whereHas(
                'attribution',
                fn ($a) => $a->where('utm_campaign', $v),
            ))
            ->when($filters['ad_set'] ?? null, fn ($q, $v) => $q->whereHas(
                'attribution',
                fn ($a) => $a->where('ad_set', $v),
            ))
            ->when($filters['creative'] ?? null, fn ($q, $v) => $q->whereHas(
                'attribution',
                fn ($a) => $a->where('creative_id', $v),
            ));
    }

    /** Adds a date-range clause on the metric-appropriate column. Leads
     *  where that column is null are excluded — a null timestamp is not "out
     *  of range", it's "hasn't happened", which is a different thing the
     *  caller should be counting as a denominator, not silently dropping. */
    private function withDateRange(Builder $query, string $column, array $filters): Builder
    {
        return $query
            ->whereNotNull($column)
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate($column, '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate($column, '<=', $v));
    }

    /** For metrics whose count is NOT defined by that column's presence
     *  (e.g. "lost" means stage='lost', full stop — lost_at is only there
     *  to let a date range narrow WHEN it was lost, not to gate the base
     *  count). Only touches the column at all if a date filter was actually
     *  given; with no date filter, a lead missing that column still counts. */
    private function withOptionalDateRange(Builder $query, string $column, array $filters): Builder
    {
        if (empty($filters['date_from']) && empty($filters['date_to'])) {
            return $query;
        }

        return $this->withDateRange($query, $column, $filters);
    }

    /**
     * The centralized "has ever won" definition (Prompt 4, section 2) —
     * every HISTORICAL commercial metric should build off this, not a raw
     * `where('stage', 'won')`. closed_at remains the right date-filter
     * column here even for a lead now sitting in in_delivery/delivered:
     * LeadObserver stamps it ONCE, the first time a lead enters 'won', and
     * never overwrites it on later stage moves — so it's still that lead's
     * original win date regardless of where it is now.
     */
    private function wonLeads(array $filters): Builder
    {
        return $this->withOptionalDateRange($this->baseLeads($filters), 'closed_at', $filters)
            ->whereIn('stage', Lead::WON_STAGES);
    }

    /** Same date-range semantics, for ad_spend (which has no lead dimension
     *  columns — track/product_type/community/country/assigned_sales simply
     *  don't apply to a spend row, so those filters are ignored for spend). */
    private function adSpendTotal(array $filters): float
    {
        return (float) AdSpend::query()
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('date', '<=', $v))
            ->sum('spend');
    }

    private function safeDivide(int|float|null $numerator, int|float|null $denominator): ?float
    {
        // A null NUMERATOR needs the same guard as a null/zero denominator
        // (Prompt 5 bug fix): campaignPerformance()/creativePerformance()
        // pass a genuinely-unknown `spend` (no matching ad_spend row) as the
        // numerator for `cpl`. Without this check, PHP treats `null / $n` as
        // `0 / $n` and silently returns 0 — a fabricated "free" CPL, exactly
        // what this method exists to prevent. Every other call site passes a
        // concrete count/sum that's never null, so this doesn't change their
        // behavior.
        if ($numerator === null || ! $denominator) {
            return null;
        }

        return $numerator / $denominator;
    }

    /**
     * Raw SQL for "seconds between two datetimes" / "day of week" / "hour",
     * in whichever dialect the current connection actually speaks. Tests run
     * on sqlite (phpunit.xml); production runs on mysql — TIMESTAMPDIFF/
     * DAYOFWEEK/HOUR are mysql-only and would hard-crash under test without
     * this. sqlite's strftime('%w', ...) is 0=Sunday..6=Saturday; +1 makes it
     * match mysql's DAYOFWEEK (1=Sunday..7=Saturday) so a stored "weekday"
     * number means the same thing regardless of which DB produced it.
     */
    private function sqlSecondsBetween(string $from, string $to): string
    {
        return DB::connection()->getDriverName() === 'sqlite'
            ? "(strftime('%s', $to) - strftime('%s', $from))"
            : "TIMESTAMPDIFF(SECOND, $from, $to)";
    }

    private function sqlDayOfWeek(string $column): string
    {
        return DB::connection()->getDriverName() === 'sqlite'
            ? "(CAST(strftime('%w', $column) AS INTEGER) + 1)"
            : "DAYOFWEEK($column)";
    }

    private function sqlHour(string $column): string
    {
        return DB::connection()->getDriverName() === 'sqlite'
            ? "CAST(strftime('%H', $column) AS INTEGER)"
            : "HOUR($column)";
    }

    // ── 2. TOP OF FUNNEL ────────────────────────────────────────────────

    private function acquisition(array $filters): array
    {
        $started = $this->withDateRange($this->baseLeads($filters), 'application_started_at', $filters)->count();
        $completed = $this->withDateRange($this->baseLeads($filters), 'application_completed_at', $filters)->count();

        $leads = $this->withDateRange($this->baseLeads($filters), 'created_at', $filters)->count();
        $consultBooked = $this->withDateRange($this->baseLeads($filters), 'consult_booked_at', $filters)->count();
        $adSpend = $this->adSpendTotal($filters);

        return [
            // impressions/clicks: no ad-platform integration exists (spec
            // explicitly says not to build one this prompt) — nothing to
            // read them from yet. Genuinely null (unavailable), not 0 (a
            // real zero) — the frontend must render these differently.
            'impressions' => null,
            'clicks' => null,
            'ad_spend' => $adSpend,
            'applications_started' => $started,
            'applications_completed' => $completed,
            'completion_rate' => $this->safeDivide($completed, $started),
            'leads' => $leads,
            'consult_booked' => $consultBooked,
            'cpl' => $this->safeDivide($adSpend, $leads),
            'speed_to_lead_minutes' => $this->speedToLeadMinutes($filters),
            'trend' => $this->acquisitionTrend($filters),
        ];
    }

    /**
     * Prompt 5 — daily/weekly/monthly series for the Acquisition Trend
     * chart. Real per-day counts from the DB, re-bucketed in PHP; never
     * "manufactured" by dividing a total across days. Granularity is picked
     * from the selected range so a chart never renders hundreds of daily
     * points: <=31 days -> daily, <=180 days -> weekly, longer (including no
     * range / "all time") -> monthly.
     */
    private function acquisitionTrend(array $filters): array
    {
        $granularity = $this->trendGranularity($filters);

        $series = [
            'leads' => $this->dailyCounts($this->baseLeads($filters), 'created_at', $filters),
            'applications_completed' => $this->dailyCounts($this->baseLeads($filters), 'application_completed_at', $filters),
            'consult_booked' => $this->dailyCounts($this->baseLeads($filters), 'consult_booked_at', $filters),
            'ad_spend' => $this->dailySpend($filters),
        ];

        return [
            'granularity' => $granularity,
            'points' => $this->bucketSeries($series, $granularity),
        ];
    }

    private function trendGranularity(array $filters): string
    {
        if (empty($filters['date_from']) || empty($filters['date_to'])) {
            return 'monthly';
        }

        $days = Carbon::parse($filters['date_from'])->diffInDays(Carbon::parse($filters['date_to']));

        return match (true) {
            $days <= 31 => 'daily',
            $days <= 180 => 'weekly',
            default => 'monthly',
        };
    }

    /** [date string (Y-m-d)] => count, for every day that has at least one
     *  matching row. DATE() is portable across mysql/sqlite as-is. */
    private function dailyCounts(Builder $query, string $column, array $filters): array
    {
        return $this->withDateRange($query, $column, $filters)
            ->selectRaw("DATE($column) as day, COUNT(*) as c")
            ->groupBy('day')
            ->pluck('c', 'day')
            ->all();
    }

    private function dailySpend(array $filters): array
    {
        return AdSpend::query()
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('date', '<=', $v))
            ->selectRaw('DATE(date) as day, SUM(spend) as s')
            ->groupBy('day')
            ->pluck('s', 'day')
            ->all();
    }

    /** Folds day => value maps into the chosen bucket width, then returns
     *  one row per bucket with every series aligned to the same x-axis —
     *  a bucket a series had no activity in gets 0 for that series, not a
     *  missing point (0 rows that day is a real fact, not unavailable data,
     *  unlike impressions/clicks which are unavailable full stop). */
    private function bucketSeries(array $series, string $granularity): array
    {
        $bucketOf = function (string $day) use ($granularity) {
            $date = Carbon::parse($day);

            return match ($granularity) {
                'weekly' => $date->startOfWeek()->toDateString(),
                'monthly' => $date->startOfMonth()->toDateString(),
                default => $day,
            };
        };

        $buckets = [];
        foreach ($series as $seriesKey => $byDay) {
            foreach ($byDay as $day => $value) {
                $bucket = $bucketOf($day);
                $buckets[$bucket][$seriesKey] = ($buckets[$bucket][$seriesKey] ?? 0) + (float) $value;
            }
        }

        ksort($buckets);

        $seriesKeys = array_keys($series);

        return collect($buckets)
            ->map(fn ($values, $bucket) => array_merge(
                ['date' => $bucket],
                collect($seriesKeys)->mapWithKeys(fn ($key) => [$key => $values[$key] ?? 0])->all(),
            ))
            ->values()
            ->all();
    }

    /** AVG(first_contact_at - application_completed_at) in minutes, over
     *  only leads where BOTH timestamps exist — never treats a missing one
     *  as zero (that would silently pull the average toward 0). */
    private function speedToLeadMinutes(array $filters): ?float
    {
        $avgSeconds = $this->baseLeads($filters)
            ->whereNotNull('application_completed_at')
            ->whereNotNull('first_contact_at')
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('application_completed_at', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('application_completed_at', '<=', $v))
            ->selectRaw('AVG('.$this->sqlSecondsBetween('application_completed_at', 'first_contact_at').') as avg_seconds')
            ->value('avg_seconds');

        return $avgSeconds === null ? null : round($avgSeconds / 60, 1);
    }

    // ── 3. MIDDLE OF FUNNEL ─────────────────────────────────────────────

    private function middleFunnel(array $filters): array
    {
        $applicationsCompleted = $this->withDateRange($this->baseLeads($filters), 'application_completed_at', $filters)->count();
        $consultsBooked = $this->withDateRange($this->baseLeads($filters), 'consult_booked_at', $filters)->count();
        $consultsScheduled = $this->withDateRange($this->baseLeads($filters), 'consult_scheduled_for', $filters)->count();
        $consultsAttended = (clone $this->baseLeads($filters))
            ->whereNotNull('consult_scheduled_for')
            ->where('consult_attended', true)
            ->count();

        // "MVPs built" (Prompt 4, section 5) = MVPs actually delivered —
        // mvp_delivered_at IS NOT NULL. The Prompt 3 proxy (mvp_type set)
        // is gone: mvp_type just means someone chose a type, not that the
        // work was ever finished. Both delivery date AND deadline must be
        // present to count either way — a missing one is excluded from
        // both sides, never silently treated as on-time.
        $mvpsBuilt = $this->withDateRange($this->baseLeads($filters), 'mvp_delivered_at', $filters)
            ->whereNotNull('mvp_deadline')
            ->count();
        $mvpsOnTime = $this->withDateRange($this->baseLeads($filters), 'mvp_delivered_at', $filters)
            ->whereNotNull('mvp_deadline')
            ->whereColumn('mvp_delivered_at', '<=', 'mvp_deadline')
            ->count();

        // Second meeting (a follow-up after the first consult, distinct
        // from the later closing_meeting_*) — date basis is
        // consult_completed_at, since "was a second meeting needed" is only
        // a meaningful question once the first one actually happened.
        $consultsCompleted = $this->withDateRange($this->baseLeads($filters), 'consult_completed_at', $filters)->count();
        $secondMeetingsNeeded = $this->withDateRange($this->baseLeads($filters), 'consult_completed_at', $filters)
            ->where('needs_second_meeting', true)
            ->count();
        $secondMeetingsScheduled = (clone $this->baseLeads($filters))
            ->where('needs_second_meeting', true)
            ->whereNotNull('second_meeting_scheduled_for')
            ->count();
        // Of second meetings with a RECORDED outcome (good or not) — one
        // that hasn't happened yet (outcome still null) isn't counted on
        // either side, same "don't fake it" rule as everywhere else.
        $secondMeetingsWithOutcome = (clone $this->baseLeads($filters))
            ->where('needs_second_meeting', true)
            ->whereNotNull('second_meeting_outcome_good')
            ->count();
        $secondMeetingsGood = (clone $this->baseLeads($filters))
            ->where('needs_second_meeting', true)
            ->where('second_meeting_outcome_good', true)
            ->count();

        return [
            'application_to_booking_rate' => $this->safeDivide($consultsBooked, $applicationsCompleted),
            'cost_per_booking' => $this->safeDivide($this->adSpendTotal($filters), $consultsBooked),
            'consult_show_rate' => $this->safeDivide($consultsAttended, $consultsScheduled),
            'second_meeting_needed_rate' => $this->safeDivide($secondMeetingsNeeded, $consultsCompleted),
            'second_meeting_booking_rate' => $this->safeDivide($secondMeetingsScheduled, $secondMeetingsNeeded),
            'second_meeting_good_outcome_rate' => $this->safeDivide($secondMeetingsGood, $secondMeetingsWithOutcome),
            // consult_outcome now has a real write path (Lead Details ->
            // Consult section, Prompt 4) and a real enum
            // (config('leads.consult_outcomes')) — 'agreed_mvp' is one of
            // its three defined values, matching the spec formula exactly,
            // not an assumption anymore.
            'consult_to_mvp_rate' => $this->safeDivide(
                (clone $this->baseLeads($filters))->where('consult_outcome', 'agreed_mvp')->count(),
                $consultsAttended,
            ),
            'mvp_on_time_rate' => $this->safeDivide($mvpsOnTime, $mvpsBuilt),
        ];
    }

    // ── 4. BOTTOM OF FUNNEL ─────────────────────────────────────────────

    private function bottomFunnel(array $filters): array
    {
        $closingScheduled = $this->withDateRange($this->baseLeads($filters), 'closing_meeting_scheduled_for', $filters)->count();
        $closingAttended = (clone $this->baseLeads($filters))
            ->whereNotNull('closing_meeting_scheduled_for')
            ->where('closing_meeting_attended', true)
            ->count();
        $consultsAttended = (clone $this->baseLeads($filters))
            ->whereNotNull('consult_scheduled_for')
            ->where('consult_attended', true)
            ->count();
        // "Historical won" (Prompt 4) — see wonLeads() and Lead::WON_STAGES.
        $won = $this->wonLeads($filters)->count();

        // "Lost count = COUNT(stage = lost)" per spec — no timestamp is part
        // of that definition, unlike applications/bookings/consults, so the
        // date range only narrows when a date filter is actually given
        // (withOptionalDateRange), and never excludes a lost lead just
        // because lost_at happens to be unset (e.g. leads moved to lost
        // before this column existed).
        $lostQuery = $this->withOptionalDateRange($this->baseLeads($filters), 'lost_at', $filters)->where('stage', 'lost');
        $lostCount = (clone $lostQuery)->count();
        $lostReasons = (clone $lostQuery)
            ->select('lost_reason', DB::raw('COUNT(*) as count'))
            ->groupBy('lost_reason')
            ->pluck('count', 'lost_reason');

        return [
            'closing_show_rate' => $this->safeDivide($closingAttended, $closingScheduled),
            'close_rate' => $this->safeDivide($won, $consultsAttended),
            'closing_meeting_close_rate' => $this->safeDivide($won, $closingAttended),
            'deposit_collection_rate' => $this->safeDivide(
                (clone $this->wonLeads($filters))->where('deposit_collected', true)->count(),
                $won,
            ),
            'lost_count' => $lostCount,
            'lost_reasons' => $lostReasons,
        ];
    }

    // ── 5. UNIT ECONOMICS ───────────────────────────────────────────────

    private function economics(array $filters): array
    {
        // Revenue date basis: closed_at, not contract_signed_date.
        // contract_signed_date is a manually-entered business record that
        // can be null even for a won deal; closed_at is auto-stamped by
        // LeadObserver the moment stage first becomes 'won', so it's always
        // populated for every won deal. Documented business-rule choice,
        // not the only valid one — flagged in the report. "Won" itself is
        // the historical definition — see wonLeads() — so revenue keeps
        // counting a deal after it moves on to in_delivery/delivered.
        $won = $this->wonLeads($filters);

        $revenue = (clone $won)->sum('contract_value');
        $projectCost = (clone $won)->sum('project_cost');
        $wonCount = (clone $won)->count();

        $mvpCostTotal = $this->withDateRange($this->baseLeads($filters), 'created_at', $filters)->sum('mvp_cost');
        $mrr = (clone $won)->sum('recurring_mrr');
        $adSpend = $this->adSpendTotal($filters);
        $cac = $this->safeDivide($adSpend, $wonCount);

        $retentionMonths = config('leads.expected_retention_months');
        $ltv = null;
        $ltvCac = null;
        if ($retentionMonths !== null && $wonCount > 0) {
            $avgContract = $revenue / $wonCount;
            $avgMrr = $mrr / $wonCount;
            $avgProjectCost = $projectCost / $wonCount;
            $ltv = $avgContract + ($avgMrr * (float) $retentionMonths) - $avgProjectCost;
            $ltvCac = $this->safeDivide($ltv, $cac);
        }

        return [
            'mvp_cost_total' => (float) $mvpCostTotal,
            'revenue' => (float) $revenue,
            'project_cost' => (float) $projectCost,
            'gross_profit' => (float) ($revenue - $projectCost),
            'gross_margin' => $this->safeDivide($revenue - $projectCost, $revenue),
            // "MRR for active clients" — 'active' isn't a stage in the
            // pipeline; interpreted as "historically won and not lost", same
            // wonLeads() definition as revenue above.
            'mrr' => (float) $mrr,
            'cac' => $cac,
            'ltv' => $ltv,
            'ltv_cac' => $ltvCac,
            'ltv_note' => $retentionMonths === null
                ? 'LTV and LTV:CAC are null: EXPECTED_RETENTION_MONTHS is not configured. Set it in config/leads.php / .env — see that file\'s comment.'
                : null,
        ];
    }

    // ── 7. SALES PERFORMANCE ────────────────────────────────────────────

    private function salesPerformance(array $filters): array
    {
        $salesUsers = User::where('role', 'sales')->get(['id', 'name']);

        return $salesUsers->map(function (User $rep) use ($filters) {
            $repFilters = array_merge($filters, ['assigned_sales' => $rep->id]);

            // Historical won (Prompt 4) — see wonLeads().
            $won = $this->wonLeads($repFilters);
            $wonCount = (clone $won)->count();
            // Date basis: consult_scheduled_for, matching acquisition's
            // consult-attendance metric — this was NOT date-filtered before
            // Prompt 4 (section 15's "sales rows accidentally including
            // lifetime data" bug).
            $scheduled = $this->withDateRange($this->baseLeads($repFilters), 'consult_scheduled_for', $repFilters)->count();
            $consultsAttended = $this->withDateRange($this->baseLeads($repFilters), 'consult_scheduled_for', $repFilters)
                ->where('consult_attended', true)
                ->count();

            $avgCycleSeconds = (clone $won)
                ->whereNotNull('closed_at')
                ->selectRaw('AVG('.$this->sqlSecondsBetween('created_at', 'closed_at').') as avg_seconds')
                ->value('avg_seconds');

            return [
                'assigned_sales_id' => $rep->id,
                'name' => $rep->name,
                'close_rate' => $this->safeDivide($wonCount, $consultsAttended),
                'average_deal_size' => $wonCount > 0 ? (float) (clone $won)->avg('contract_value') : null,
                'sales_cycle_days' => $avgCycleSeconds === null ? null : round($avgCycleSeconds / 86400, 1),
                'show_rate' => $this->safeDivide($consultsAttended, $scheduled),
                'revenue_generated' => (float) (clone $won)->sum('contract_value'),
            ];
        })->values()->all();
    }

    // ── 8. DEVELOPER PERFORMANCE ────────────────────────────────────────

    private function developerPerformance(array $filters): array
    {
        // "assigned_developers" is the lead_developer pivot (many-to-many —
        // a project can have more than one dev), so this groups by that
        // relation rather than a single column the way sales does.
        $devUserIds = DB::table('lead_developer')->distinct()->pluck('user_id');
        $devs = User::whereIn('id', $devUserIds)->get(['id', 'name']);

        $hasDateFilter = ! empty($filters['date_from']) || ! empty($filters['date_to']);

        return $devs->map(function (User $dev) use ($filters, $hasDateFilter) {
            $leadIds = DB::table('lead_developer')->where('user_id', $dev->id)->pluck('lead_id');
            $leads = fn () => $this->baseLeads($filters)->whereIn('leads.id', $leadIds);

            // CURRENT-STATE, never date-filtered (Prompt 4, section 16) —
            // "how many projects does this dev have (assigned / currently in
            // delivery) right now" doesn't mean anything scoped to a past
            // date range. on_time_delivery_rate keeps the spec's literal
            // "delivered on time / projects assigned" denominator — lifetime
            // assigned count, same as here — rather than switching to a
            // date-scoped denominator, which would be a different formula,
            // not a date-filter fix.
            $assignedCount = $leads()->count();
            $activeProjectLoad = $leads()->where('stage', 'in_delivery')->count();
            $onTime = $leads()
                ->whereNotNull('delivered_at')
                ->whereNotNull('project_deadline')
                ->whereColumn('delivered_at', '<=', 'project_deadline')
                ->count();

            // EVENT-based: date basis is delivered_at (section 14) — "how
            // many finished, in this period". Distinct from
            // on_time_delivery_rate above (deliberately lifetime, see
            // comment). With no date filter this is "delivered, ever".
            $deliveredInRange = $this->withDateRange($leads(), 'delivered_at', $filters);
            $deliveredCount = (clone $deliveredInRange)->count();

            // Hours/revisions accrue for the whole life of a project, not at
            // a single moment — there's no "hours happened on this date" to
            // filter by. With a date range selected, scoped to the projects
            // that finished IN that range (hours spent on work delivered
            // this period); with no range, lifetime hours across every
            // currently assigned project (matching pre-Prompt-4 behavior).
            // Documented rather than silently mixing the two.
            $hoursScope = $hasDateFilter ? $deliveredInRange : $leads();

            return [
                'user_id' => $dev->id,
                'name' => $dev->name,
                'on_time_delivery_rate' => $this->safeDivide($onTime, $assignedCount),
                'budgeted_hours_total' => (float) (clone $hoursScope)->sum('budgeted_hours'),
                'actual_hours_total' => (float) (clone $hoursScope)->sum('actual_hours'),
                'hours_ratio' => $this->safeDivide(
                    (clone $hoursScope)->sum('actual_hours'),
                    (clone $hoursScope)->sum('budgeted_hours'),
                ),
                'revision_rate' => $this->safeDivide(
                    (clone $hoursScope)->sum('revision_count'),
                    (clone $hoursScope)->count(),
                ),
                'active_project_load' => $activeProjectLoad,
                'assigned_count' => $assignedCount,
                'delivered_count' => $deliveredCount,
            ];
        })->values()->all();
    }

    // ── 9. TIMING / ANALYSIS ────────────────────────────────────────────

    private function timing(array $filters): array
    {
        return [
            'most_booked_weekday' => $this->modeOf($filters, 'consult_scheduled_for', fn ($c) => $this->sqlDayOfWeek($c)),
            'most_booked_hour' => $this->modeOf($filters, 'consult_scheduled_for', fn ($c) => $this->sqlHour($c)),
            'most_closing_weekday' => $this->modeOf($filters, 'closed_at', fn ($c) => $this->sqlDayOfWeek($c)),
            'most_closing_hour' => $this->modeOf($filters, 'closed_at', fn ($c) => $this->sqlHour($c)),
            // All three: historical won (Prompt 4) — see wonLeads().
            'mvp_types_by_wins' => (clone $this->wonLeads($filters))
                ->whereNotNull('mvp_type')
                ->select('mvp_type', DB::raw('COUNT(*) as count'))
                ->groupBy('mvp_type')
                ->orderByDesc('count')
                ->pluck('count', 'mvp_type'),
            'mvp_types_by_revenue' => (clone $this->wonLeads($filters))
                ->whereNotNull('mvp_type')
                ->select('mvp_type', DB::raw('SUM(contract_value) as revenue'))
                ->groupBy('mvp_type')
                ->orderByDesc('revenue')
                ->pluck('revenue', 'mvp_type'),
            'profit_by_product_type' => (clone $this->wonLeads($filters))
                ->select('product_type', DB::raw('SUM(contract_value - COALESCE(project_cost, 0)) as profit'))
                ->groupBy('product_type')
                ->pluck('profit', 'product_type'),
            'conversion_and_cac_by_segment' => $this->conversionAndCacBySegment($filters),
        ];
    }

    /** @param  \Closure(string):string  $bucketExpr  e.g. fn($c) => $this->sqlHour($c) */
    private function modeOf(array $filters, string $column, \Closure $bucketExpr): ?int
    {
        $row = $this->withDateRange($this->baseLeads($filters), $column, $filters)
            ->selectRaw($bucketExpr($column).' as bucket, COUNT(*) as c')
            ->groupBy('bucket')
            ->orderByDesc('c')
            ->first();

        return $row?->bucket;
    }

    /**
     * Segment = segment_community × country (spec section 9/17).
     *
     * LIMITATION, stated explicitly rather than pretending this is exact
     * (spec section 17/18): `ad_spend` has no segment/lead-id dimension to
     * split by, so per-segment CAC divides the SAME period-total ad spend
     * across each segment's own won count — every segment's CAC shares one
     * spend numerator. This is not true per-segment spend attribution; it's
     * the best available approximation until spend can be tied to a
     * specific lead (which needs a real ads-platform integration, out of
     * scope). `leads`/`won` below ARE exact — those come straight from the
     * `leads` table, date-filtered on closed_at exactly like every other
     * historical-won figure.
     */
    private function conversionAndCacBySegment(array $filters): array
    {
        $adSpend = $this->adSpendTotal($filters);
        $wonStagesList = "'".implode("','", Lead::WON_STAGES)."'";

        // Date basis: created_at, same as the plain "leads" count elsewhere
        // — a cohort read ("of leads that CAME IN during this period, how
        // many of them eventually won"). Using closed_at here instead would
        // exclude every non-won lead from the `leads` count the moment any
        // date filter is applied (closed_at is null for a lead that never
        // won), which would silently corrupt the denominator.
        $rows = $this->withDateRange($this->baseLeads($filters), 'created_at', $filters)
            ->select(
                'segment_community',
                'country',
                DB::raw('COUNT(*) as leads'),
                DB::raw("SUM(CASE WHEN stage IN ($wonStagesList) THEN 1 ELSE 0 END) as won"),
                DB::raw('SUM(CASE WHEN consult_attended = 1 THEN 1 ELSE 0 END) as consults_attended'),
            )
            ->whereNotNull('segment_community')
            ->whereNotNull('country')
            ->groupBy('segment_community', 'country')
            ->get();

        return $rows->map(fn ($row) => [
            'segment_community' => $row->segment_community,
            'country' => $row->country,
            'leads' => (int) $row->leads,
            'won' => (int) $row->won,
            'close_rate' => $this->safeDivide($row->won, $row->consults_attended),
            'cac' => $this->safeDivide($adSpend, $row->won),
            'cac_is_approximate' => true,
        ])->all();
    }

    // ── 10. REAL FUNNEL DATA ────────────────────────────────────────────

    /** Real per-stage counts, in pipeline order — the number of leads
     *  CURRENTLY sitting in each stage (not cumulative "reached this stage
     *  or beyond", which would need stage-history tracking that doesn't
     *  exist). The mock FunnelView's "reach/drop-off" framing needs that
     *  history; this only gives current distribution. Frontend wiring is
     *  explicitly a later prompt. */
    private function funnel(array $filters): array
    {
        $counts = (clone $this->baseLeads($filters))
            ->select('stage', DB::raw('COUNT(*) as count'))
            ->groupBy('stage')
            ->pluck('count', 'stage');

        return collect(Lead::STAGES)
            ->mapWithKeys(fn ($stage) => [$stage => (int) ($counts[$stage] ?? 0)])
            ->all();
    }

    // ── PROMPT 5: CAMPAIGN / CREATIVE PERFORMANCE ───────────────────────

    /**
     * One row per campaign. `spend` and `cpl` are null (rendered as "—" by
     * the frontend, never 0 or invented) whenever no ad_spend row names that
     * exact campaign string — there's no ad-platform id to join on, only a
     * value match against lead_attributions.utm_campaign, so a spend record
     * with a slightly different spelling just won't match. That's the
     * limitation named in the spec, not a bug.
     */
    private function campaignPerformance(array $filters): array
    {
        $spendByCampaign = $this->spendGroupedBy('campaign', $filters);
        $wonList = "'".implode("','", Lead::WON_STAGES)."'";

        // 'leads.created_at' explicitly qualified: both `leads` and
        // `lead_attributions` have a created_at column, and once joined an
        // unqualified reference is ambiguous to the DB.
        $rows = $this->withDateRange($this->baseLeads($filters), 'leads.created_at', $filters)
            ->join('lead_attributions', 'lead_attributions.lead_id', '=', 'leads.id')
            ->whereNotNull('lead_attributions.utm_campaign')
            ->select(
                'lead_attributions.utm_campaign as campaign',
                DB::raw('COUNT(*) as leads'),
                DB::raw('SUM(CASE WHEN leads.consult_booked_at IS NOT NULL THEN 1 ELSE 0 END) as consults'),
                DB::raw("SUM(CASE WHEN leads.stage IN ($wonList) THEN 1 ELSE 0 END) as won"),
                DB::raw("SUM(CASE WHEN leads.stage IN ($wonList) THEN leads.contract_value ELSE 0 END) as revenue"),
            )
            ->groupBy('lead_attributions.utm_campaign')
            ->get();

        return $rows->map(function ($row) use ($spendByCampaign) {
            $spend = $spendByCampaign[$row->campaign] ?? null;

            return [
                'campaign' => $row->campaign,
                'spend' => $spend === null ? null : (float) $spend,
                'leads' => (int) $row->leads,
                'cpl' => $this->safeDivide($spend, $row->leads),
                'consults' => (int) $row->consults,
                'won' => (int) $row->won,
                'revenue' => (float) $row->revenue,
            ];
        })->sortByDesc('leads')->values()->all();
    }

    /** Same shape and same limitation as campaignPerformance(), grouped by
     *  creative_id instead — "which creative produces actual customers" per
     *  the spec, with the same value-match caveat on spend attribution. */
    private function creativePerformance(array $filters): array
    {
        $spendByCreative = $this->spendGroupedBy('creative', $filters);
        $wonList = "'".implode("','", Lead::WON_STAGES)."'";

        // 'leads.created_at' explicitly qualified: both `leads` and
        // `lead_attributions` have a created_at column, and once joined an
        // unqualified reference is ambiguous to the DB.
        $rows = $this->withDateRange($this->baseLeads($filters), 'leads.created_at', $filters)
            ->join('lead_attributions', 'lead_attributions.lead_id', '=', 'leads.id')
            ->whereNotNull('lead_attributions.creative_id')
            ->select(
                'lead_attributions.creative_id as creative',
                'lead_attributions.ad_set as ad_set',
                'lead_attributions.utm_campaign as campaign',
                DB::raw('COUNT(*) as leads'),
                DB::raw("SUM(CASE WHEN leads.stage IN ($wonList) THEN 1 ELSE 0 END) as won"),
                DB::raw("SUM(CASE WHEN leads.stage IN ($wonList) THEN leads.contract_value ELSE 0 END) as revenue"),
            )
            ->groupBy('lead_attributions.creative_id', 'lead_attributions.ad_set', 'lead_attributions.utm_campaign')
            ->get();

        return $rows->map(function ($row) use ($spendByCreative) {
            $spend = $spendByCreative[$row->creative] ?? null;

            return [
                'creative' => $row->creative,
                'campaign' => $row->campaign,
                'ad_set' => $row->ad_set,
                'spend' => $spend === null ? null : (float) $spend,
                'leads' => (int) $row->leads,
                'cpl' => $this->safeDivide($spend, $row->leads),
                'won' => (int) $row->won,
                'revenue' => (float) $row->revenue,
            ];
        })->sortByDesc('leads')->values()->all();
    }

    /** [value of that ad_spend column] => total spend, date-filtered the
     *  same way adSpendTotal() is. Shared by both breakdowns above. */
    private function spendGroupedBy(string $column, array $filters): array
    {
        return AdSpend::query()
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('date', '<=', $v))
            ->whereNotNull($column)
            ->select($column, DB::raw('SUM(spend) as total'))
            ->groupBy($column)
            ->pluck('total', $column)
            ->all();
    }
}
