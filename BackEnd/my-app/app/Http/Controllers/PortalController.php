<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use Illuminate\Http\Request;

/**
 * The client portal's one real read. CLIENT-SAFE fields only — see the
 * CLIENT-SAFE RULE in the frontend's config/portal.js: never notes,
 * source, stage, sales activity, or rep figures. Scoped by the signed-in
 * user's own `client_user_id` link, never a lead id from the request, so
 * one client can never fetch another's project by guessing an id.
 */
class PortalController extends Controller
{
    public function show(Request $request)
    {
        $lead = Lead::where('client_user_id', $request->user()->id)
            ->with(['milestones', 'previews', 'developers:id,name'])
            ->first();

        if (! $lead) {
            return response()->json(['error' => 'No project is linked to this account yet.'], 404);
        }

        return response()->json([
            'id' => $lead->id,
            'name' => $lead->full_name,
            'company' => $lead->business_type,
            'project_summary' => $lead->need_description,
            'live_url' => $lead->live_url,
            'milestones' => $lead->milestones,
            'previews' => $lead->previews,
            'developer' => $lead->developers->first()?->only(['id', 'name']),
        ]);
    }
}
