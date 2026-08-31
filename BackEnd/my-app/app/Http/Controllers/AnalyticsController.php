<?php

namespace App\Http\Controllers;

use App\Models\DialLog;
use App\Models\Lead;
use App\Models\User;
use App\Services\KpiService;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
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

        return response()->json($kpis->build($filters));
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
