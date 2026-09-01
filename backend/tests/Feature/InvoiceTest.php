<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoiceTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Tenant $tenant;

    private Customer $customer;

    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();
        $this->user = User::factory()->owner()->create([
            'tenant_id' => $this->tenant->id,
        ]);
        $this->customer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);
        $this->product = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'unit_price' => 10000,
            'tax_rate' => 20,
        ]);
    }

    private function authHeaders(): array
    {
        $token = $this->user->createToken('api')->plainTextToken;

        return [
            'Authorization' => 'Bearer '.$token,
            'Accept' => 'application/json',
        ];
    }

    public function test_user_can_create_invoice(): void
    {
        $response = $this->postJson('/api/v1/invoices', [
            'customer_id' => $this->customer->id,
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'lines' => [
                [
                    'product_id' => $this->product->id,
                    'description' => 'Test Product',
                    'qty' => 2,
                    'unit_price' => 10000,
                    'tax_rate' => 20,
                ],
            ],
        ], $this->authHeaders());

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'data' => [
                'id',
                'number',
                'status',
                'subtotal',
                'tax_total',
                'total',
            ],
        ]);

        $this->assertDatabaseHas('invoices', [
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'draft',
            'subtotal' => 20000,
            'tax_total' => 4000,
            'total' => 24000,
        ]);
    }

    public function test_invoice_number_is_sequential(): void
    {
        $this->postJson('/api/v1/invoices', [
            'customer_id' => $this->customer->id,
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'lines' => [
                [
                    'description' => 'Line 1',
                    'qty' => 1,
                    'unit_price' => 1000,
                ],
            ],
        ], $this->authHeaders())->assertStatus(201);

        $this->postJson('/api/v1/invoices', [
            'customer_id' => $this->customer->id,
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'lines' => [
                [
                    'description' => 'Line 2',
                    'qty' => 1,
                    'unit_price' => 2000,
                ],
            ],
        ], $this->authHeaders())->assertStatus(201);

        $invoices = Invoice::withoutTenant()
            ->where('tenant_id', $this->tenant->id)
            ->orderBy('id')
            ->get();

        $this->assertCount(2, $invoices);
        $this->assertEquals('INV-0001', $invoices[0]->number);
        $this->assertEquals('INV-0002', $invoices[1]->number);
    }

    public function test_cannot_create_invoice_with_cross_tenant_customer(): void
    {
        $otherTenant = Tenant::factory()->create();
        $otherCustomer = Customer::factory()->create([
            'tenant_id' => $otherTenant->id,
        ]);

        $response = $this->postJson('/api/v1/invoices', [
            'customer_id' => $otherCustomer->id,
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'lines' => [
                [
                    'description' => 'Line 1',
                    'qty' => 1,
                    'unit_price' => 1000,
                ],
            ],
        ], $this->authHeaders());

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('customer_id');
    }

    public function test_cannot_create_invoice_with_cross_tenant_product(): void
    {
        $otherTenant = Tenant::factory()->create();
        $otherProduct = Product::factory()->create([
            'tenant_id' => $otherTenant->id,
        ]);

        $response = $this->postJson('/api/v1/invoices', [
            'customer_id' => $this->customer->id,
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'lines' => [
                [
                    'product_id' => $otherProduct->id,
                    'description' => 'Line 1',
                    'qty' => 1,
                    'unit_price' => 1000,
                ],
            ],
        ], $this->authHeaders());

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('lines.0.product_id');
    }

    public function test_can_only_send_draft_invoice(): void
    {
        $invoice = Invoice::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'draft',
        ]);

        $response = $this->postJson("/api/v1/invoices/{$invoice->id}/send", [], $this->authHeaders());
        $response->assertStatus(200);

        $invoice->refresh();
        $this->assertEquals('sent', $invoice->status);
    }

    public function test_cannot_send_non_draft_invoice(): void
    {
        $invoice = Invoice::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'sent',
        ]);

        $response = $this->postJson("/api/v1/invoices/{$invoice->id}/send", [], $this->authHeaders());
        $response->assertStatus(422);
    }

    public function test_can_cancel_draft_or_sent_invoice(): void
    {
        $draftInvoice = Invoice::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'draft',
        ]);

        $this->postJson("/api/v1/invoices/{$draftInvoice->id}/cancel", [], $this->authHeaders())
            ->assertStatus(200);

        $draftInvoice->refresh();
        $this->assertEquals('cancelled', $draftInvoice->status);
        $this->assertNotNull($draftInvoice->cancelled_at);
    }

    public function test_cannot_cancel_paid_invoice(): void
    {
        $invoice = Invoice::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'paid',
        ]);

        $response = $this->postJson("/api/v1/invoices/{$invoice->id}/cancel", [], $this->authHeaders());
        $response->assertStatus(422);
    }

    public function test_can_record_payment_on_sent_invoice(): void
    {
        $invoice = Invoice::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'sent',
            'total' => 24000,
        ]);

        $response = $this->postJson("/api/v1/invoices/{$invoice->id}/payments", [
            'amount' => 12000,
            'method' => 'bank_transfer',
            'paid_at' => now()->toDateString(),
        ], $this->authHeaders());

        $response->assertStatus(201);

        $invoice->refresh();
        $this->assertEquals('partially_paid', $invoice->status);
    }

    public function test_full_payment_marks_invoice_as_paid(): void
    {
        $invoice = Invoice::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'sent',
            'total' => 24000,
        ]);

        $this->postJson("/api/v1/invoices/{$invoice->id}/payments", [
            'amount' => 24000,
            'method' => 'cash',
            'paid_at' => now()->toDateString(),
        ], $this->authHeaders())->assertStatus(201);

        $invoice->refresh();
        $this->assertEquals('paid', $invoice->status);
    }

    public function test_cannot_exceed_payment_balance(): void
    {
        $invoice = Invoice::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'sent',
            'total' => 24000,
        ]);

        $response = $this->postJson("/api/v1/invoices/{$invoice->id}/payments", [
            'amount' => 25000,
            'method' => 'cash',
            'paid_at' => now()->toDateString(),
        ], $this->authHeaders());

        $response->assertStatus(422);
    }

    public function test_cannot_record_payment_on_draft_invoice(): void
    {
        $invoice = Invoice::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'draft',
            'total' => 24000,
        ]);

        $response = $this->postJson("/api/v1/invoices/{$invoice->id}/payments", [
            'amount' => 10000,
            'method' => 'cash',
            'paid_at' => now()->toDateString(),
        ], $this->authHeaders());

        $response->assertStatus(422);
    }

    public function test_cannot_delete_non_draft_invoice(): void
    {
        $invoice = Invoice::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'sent',
        ]);

        $response = $this->deleteJson("/api/v1/invoices/{$invoice->id}", [], $this->authHeaders());
        $response->assertStatus(422);
    }

    public function test_can_delete_draft_invoice(): void
    {
        $invoice = Invoice::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'draft',
        ]);

        $this->deleteJson("/api/v1/invoices/{$invoice->id}", [], $this->authHeaders())
            ->assertStatus(200);

        $this->assertDatabaseMissing('invoices', ['id' => $invoice->id]);
    }

    public function test_can_list_invoices(): void
    {
        Invoice::factory()->count(3)->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $response = $this->getJson('/api/v1/invoices', $this->authHeaders());
        $response->assertStatus(200);
        $response->assertJsonCount(3, 'data');
    }

    public function test_can_filter_invoices_by_status(): void
    {
        Invoice::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'draft',
        ]);
        Invoice::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'sent',
        ]);

        $response = $this->getJson('/api/v1/invoices?status=draft', $this->authHeaders());
        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
    }

    public function test_cannot_access_other_tenant_invoice(): void
    {
        $otherTenant = Tenant::factory()->create();
        $otherInvoice = Invoice::factory()->create([
            'tenant_id' => $otherTenant->id,
        ]);

        $response = $this->getJson("/api/v1/invoices/{$otherInvoice->id}", $this->authHeaders());
        $response->assertStatus(404);
    }
}
