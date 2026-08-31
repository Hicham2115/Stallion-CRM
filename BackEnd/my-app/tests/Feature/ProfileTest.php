<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_update_their_own_name_and_email(): void
    {
        $user = User::factory()->create(['name' => 'Old Name', 'email' => 'old@example.com']);
        $this->actingAs($user, 'sanctum');

        $response = $this->patchJson('/api/profile', [
            'name' => 'New Name',
            'email' => 'new@example.com',
        ]);

        $response->assertOk();
        $user->refresh();
        $this->assertSame('New Name', $user->name);
        $this->assertSame('new@example.com', $user->email);
    }

    public function test_email_must_be_unique_across_other_users(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);
        $user = User::factory()->create(['email' => 'me@example.com']);
        $this->actingAs($user, 'sanctum');

        $this->patchJson('/api/profile', [
            'name' => $user->name,
            'email' => 'taken@example.com',
        ])->assertStatus(422);

        $this->assertSame('me@example.com', $user->fresh()->email);
    }

    public function test_a_user_keeping_their_own_email_is_not_rejected_as_taken(): void
    {
        $user = User::factory()->create(['email' => 'me@example.com']);
        $this->actingAs($user, 'sanctum');

        $this->patchJson('/api/profile', [
            'name' => 'Still Me',
            'email' => 'me@example.com',
        ])->assertOk();
    }

    public function test_unauthenticated_requests_are_rejected(): void
    {
        $this->patchJson('/api/profile', ['name' => 'X', 'email' => 'x@example.com'])
            ->assertUnauthorized();
    }

    public function test_user_can_change_their_password_with_correct_current_password(): void
    {
        $user = User::factory()->create(); // factory default password: "password"
        $this->actingAs($user, 'sanctum');

        $this->patchJson('/api/profile/password', [
            'current_password' => 'password',
            'password' => 'a-new-strong-password',
            'password_confirmation' => 'a-new-strong-password',
        ])->assertOk();

        $this->assertTrue(Hash::check('a-new-strong-password', $user->fresh()->password));
    }

    public function test_password_change_is_rejected_with_wrong_current_password(): void
    {
        $user = User::factory()->create();
        $originalHash = $user->password;
        $this->actingAs($user, 'sanctum');

        $this->patchJson('/api/profile/password', [
            'current_password' => 'not-the-real-password',
            'password' => 'a-new-strong-password',
            'password_confirmation' => 'a-new-strong-password',
        ])->assertStatus(422);

        $this->assertSame($originalHash, $user->fresh()->password);
    }

    public function test_password_change_requires_confirmation_to_match(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum');

        $this->patchJson('/api/profile/password', [
            'current_password' => 'password',
            'password' => 'a-new-strong-password',
            'password_confirmation' => 'does-not-match',
        ])->assertStatus(422);
    }
}
