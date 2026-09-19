<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AdjustStockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'new_quantity' => ['sometimes', 'nullable', 'integer'],
            'delta' => ['sometimes', 'nullable', 'integer'],
            'reason' => ['required', 'string', 'min:1', 'max:255'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if (! $this->has('new_quantity') && ! $this->has('delta')) {
                $validator->errors()->add('quantity', 'Either new_quantity or delta must be provided.');
            }

            if ($this->has('new_quantity') && $this->has('delta')) {
                $validator->errors()->add('quantity', 'Only one of new_quantity or delta may be provided, not both.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'reason.required' => 'Reason is required.',
            'reason.string' => 'Reason must be a string.',
            'reason.min' => 'Reason cannot be empty.',
            'new_quantity.integer' => 'New quantity must be a whole number.',
            'delta.integer' => 'Delta must be a whole number.',
        ];
    }
}
