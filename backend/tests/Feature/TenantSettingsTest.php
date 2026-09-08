<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TenantSettingsTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    private User $staff;

    private Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();
        $this->owner = User::factory()->owner()->create([
            'tenant_id' => $this->tenant->id,
        ]);
        $this->staff = User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);
    }

    private function ownerHeaders(): array
    {
        $token = $this->owner->createToken('api')->plainTextToken;

        return [
            'Authorization' => 'Bearer ' . $token,
            'Accept' => 'application/json',
        ];
    }

    private function staffHeaders(): array
    {
        $token = $this->staff->createToken('api')->plainTextToken;

        return [
            'Authorization' => 'Bearer ' . $token,
            'Accept' => 'application/json',
        ];
    }

    public function test_owner_can_get_company_settings(): void
    {
        $response = $this->getJson('/api/v1/settings/company', $this->ownerHeaders());

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'name',
                'currency',
                'currency_decimal_places',
                'locale',
                'invoice_prefix',
                'logo',
                'has_invoices',
            ],
        ]);
    }

    public function test_owner_can_update_company_settings(): void
    {
        $response = $this->patchJson('/api/v1/settings/company', [
            'name' => 'Updated Company',
            'currency' => 'EUR',
            'locale' => 'ar',
            'invoice_prefix' => 'FAC',
        ], $this->ownerHeaders());

        $response->assertStatus(200);

        $this->tenant->refresh();
        $this->assertEquals('Updated Company', $this->tenant->name);
        $this->assertEquals('EUR', $this->tenant->currency);
        $this->assertEquals(2, $this->tenant->currency_decimal_places);
        $this->assertEquals('ar', $this->tenant->locale);
        $this->assertEquals('FAC', $this->tenant->invoice_prefix);
        $this->assertEquals($this->owner->id, $this->tenant->updated_by);
    }

    public function test_staff_cannot_get_company_settings(): void
    {
        $response = $this->getJson('/api/v1/settings/company', $this->staffHeaders());

        $response->assertStatus(403);
    }

    public function test_staff_cannot_update_company_settings(): void
    {
        $response = $this->patchJson('/api/v1/settings/company', [
            'name' => 'Hacked Name',
        ], $this->staffHeaders());

        $response->assertStatus(403);
    }

    public function test_unauthenticated_user_cannot_access(): void
    {
        $this->getJson('/api/v1/settings/company')->assertStatus(401);
        $this->patchJson('/api/v1/settings/company', ['name' => 'X'])->assertStatus(401);
    }

    public function test_validates_name_max_length(): void
    {
        $response = $this->patchJson('/api/v1/settings/company', [
            'name' => str_repeat('a', 101),
        ], $this->ownerHeaders());

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('name');
    }

    public function test_validates_currency_size(): void
    {
        $response = $this->patchJson('/api/v1/settings/company', [
            'currency' => 'EURO',
        ], $this->ownerHeaders());

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('currency');
    }

    public function test_validates_locale_enum(): void
    {
        $response = $this->patchJson('/api/v1/settings/company', [
            'locale' => 'fr',
        ], $this->ownerHeaders());

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('locale');
    }

    public function test_validates_logo_mimes_rejects_svg(): void
    {
        Storage::fake('public');

        $response = $this->postJson('/api/v1/settings/company', [], $this->ownerHeaders());
        $response->assertStatus(405);

        $file = UploadedFile::fake()->createWithContent('test.svg', '<svg></svg>');
        $response = $this->patchJson('/api/v1/settings/company', [
            'logo' => $file,
        ], $this->ownerHeaders());

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('logo');
    }

    public function test_updates_currency_decimal_places_for_jpy(): void
    {
        $response = $this->patchJson('/api/v1/settings/company', [
            'currency' => 'JPY',
        ], $this->ownerHeaders());

        $response->assertStatus(200);

        $this->tenant->refresh();
        $this->assertEquals(0, $this->tenant->currency_decimal_places);
    }

    public function test_updates_currency_decimal_places_for_mad(): void
    {
        $this->tenant->update(['currency_decimal_places' => 0]);

        $response = $this->patchJson('/api/v1/settings/company', [
            'currency' => 'MAD',
        ], $this->ownerHeaders());

        $response->assertStatus(200);

        $this->tenant->refresh();
        $this->assertEquals(2, $this->tenant->currency_decimal_places);
    }

    public function test_sets_updated_by_on_update(): void
    {
        $this->assertNull($this->tenant->updated_by);

        $this->patchJson('/api/v1/settings/company', [
            'name' => 'New Name',
        ], $this->ownerHeaders())->assertStatus(200);

        $this->tenant->refresh();
        $this->assertEquals($this->owner->id, $this->tenant->updated_by);
    }

    public function test_partial_update_only_changes_provided_fields(): void
    {
        $originalCurrency = $this->tenant->currency;
        $originalPrefix = $this->tenant->invoice_prefix;

        $this->patchJson('/api/v1/settings/company', [
            'name' => 'Partially Updated',
        ], $this->ownerHeaders())->assertStatus(200);

        $this->tenant->refresh();
        $this->assertEquals('Partially Updated', $this->tenant->name);
        $this->assertEquals($originalCurrency, $this->tenant->currency);
        $this->assertEquals($originalPrefix, $this->tenant->invoice_prefix);
    }
}
