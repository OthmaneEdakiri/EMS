<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'name' => fake()->words(3, true),
            'type' => fake()->randomElement(['product', 'service']),
            'unit_price' => fake()->numberBetween(100, 100000),
            'tax_rate' => fake()->optional(0.7)->randomElement([10, 14, 20]),
        ];
    }
}
