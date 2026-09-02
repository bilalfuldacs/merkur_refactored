<?php

namespace App\Http\Requests;

use App\Models\CiSupplier;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCiSupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        $ciSupplier = $this->route('ciSupplier');

        return $ciSupplier instanceof CiSupplier
            && $this->user()?->can('update', $ciSupplier) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $ciSupplier = $this->route('ciSupplier');
        $supplierId = $ciSupplier instanceof CiSupplier ? $ciSupplier->ID : null;

        return [
            'short_name' => ['sometimes', 'string', 'max:40', Rule::unique('ci_suppliers', 'short_name')->ignore($supplierId, 'ID')],
            'name' => ['nullable', 'string', 'max:50', Rule::unique('ci_suppliers', 'name')->ignore($supplierId, 'ID')],
            'website' => ['nullable', 'string', 'max:50'],
            'comment' => ['nullable', 'string'],
        ];
    }
}
