<?php

namespace App\Http\Controllers;

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
}
