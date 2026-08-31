<?php

namespace App\Models;

use App\Observers\LeadObserver;
use Database\Factories\LeadFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'full_name',
    'email',
    'phone',
    'role',
    'is_decision_maker',
    'business_type',
    'product_type',
    'track',
    'budget_band',
    'need_description',
    'desired_launch',
    'brief_file_path',
    'live_url',
    'status',
    'stage',
    'lost_reason',
    'segment_community',
    'country',
    'assigned_sales_id',
    'application_started_at',
    'application_completed_at',
    'first_contact_at',
    'consult_booked_at',
    'consult_scheduled_for',
    'consult_attended',
    'consult_outcome',
    'consult_completed_at',
    'needs_second_meeting',
    'second_meeting_scheduled_for',
    'second_meeting_outcome_good',
    'mvp_type',
    'mvp_deadline',
    'mvp_cost',
    'mvp_delivered_at',
    'mvp_started_at',
    'closing_meeting_scheduled_for',
    'closing_meeting_attended',
    'closed_at',
    'delivery_started_at',
    'deposit_collected',
    'contract_value',
    'project_cost',
    'recurring_mrr',
    'payment_schedule',
    'contract_signed_date',
    'project_deadline',
    'project_delivered_date',
    'delivered_at',
    'lost_at',
    'budgeted_hours',
    'actual_hours',
    'revision_count',
])]
#[ObservedBy(LeadObserver::class)]
class Lead extends Model
{
    /** @use HasFactory<LeadFactory> */
    use HasFactory;

    /** Every stage the pipeline supports, in order. `lost` can happen from most. */
    public const STAGES = [
        'new_lead',
        'contacted',
        'consult_booked',
        'consult_completed',
        'mvp_in_progress',
        'closing_booked',
        'won',
        'in_delivery',
        'delivered',
        'lost',
    ];

    /**
     * A lead that reaches `won` stays a won customer even after moving on to
     * in_delivery/delivered — the deal didn't un-happen. Every HISTORICAL
     * commercial KPI (revenue, CAC denominator, deal counts, LTV, close
     * rates, deposit collection) reads through this, via KpiService's
     * wonLeads() helper.
     *
     * This is deliberately NOT used everywhere `stage = 'won'` might appear:
     * funnel() (the Kanban column counts) and developerPerformance()'s
     * active_project_load are CURRENT-STATE snapshots — "how many leads are
     * sitting in this exact column right now" — where widening to
     * WON_STAGES would be wrong (a delivered lead isn't "currently in the
     * Won column" and counting it there would double-count against the
     * Delivered column).
     */
    public const WON_STAGES = ['won', 'in_delivery', 'delivered'];

    public const LOST_REASONS = [
        'price',
        'timing',
        'trust',
        'scope',
        'went_elsewhere',
        'no_response',
        'not_qualified',
        'other',
    ];

    /**
     * Stage -> the column LeadObserver stamps the FIRST time a lead enters
     * that stage (never overwritten after — see LeadObserver::saving()).
     * This is the single source of truth for stage-duration timing, used by
     * both the observer and config/pipeline-live.js's stageEnteredAt() on
     * the frontend (Prompt 4 completed the map — mvp_started_at,
     * delivery_started_at and consult_completed_at were the three gaps
     * Prompt 3 flagged; `new_lead` and `closing_booked` intentionally have
     * no entry, since the spec defines those from application_completed_at/
     * created_at and closing_meeting_scheduled_for — plain fields, not
     * stage-transition stamps).
     */
    public const STAGE_TIMESTAMP_EVENTS = [
        'contacted' => 'first_contact_at',
        'consult_booked' => 'consult_booked_at',
        'consult_completed' => 'consult_completed_at',
        'mvp_in_progress' => 'mvp_started_at',
        'won' => 'closed_at',
        'in_delivery' => 'delivery_started_at',
        'delivered' => 'delivered_at',
        'lost' => 'lost_at',
    ];

    protected function casts(): array
    {
        return [
            'is_decision_maker' => 'boolean',
            'application_started_at' => 'datetime',
            'application_completed_at' => 'datetime',
            'first_contact_at' => 'datetime',
            'consult_booked_at' => 'datetime',
            'consult_scheduled_for' => 'datetime',
            'consult_attended' => 'boolean',
            'consult_completed_at' => 'datetime',
            'needs_second_meeting' => 'boolean',
            'second_meeting_scheduled_for' => 'datetime',
            'second_meeting_outcome_good' => 'boolean',
            'mvp_deadline' => 'date',
            'mvp_cost' => 'decimal:2',
            'mvp_delivered_at' => 'datetime',
            'mvp_started_at' => 'datetime',
            'closing_meeting_scheduled_for' => 'datetime',
            'closing_meeting_attended' => 'boolean',
            'closed_at' => 'datetime',
            'delivery_started_at' => 'datetime',
            'deposit_collected' => 'boolean',
            'contract_value' => 'decimal:2',
            'project_cost' => 'decimal:2',
            'recurring_mrr' => 'decimal:2',
            'contract_signed_date' => 'date',
            'project_deadline' => 'date',
            'project_delivered_date' => 'date',
            'delivered_at' => 'datetime',
            'lost_at' => 'datetime',
            'budgeted_hours' => 'decimal:2',
            'actual_hours' => 'decimal:2',
            'revision_count' => 'integer',
        ];
    }

    public function attribution(): HasOne
    {
        return $this->hasOne(LeadAttribution::class);
    }

    /** Full append-only stage-change audit trail — see LeadStageHistory. */
    public function stageHistory(): HasMany
    {
        return $this->hasMany(LeadStageHistory::class)->orderBy('entered_at');
    }

    public function segmentation(): HasOne
    {
        return $this->hasOne(LeadSegmentation::class);
    }

    /** The one assignment architecture for "who owns this deal" — a real FK
     *  to users, not a parallel rep system. */
    public function assignedSales(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_sales_id');
    }

    /** Plural on purpose — a project can have more than one developer. */
    public function developers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'lead_developer');
    }

    /** The real (role=client) account that can sign in and see this lead on
     *  /portal — see LeadController::createPortalAccount. */
    public function clientUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_user_id');
    }

    /** The dev workspace's "Project Steps" — see LeadMilestone. */
    public function milestones(): HasMany
    {
        return $this->hasMany(LeadMilestone::class)->orderBy('position');
    }

    /** Screenshots/links shared with the client — newest first, matching
     *  the portal's "freshest link wins" read order. */
    public function previews(): HasMany
    {
        return $this->hasMany(LeadPreview::class)->latest();
    }

    /**
     * The normal, automatic path — config('leads.low_ticket_product_types')
     * is the single source of truth, mirrored on the frontend in
     * lib/validations/lead.js's trackForProductType(). A caller that already
     * knows the track (or wants to override it) should just set `track`
     * directly; LeadObserver only fills this in when it's empty.
     */
    public static function trackForProductType(?string $productType): ?string
    {
        if ($productType === null) {
            return null;
        }

        $lowTicket = config('leads.low_ticket_product_types', []);

        return in_array($productType, $lowTicket, true) ? 'low_ticket' : 'high_ticket';
    }
}
