<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ModifyTableAssetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'tlp' => ['required', 'in:red,amber,green,clear'],
            'ac' => ['nullable', 'string', 'max:100'],
            'sf' => ['nullable', 'string', 'max:200'],
            'f' => ['required', 'string', 'max:255'],
            'tlp_new' => ['nullable', 'in:red,amber,green,clear'],
            'ac_new' => ['nullable', 'string', 'max:100'],
            'sf_new' => ['nullable', 'string', 'max:200'],
            'name_new' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:2000'],
            'featured' => ['sometimes', 'boolean'],
            'draft' => ['sometimes', 'boolean'],
            'delete' => ['sometimes', 'boolean'],
        ];
    }
}
