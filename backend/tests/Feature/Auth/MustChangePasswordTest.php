<?php

namespace Tests\Feature\Auth;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MustChangePasswordTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tenant = Tenant::factory()->create();
    }

    private function authHeaders(User $user): array
    {
        $token = $user->createToken('api')->plainTextToken;

        return [
            'Authorization' => 'Bearer '.$token,
            'Accept' => 'application/json',
        ];
    }

    public function test_staff_created_with_must_change_password_flag(): void
    {
        $owner = User::factory()->owner()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $response = $this->actingAs($owner)->postJson('/api/v1/users', [
            'name' => 'Test Staff',
            'email' => 'staff@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201);

        $staff = User::where('email', 'staff@example.com')->first();
        $this->assertTrue((bool) $staff->must_change_password);
    }

    public function test_owner_created_without_must_change_password_flag(): void
    {
        $response = $this->postJson('/api/v1/register', [
            'name' => 'Test Owner',
            'email' => 'owner@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'tenant_name' => 'Test Company',
            'currency' => 'USD',
            'invoice_prefix' => 'INV',
            'tenant_locale' => 'en',
        ]);

        $response->assertStatus(201);

        $owner = User::where('email', 'owner@example.com')->first();
        $this->assertFalse((bool) $owner->must_change_password);
    }

    public function test_protected_endpoint_returns_403_when_must_change_password_true(): void
    {
        $staff = User::factory()->mustChangePassword()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $response = $this->withHeaders($this->authHeaders($staff))
            ->getJson('/api/v1/customers');

        $response->assertStatus(403);
    }

    public function test_user_me_endpoint_works_when_must_change_password_true(): void
    {
        $staff = User::factory()->mustChangePassword()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $response = $this->withHeaders($this->authHeaders($staff))
            ->getJson('/api/v1/user/me');

        $response->assertStatus(200);
        $response->assertJson([
            'must_change_password' => true,
            'user' => [
                'id' => $staff->id,
                'name' => $staff->name,
                'email' => $staff->email,
                'role' => 'staff',
            ],
        ]);
    }

    public function test_password_change_works_when_must_change_password_true(): void
    {
        $staff = User::factory()->mustChangePassword()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $response = $this->withHeaders($this->authHeaders($staff))
            ->postJson('/api/v1/password/change', [
                'current_password' => 'password',
                'password' => 'newPassword123',
                'password_confirmation' => 'newPassword123',
            ]);

        $response->assertStatus(200);
    }

    public function test_password_change_resets_must_change_password_flag(): void
    {
        $staff = User::factory()->mustChangePassword()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $this->assertTrue((bool) $staff->must_change_password);

        $this->withHeaders($this->authHeaders($staff))
            ->postJson('/api/v1/password/change', [
                'current_password' => 'password',
                'password' => 'newPassword123',
                'password_confirmation' => 'newPassword123',
            ]);

        $staff->refresh();
        $this->assertFalse((bool) $staff->must_change_password);
    }

    public function test_protected_endpoint_accessible_after_password_change(): void
    {
        $staff = User::factory()->mustChangePassword()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $this->withHeaders($this->authHeaders($staff))
            ->postJson('/api/v1/password/change', [
                'current_password' => 'password',
                'password' => 'newPassword123',
                'password_confirmation' => 'newPassword123',
            ]);

        $response = $this->withHeaders($this->authHeaders($staff))
            ->getJson('/api/v1/customers');

        $response->assertStatus(200);
    }
}
