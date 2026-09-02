<?php

namespace App\Http\Requests;

use App\Models\Feature;
use Illuminate\Foundation\Http\FormRequest;

class StoreFeatureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Feature::class) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'ID_text' => ['nullable', 'string', 'size:4', 'unique:features,ID_text'],
            'name' => ['required', 'string', 'max:100'],
            'version_ID' => ['nullable', 'integer', 'exists:versions,ID'],
            'dev_URL' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ];
    }
}
