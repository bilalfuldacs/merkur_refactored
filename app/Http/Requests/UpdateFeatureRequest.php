<?php

namespace App\Http\Requests;

use App\Models\Feature;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFeatureRequest extends FormRequest
{
    public function authorize(): bool
    {
        $feature = $this->route('feature');

        return $feature instanceof Feature
            && $this->user()?->can('update', $feature) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $feature = $this->route('feature');
        $featureId = $feature instanceof Feature ? $feature->ID : null;

        return [
            'ID_text' => ['nullable', 'string', 'size:4', Rule::unique('features', 'ID_text')->ignore($featureId, 'ID')],
            'name' => ['sometimes', 'string', 'max:100'],
            'version_ID' => ['nullable', 'integer', 'exists:versions,ID'],
            'dev_URL' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ];
    }
}
