<?php

namespace App\Http\Requests;

use App\Models\Component;
use Illuminate\Foundation\Http\FormRequest;

class StoreComponentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Component::class) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'SKU' => ['nullable', 'string', 'size:8', 'unique:components,SKU'],
            'name' => ['required', 'string', 'max:30', 'unique:components,name'],
            'type_ID' => ['required', 'integer', 'exists:hardware_types,ID'],
        ];
    }
}
