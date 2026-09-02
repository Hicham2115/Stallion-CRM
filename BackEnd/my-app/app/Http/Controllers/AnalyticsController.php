<?php

namespace App\Http\Controllers;

use App\Models\DialLog;
use App\Models\Lead;
use App\Models\User;
use App\Services\KpiService;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

class AnalyticsController extends Controller
{
    /**
     * Company financials inside `economics`. A sales rep may see what a
     * customer COSTS — cac, ltv, ltv_cac, and acquisition.cpl — because that
     * is what tells them which leads are worth their time. What the agency
     * EARNS and keeps is the admin's. (User decision, 2026-09-01, when
     * /rep/analysis was added. This settles the "should economics be
     * admin-only" question left open in routes/api.php.)
     */
    private const ADMIN_ONLY_ECONOMICS = [
        'mvp_cost_total', 'revenue', 'project_cost', 'gross_profit', 'gross_margin', 'mrr',
    ];

    /**
     * Whole sections that rank one PERSON against another — per-rep revenue
     * and deal size, per-dev delivery. config/roles.js has listed these under
     * what a rep never reads since the rep front was built; before this
     * screen existed nothing rendered them, so nothing enforced it either.
     */
    private const ADMIN_ONLY_SECTIONS = ['sales', 'developers'];

    /** Per-row money on the campaign/creative breakdowns — same rule as
     *  ADMIN_ONLY_ECONOMICS, applied to each row. */
    private const ADMIN_ONLY_BREAKDOWN_FIELDS = ['revenue'];

    public function kpis(Request $request, KpiService $kpis)
    {
        $filters = $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'track' => ['nullable', 'string', 'in:low_ticket,high_ticket'],
            'product_type' => ['nullable', 'string', 'in:'.implode(',', config('leads.product_types'))],
            'segment_community' => ['nullable', 'string'],
            'country' => ['nullable', 'string'],
            'assigned_sales' => ['nullable', 'integer', 'exists:users,id'],
            // Prompt 5 — free strings, not an enum: campaigns/ad sets/
            // creatives are whatever an admin typed into an ad-spend row or
            // the frontend's attribution capture, not a fixed list.
            'campaign' => ['nullable', 'string'],
            'ad_set' => ['nullable', 'string'],
            'creative' => ['nullable', 'string'],
        ]);

        $payload = $kpis->build($filters);

        // Display-side filtering exists too (config/analysis.js's `audience`),
        // but this is the boundary. Product principle 4: roles decide the
        // surface, the server decides the permission — a hidden KPI card is
        // still one devtools tab away if the figure ships in the payload.
        if ($request->user()->role !== 'admin') {
            $payload = $this->withoutAdminOnlyFigures($payload);
        }

        return response()->json($payload);
    }

    /**
     * The same payload with every admin-only figure REMOVED — not nulled.
     *
     * Removed, because null already means something specific and load-bearing
     * everywhere in this API: "the denominator is unknown" (see KpiService's
     * NULL VS ZERO note), which the frontend renders as "—". A redacted
     * revenue sent as null would render identically to a genuine "no won
     * deals yet", so a rep would read "the agency earned nothing" instead of
     * "this is not yours to see". An absent key renders as "—" too, but it
     * cannot be mistaken for a measurement.
     */
    private function withoutAdminOnlyFigures(array $payload): array
    {
        foreach (self::ADMIN_ONLY_SECTIONS as $section) {
            unset($payload[$section]);
        }

        $payload['economics'] = Arr::except($payload['economics'], self::ADMIN_ONLY_ECONOMICS);

        foreach (['campaigns', 'creatives'] as $breakdown) {
            $payload[$breakdown] = array_map(
                fn (array $row) => Arr::except($row, self::ADMIN_ONLY_BREAKDOWN_FIELDS),
                $payload[$breakdown],
            );
        }

        return $payload;
    }

    /**
     * Admin dashboard's "Rep Leaderboard" widget — lifetime, unfiltered
     * activity counts per active sales rep. Deliberately simpler than
     * KpiService::salesPerformance() (which is date-filterable and
     * revenue-focused, for the Reports screen): this is a quick "who's
     * active" glance, not a report.
     */
    public function leaderboard(Request $request)
    {
        $reps = User::where('role', 'sales')->where('active', true)->get(['id', 'name']);

        $rows = $reps->map(fn (User $rep) => [
            'id' => $rep->id,
            'name' => $rep->name,
            'dials' => (int) DialLog::where('user_id', $rep->id)->sum('dial_count'),
            'appointments' => Lead::where('assigned_sales_id', $rep->id)->whereNotNull('consult_scheduled_for')->count(),
            'conversions' => Lead::where('assigned_sales_id', $rep->id)->whereIn('stage', Lead::WON_STAGES)->count(),
        ]);

        return response()->json($rows->values());
    }
}
