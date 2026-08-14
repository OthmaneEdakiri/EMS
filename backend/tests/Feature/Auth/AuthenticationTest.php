<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_users_can_authenticate(): void
    {
        $user = User::factory()->owner()->create();

        $response = $this->post('/api/v1/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => ['user' => ['id', 'name', 'email', 'role'], 'token', 'must_change_password'],
            'meta' => [],
            'errors' => [],
        ]);
    }

    public function test_users_cannot_authenticate_with_invalid_password(): void
    {
        $user = User::factory()->owner()->create();

        $response = $this->post('/api/v1/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ], ['Accept' => 'application/json']);

        $response->assertStatus(422);
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->owner()->create();
        $token = $user->createToken('api')->plainTextToken;

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->post('/api/v1/logout');

        $response->assertStatus(204);
    }
}
