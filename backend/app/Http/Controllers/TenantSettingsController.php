<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TenantSettingsController extends Controller
{
    public function show(Request $request)
    {
        $tenant = $request->user()->tenant;

        return $this->success([
            'name' => $tenant->name,
            'currency' => $tenant->currency,
            'currency_decimal_places' => $tenant->currency_decimal_places,
            'locale' => $tenant->locale,
            'invoice_prefix' => $tenant->invoice_prefix,
            'logo' => $tenant->logo ? asset('storage/' . $tenant->logo) : null,
            'has_invoices' => $tenant->invoices()->exists(),
        ]);
    }

    public function update(Request $request)
    {
        $tenant = $request->user()->tenant;

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'currency' => ['sometimes', 'string', 'size:3'],
            'locale' => ['sometimes', 'string', 'in:ar,en'],
            'invoice_prefix' => ['sometimes', 'string', 'max:20'],
            'logo' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:2048', 'dimensions:max_width=400,max_height=400'],
        ]);

        if (isset($validated['currency'])) {
            $validated['currency_decimal_places'] = match ($validated['currency']) {
                'JPY' => 0,
                default => 2,
            };
        }

        if (array_key_exists('logo', $request->input())) {
            if ($tenant->logo) {
                Storage::disk('public')->delete($tenant->logo);
            }

            if ($request->file('logo')) {
                $path = $request->file('logo')->store('logos/' . $tenant->id, 'public');
                $validated['logo'] = $path;
            } else {
                $validated['logo'] = null;
            }
        }

        $validated['updated_by'] = $request->user()->id;

        $tenant->update($validated);

        return $this->success([
            'name' => $tenant->name,
            'currency' => $tenant->currency,
            'currency_decimal_places' => $tenant->currency_decimal_places,
            'locale' => $tenant->locale,
            'invoice_prefix' => $tenant->invoice_prefix,
            'logo' => $tenant->logo ? asset('storage/' . $tenant->logo) : null,
            'has_invoices' => $tenant->invoices()->exists(),
        ]);
    }
}
