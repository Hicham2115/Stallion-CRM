<?php

namespace Tests\Feature;

use App\Models\AdSpend;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class AdSpendImportTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsRole(string $role): User
    {
        $user = User::factory()->create(['role' => $role]);
        $this->actingAs($user, 'sanctum');

        return $user;
    }

    /** A CSV in memory, named .csv so the `mimes` rule passes. */
    private function csv(string $contents, string $name = 'meta-export.csv'): UploadedFile
    {
        return UploadedFile::fake()->createWithContent($name, $contents);
    }

    /** The column set an Ads Manager export actually ships, day-broken-down. */
    private function metaExport(): string
    {
        return <<<'CSV'
        Day,Campaign name,Ad set name,Ad name,Amount spent (EUR)
        2026-08-01,Spring Launch,Lookalike 1%,Video A,120.50
        2026-08-01,Spring Launch,Lookalike 1%,Video B,80
        2026-08-02,Spring Launch,Lookalike 1%,Video A,60.25
        CSV;
    }

    // ── ACCESS ───────────────────────────────────────────────────────────

    // A real row, so `destroy` is refused by the role gate rather than 404ing
    // on a missing id — `role:` is an unprioritized alias, so it runs AFTER
    // SubstituteBindings and never sees a request whose binding failed.
    public function test_unauthenticated_requests_are_rejected(): void
    {
        $row = AdSpend::create(['date' => '2026-08-01', 'campaign' => 'Spring Launch', 'spend' => 10]);

        $this->getJson('/api/ad-spend')->assertUnauthorized();
        $this->postJson('/api/ad-spend/import')->assertUnauthorized();
        $this->deleteJson("/api/ad-spend/{$row->id}")->assertUnauthorized();
        $this->deleteJson('/api/ad-spend/all')->assertUnauthorized();

        $this->assertSame(1, AdSpend::count());
    }

    public function test_dev_and_client_roles_are_forbidden(): void
    {
        $row = AdSpend::create(['date' => '2026-08-01', 'campaign' => 'Spring Launch', 'spend' => 10]);

        foreach (['dev', 'client'] as $role) {
            $this->actingAsRole($role);

            $this->getJson('/api/ad-spend')->assertForbidden();
            $this->postJson('/api/ad-spend/import')->assertForbidden();
            $this->deleteJson("/api/ad-spend/{$row->id}")->assertForbidden();
            $this->deleteJson('/api/ad-spend/all')->assertForbidden();
        }

        $this->assertSame(1, AdSpend::count());
    }

    /** Sales shares this surface with admin — see the routes' comment. */
    public function test_sales_may_import(): void
    {
        $this->actingAsRole('sales');

        $this->post('/api/ad-spend/import', ['file' => $this->csv($this->metaExport())])
            ->assertOk()
            ->assertJson(['imported' => 3, 'skipped' => 0]);
    }

    // ── IMPORT ───────────────────────────────────────────────────────────

    public function test_a_real_ads_manager_export_imports_every_row(): void
    {
        $this->actingAsRole('admin');

        $this->post('/api/ad-spend/import', ['file' => $this->csv($this->metaExport())])
            ->assertOk()
            ->assertJson(['imported' => 3, 'skipped' => 0, 'errors' => []]);

        $this->assertSame(3, AdSpend::count());

        $row = AdSpend::where('creative', 'Video B')->firstOrFail();
        $this->assertSame('2026-08-01', $row->date->toDateString());
        $this->assertSame('Spring Launch', $row->campaign);
        $this->assertSame('Lookalike 1%', $row->ad_set);
        $this->assertSame('80.00', $row->spend);
        // No platform column in the export.
        $this->assertSame('meta', $row->platform);
    }

    /**
     * Headers are matched by alias, not position — the point of
     * normalizeHeader()/HEADER_ALIASES. Different spellings, reordered, with
     * an unrecognized column in the middle.
     */
    public function test_headers_are_matched_flexibly_and_out_of_order(): void
    {
        $this->actingAsRole('admin');

        $csv = <<<'CSV'
        Amount spent,Impressions,Ad Set,Date,Campaign
        45.00,9000,Broad,2026-08-03,Retargeting
        CSV;

        $this->post('/api/ad-spend/import', ['file' => $this->csv($csv)])
            ->assertOk()
            ->assertJson(['imported' => 1, 'skipped' => 0]);

        $row = AdSpend::firstOrFail();
        $this->assertSame('Retargeting', $row->campaign);
        $this->assertSame('Broad', $row->ad_set);
        $this->assertSame('45.00', $row->spend);
        $this->assertNull($row->creative);
    }

    public function test_malformed_rows_are_skipped_and_reported_not_fatal(): void
    {
        $this->actingAsRole('admin');

        $csv = <<<'CSV'
        Day,Campaign name,Ad set name,Ad name,Amount spent
        2026-08-01,Spring Launch,Lookalike 1%,Video A,120.50
        not-a-date,Spring Launch,Lookalike 1%,Video B,80
        2026-08-02,Spring Launch,Lookalike 1%,Video C,
        2026-08-03,Spring Launch,Lookalike 1%,Video D,-40
        2026-08-04,Spring Launch,Lookalike 1%,Video E,15

        CSV;

        $response = $this->post('/api/ad-spend/import', ['file' => $this->csv($csv)]);

        $response->assertOk()->assertJson(['imported' => 2, 'skipped' => 3]);
        $this->assertCount(3, $response->json('errors'));
        $this->assertSame(2, AdSpend::count());
        // The trailing blank line is not an error.
        $this->assertNotNull(AdSpend::where('creative', 'Video E')->first());
    }

    public function test_a_file_missing_a_required_column_is_rejected_whole(): void
    {
        $this->actingAsRole('admin');

        $csv = <<<'CSV'
        Campaign name,Ad set name,Ad name
        Spring Launch,Lookalike 1%,Video A
        CSV;

        $this->postJson('/api/ad-spend/import', [])->assertStatus(422);

        $this->post('/api/ad-spend/import', ['file' => $this->csv($csv)])
            ->assertStatus(422)
            ->assertJsonValidationErrors('file');

        $this->assertSame(0, AdSpend::count());
    }

    public function test_reimporting_the_same_export_does_not_double_the_spend(): void
    {
        $this->actingAsRole('admin');

        $this->post('/api/ad-spend/import', ['file' => $this->csv($this->metaExport())])->assertOk();
        $this->post('/api/ad-spend/import', ['file' => $this->csv($this->metaExport())])->assertOk();

        $this->assertSame(3, AdSpend::count());
        $this->assertSame(260.75, (float) AdSpend::sum('spend'));
    }

    public function test_reimporting_a_corrected_export_overwrites_the_amount(): void
    {
        $this->actingAsRole('admin');

        $this->post('/api/ad-spend/import', ['file' => $this->csv($this->metaExport())])->assertOk();

        $corrected = str_replace('Video B,80', 'Video B,95', $this->metaExport());
        $this->post('/api/ad-spend/import', ['file' => $this->csv($corrected)])->assertOk();

        $this->assertSame(3, AdSpend::count());
        $this->assertSame('95.00', AdSpend::where('creative', 'Video B')->firstOrFail()->spend);
    }

    /**
     * A repeated tuple inside ONE file means the export carries a breakdown
     * ad_spend does not model, so the day's spend for that ad is the sum —
     * the opposite of the across-files rule above. See parse()'s comment.
     */
    public function test_a_tuple_repeated_within_one_file_is_summed(): void
    {
        $this->actingAsRole('admin');

        $csv = <<<'CSV'
        Day,Campaign name,Ad set name,Ad name,Amount spent
        2026-08-01,Spring Launch,Broad,Video A,10
        2026-08-01,Spring Launch,Broad,Video A,15
        CSV;

        $this->post('/api/ad-spend/import', ['file' => $this->csv($csv)])
            ->assertOk()
            ->assertJson(['imported' => 1]);

        $this->assertSame('25.00', AdSpend::firstOrFail()->spend);
    }

    public function test_grouped_and_comma_decimal_amounts_are_read_correctly(): void
    {
        $this->actingAsRole('admin');

        $csv = <<<'CSV'
        Day,Campaign name,Amount spent
        2026-08-01,US grouping,"1,234.56"
        2026-08-01,EU grouping,"1.234,56"
        2026-08-01,Decimal comma,"1,50"
        2026-08-01,With symbol,"€ 99"
        CSV;

        $this->post('/api/ad-spend/import', ['file' => $this->csv($csv)])
            ->assertOk()
            ->assertJson(['imported' => 4, 'skipped' => 0]);

        $spendOf = fn (string $campaign) => AdSpend::where('campaign', $campaign)->firstOrFail()->spend;

        $this->assertSame('1234.56', $spendOf('US grouping'));
        $this->assertSame('1234.56', $spendOf('EU grouping'));
        $this->assertSame('1.50', $spendOf('Decimal comma'));
        $this->assertSame('99.00', $spendOf('With symbol'));
    }

    // ── THE SHIPPED SAMPLE FILES ─────────────────────────────────────────

    /** The real fixtures in database/samples/ad-spend, or a skip if someone
     *  has removed them — they are QA aids, not required for the suite. */
    private function sample(string $name): UploadedFile
    {
        $path = database_path("samples/ad-spend/{$name}");

        if (! is_file($path)) {
            $this->markTestSkipped("database/samples/ad-spend/{$name} is not present.");
        }

        return $this->csv(file_get_contents($path), $name);
    }

    /**
     * Pins the exact figures database/samples/ad-spend/README.md tells a
     * developer to expect. If someone edits a sample CSV, this fails rather
     * than letting the README quietly start lying about what the import does.
     */
    public function test_the_shipped_sample_export_matches_its_documented_totals(): void
    {
        $this->actingAsRole('admin');

        $this->post('/api/ad-spend/import', ['file' => $this->sample('meta-ads-export.csv')])
            ->assertOk()
            ->assertJson(['imported' => 12, 'skipped' => 0, 'errors' => []]);

        $this->assertSame(12, AdSpend::count());
        $this->assertEqualsWithDelta(3142.05, (float) AdSpend::sum('spend'), 0.001);
        $this->assertEqualsWithDelta(2705.45, (float) AdSpend::where('campaign', 'stallion-q3-webdev')->sum('spend'), 0.001);
        $this->assertEqualsWithDelta(436.60, (float) AdSpend::where('campaign', 'stallion-q3-ecom')->sum('spend'), 0.001);

        // Extra columns an Ads Manager export carries (Impressions, Link
        // clicks) are ignored, not a reason to skip the row.
        $this->assertSame('meta', AdSpend::first()->platform);
    }

    /** The override demo in the README: same 12 keys, restated amounts. */
    public function test_the_corrected_sample_overwrites_rather_than_doubling(): void
    {
        $this->actingAsRole('admin');

        $this->post('/api/ad-spend/import', ['file' => $this->sample('meta-ads-export.csv')])->assertOk();
        $this->post('/api/ad-spend/import', ['file' => $this->sample('meta-ads-export-corrected.csv')])
            ->assertOk()
            ->assertJson(['imported' => 12, 'skipped' => 0]);

        $this->assertSame(12, AdSpend::count(), 'A re-import created new rows instead of overwriting.');
        $this->assertEqualsWithDelta(3213.80, (float) AdSpend::sum('spend'), 0.001);

        // And the last import of a row always wins, in both directions.
        $this->post('/api/ad-spend/import', ['file' => $this->sample('meta-ads-export.csv')])->assertOk();
        $this->assertSame(12, AdSpend::count());
        $this->assertEqualsWithDelta(3142.05, (float) AdSpend::sum('spend'), 0.001);
    }

    /** The malformed-row demo: 2 good rows in, 3 reported, nothing fatal. */
    public function test_the_bad_row_sample_skips_exactly_three_rows(): void
    {
        $this->actingAsRole('admin');

        $response = $this->post('/api/ad-spend/import', ['file' => $this->sample('meta-ads-export-with-bad-rows.csv')]);

        $response->assertOk()->assertJson(['imported' => 2, 'skipped' => 3]);
        $this->assertCount(3, $response->json('errors'));
        $this->assertEqualsWithDelta(465.65, (float) AdSpend::sum('spend'), 0.001);
    }

    // ── LIST + DELETE ────────────────────────────────────────────────────

    public function test_index_returns_newest_first_with_a_total(): void
    {
        $this->actingAsRole('admin');
        AdSpend::create(['date' => '2026-08-01', 'campaign' => 'Older', 'spend' => 10]);
        AdSpend::create(['date' => '2026-08-09', 'campaign' => 'Newer', 'spend' => 20]);

        $response = $this->getJson('/api/ad-spend')->assertOk();

        $this->assertSame(2, $response->json('total'));
        $this->assertSame('Newer', $response->json('data.0.campaign'));
    }

    public function test_a_single_row_can_be_deleted(): void
    {
        $this->actingAsRole('admin');
        $row = AdSpend::create(['date' => '2026-08-01', 'campaign' => 'Spring Launch', 'spend' => 10]);

        $this->deleteJson("/api/ad-spend/{$row->id}")->assertOk()->assertJson(['id' => $row->id]);

        $this->assertSame(0, AdSpend::count());
    }

    public function test_clearing_removes_every_row(): void
    {
        $this->actingAsRole('admin');
        $this->post('/api/ad-spend/import', ['file' => $this->csv($this->metaExport())])->assertOk();

        $this->deleteJson('/api/ad-spend/all')->assertOk()->assertJson(['deleted' => 3]);

        $this->assertSame(0, AdSpend::count());
    }

    /** Cleared rows must be re-importable — the dedupe key cannot outlive
     *  the row it identified. */
    public function test_a_cleared_import_can_be_uploaded_again(): void
    {
        $this->actingAsRole('admin');

        $this->post('/api/ad-spend/import', ['file' => $this->csv($this->metaExport())])->assertOk();
        $this->deleteJson('/api/ad-spend/all')->assertOk();
        $this->post('/api/ad-spend/import', ['file' => $this->csv($this->metaExport())])
            ->assertOk()
            ->assertJson(['imported' => 3]);

        $this->assertSame(3, AdSpend::count());
    }
}
