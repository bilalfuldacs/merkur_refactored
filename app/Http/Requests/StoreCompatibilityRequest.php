<?php

namespace App\Http\Requests;

use App\Models\Compatibility;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCompatibilityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Compatibility::class) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'version_ID' => [
                'required',
                'integer',
                'exists:versions,ID',
                Rule::unique('compatibilities', 'version_ID')->where('component_ID', $this->input('component_ID')),
            ],
            'component_ID' => ['required', 'integer', 'exists:components,ID'],
            'comment' => ['nullable', 'string', 'max:140'],
        ];
    }
}
