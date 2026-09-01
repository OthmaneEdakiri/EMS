<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

class InvoiceFactory extends Factory
{
    protected $model = Invoice::class;

    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'customer_id' => Customer::factory(),
            'number' => 'INV-'.str_pad(fake()->unique()->numberBetween(1, 9999), 4, '0', STR_PAD_LEFT),
            'status' => 'draft',
            'issue_date' => fake()->dateTimeThisMonth(),
            'due_date' => fake()->dateTimeThisMonth('+30 days'),
            'subtotal' => fake()->numberBetween(1000, 100000),
            'tax_total' => fake()->numberBetween(0, 20000),
            'total' => fake()->numberBetween(1000, 120000),
        ];
    }
}
