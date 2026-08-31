<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $perPage = min(max((int) $request->input('per_page', 15), 1), 100);

        $paginator = Product::where('tenant_id', $request->user()->tenant_id)
            ->whereNull('archived_at')
            ->whereNull('deleted_at')
            ->when($request->input('search'), function ($query, $search) {
                $term = '%' . trim($search) . '%';
                $query->where('name', 'ilike', $term);
            })
            ->orderByDesc('id')
            ->paginate($perPage);

        return $this->success($paginator->items(), [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:product,service'],
            'unit_price' => ['required', 'integer', 'min:0'],
            'tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $product = Product::create([
            'name' => $request->name,
            'type' => $request->type,
            'unit_price' => $request->unit_price,
            'tax_rate' => $request->tax_rate,
            'tenant_id' => $request->user()->tenant_id,
            'created_by' => $request->user()->id,
            'updated_by' => $request->user()->id,
        ]);

        return $this->created($product);
    }

    public function show(Request $request, Product $product)
    {
        if ($product->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        return $this->success($product);
    }

    public function update(Request $request, Product $product)
    {
        if ($product->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'type' => ['sometimes', 'required', 'string', 'in:product,service'],
            'unit_price' => ['sometimes', 'required', 'integer', 'min:0'],
            'tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $product->update(array_merge(
            $request->only(['name', 'type', 'unit_price', 'tax_rate']),
            ['updated_by' => $request->user()->id]
        ));

        return $this->success($product);
    }

    public function destroy(Request $request, Product $product)
    {
        if ($product->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        if ($product->invoiceLines()->exists()) {
            $product->update(['archived_at' => now()]);

            return response()->noContent();
        }

        $product->delete();

        return response()->noContent();
    }
}
