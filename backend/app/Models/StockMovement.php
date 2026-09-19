<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockMovement extends Model
{
    use HasFactory;

    public const TYPE_OPENING_BALANCE = 'opening_balance';

    public const TYPE_SALE = 'sale';

    public const TYPE_CANCELLATION_REVERSAL = 'cancellation_reversal';

    public const TYPE_ADJUSTMENT = 'adjustment';

    public const REFERENCE_TYPE_INVOICE = 'invoice';

    protected $fillable = [
        'tenant_id',
        'product_id',
        'type',
        'quantity_delta',
        'reference_type',
        'reference_id',
        'reason',
        'created_by',
    ];

    protected $casts = [
        'quantity_delta' => 'integer',
    ];

    public $timestamps = false;

    protected $guarded = ['created_at'];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
