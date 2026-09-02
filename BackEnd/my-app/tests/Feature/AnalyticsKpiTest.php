<?php

namespace Tests\Feature;

use App\Models\AdSpend;
use App\Models\Lead;
use App\Models\LeadAttribution;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnalyticsKpiTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsRole(string $role): User
    {
        $user = User::factory()->create(['role' => $role]);
        $this->actingAs($user, 'sanctum');

        return $user;
    }

    public function test_dev_and_client_roles_are_forbidden(): void
    {
        $this->actingAsRole('dev');
        $this->getJson('/api/analytics/kpis')->assertForbidden();

        $this->actingAsRole('client');
        $this->getJson('/api/analytics/kpis')->assertForbidden();
    }

    public function test_admin_gets_full_kpi_structure_with_no_filters(): void
    {
        $this->actingAsRole('admin');

        $response = $this->getJson('/api/analytics/kpis');

        $response->assertOk()->assertJsonStructure([
            'acquisition' => ['leads', 'applications_started', 'applications_completed', 'completion_rate', 'cpl', 'speed_to_lead_minutes'],
            'middle_funnel' => ['application_to_booking_rate', 'consult_show_rate', 'mvp_on_time_rate'],
            'bottom_funnel' => ['close_rate', 'lost_count', 'lost_reasons'],
            'economics' => ['revenue', 'gross_profit', 'gross_margin', 'cac', 'ltv', 'ltv_cac'],
            'sales',
            'developers',
            'timing',
            'funnel' => Lead::STAGES,
        ]);
    }

    /**
     * A sales rep may see acquisition COST, never company earnings. The
     * figures are removed from the payload, not nulled — null already means
     * "denominator unknown" everywhere in this API, so a redacted revenue
     * sent as null would read as "the agency earned nothing".
     */
    public function test_sales_never_receives_company_financials(): void
    {
        $rep = User::factory()->create(['role' => 'sales']);
        Lead::factory()->create([
            'stage' => 'won',
            'closed_at' => now(),
            'contract_value' => 50000,
            'recurring_mrr' => 1200,
            'assigned_sales_id' => $rep->id,
        ]);
        AdSpend::create(['date' => now()->toDateString(), 'campaign' => 'spring-launch', 'spend' => 2000]);

        $this->actingAs($rep, 'sanctum');
        $data = $this->getJson('/api/analytics/kpis')->assertOk()->json();

        foreach (['revenue', 'project_cost', 'gross_profit', 'gross_margin', 'mrr', 'mvp_cost_total'] as $field) {
            $this->assertArrayNotHasKey($field, $data['economics'], "economics.$field leaked to a sales rep");
        }

        // Per-person ranking, listed under sales.neverReads in config/roles.js.
        $this->assertArrayNotHasKey('sales', $data);
        $this->assertArrayNotHasKey('developers', $data);

        // What a rep IS meant to have: what a customer costs.
        // Delta, not assertSame: json_encode(2000.0) emits `2000`, which
        // decodes back as an int — same convention as every other money
        // assertion in this file.
        $this->assertEqualsWithDelta(2000.0, $data['economics']['cac'], 0.0001);
        $this->assertEqualsWithDelta(2000.0, $data['acquisition']['cpl'], 0.0001);
        $this->assertArrayHasKey('ltv_cac', $data['economics']);
    }

    public function test_campaign_rows_drop_revenue_for_sales_but_keep_cost(): void
    {
        $rep = User::factory()->create(['role' => 'sales']);
        $lead = Lead::factory()->create(['stage' => 'won', 'closed_at' => now(), 'contract_value' => 50000]);
        LeadAttribution::create(['lead_id' => $lead->id, 'utm_campaign' => 'spring-launch']);
        AdSpend::create(['date' => now()->toDateString(), 'campaign' => 'spring-launch', 'spend' => 400]);

        $this->actingAs($rep, 'sanctum');
        $row = $this->getJson('/api/analytics/kpis')->assertOk()->json('campaigns.0');

        $this->assertArrayNotHasKey('revenue', $row);
        $this->assertEqualsWithDelta(400.0, $row['spend'], 0.0001);
        $this->assertEqualsWithDelta(400.0, $row['cpl'], 0.0001);
        $this->assertSame(1, $row['won']);
    }

    /** The redaction must not touch what an admin gets. */
    public function test_admin_still_receives_every_financial_figure(): void
    {
        $this->actingAsRole('admin');

        $data = $this->getJson('/api/analytics/kpis')->assertOk()->json();

        $this->assertArrayHasKey('revenue', $data['economics']);
        $this->assertArrayHasKey('gross_margin', $data['economics']);
        $this->assertArrayHasKey('sales', $data);
        $this->assertArrayHasKey('developers', $data);
    }

    public function test_zero_denominator_returns_null_not_zero_or_fake_number(): void
    {
        $this->actingAsRole('admin');
        // No leads at all — every ratio's denominator is 0.

        $data = $this->getJson('/api/analytics/kpis')->json();

        $this->assertNull($data['acquisition']['completion_rate']);
        $this->assertNull($data['acquisition']['cpl']);
        $this->assertNull($data['bottom_funnel']['close_rate']);
        $this->assertNull($data['economics']['cac']);
        $this->assertSame(0, $data['bottom_funnel']['lost_count']);
        $this->assertSame([], $data['bottom_funnel']['lost_reasons']);
    }

    public function test_leads_count_and_track_filter(): void
    {
        $this->actingAsRole('admin');
        Lead::factory()->create(['track' => 'low_ticket']);
        Lead::factory()->create(['track' => 'low_ticket']);
        Lead::factory()->create(['track' => 'high_ticket']);

        $all = $this->getJson('/api/analytics/kpis')->json();
        $this->assertSame(3, $all['acquisition']['leads']);

        $lowOnly = $this->getJson('/api/analytics/kpis?track=low_ticket')->json();
        $this->assertSame(2, $lowOnly['acquisition']['leads']);

        $highOnly = $this->getJson('/api/analytics/kpis?track=high_ticket')->json();
        $this->assertSame(1, $highOnly['acquisition']['leads']);
    }

    public function test_product_type_filter(): void
    {
        $this->actingAsRole('admin');
        Lead::factory()->create(['product_type' => 'crm']);
        Lead::factory()->create(['product_type' => 'saas']);

        $data = $this->getJson('/api/analytics/kpis?product_type=saas')->json();
        $this->assertSame(1, $data['acquisition']['leads']);
    }

    public function test_country_and_community_filters(): void
    {
        $this->actingAsRole('admin');
        Lead::factory()->create(['country' => 'Morocco', 'segment_community' => 'founders']);
        Lead::factory()->create(['country' => 'France', 'segment_community' => 'founders']);
        Lead::factory()->create(['country' => 'Morocco', 'segment_community' => 'agencies']);

        $morocco = $this->getJson('/api/analytics/kpis?country=Morocco')->json();
        $this->assertSame(2, $morocco['acquisition']['leads']);

        $founders = $this->getJson('/api/analytics/kpis?segment_community=founders')->json();
        $this->assertSame(2, $founders['acquisition']['leads']);

        $moroccoFounders = $this->getJson('/api/analytics/kpis?country=Morocco&segment_community=founders')->json();
        $this->assertSame(1, $moroccoFounders['acquisition']['leads']);
    }

    public function test_assigned_sales_filter_and_grouping(): void
    {
        $admin = $this->actingAsRole('admin');
        $repA = User::factory()->create(['role' => 'sales']);
        $repB = User::factory()->create(['role' => 'sales']);

        Lead::factory()->create(['assigned_sales_id' => $repA->id]);
        Lead::factory()->count(2)->create(['assigned_sales_id' => $repB->id]);
        Lead::factory()->create(); // unassigned

        $repAOnly = $this->getJson("/api/analytics/kpis?assigned_sales={$repA->id}")->json();
        $this->assertSame(1, $repAOnly['acquisition']['leads']);

        $all = $this->getJson('/api/analytics/kpis')->json();
        $names = collect($all['sales'])->pluck('name', 'assigned_sales_id');
        $this->assertTrue($names->has($repA->id));
        $this->assertTrue($names->has($repB->id));
    }

    public function test_date_range_filters_leads_by_created_at(): void
    {
        $this->actingAsRole('admin');

        $old = Lead::factory()->create();
        $old->created_at = now()->subDays(30);
        $old->saveQuietly();

        Lead::factory()->create(); // created "now", inside range

        $inRange = $this->getJson('/api/analytics/kpis?date_from='.now()->subDays(2)->toDateString().'&date_to='.now()->toDateString())->json();
        $this->assertSame(1, $inRange['acquisition']['leads']);

        $wideRange = $this->getJson('/api/analytics/kpis?date_from='.now()->subDays(60)->toDateString())->json();
        $this->assertSame(2, $wideRange['acquisition']['leads']);
    }

    public function test_lost_requires_reason_and_breakdown_is_grouped_correctly(): void
    {
        $this->actingAsRole('admin');

        $lead = Lead::factory()->create();
        $lead->stage = 'lost';
        $lead->lost_reason = 'price';
        $lead->save();

        Lead::factory()->create(['stage' => 'lost', 'lost_reason' => 'price']);
        Lead::factory()->create(['stage' => 'lost', 'lost_reason' => 'timing']);

        $data = $this->getJson('/api/analytics/kpis')->json();

        $this->assertSame(3, $data['bottom_funnel']['lost_count']);
        $this->assertSame(2, $data['bottom_funnel']['lost_reasons']['price']);
        $this->assertSame(1, $data['bottom_funnel']['lost_reasons']['timing']);
    }

    public function test_lost_leads_without_lost_at_still_count_but_date_filter_narrows_correctly(): void
    {
        // Regression test for a real bug found while building this: a lead
        // moved to 'lost' before the lost_at column existed (or any lead
        // where it's otherwise null) must still count in the UNFILTERED
        // total — "Lost count = COUNT(stage = lost)" per spec, no timestamp
        // requirement. It should only drop out once a DATE filter is applied
        // (nothing to place it in the range).
        $this->actingAsRole('admin');

        $lead = Lead::factory()->create(['stage' => 'lost', 'lost_reason' => 'other']);
        $lead->lost_at = null;
        $lead->saveQuietly();

        $unfiltered = $this->getJson('/api/analytics/kpis')->json();
        $this->assertSame(1, $unfiltered['bottom_funnel']['lost_count']);

        $dateFiltered = $this->getJson('/api/analytics/kpis?date_from='.now()->subDay()->toDateString())->json();
        $this->assertSame(0, $dateFiltered['bottom_funnel']['lost_count']);
    }

    public function test_financial_calculations_and_ltv_stays_null_without_configured_retention(): void
    {
        $this->actingAsRole('admin');

        $lead = Lead::factory()->create([
            'contract_value' => 10000,
            'project_cost' => 4000,
            'recurring_mrr' => 500,
        ]);
        $lead->stage = 'won';
        $lead->save();

        AdSpend::create(['date' => now()->toDateString(), 'spend' => 2000]);

        $data = $this->getJson('/api/analytics/kpis')->json();

        $this->assertEqualsWithDelta(10000.0, $data['economics']['revenue'], 0.0001);
        $this->assertEqualsWithDelta(4000.0, $data['economics']['project_cost'], 0.0001);
        $this->assertEqualsWithDelta(6000.0, $data['economics']['gross_profit'], 0.0001);
        $this->assertEqualsWithDelta(0.6, $data['economics']['gross_margin'], 0.0001);
        $this->assertEqualsWithDelta(2000.0, $data['economics']['cac'], 0.0001);

        // EXPECTED_RETENTION_MONTHS is not set in the test env — LTV/LTV:CAC
        // must be null, never a guessed number.
        $this->assertNull($data['economics']['ltv']);
        $this->assertNull($data['economics']['ltv_cac']);
        $this->assertNotNull($data['economics']['ltv_note']);
    }

    public function test_ltv_is_calculated_once_retention_months_is_configured(): void
    {
        config(['leads.expected_retention_months' => 12]);
        $this->actingAsRole('admin');

        $lead = Lead::factory()->create([
            'contract_value' => 10000,
            'project_cost' => 4000,
            'recurring_mrr' => 500,
        ]);
        $lead->stage = 'won';
        $lead->save();

        $data = $this->getJson('/api/analytics/kpis')->json();

        // LTV = contract_value + (mrr * months) - project_cost
        //     = 10000 + (500 * 12) - 4000 = 12000
        $this->assertEqualsWithDelta(12000.0, $data['economics']['ltv'], 0.0001);
    }

    public function test_speed_to_lead_ignores_leads_missing_either_timestamp(): void
    {
        $this->actingAsRole('admin');

        $complete = Lead::factory()->create();
        $complete->application_completed_at = now()->subHour();
        $complete->first_contact_at = now();
        $complete->saveQuietly();

        // Missing first_contact_at entirely — must not be treated as 0.
        Lead::factory()->create(['application_completed_at' => now()]);

        $data = $this->getJson('/api/analytics/kpis')->json();

        $this->assertEqualsWithDelta(60.0, $data['acquisition']['speed_to_lead_minutes'], 1.0);
    }

    public function test_developer_performance_is_grouped_by_assigned_developer(): void
    {
        $this->actingAsRole('admin');
        $dev = User::factory()->create(['role' => 'dev']);

        $lead = Lead::factory()->create(['stage' => 'in_delivery']);
        $lead->developers()->attach($dev->id);

        $data = $this->getJson('/api/analytics/kpis')->json();

        $devRow = collect($data['developers'])->firstWhere('user_id', $dev->id);
        $this->assertNotNull($devRow);
        $this->assertSame(1, $devRow['active_project_load']);
    }

    // ── PROMPT 5: acquisition trend, campaign/creative performance ──────

    public function test_acquisition_trend_returns_real_daily_counts_never_divided_from_a_total(): void
    {
        $this->actingAsRole('admin');

        $today = now()->toDateString();
        $yesterday = now()->subDay()->toDateString();

        Lead::factory()->count(3)->create(['created_at' => $today]);
        Lead::factory()->count(1)->create(['created_at' => $yesterday]);

        $data = $this->getJson("/api/analytics/kpis?date_from={$yesterday}&date_to={$today}")->json();

        $this->assertSame('daily', $data['acquisition']['trend']['granularity']);
        $points = collect($data['acquisition']['trend']['points'])->keyBy('date');
        $this->assertSame(3, $points[$today]['leads']);
        $this->assertSame(1, $points[$yesterday]['leads']);
    }

    public function test_campaign_performance_reports_null_spend_when_no_ad_spend_row_matches(): void
    {
        $this->actingAsRole('admin');

        $matched = Lead::factory()->create();
        LeadAttribution::create(['lead_id' => $matched->id, 'utm_campaign' => 'spring-launch']);

        $unmatched = Lead::factory()->create();
        LeadAttribution::create(['lead_id' => $unmatched->id, 'utm_campaign' => 'no-spend-recorded']);

        AdSpend::create(['date' => now()->toDateString(), 'campaign' => 'spring-launch', 'spend' => 400]);

        $data = $this->getJson('/api/analytics/kpis')->json();
        $rows = collect($data['campaigns'])->keyBy('campaign');

        $this->assertEqualsWithDelta(400.0, $rows['spring-launch']['spend'], 0.0001);
        $this->assertEqualsWithDelta(400.0, $rows['spring-launch']['cpl'], 0.0001);

        $this->assertNull($rows['no-spend-recorded']['spend']);
        $this->assertNull($rows['no-spend-recorded']['cpl']);
    }

    public function test_creative_performance_grouping_and_campaign_filter_narrows_leads(): void
    {
        $this->actingAsRole('admin');

        $inCampaign = Lead::factory()->create();
        LeadAttribution::create([
            'lead_id' => $inCampaign->id,
            'utm_campaign' => 'spring-launch',
            'ad_set' => 'retarget',
            'creative_id' => 'vid-1',
        ]);

        $otherCampaign = Lead::factory()->create();
        LeadAttribution::create([
            'lead_id' => $otherCampaign->id,
            'utm_campaign' => 'summer-sale',
            'creative_id' => 'vid-2',
        ]);

        $all = $this->getJson('/api/analytics/kpis')->json();
        $creativeRow = collect($all['creatives'])->firstWhere('creative', 'vid-1');
        $this->assertSame('spring-launch', $creativeRow['campaign']);
        $this->assertSame('retarget', $creativeRow['ad_set']);
        $this->assertNull($creativeRow['spend']);

        $filtered = $this->getJson('/api/analytics/kpis?campaign=spring-launch')->json();
        $this->assertSame(1, $filtered['acquisition']['leads']);

        $filteredByAdSet = $this->getJson('/api/analytics/kpis?ad_set=retarget')->json();
        $this->assertSame(1, $filteredByAdSet['acquisition']['leads']);

        $filteredByCreative = $this->getJson('/api/analytics/kpis?creative=vid-2')->json();
        $this->assertSame(1, $filteredByCreative['acquisition']['leads']);
    }
}
