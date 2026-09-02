<?php

namespace App\Http\Requests;

use App\Models\MatrixTemplate;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMatrixTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        $matrixTemplate = $this->route('matrixTemplate');

        return $matrixTemplate instanceof MatrixTemplate
            && $this->user()?->can('update', $matrixTemplate) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $matrixTemplate = $this->route('matrixTemplate');
        $templateId = $matrixTemplate instanceof MatrixTemplate ? $matrixTemplate->ID : null;
        $column = $this->input('column', $matrixTemplate instanceof MatrixTemplate ? $matrixTemplate->column : null);

        return [
            'table' => [
                'sometimes',
                'string',
                'max:40',
                Rule::unique('matrix_templates', 'table')->where('column', $column)->ignore($templateId, 'ID'),
            ],
            'column' => ['sometimes', 'string', 'max:40'],
            'template' => ['nullable', 'array'],
            'active' => ['sometimes', 'boolean'],
            'description' => ['nullable', 'string'],
        ];
    }
}
