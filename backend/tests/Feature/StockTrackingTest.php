<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StockTrackingTest extends TestCase
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
            'role' => 'staff',
        ]);
    }

    private function ownerHeaders(): array
    {
        $token = $this->owner->createToken('api')->plainTextToken;

        return [
            'Authorization' => 'Bearer '.$token,
            'Accept' => 'application/json',
        ];
    }

    private function staffHeaders(): array
    {
        $token = $this->staff->createToken('api')->plainTextToken;

        return [
            'Authorization' => 'Bearer '.$token,
            'Accept' => 'application/json',
        ];
    }

    public function test_owner_can_enable_stock_tracking(): void
    {
        $product = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'type' => 'product',
            'track_stock' => false,
            'quantity_on_hand' => 0,
        ]);

        $response = $this->patchJson("/api/v1/products/{$product->id}/stock/enable", [
            'opening_quantity' => 50,
            'reorder_level' => 10,
        ], $this->ownerHeaders());

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'id',
                'track_stock',
                'quantity_on_hand',
                'reorder_level',
            ],
        ]);

        $product->refresh();
        $this->assertTrue($product->track_stock);
        $this->assertEquals(50, $product->quantity_on_hand);
        $this->assertEquals(10, $product->reorder_level);

        $this->assertDatabaseHas('stock_movements', [
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'type' => StockMovement::TYPE_OPENING_BALANCE,
            'quantity_delta' => 50,
            'created_by' => $this->owner->id,
        ]);
    }

    public function test_owner_can_enable_stock_tracking_with_zero_opening_quantity(): void
    {
        $product = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'type' => 'product',
            'track_stock' => false,
        ]);

        $response = $this->patchJson("/api/v1/products/{$product->id}/stock/enable", [
            'opening_quantity' => 0,
        ], $this->ownerHeaders());

        $response->assertStatus(200);

        $product->refresh();
        $this->assertTrue($product->track_stock);
        $this->assertEquals(0, $product->quantity_on_hand);
        $this->assertNull($product->reorder_level);
    }

    public function test_staff_cannot_enable_stock_tracking(): void
    {
        $product = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'type' => 'product',
        ]);

        $response = $this->patchJson("/api/v1/products/{$product->id}/stock/enable", [
            'opening_quantity' => 10,
        ], $this->staffHeaders());

        $response->assertStatus(403);

        $product->refresh();
        $this->assertFalse($product->track_stock);
    }

    public function test_cannot_enable_stock_tracking_on_service_type(): void
    {
        $product = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'type' => 'service',
        ]);

        $response = $this->patchJson("/api/v1/products/{$product->id}/stock/enable", [
            'opening_quantity' => 10,
        ], $this->ownerHeaders());

        $response->assertStatus(422);

        $product->refresh();
        $this->assertFalse($product->track_stock);
    }

    public function test_cannot_enable_stock_tracking_twice(): void
    {
        $product = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'type' => 'product',
            'track_stock' => true,
            'quantity_on_hand' => 20,
        ]);

        $response = $this->patchJson("/api/v1/products/{$product->id}/stock/enable", [
            'opening_quantity' => 10,
        ], $this->ownerHeaders());

        $response->assertStatus(422);
    }

    public function test_cannot_enable_stock_tracking_with_negative_opening_quantity(): void
    {
        $product = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'type' => 'product',
        ]);

        $response = $this->patchJson("/api/v1/products/{$product->id}/stock/enable", [
            'opening_quantity' => -5,
        ], $this->ownerHeaders());

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('opening_quantity');
    }

    public function test_cannot_enable_stock_tracking_with_negative_reorder_level(): void
    {
        $product = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'type' => 'product',
        ]);

        $response = $this->patchJson("/api/v1/products/{$product->id}/stock/enable", [
            'opening_quantity' => 10,
            'reorder_level' => -1,
        ], $this->ownerHeaders());

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('reorder_level');
    }

    public function test_cannot_enable_stock_tracking_on_other_tenant_product(): void
    {
        $otherTenant = Tenant::factory()->create();
        $product = Product::factory()->create([
            'tenant_id' => $otherTenant->id,
            'type' => 'product',
        ]);

        $response = $this->patchJson("/api/v1/products/{$product->id}/stock/enable", [
            'opening_quantity' => 10,
        ], $this->ownerHeaders());

        $response->assertStatus(403);
    }

    public function test_opening_quantity_is_required(): void
    {
        $product = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'type' => 'product',
        ]);

        $response = $this->patchJson("/api/v1/products/{$product->id}/stock/enable", [], $this->ownerHeaders());

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('opening_quantity');
    }

    public function test_stock_movement_recorded_with_correct_fields(): void
    {
        $product = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'type' => 'product',
        ]);

        $this->patchJson("/api/v1/products/{$product->id}/stock/enable", [
            'opening_quantity' => 25,
        ], $this->ownerHeaders());

        $movement = StockMovement::where('product_id', $product->id)->first();

        $this->assertNotNull($movement);
        $this->assertEquals($this->tenant->id, $movement->tenant_id);
        $this->assertEquals(StockMovement::TYPE_OPENING_BALANCE, $movement->type);
        $this->assertEquals(25, $movement->quantity_delta);
        $this->assertNull($movement->reference_type);
        $this->assertNull($movement->reference_id);
        $this->assertNull($movement->reason);
        $this->assertEquals($this->owner->id, $movement->created_by);
        $this->assertNotNull($movement->created_at);
    }
}
