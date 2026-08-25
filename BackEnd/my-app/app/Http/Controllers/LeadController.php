<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLeadRequest;
use App\Models\Lead;
use App\Models\LeadAttribution;
use App\Models\LeadSegmentation;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LeadController extends Controller
{
    public function store(StoreLeadRequest $request)
    {
        $data = $request->validated();
        $attribution = $request->attributionData();

        try {
            $lead = DB::transaction(function () use ($request, $data, $attribution) {
                $briefPath = $request->hasFile('brief_file')
                    ? $request->file('brief_file')->store('lead-briefs', 'local')
                    : null;

                $lead = Lead::create([
                    'full_name' => $data['full_name'],
                    'email' => $data['email'],
                    'phone' => $data['phone'],
                    'role' => $data['role'] ?? null,
                    'is_decision_maker' => $data['is_decision_maker'],
                    'business_type' => $data['business_type'],
                    'product_type' => $data['product_type'],
                    'track' => $data['track'],
                    'budget_band' => $data['budget_band'],
                    'need_description' => $data['need_description'],
                    'desired_launch' => $data['desired_launch'],
                    'brief_file_path' => $briefPath,
                    'status' => 'new',
                ]);

                LeadAttribution::create([
                    'lead_id' => $lead->id,
                    'utm_source' => $attribution['utm_source'] ?? null,
                    'utm_medium' => $attribution['utm_medium'] ?? null,
                    'utm_campaign' => $attribution['utm_campaign'] ?? null,
                    'utm_content' => $attribution['utm_content'] ?? null,
                    'utm_term' => $attribution['utm_term'] ?? null,
                    'gclid' => $attribution['gclid'] ?? null,
                    'fbclid' => $attribution['fbclid'] ?? null,
                    'referrer' => $attribution['referrer'] ?? null,
                    'landing_page' => $attribution['landing_page'] ?? null,
                ]);

                LeadSegmentation::create([
                    'lead_id' => $lead->id,
                    'track' => $data['track'],
                    'product_type' => $data['product_type'],
                    'budget_band' => $data['budget_band'],
                    'desired_launch' => $data['desired_launch'],
                    'priority_score' => $this->priorityScore($data),
                ]);

                return $lead;
            });
        } catch (\Throwable $e) {
            Log::error('Lead creation failed', ['error' => $e->getMessage()]);

            return response()->json(['error' => 'Could not save this lead. Please try again.'], 500);
        }

        return response()->json(['id' => $lead->id, 'status' => $lead->status], 201);
    }

    /** Higher-value track and urgency surface a lead to sales faster. */
    private function priorityScore(array $data): int
    {
        $trackScore = $data['track'] === 'high_ticket' ? 20 : 10;

        $urgencyScore = match ($data['desired_launch']) {
            'asap' => 15,
            '1-3mo' => 10,
            '3-6mo' => 5,
            default => 0,
        };

        $decisionMakerScore = $data['is_decision_maker'] ? 10 : 0;

        return $trackScore + $urgencyScore + $decisionMakerScore;
    }
}
