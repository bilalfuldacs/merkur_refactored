<?php

namespace App\Http\Requests;

use App\Models\VersionMilestone;
use Illuminate\Foundation\Http\FormRequest;

class UpdateVersionMilestoneRequest extends FormRequest
{
    public function authorize(): bool
    {
        $versionMilestone = $this->route('versionMilestone');

        return $versionMilestone instanceof VersionMilestone
            && $this->user()?->can('update', $versionMilestone) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'version_ID' => ['sometimes', 'integer', 'exists:versions,ID'],
            'jurisdiction_ID' => ['sometimes', 'integer', 'exists:jurisdictions,ID'],
            'expected_status_ID' => ['sometimes', 'integer', 'exists:config__statuses,ID'],
            'expected_date' => ['sometimes', 'date'],
            'actual_date' => ['nullable', 'date'],
            'comment' => ['nullable', 'string', 'max:140'],
        ];
    }
}
