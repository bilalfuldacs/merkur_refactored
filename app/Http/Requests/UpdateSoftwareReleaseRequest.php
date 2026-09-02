<?php

namespace App\Http\Requests;

use App\Models\SoftwareRelease;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSoftwareReleaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        $softwareRelease = $this->route('softwareRelease');

        return $softwareRelease instanceof SoftwareRelease
            && $this->user()?->can('update', $softwareRelease) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $softwareRelease = $this->route('softwareRelease');
        $releaseId = $softwareRelease instanceof SoftwareRelease ? $softwareRelease->ID : null;

        return [
            'build_ID' => ['nullable', 'integer', 'exists:builds,ID', Rule::unique('releases', 'build_ID')->ignore($releaseId, 'ID')],
            'release_date' => ['nullable', 'date'],
            'release_by' => ['sometimes', 'integer', 'exists:dynamic__users,ID'],
            'GLI_approval_status' => ['sometimes', 'string', 'max:160'],
            'base_dongle_ID' => ['sometimes', 'integer', 'exists:dongles,ID'],
            'suitable_for_cabinets' => ['sometimes', 'string', 'max:160'],
            'suitable_for_markets' => ['sometimes', 'string', 'max:160'],
            'solved_issues' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
