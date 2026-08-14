<?php

namespace Database\Factories;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

class TenantFactory extends Factory
{
    protected $model = Tenant::class;

    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'currency' => 'MAD',
            'currency_decimal_places' => 2,
            'locale' => 'en',
            'invoice_prefix' => 'INV',
        ];
    }
}
