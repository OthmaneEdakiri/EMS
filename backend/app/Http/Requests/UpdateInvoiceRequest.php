<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenantId = $this->user()->tenant_id;

        return [
            'customer_id' => [
                'sometimes',
                'required',
                'integer',
                Rule::exists('customers', 'id')
                    ->where('tenant_id', $tenantId)
                    ->whereNull('archived_at')
                    ->whereNull('deleted_at'),
            ],
            'issue_date' => ['sometimes', 'required', 'date'],
            'due_date' => ['sometimes', 'required', 'date', 'after_or_equal:issue_date'],
            'lines' => ['sometimes', 'required', 'array', 'min:1'],
            'lines.*.product_id' => [
                'nullable',
                'integer',
                Rule::exists('products', 'id')
                    ->where('tenant_id', $tenantId)
                    ->whereNull('archived_at')
                    ->whereNull('deleted_at'),
            ],
            'lines.*.description' => ['required', 'string', 'max:500'],
            'lines.*.qty' => ['required', 'numeric', 'min:0.01'],
            'lines.*.unit_price' => ['required', 'integer', 'min:0'],
            'lines.*.tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'customer_id.required' => 'Please select a customer.',
            'customer_id.exists' => 'The selected customer does not exist or is not available.',
            'lines.required' => 'At least one line item is required.',
            'lines.min' => 'At least one line item is required.',
            'lines.*.product_id.exists' => 'The selected product does not exist or is not available.',
            'lines.*.description.required' => 'Description is required for each line item.',
            'lines.*.qty.min' => 'Quantity must be at least 0.01.',
            'lines.*.unit_price.min' => 'Unit price must be at least 0.',
            'lines.*.tax_rate.max' => 'Tax rate cannot exceed 100%.',
        ];
    }
}
