<?php

namespace App\Http\Requests;

use App\Models\CiSupplier;
use Illuminate\Foundation\Http\FormRequest;

class StoreCiSupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', CiSupplier::class) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'short_name' => ['required', 'string', 'max:40', 'unique:ci_suppliers,short_name'],
            'name' => ['nullable', 'string', 'max:50', 'unique:ci_suppliers,name'],
            'website' => ['nullable', 'string', 'max:50'],
            'comment' => ['nullable', 'string'],
        ];
    }
}
