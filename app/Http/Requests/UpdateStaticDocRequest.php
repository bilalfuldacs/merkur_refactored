<?php

namespace App\Http\Requests;

use App\Models\StaticDoc;
use Illuminate\Foundation\Http\FormRequest;

class UpdateStaticDocRequest extends FormRequest
{
    public function authorize(): bool
    {
        $staticDoc = $this->route('staticDoc');

        return $staticDoc instanceof StaticDoc
            && $this->user()?->can('update', $staticDoc) === true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('is_complete') && $this->input('is_complete') === '') {
            $this->merge(['is_complete' => null]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'subfolder' => ['sometimes', 'nullable', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'is_complete' => ['sometimes', 'nullable', 'boolean'],
            'pdf' => ['sometimes', 'file', 'mimes:pdf', 'max:51200'],
            'thumbnail' => ['sometimes', 'nullable', 'file', 'mimes:png,jpg,jpeg,webp', 'max:8192'],
        ];
    }
}
