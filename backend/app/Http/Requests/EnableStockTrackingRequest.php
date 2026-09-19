<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EnableStockTrackingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'opening_quantity' => ['required', 'integer', 'min:0'],
            'reorder_level' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'opening_quantity.required' => 'Opening quantity is required.',
            'opening_quantity.integer' => 'Opening quantity must be a whole number.',
            'opening_quantity.min' => 'Opening quantity cannot be negative.',
            'reorder_level.integer' => 'Reorder level must be a whole number.',
            'reorder_level.min' => 'Reorder level cannot be negative.',
        ];
    }
}
