<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\LeadAttribution;
use App\Models\LeadSegmentation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class LeadController extends Controller
{
    public function index()
    {
        $leads = Lead::with('attribution')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($leads);
    }

    public function store(Request $request)
    {
        $request->merge([
            'is_decision_maker' => filter_var($request->input('is_decision_maker'), FILTER_VALIDATE_BOOLEAN),
        ]);

        $data = $request->validate([
            'full_name' => ['required', 'string', 'min:2', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'phone' => ['required', 'string', 'min:7'],
            'role' => ['nullable', 'string', 'max:80'],
            'is_decision_maker' => ['required', 'boolean'],

            'business_type' => ['required', 'string', 'min:2', 'max:255'],
            'product_type' => ['required', 'string', 'in:' . implode(',', config('leads.product_types'))],
            'track' => ['required', 'string', 'in:low_ticket,high_ticket'],

            'budget_band' => ['required', 'string', 'in:' . implode(',', config('leads.budget_bands'))],
            'need_description' => ['required', 'string', 'min:10', 'max:2000'],
            'desired_launch' => ['required', 'string', 'in:' . implode(',', config('leads.desired_launch_options'))],

            'brief_file' => ['nullable', 'file', 'max:10240', 'mimes:pdf,doc,docx,png,jpg,jpeg'],

            'attribution' => ['nullable', 'string'],
        ]);

        $this->assertBudgetInRange($data['track'], $data['budget_band']);

        $attribution = $this->decodeAttribution($request->input('attribution'));

        try {
            $lead = DB::transaction(function () use ($request, $data, $attribution) {
                $briefPath = $request->hasFile('brief_file')
                    ? $request->file('brief_file')->store('lead-briefs', 'public')
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

                $this->createAttribution($lead, $attribution);

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

    /** Entry-gate capture: just a name + email before the visitor can browse the site. */
    public function storeGate(Request $request)
    {
        $data = $request->validate([
            'full_name' => ['required', 'string', 'min:2', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'attribution' => ['nullable', 'string'],
        ]);

        $attribution = $this->decodeAttribution($request->input('attribution'));

        try {
            $lead = DB::transaction(function () use ($data, $attribution) {
                $lead = Lead::create([
                    'full_name' => $data['full_name'],
                    'email' => $data['email'],
                    'status' => 'gate',
                ]);

                $this->createAttribution($lead, $attribution);

                return $lead;
            });
        } catch (\Throwable $e) {
            Log::error('Gate lead creation failed', ['error' => $e->getMessage()]);

            return response()->json(['error' => 'Could not save this. Please try again.'], 500);
        }

        return response()->json(['id' => $lead->id], 201);
    }

    /** Cross-field check: budget must be in range for the derived track. */
    private function assertBudgetInRange(string $track, string $budgetBand): void
    {
        $allowed = config("leads.budget_bands_by_track.$track", []);

        if (! in_array($budgetBand, $allowed, true)) {
            throw ValidationException::withMessages([
                'budget_band' => 'Selected budget is out of range for this project type.',
            ]);
        }
    }

    /** Decoded attribution payload — empty array if missing or malformed. */
    private function decodeAttribution(?string $raw): array
    {
        $decoded = json_decode($raw ?? '{}', true);

        return is_array($decoded) ? $decoded : [];
    }

    private function createAttribution(Lead $lead, array $attribution): void
    {
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
