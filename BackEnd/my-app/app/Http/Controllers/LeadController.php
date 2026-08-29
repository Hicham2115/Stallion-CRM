<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\LeadAttribution;
use App\Models\LeadSegmentation;
use App\Models\User;
use App\Notifications\CrmNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class LeadController extends Controller
{
    /**
     * Unscoped by default — a sales user sees the same Clients list as
     * admin. `?mine=1` narrows to assigned_sales_id = the signed-in rep,
     * used only by /rep/pipeline (LivePipelineBoard's `mine` prop) — that's
     * the one screen meant to be a private per-rep working queue; Clients
     * is a shared, company-wide list on both admin and rep.
     *
     * A `dev` user is always scoped, unconditionally — unlike a rep's
     * `mine`, there's no company-wide "all projects" screen a developer is
     * meant to see, so this isn't optional the way `mine` is.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $mine = $request->boolean('mine');

        // stageHistory eager-loaded here (not a separate endpoint) because
        // the Lead Details dialog reads straight off the lead object it
        // already has from this list — see LeadStageHistory. assignedSales
        // (name only) is here for the Reports CSV export's "Assigned rep"
        // column — no separate "list users" endpoint exists yet.
        $leads = Lead::with(['attribution', 'stageHistory', 'assignedSales:id,name', 'developers:id,name', 'clientUser:id,email'])
            ->when($mine && $user->role === 'sales', fn ($q) => $q->where('assigned_sales_id', $user->id))
            ->when($user->role === 'dev', fn ($q) => $q->whereHas('developers', fn ($dq) => $dq->where('users.id', $user->id)))
            ->orderByDesc('created_at')
            ->get();

        return response()->json($leads);
    }

    /** A sales user may only act on their own leads — the list endpoint
     *  already hides everyone else's, but stage/workflow updates are
     *  reached by lead id directly and need their own check. Admin is
     *  unrestricted. */
    private function assertOwnsLead(Request $request, Lead $lead): void
    {
        $user = $request->user();

        if ($user->role === 'sales' && $lead->assigned_sales_id !== $user->id) {
            abort(403, 'This lead is not assigned to you.');
        }
    }

    /**
     * One lead, for a dev opening their project page directly (not from
     * the already-fetched list) — same scoping as index(): a dev only
     * reaches a lead they're actually assigned to.
     */
    public function show(Request $request, Lead $lead)
    {
        $this->assertOwnsLead($request, $lead);

        $user = $request->user();
        if ($user->role === 'dev' && ! $lead->developers()->where('users.id', $user->id)->exists()) {
            abort(403, 'You are not assigned to this project.');
        }

        return response()->json($lead->fresh([
            'attribution', 'stageHistory', 'assignedSales:id,name', 'developers:id,name', 'clientUser:id,email', 'milestones', 'previews',
        ]));
    }

    /**
     * Create the client's own sign-in for this lead and link it — what
     * turns on /portal for them. Admin-only. The lead may already have a
     * linked account; this always creates a NEW one and overwrites the
     * link, since there's no "edit" UI for it yet and re-running this is
     * how an admin would reset a client's forgotten credentials today.
     */
    public function createPortalAccount(Request $request, Lead $lead)
    {
        $data = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $user = User::create([
            'name' => $lead->full_name,
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => 'client',
            'active' => true,
        ]);

        $lead->client_user_id = $user->id;
        $lead->save();

        return response()->json($user->only(['id', 'name', 'email', 'role']), 201);
    }

    /**
     * Drag-and-drop entry point for the pipeline board. Only `stage` (and
     * `lost_reason`, when moving to "lost") are writable here — everything
     * else about a lead is edited elsewhere. Timestamp stamping, track
     * derivation and the "lost needs a reason" rule all live in
     * LeadObserver::saving(), so this stays a thin pass-through to it.
     */
    public function updateStage(Request $request, Lead $lead)
    {
        $this->assertOwnsLead($request, $lead);

        $data = $request->validate([
            'stage' => ['required', 'string', 'in:'.implode(',', Lead::STAGES)],
            'lost_reason' => ['nullable', 'string', 'in:'.implode(',', Lead::LOST_REASONS)],
        ]);

        $lead->stage = $data['stage'];
        if (array_key_exists('lost_reason', $data)) {
            $lead->lost_reason = $data['lost_reason'];
        }

        // Not caught here: a ValidationException from the "lost needs a
        // reason" guard in LeadObserver is meant to reach the client as a
        // normal 422 — Laravel's handler already does that for API routes.
        try {
            $lead->save();
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('Lead stage update failed', [
                'lead_id' => $lead->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['error' => 'Could not update this lead. Please try again.'], 500);
        }

        return response()->json($lead->fresh(['attribution', 'stageHistory']));
    }

    /**
     * The consult/second-meeting/MVP/closing workflow fields — everything
     * the Lead Details dialog can edit directly. Deliberately NOT here:
     * `stage` (updateStage() above) and any of the auto-stamped timestamps
     * (first_contact_at, consult_booked_at, consult_completed_at,
     * mvp_started_at, closed_at, delivery_started_at, delivered_at, lost_at
     * — LeadObserver owns those).
     *
     * Financial scope was deliberately cut back to `project_cost` alone
     * (contract_value/recurring_mrr/payment_schedule/contract_signed_date
     * were tried and reverted in the same session — the business wants the
     * workflow simple for now, not full deal-financial entry). Revenue/CAC/
     * LTV KPIs stay null until contract_value gets a real write path later.
     *
     * `sometimes` on every rule + Eloquent's fill() means an omitted field
     * is left untouched, not cleared — a partial PATCH only ever changes
     * what it actually sent.
     */
    public function updateWorkflow(Request $request, Lead $lead)
    {
        $this->assertOwnsLead($request, $lead);

        $data = $request->validate([
            'consult_scheduled_for' => ['sometimes', 'nullable', 'date'],
            'consult_attended' => ['sometimes', 'nullable', 'boolean'],
            'consult_outcome' => ['sometimes', 'nullable', 'string', 'in:'.implode(',', config('leads.consult_outcomes'))],
            'needs_second_meeting' => ['sometimes', 'nullable', 'boolean'],
            'second_meeting_scheduled_for' => ['sometimes', 'nullable', 'date'],
            'second_meeting_outcome_good' => ['sometimes', 'nullable', 'boolean'],
            'mvp_type' => ['sometimes', 'nullable', 'string', 'in:'.implode(',', config('leads.product_types'))],
            'mvp_deadline' => ['sometimes', 'nullable', 'date'],
            'mvp_cost' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'mvp_delivered_at' => ['sometimes', 'nullable', 'date'],
            'closing_meeting_scheduled_for' => ['sometimes', 'nullable', 'date'],
            'closing_meeting_attended' => ['sometimes', 'nullable', 'boolean'],
            'deposit_collected' => ['sometimes', 'nullable', 'boolean'],
            'project_cost' => ['sometimes', 'nullable', 'numeric', 'min:0'],
        ]);

        $lead->fill($data);

        try {
            $lead->save();
        } catch (\Throwable $e) {
            Log::error('Lead workflow update failed', [
                'lead_id' => $lead->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['error' => 'Could not update this lead. Please try again.'], 500);
        }

        return response()->json($lead->fresh(['attribution', 'stageHistory']));
    }

    /**
     * The CRM's own "Add Client" button (Clients page, both admin and
     * sales) — distinct from store() below, which is the public site's
     * multi-step intake form and needs none of that funnel data. A sales
     * user's lead is assigned to themselves right away: that's what makes
     * this a rep's OWN client the moment they add it, no separate admin
     * "assign this to a rep" step required. Admin-created leads are left
     * unassigned — no "pick a rep" UI exists yet (see index()'s note on
     * there being no list-users endpoint).
     */
    public function storeManual(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'full_name' => ['required', 'string', 'min:2', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'phone' => ['required', 'string', 'min:7'],
            'business_type' => ['nullable', 'string', 'max:255'],
        ]);

        $lead = Lead::create([
            'full_name' => $data['full_name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'business_type' => $data['business_type'] ?? null,
            'status' => 'new',
            'stage' => 'new_lead',
            'assigned_sales_id' => $user->role === 'sales' ? $user->id : null,
            'application_completed_at' => now(),
        ]);

        return response()->json($lead->fresh(['attribution', 'stageHistory', 'assignedSales:id,name']), 201);
    }

    /**
     * Assign this lead to one developer — an admin-only action (Clients/
     * Pipeline dialog). `developers` is a many-to-many on the model (a
     * project can technically have more than one), but the UI here only
     * ever offers picking one at a time, so `sync()` with a single id (or
     * an empty array to unassign) is what "assign to a dev" means in
     * practice rather than an additive attach().
     */
    public function assignDeveloper(Request $request, Lead $lead)
    {
        $data = $request->validate([
            'developer_id' => ['nullable', 'integer', Rule::exists('users', 'id')->where('role', 'dev')],
        ]);

        $lead->developers()->sync($data['developer_id'] ? [$data['developer_id']] : []);

        if ($data['developer_id']) {
            User::find($data['developer_id'])?->notify(new CrmNotification(
                'New project assigned',
                "You've been assigned to {$lead->full_name}'s project.",
                "/dev/{$lead->id}",
            ));
        }

        return response()->json($lead->fresh(['developers:id,name']));
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
            'product_type' => ['required', 'string', 'in:'.implode(',', config('leads.product_types'))],
            // Normally derived from product_type (see Lead::trackForProductType()) —
            // nullable here so a caller can omit it; when it IS sent, that's a
            // manual override and wins.
            'track' => ['nullable', 'string', 'in:low_ticket,high_ticket'],

            'budget_band' => ['required', 'string', 'in:'.implode(',', config('leads.budget_bands'))],
            'need_description' => ['required', 'string', 'min:10', 'max:2000'],
            'desired_launch' => ['required', 'string', 'in:'.implode(',', config('leads.desired_launch_options'))],

            'brief_file' => ['nullable', 'file', 'max:10240', 'mimes:pdf,doc,docx,png,jpg,jpeg'],

            'attribution' => ['nullable', 'string'],
        ]);

        $data['track'] ??= Lead::trackForProductType($data['product_type']);

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
                    // Set explicitly, not left to the `stage` column's DB
                    // default: LeadObserver::saved() reads $lead->stage
                    // right after create() to log the first stage-history
                    // row, and an implicit DB-only default never makes it
                    // onto the in-memory model, so that read would be null.
                    'stage' => 'new_lead',
                    // The multi-step intake form saves once, atomically, on
                    // this final submit — there's no earlier "started
                    // filling it out" event captured anywhere, so
                    // application_started_at is deliberately left null
                    // rather than set to the same instant (that would fake
                    // a 100% completion rate). See the Prompt 3 report.
                    'application_completed_at' => now(),
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

        // Best-effort — a notification failure shouldn't turn a saved lead
        // into a 500 for the person who just submitted it.
        try {
            User::where('role', 'admin')->get()->each->notify(new CrmNotification(
                'New lead',
                "{$lead->full_name} just submitted an application.",
                "/admin/clients/{$lead->id}",
            ));
        } catch (\Throwable $e) {
            Log::error('New lead notification failed', ['lead_id' => $lead->id, 'error' => $e->getMessage()]);
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
                    // Same reason as store() above — set explicitly so
                    // LeadObserver::saved() has a real value to log.
                    'stage' => 'new_lead',
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
