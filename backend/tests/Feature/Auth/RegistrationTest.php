<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_users_can_register(): void
    {
        $headers = ['Accept' => 'application/json'];

        $response = $this->post('/api/v1/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'tenant_name' => 'Test Company',
            'currency' => 'MAD',
            'invoice_prefix' => 'INV',
            'tenant_locale' => 'en',
        ], $headers);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'data' => ['user' => ['id', 'name', 'email', 'role'], 'token', 'must_change_password'],
            'meta' => [],
            'errors' => [],
        ]);
    }

    public function test_registration_fails_with_duplicate_email(): void
    {
        $headers = ['Accept' => 'application/json'];

        $this->post('/api/v1/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'tenant_name' => 'Test Company',
            'currency' => 'MAD',
            'invoice_prefix' => 'INV',
            'tenant_locale' => 'en',
        ], $headers);

        $response = $this->post('/api/v1/register', [
            'name' => 'Test User 2',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'tenant_name' => 'Test Company 2',
            'currency' => 'MAD',
            'invoice_prefix' => 'INVOICE',
            'tenant_locale' => 'en',
        ], $headers);

        $response->assertStatus(422);
    }
}
