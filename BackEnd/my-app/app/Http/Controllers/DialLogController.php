<?php

namespace App\Http\Controllers;

use App\Models\DialLog;
use Illuminate\Http\Request;

/**
 * Self-service dial tracking (Rep Dashboard "My Dials Today") — same
 * "acts on $request->user() only" pattern as ProfileController. A rep
 * types their own count in; there's no phone-system integration to read
 * it from automatically.
 */
class DialLogController extends Controller
{
    public function today(Request $request)
    {
        return response()->json($this->summaryFor($request->user()));
    }

    public function updateToday(Request $request)
    {
        $data = $request->validate([
            'count' => ['required', 'integer', 'min:0'],
        ]);

        DialLog::updateOrCreate(
            ['user_id' => $request->user()->id, 'date' => now()->toDateString()],
            ['dial_count' => $data['count']],
        );

        return response()->json($this->summaryFor($request->user()));
    }

    private function summaryFor($user): array
    {
        return [
            'today' => (int) DialLog::where('user_id', $user->id)
                ->where('date', now()->toDateString())
                ->value('dial_count'),
            'all_time' => (int) DialLog::where('user_id', $user->id)->sum('dial_count'),
        ];
    }
}
