<?php

namespace App\Http\Controllers;

use App\Http\Requests\AdjustStockRequest;
use App\Http\Requests\EnableStockTrackingRequest;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $perPage = min(max((int) $request->input('per_page', 15), 1), 100);

        $paginator = Product::where('tenant_id', $request->user()->tenant_id)
            ->whereNull('archived_at')
            ->whereNull('deleted_at')
            ->when($request->input('search'), function ($query, $search) {
                $term = '%'.trim($search).'%';
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

    public function enableStockTracking(EnableStockTrackingRequest $request, Product $product)
    {
        if ($product->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        if ($product->type !== 'product') {
            return $this->error(['Only product-type items can have stock tracking enabled.'], status: 422);
        }

        if ($product->track_stock) {
            return $this->error(['Stock tracking is already enabled for this product.'], status: 422);
        }

        $openingQuantity = $request->integer('opening_quantity');
        $reorderLevel = $request->has('reorder_level') ? $request->integer('reorder_level') : null;

        DB::transaction(function () use ($request, $product, $openingQuantity, $reorderLevel) {
            StockMovement::create([
                'tenant_id' => $product->tenant_id,
                'product_id' => $product->id,
                'type' => StockMovement::TYPE_OPENING_BALANCE,
                'quantity_delta' => $openingQuantity,
                'reason' => null,
                'created_by' => $request->user()->id,
            ]);

            $product->update([
                'track_stock' => true,
                'quantity_on_hand' => $openingQuantity,
                'reorder_level' => $reorderLevel,
                'updated_by' => $request->user()->id,
            ]);
        });

        return $this->success($product->fresh());
    }

    public function adjustStock(AdjustStockRequest $request, Product $product)
    {
        if ($product->tenant_id !== $request->user()->tenant_id) {
            abort(403);
        }

        if (! $product->track_stock) {
            return $this->error(['Stock tracking is not enabled for this product.'], status: 422);
        }

        $quantityDelta = $request->has('new_quantity')
            ? $request->integer('new_quantity') - $product->quantity_on_hand
            : $request->integer('delta');

        DB::transaction(function () use ($request, $product, $quantityDelta) {
            StockMovement::create([
                'tenant_id' => $product->tenant_id,
                'product_id' => $product->id,
                'type' => StockMovement::TYPE_ADJUSTMENT,
                'quantity_delta' => $quantityDelta,
                'reason' => $request->string('reason'),
                'created_by' => $request->user()->id,
            ]);

            $product->update([
                'quantity_on_hand' => $product->quantity_on_hand + $quantityDelta,
                'updated_by' => $request->user()->id,
            ]);
        });

        return $this->success($product->fresh());
    }
}
