<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTableAssetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        if ($this->input('ac') === null) {
            $this->merge(['ac' => '']);
        }

        if ($this->has('featured')) {
            $this->merge(['featured' => $this->boolean('featured')]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'upload' => ['required', 'file', 'max:102400'],
            'tlp' => ['required', 'in:red,amber,green,clear'],
            'ac' => ['nullable', 'string', 'max:100'],
            'featured' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'upload.required' => 'Choose a file to upload.',
            'upload.max' => 'The file is larger than 100 MB.',
            'tlp.in' => 'Choose a valid TLP level.',
        ];
    }
}
