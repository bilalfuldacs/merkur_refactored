<?php

namespace App\Http\Requests;

use App\Models\MatrixTemplate;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMatrixTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', MatrixTemplate::class) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'table' => [
                'required',
                'string',
                'max:40',
                Rule::unique('matrix_templates', 'table')->where('column', $this->input('column')),
            ],
            'column' => ['required', 'string', 'max:40'],
            'template' => ['nullable', 'array'],
            'active' => ['sometimes', 'boolean'],
            'description' => ['nullable', 'string'],
        ];
    }
}
