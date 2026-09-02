<?php

namespace App\Http\Requests;

use App\Models\Component;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateComponentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $component = $this->route('component');

        return $component instanceof Component
            && $this->user()?->can('update', $component) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $component = $this->route('component');
        $componentId = $component instanceof Component ? $component->ID : null;

        return [
            'SKU' => ['nullable', 'string', 'size:8', Rule::unique('components', 'SKU')->ignore($componentId, 'ID')],
            'name' => ['sometimes', 'string', 'max:30', Rule::unique('components', 'name')->ignore($componentId, 'ID')],
            'type_ID' => ['sometimes', 'integer', 'exists:hardware_types,ID'],
        ];
    }
}
