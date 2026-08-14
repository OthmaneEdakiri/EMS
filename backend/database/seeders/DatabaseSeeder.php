<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::create([
            'name' => 'Demo Company',
            'currency' => 'MAD',
            'currency_decimal_places' => 2,
            'locale' => 'en',
            'invoice_prefix' => 'INV',
        ]);

        User::factory()->owner()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'tenant_id' => $tenant->id,
        ]);
    }
}
