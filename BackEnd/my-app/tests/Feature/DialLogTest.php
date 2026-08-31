<?php

namespace Tests\Feature;

use App\Models\DialLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DialLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_sales_can_set_and_read_todays_dial_count(): void
    {
        $rep = User::factory()->create(['role' => 'sales']);
        $this->actingAs($rep, 'sanctum');

        $this->getJson('/api/dials/today')->assertOk()->assertJson(['today' => 0, 'all_time' => 0]);

        $this->patchJson('/api/dials/today', ['count' => 12])
            ->assertOk()
            ->assertJson(['today' => 12, 'all_time' => 12]);

        $this->getJson('/api/dials/today')->assertOk()->assertJson(['today' => 12, 'all_time' => 12]);
    }

    public function test_updating_today_again_replaces_not_adds(): void
    {
        $rep = User::factory()->create(['role' => 'sales']);
        $this->actingAs($rep, 'sanctum');

        $this->patchJson('/api/dials/today', ['count' => 5])->assertOk();
        $this->patchJson('/api/dials/today', ['count' => 8])->assertOk();

        $this->assertSame(1, DialLog::where('user_id', $rep->id)->count());
        $this->assertSame(8, DialLog::where('user_id', $rep->id)->value('dial_count'));
    }

    public function test_all_time_sums_across_days(): void
    {
        $rep = User::factory()->create(['role' => 'sales']);

        DialLog::create(['user_id' => $rep->id, 'date' => now()->subDays(2)->toDateString(), 'dial_count' => 10]);
        DialLog::create(['user_id' => $rep->id, 'date' => now()->subDay()->toDateString(), 'dial_count' => 15]);
        DialLog::create(['user_id' => $rep->id, 'date' => now()->toDateString(), 'dial_count' => 7]);

        $this->actingAs($rep, 'sanctum');
        $this->getJson('/api/dials/today')->assertOk()->assertJson(['today' => 7, 'all_time' => 32]);
    }

    public function test_dial_counts_are_scoped_to_the_authenticated_rep(): void
    {
        $repA = User::factory()->create(['role' => 'sales']);
        $repB = User::factory()->create(['role' => 'sales']);
        DialLog::create(['user_id' => $repA->id, 'date' => now()->toDateString(), 'dial_count' => 20]);

        $this->actingAs($repB, 'sanctum');
        $this->getJson('/api/dials/today')->assertOk()->assertJson(['today' => 0, 'all_time' => 0]);
    }

    public function test_negative_dial_count_is_rejected(): void
    {
        $rep = User::factory()->create(['role' => 'sales']);
        $this->actingAs($rep, 'sanctum');

        $this->patchJson('/api/dials/today', ['count' => -1])->assertStatus(422);
    }

    public function test_admin_and_other_roles_cannot_use_dial_endpoints(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin, 'sanctum');
        $this->getJson('/api/dials/today')->assertForbidden();

        $dev = User::factory()->create(['role' => 'dev']);
        $this->actingAs($dev, 'sanctum');
        $this->patchJson('/api/dials/today', ['count' => 3])->assertForbidden();
    }
}
