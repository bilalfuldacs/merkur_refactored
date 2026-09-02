<?php

namespace App\Http\Requests;

use App\Models\StaticDoc;
use Illuminate\Foundation\Http\FormRequest;

class StoreStaticDocRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', StaticDoc::class) === true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('is_complete') && $this->input('is_complete') === '') {
            $this->merge(['is_complete' => null]);
        }

        if ($this->has('subfolder') && trim((string) $this->input('subfolder')) === '') {
            $this->merge(['subfolder' => 'Uploads']);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'subfolder' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'is_complete' => ['nullable', 'boolean'],
            'pdf' => ['required', 'file', 'mimes:pdf', 'max:51200'],
            'thumbnail' => ['nullable', 'file', 'mimes:png,jpg,jpeg,webp', 'max:8192'],
        ];
    }
}
