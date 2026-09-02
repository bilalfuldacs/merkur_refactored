<?php

namespace App\Http\Requests;

use App\Models\Compatibility;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCompatibilityRequest extends FormRequest
{
    public function authorize(): bool
    {
        $compatibility = $this->route('compatibility');

        return $compatibility instanceof Compatibility
            && $this->user()?->can('update', $compatibility) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $compatibility = $this->route('compatibility');
        $compatibilityId = $compatibility instanceof Compatibility ? $compatibility->ID : null;
        $versionId = $this->input('version_ID', $compatibility instanceof Compatibility ? $compatibility->version_ID : null);
        $componentId = $this->input('component_ID', $compatibility instanceof Compatibility ? $compatibility->component_ID : null);

        return [
            'version_ID' => [
                'sometimes',
                'integer',
                'exists:versions,ID',
                Rule::unique('compatibilities', 'version_ID')->where('component_ID', $componentId)->ignore($compatibilityId, 'ID'),
            ],
            'component_ID' => [
                'sometimes',
                'integer',
                'exists:components,ID',
                Rule::unique('compatibilities', 'component_ID')->where('version_ID', $versionId)->ignore($compatibilityId, 'ID'),
            ],
            'comment' => ['nullable', 'string', 'max:140'],
        ];
    }
}
