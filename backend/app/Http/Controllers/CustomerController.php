<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $customers = Customer::where('tenant_id', $request->user()->tenant_id)
            ->whereNull('archived_at')
            ->get();

        return $this->success($customers);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'tax_id' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'string', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
        ]);

        $customer = Customer::create([
            'name' => $request->name,
            'tax_id' => $request->tax_id,
            'email' => $request->email,
            'phone' => $request->phone,
            'address' => $request->address,
            'tenant_id' => $request->user()->tenant_id,
            'created_by' => $request->user()->id,
            'updated_by' => $request->user()->id,
        ]);

        return $this->created($customer);
    }

    public function show(Request $request, Customer $customer)
    {
        if ($customer->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        return $this->success($customer);
    }

    public function update(Request $request, Customer $customer)
    {
        if ($customer->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'tax_id' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'string', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
        ]);

        $customer->update(array_merge(
            $request->only(['name', 'tax_id', 'email', 'phone', 'address']),
            ['updated_by' => $request->user()->id]
        ));

        return $this->success($customer);
    }

    public function destroy(Request $request, Customer $customer)
    {
        if ($customer->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        if ($customer->invoices()->exists()) {
            return $this->error(
                [['field' => 'customer', 'message' => 'Cannot delete a customer with existing invoices. Use archive instead.']],
                null,
                422
            );
        }

        $customer->delete();

        return response()->noContent();
    }
}
