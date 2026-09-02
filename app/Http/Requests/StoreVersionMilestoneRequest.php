<?php

namespace App\Http\Requests;

use App\Models\VersionMilestone;
use Illuminate\Foundation\Http\FormRequest;

class StoreVersionMilestoneRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', VersionMilestone::class) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'version_ID' => ['required', 'integer', 'exists:versions,ID'],
            'jurisdiction_ID' => ['required', 'integer', 'exists:jurisdictions,ID'],
            'expected_status_ID' => ['required', 'integer', 'exists:config__statuses,ID'],
            'expected_date' => ['required', 'date'],
            'actual_date' => ['nullable', 'date'],
            'comment' => ['nullable', 'string', 'max:140'],
        ];
    }
}
