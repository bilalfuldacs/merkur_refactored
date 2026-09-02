<?php

namespace App\Http\Requests;

use App\Models\Build;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBuildRequest extends FormRequest
{
    public function authorize(): bool
    {
        $build = $this->route('build');

        return $build instanceof Build
            && $this->user()?->can('update', $build) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $build = $this->route('build');
        $buildId = $build instanceof Build ? $build->ID : null;

        return [
            'version_ID' => ['sometimes', 'integer', 'exists:versions,ID'],
            'jurisdiction_ID' => ['nullable', 'integer', 'exists:jurisdictions,ID'],
            'name' => ['sometimes', 'string', 'max:25', Rule::unique('builds', 'name')->ignore($buildId, 'ID')],
            'status_ID' => ['sometimes', 'integer', 'exists:config__statuses,ID'],
            'comment' => ['nullable', 'string', 'max:140'],
            'p_label' => ['nullable', 'string', 'max:40'],
            'checksum_system' => ['nullable', 'string', 'max:40'],
            'checksum_verify' => ['nullable', 'string', 'max:40'],
            'checksum_app' => ['nullable', 'string', 'max:40'],
        ];
    }
}
