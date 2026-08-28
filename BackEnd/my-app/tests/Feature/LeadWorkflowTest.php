<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class LeadWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $user = User::factory()->create(['role' => 'admin']);
        $this->actingAs($user, 'sanctum');

        return $user;
    }

    private function moveStage(Lead $lead, string $stage, ?string $lostReason = null): TestResponse
    {
        return $this->patchJson("/api/leads/{$lead->id}/stage", array_filter([
            'stage' => $stage,
            'lost_reason' => $lostReason,
        ], fn ($v) => $v !== null));
    }

    // ── Section 13: stage transitions stamp the right timestamp, once ──

    public static function stageTransitionProvider(): array
    {
        return [
            'new_lead -> contacted stamps first_contact_at' => ['contacted', 'first_contact_at'],
            'contacted -> consult_booked stamps consult_booked_at' => ['consult_booked', 'consult_booked_at'],
            'consult_booked -> consult_completed stamps consult_completed_at' => ['consult_completed', 'consult_completed_at'],
            'consult_completed -> mvp_in_progress stamps mvp_started_at' => ['mvp_in_progress', 'mvp_started_at'],
            'mvp_in_progress -> closing_booked has no dedicated timestamp' => ['closing_booked', null],
            'closing_booked -> won stamps closed_at' => ['won', 'closed_at'],
            'won -> in_delivery stamps delivery_started_at' => ['in_delivery', 'delivery_started_at'],
            'in_delivery -> delivered stamps delivered_at' => ['delivered', 'delivered_at'],
        ];
    }

    #[DataProvider('stageTransitionProvider')]
    public function test_stage_transition_stamps_timestamp_once_and_never_overwrites(string $targetStage, ?string $column): void
    {
        $this->admin();
        $lead = Lead::factory()->create();

        $response = $this->moveStage($lead, $targetStage);
        $response->assertOk();
        $lead->refresh();

        if ($column === null) {
            // closing_booked has no dedicated stage-timestamp per the spec
            // (closing_meeting_scheduled_for is a manually-set business
            // field, not an auto-stamp) — just confirm the move itself worked.
            $this->assertSame($targetStage, $lead->stage);

            return;
        }

        $this->assertNotNull($lead->{$column}, "$column should be set after moving to $targetStage");
        $stamped = $lead->{$column};

        // Move away and back — the ORIGINAL timestamp must survive both hops.
        $this->moveStage($lead, 'lost', 'other');
        $this->moveStage($lead, $targetStage);
        $lead->refresh();

        $this->assertTrue(
            $lead->{$column}->eq($stamped),
            "$column was overwritten by a later transition back into $targetStage",
        );
    }

    public function test_lost_at_survives_moving_away_and_back_to_lost(): void
    {
        $this->admin();
        $lead = Lead::factory()->create();

        $this->moveStage($lead, 'lost', 'price')->assertOk();
        $lead->refresh();
        $this->assertNotNull($lead->lost_at);
        $original = $lead->lost_at;

        // Moving away from lost must not erase the historical lost_at.
        $this->moveStage($lead, 'contacted')->assertOk();
        $lead->refresh();
        $this->assertNotNull($lead->lost_at);
        $this->assertTrue($lead->lost_at->eq($original));

        // Moving back to lost must not reset it either.
        $this->moveStage($lead, 'lost', 'timing')->assertOk();
        $lead->refresh();
        $this->assertTrue($lead->lost_at->eq($original), 'lost_at was reset on a second move to lost');
        // lost_reason, unlike lost_at, DOES update — it's a plain editable
        // field, not a stage-transition stamp.
        $this->assertSame('timing', $lead->lost_reason);
    }

    public function test_lost_still_requires_a_reason(): void
    {
        $this->admin();
        $lead = Lead::factory()->create();

        $this->moveStage($lead, 'lost')->assertStatus(422);
        $this->assertSame('new_lead', $lead->fresh()->stage);
    }

    // ── Section 2: WON_STAGES — historical won survives stage progress ──

    public function test_won_in_delivery_and_delivered_all_count_as_historical_won(): void
    {
        $this->admin();
        Lead::factory()->create(['contract_value' => 1000, 'stage' => 'won']);

        $lead2 = Lead::factory()->create(['contract_value' => 2000]);
        $lead2->stage = 'won';
        $lead2->save();
        $lead2->stage = 'in_delivery';
        $lead2->save();

        $lead3 = Lead::factory()->create(['contract_value' => 3000]);
        $lead3->stage = 'won';
        $lead3->save();
        $lead3->stage = 'in_delivery';
        $lead3->save();
        $lead3->stage = 'delivered';
        $lead3->save();

        Lead::factory()->create(['stage' => 'lost', 'lost_reason' => 'price']);

        $data = $this->getJson('/api/analytics/kpis')->json();

        // Revenue must include all three historical wins, not just the one
        // still literally sitting in the "won" column.
        $this->assertEqualsWithDelta(6000.0, $data['economics']['revenue'], 0.0001);
    }

    public function test_funnel_counts_are_current_stage_not_historical_won(): void
    {
        // funnel() is explicitly a CURRENT-STATE snapshot (the Kanban column
        // counts) — it must NOT use the WON_STAGES-widened definition, or a
        // delivered lead would double-count against both won and delivered.
        $this->admin();

        $lead = Lead::factory()->create();
        $lead->stage = 'won';
        $lead->save();
        $lead->stage = 'in_delivery';
        $lead->save();
        $lead->stage = 'delivered';
        $lead->save();

        $data = $this->getJson('/api/analytics/kpis')->json();

        $this->assertSame(0, $data['funnel']['won']);
        $this->assertSame(0, $data['funnel']['in_delivery']);
        $this->assertSame(1, $data['funnel']['delivered']);
    }

    // ── Section 3/4/6: workflow fields are editable via the Lead Details endpoint ──

    public function test_consult_fields_are_editable_and_outcome_is_validated(): void
    {
        $this->admin();
        $lead = Lead::factory()->create();

        $this->patchJson("/api/leads/{$lead->id}", ['consult_outcome' => 'not_a_real_outcome'])
            ->assertStatus(422);

        $response = $this->patchJson("/api/leads/{$lead->id}", [
            'consult_scheduled_for' => now()->addDay()->toDateTimeString(),
            'consult_attended' => true,
            'consult_outcome' => 'agreed_mvp',
        ]);
        $response->assertOk();

        $lead->refresh();
        $this->assertTrue((bool) $lead->consult_attended);
        $this->assertSame('agreed_mvp', $lead->consult_outcome);
        // Marking attended also stamps consult_completed_at (section 3/12).
        $this->assertNotNull($lead->consult_completed_at);
    }

    public function test_mvp_fields_are_editable_and_type_reuses_product_type_enum(): void
    {
        $this->admin();
        $lead = Lead::factory()->create();

        $this->patchJson("/api/leads/{$lead->id}", ['mvp_type' => 'not_a_product_type'])
            ->assertStatus(422);

        $this->patchJson("/api/leads/{$lead->id}", [
            'mvp_type' => 'saas',
            'mvp_deadline' => now()->addWeek()->toDateString(),
            'mvp_cost' => 2500,
        ])->assertOk();

        $lead->refresh();
        $this->assertSame('saas', $lead->mvp_type);
        $this->assertEqualsWithDelta(2500.0, (float) $lead->mvp_cost, 0.01);
    }

    public function test_mvp_delivered_at_does_not_overwrite_on_unrelated_edits(): void
    {
        $this->admin();
        $lead = Lead::factory()->create();

        $deliveredAt = now()->subDay()->toDateTimeString();
        $this->patchJson("/api/leads/{$lead->id}", ['mvp_delivered_at' => $deliveredAt])->assertOk();
        $lead->refresh();
        $stamped = $lead->mvp_delivered_at;
        $this->assertNotNull($stamped);

        // A PATCH that omits mvp_delivered_at must leave it untouched.
        $this->patchJson("/api/leads/{$lead->id}", ['mvp_cost' => 999])->assertOk();
        $lead->refresh();
        $this->assertTrue($lead->mvp_delivered_at->eq($stamped));
    }

    public function test_closing_and_deposit_fields_are_editable(): void
    {
        $this->admin();
        $lead = Lead::factory()->create();

        $this->patchJson("/api/leads/{$lead->id}", [
            'closing_meeting_scheduled_for' => now()->addDays(3)->toDateTimeString(),
            'closing_meeting_attended' => true,
            'deposit_collected' => true,
        ])->assertOk();

        $lead->refresh();
        $this->assertTrue((bool) $lead->closing_meeting_attended);
        $this->assertTrue((bool) $lead->deposit_collected);
    }

    public function test_workflow_endpoint_cannot_set_stage_or_observer_owned_timestamps(): void
    {
        // Only the fields explicitly validated in updateWorkflow() can be
        // set through it — stage and the auto-stamped columns are silently
        // ignored (Laravel's validate() drops unknown keys), not writable
        // through this endpoint.
        $this->admin();
        $lead = Lead::factory()->create();

        $this->patchJson("/api/leads/{$lead->id}", [
            'stage' => 'won',
            'closed_at' => now()->toDateTimeString(),
            'mvp_cost' => 100,
        ])->assertOk();

        $lead->refresh();
        $this->assertSame('new_lead', $lead->stage);
        $this->assertNull($lead->closed_at);
    }

    public function test_dev_and_client_roles_cannot_edit_workflow_fields(): void
    {
        $lead = Lead::factory()->create();

        $dev = User::factory()->create(['role' => 'dev']);
        $this->actingAs($dev, 'sanctum');
        $this->patchJson("/api/leads/{$lead->id}", ['mvp_cost' => 100])->assertForbidden();

        $client = User::factory()->create(['role' => 'client']);
        $this->actingAs($client, 'sanctum');
        $this->patchJson("/api/leads/{$lead->id}", ['mvp_cost' => 100])->assertForbidden();
    }

    // ── Section 5: MVP on-time rate uses real delivery data, not a proxy ──

    public function test_mvp_on_time_rate_uses_mvp_delivered_at_not_mvp_type_proxy(): void
    {
        $this->admin();

        // Has mvp_type but was NEVER delivered — must NOT count in either
        // side of the ratio (the old Prompt 3 proxy would have counted this
        // as "built").
        Lead::factory()->create(['mvp_type' => 'crm']);

        // Delivered on time.
        Lead::factory()->create([
            'mvp_type' => 'crm',
            'mvp_deadline' => '2026-06-10',
            'mvp_delivered_at' => '2026-06-05 10:00:00',
        ]);

        // Delivered late.
        Lead::factory()->create([
            'mvp_type' => 'saas',
            'mvp_deadline' => '2026-06-10',
            'mvp_delivered_at' => '2026-06-15 10:00:00',
        ]);

        // Delivered but no deadline recorded — must be excluded from both
        // sides ("do not treat missing dates as on-time").
        Lead::factory()->create([
            'mvp_type' => 'platform',
            'mvp_delivered_at' => now(),
        ]);

        $data = $this->getJson('/api/analytics/kpis')->json();

        // 2 delivered-with-deadline out of those, 1 on time.
        $this->assertEqualsWithDelta(0.5, $data['middle_funnel']['mvp_on_time_rate'], 0.0001);
    }

    // ── Section 15/16/17: date filtering ──

    public function test_sales_performance_respects_date_range_not_lifetime(): void
    {
        $this->admin();
        $rep = User::factory()->create(['role' => 'sales']);

        $old = Lead::factory()->create(['assigned_sales_id' => $rep->id, 'contract_value' => 5000]);
        $old->stage = 'won';
        $old->save();
        $old->closed_at = now()->subMonths(6);
        $old->saveQuietly();

        $recent = Lead::factory()->create(['assigned_sales_id' => $rep->id, 'contract_value' => 1000]);
        $recent->stage = 'won';
        $recent->save(); // closed_at stamped to "now"

        $inRange = $this->getJson('/api/analytics/kpis?date_from='.now()->subWeek()->toDateString())->json();
        $repRow = collect($inRange['sales'])->firstWhere('assigned_sales_id', $rep->id);
        $this->assertEqualsWithDelta(1000.0, $repRow['revenue_generated'], 0.01);

        $lifetime = $this->getJson('/api/analytics/kpis')->json();
        $repRowLifetime = collect($lifetime['sales'])->firstWhere('assigned_sales_id', $rep->id);
        $this->assertEqualsWithDelta(6000.0, $repRowLifetime['revenue_generated'], 0.01);
    }

    public function test_developer_active_project_load_is_current_state_not_date_filtered(): void
    {
        $this->admin();
        $dev = User::factory()->create(['role' => 'dev']);

        $lead = Lead::factory()->create(['stage' => 'in_delivery']);
        $lead->developers()->attach($dev->id);

        // A date filter far in the past should NOT hide a current-state
        // "active project load" figure — it's a snapshot, not an event.
        $data = $this->getJson('/api/analytics/kpis?date_from=2000-01-01&date_to=2000-01-02')->json();
        $devRow = collect($data['developers'])->firstWhere('user_id', $dev->id);

        $this->assertSame(1, $devRow['active_project_load']);
    }

    public function test_developer_delivered_count_respects_date_range(): void
    {
        $this->admin();
        $dev = User::factory()->create(['role' => 'dev']);

        $lead = Lead::factory()->create();
        $lead->developers()->attach($dev->id);
        $lead->stage = 'won';
        $lead->save();
        $lead->stage = 'in_delivery';
        $lead->save();
        $lead->stage = 'delivered';
        $lead->save(); // delivered_at stamped to "now"

        $outOfRange = $this->getJson('/api/analytics/kpis?date_from=2000-01-01&date_to=2000-01-02')->json();
        $devRowOut = collect($outOfRange['developers'])->firstWhere('user_id', $dev->id);
        $this->assertSame(0, $devRowOut['delivered_count']);

        $inRange = $this->getJson('/api/analytics/kpis?date_from='.now()->subDay()->toDateString())->json();
        $devRowIn = collect($inRange['developers'])->firstWhere('user_id', $dev->id);
        $this->assertSame(1, $devRowIn['delivered_count']);
    }

    // ── Project cost entry (PATCH /api/leads/{id}) ───────────────────────
    // Scope deliberately cut back to project_cost alone in this same
    // session — contract_value/recurring_mrr/payment_schedule/
    // contract_signed_date were built and then reverted (see the report):
    // the business wants the workflow kept simple for now.

    public function test_admin_can_update_project_cost(): void
    {
        $this->admin();
        $lead = Lead::factory()->create(['stage' => 'won']);

        $this->patchJson("/api/leads/{$lead->id}", ['project_cost' => 6000])->assertOk();

        $lead->refresh();
        $this->assertEqualsWithDelta(6000.0, (float) $lead->project_cost, 0.01);
    }

    public function test_sales_can_update_project_cost(): void
    {
        $sales = User::factory()->create(['role' => 'sales']);
        $this->actingAs($sales, 'sanctum');
        $lead = Lead::factory()->create(['stage' => 'won', 'assigned_sales_id' => $sales->id]);

        $this->patchJson("/api/leads/{$lead->id}", ['project_cost' => 4200])->assertOk();

        $lead->refresh();
        $this->assertEqualsWithDelta(4200.0, (float) $lead->project_cost, 0.01);
    }

    public function test_dev_and_client_roles_cannot_update_project_cost(): void
    {
        $lead = Lead::factory()->create(['stage' => 'won']);

        $dev = User::factory()->create(['role' => 'dev']);
        $this->actingAs($dev, 'sanctum');
        $this->patchJson("/api/leads/{$lead->id}", ['project_cost' => 1000])->assertForbidden();

        $client = User::factory()->create(['role' => 'client']);
        $this->actingAs($client, 'sanctum');
        $this->patchJson("/api/leads/{$lead->id}", ['project_cost' => 1000])->assertForbidden();

        $this->assertNull($lead->fresh()->project_cost);
    }

    public function test_negative_project_cost_is_rejected(): void
    {
        $this->admin();
        $lead = Lead::factory()->create();

        $this->patchJson("/api/leads/{$lead->id}", ['project_cost' => -1])->assertStatus(422);

        $this->assertNull($lead->fresh()->project_cost);
    }

    // ── Second meeting (PATCH /api/leads/{id}) ───────────────────────────

    public function test_second_meeting_fields_are_editable(): void
    {
        $this->admin();
        $lead = Lead::factory()->create();

        $this->patchJson("/api/leads/{$lead->id}", [
            'needs_second_meeting' => true,
            'second_meeting_scheduled_for' => now()->addDays(3)->toDateTimeString(),
            'second_meeting_outcome_good' => true,
        ])->assertOk();

        $lead->refresh();
        $this->assertTrue((bool) $lead->needs_second_meeting);
        $this->assertNotNull($lead->second_meeting_scheduled_for);
        $this->assertTrue((bool) $lead->second_meeting_outcome_good);
    }

    public function test_dev_and_client_roles_cannot_edit_second_meeting_fields(): void
    {
        $lead = Lead::factory()->create();

        $dev = User::factory()->create(['role' => 'dev']);
        $this->actingAs($dev, 'sanctum');
        $this->patchJson("/api/leads/{$lead->id}", ['needs_second_meeting' => true])->assertForbidden();

        $this->assertNull($lead->fresh()->needs_second_meeting);
    }

    public function test_a_lead_can_become_won_with_no_second_meeting_recorded(): void
    {
        // Same "never block the workflow" rule as project cost — a lead
        // that never needed (or never got) a second meeting must still be
        // able to reach `won`.
        $this->admin();
        $lead = Lead::factory()->create();

        $this->patchJson("/api/leads/{$lead->id}/stage", ['stage' => 'won'])->assertOk();

        $this->assertSame('won', $lead->fresh()->stage);
    }

    public function test_second_meeting_kpis_reflect_entered_data(): void
    {
        $this->admin();

        // Consult completed, no second meeting needed.
        Lead::factory()->create(['consult_completed_at' => now(), 'needs_second_meeting' => false]);

        // Needed, scheduled, and it went well.
        Lead::factory()->create([
            'consult_completed_at' => now(),
            'needs_second_meeting' => true,
            'second_meeting_scheduled_for' => now()->addDay(),
            'second_meeting_outcome_good' => true,
        ]);

        // Needed, scheduled, but it did NOT go well.
        Lead::factory()->create([
            'consult_completed_at' => now(),
            'needs_second_meeting' => true,
            'second_meeting_scheduled_for' => now()->addDay(),
            'second_meeting_outcome_good' => false,
        ]);

        // Needed, but not scheduled yet (no outcome either) — must not
        // count on either side of the booking/outcome rates.
        Lead::factory()->create(['consult_completed_at' => now(), 'needs_second_meeting' => true]);

        $data = $this->getJson('/api/analytics/kpis')->json()['middle_funnel'];

        // 3 of 4 consult-completed leads needed a second meeting.
        $this->assertEqualsWithDelta(0.75, $data['second_meeting_needed_rate'], 0.0001);
        // 2 of 3 that needed one actually got it scheduled.
        $this->assertEqualsWithDelta(2 / 3, $data['second_meeting_booking_rate'], 0.0001);
        // 1 of 2 with a recorded outcome went well.
        $this->assertEqualsWithDelta(0.5, $data['second_meeting_good_outcome_rate'], 0.0001);
    }

    // ── Per-rep pipeline scoping (each sales account sees only its own) ──

    public function test_sales_index_is_unscoped_by_default_same_as_admin(): void
    {
        $repA = User::factory()->create(['role' => 'sales']);
        $repB = User::factory()->create(['role' => 'sales']);

        Lead::factory()->create(['assigned_sales_id' => $repA->id]);
        Lead::factory()->create(['assigned_sales_id' => $repB->id]);
        Lead::factory()->create();

        $this->actingAs($repA, 'sanctum');
        $this->getJson('/api/leads')->assertOk()->assertJsonCount(3);
    }

    public function test_sales_index_with_mine_param_scopes_to_their_own_assigned_leads(): void
    {
        $repA = User::factory()->create(['role' => 'sales']);
        $repB = User::factory()->create(['role' => 'sales']);

        Lead::factory()->create(['assigned_sales_id' => $repA->id]);
        Lead::factory()->create(['assigned_sales_id' => $repB->id]);
        Lead::factory()->create(); // unassigned — belongs to no rep's pipeline

        $this->actingAs($repA, 'sanctum');
        $response = $this->getJson('/api/leads?mine=1');

        $response->assertOk();
        $ids = collect($response->json())->pluck('assigned_sales_id');
        $this->assertTrue($ids->every(fn ($id) => $id === $repA->id));
        $this->assertCount(1, $response->json());
    }

    public function test_admin_index_ignores_mine_param_and_returns_every_lead(): void
    {
        $this->admin();
        $rep = User::factory()->create(['role' => 'sales']);
        Lead::factory()->create(['assigned_sales_id' => $rep->id]);
        Lead::factory()->create();

        $response = $this->getJson('/api/leads?mine=1');

        $this->assertCount(2, $response->json());
    }

    public function test_sales_cannot_move_a_lead_not_assigned_to_them(): void
    {
        $repA = User::factory()->create(['role' => 'sales']);
        $repB = User::factory()->create(['role' => 'sales']);
        $lead = Lead::factory()->create(['assigned_sales_id' => $repB->id]);

        $this->actingAs($repA, 'sanctum');
        $this->patchJson("/api/leads/{$lead->id}/stage", ['stage' => 'contacted'])
            ->assertForbidden();

        $this->assertSame('new_lead', $lead->fresh()->stage);
    }

    public function test_sales_cannot_edit_workflow_fields_on_a_lead_not_assigned_to_them(): void
    {
        $repA = User::factory()->create(['role' => 'sales']);
        $repB = User::factory()->create(['role' => 'sales']);
        $lead = Lead::factory()->create(['assigned_sales_id' => $repB->id]);

        $this->actingAs($repA, 'sanctum');
        $this->patchJson("/api/leads/{$lead->id}", ['mvp_cost' => 500])
            ->assertForbidden();

        $this->assertNull($lead->fresh()->mvp_cost);
    }

    public function test_sales_can_move_their_own_assigned_lead(): void
    {
        $rep = User::factory()->create(['role' => 'sales']);
        $lead = Lead::factory()->create(['assigned_sales_id' => $rep->id]);

        $this->actingAs($rep, 'sanctum');
        $this->patchJson("/api/leads/{$lead->id}/stage", ['stage' => 'contacted'])
            ->assertOk();

        $this->assertSame('contacted', $lead->fresh()->stage);
    }

    // ── Stage history audit trail (lead_stage_history) ──────────────────

    public function test_creating_a_lead_logs_its_initial_stage(): void
    {
        $this->admin();
        $lead = Lead::factory()->create();

        $this->assertCount(1, $lead->stageHistory);
        $this->assertSame('new_lead', $lead->stageHistory->first()->stage);
    }

    public function test_each_stage_move_appends_a_history_row_including_repeat_visits(): void
    {
        $this->admin();
        $lead = Lead::factory()->create();

        $this->moveStage($lead, 'contacted')->assertOk();
        $this->moveStage($lead, 'lost', 'other')->assertOk();
        $this->moveStage($lead, 'contacted')->assertOk();

        $stages = $lead->stageHistory()->pluck('stage')->all();
        // Visited "contacted" twice — both visits are logged, not just the
        // first (unlike Lead::STAGE_TIMESTAMP_EVENTS, which never repeats).
        $this->assertSame(['new_lead', 'contacted', 'lost', 'contacted'], $stages);
    }

    public function test_workflow_field_edits_do_not_add_a_stage_history_row(): void
    {
        $this->admin();
        $lead = Lead::factory()->create();

        $this->patchJson("/api/leads/{$lead->id}", ['mvp_cost' => 500])->assertOk();

        $this->assertCount(1, $lead->fresh()->stageHistory);
    }

    public function test_segment_breakdown_respects_date_range(): void
    {
        $this->admin();

        $old = Lead::factory()->create(['segment_community' => 'founders', 'country' => 'Morocco']);
        $old->created_at = now()->subYear();
        $old->saveQuietly();

        Lead::factory()->create(['segment_community' => 'founders', 'country' => 'Morocco']);

        $inRange = $this->getJson('/api/analytics/kpis?date_from='.now()->subWeek()->toDateString())->json();
        $segment = collect($inRange['timing']['conversion_and_cac_by_segment'])
            ->firstWhere('segment_community', 'founders');

        $this->assertSame(1, $segment['leads']);
    }
}
