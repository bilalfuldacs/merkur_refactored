<?php

namespace App\Http\Requests;

use App\Models\Availability;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAvailabilityRequest extends FormRequest
{
    public function authorize(): bool
    {
        $availability = $this->route('availability');

        return $availability instanceof Availability
            && $this->user()?->can('update', $availability) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $availability = $this->route('availability');
        $availabilityId = $availability instanceof Availability ? $availability->ID : null;
        $versionId = $this->input('version_ID', $availability instanceof Availability ? $availability->version_ID : null);
        $jurisdictionId = $this->input('jurisdiction_ID', $availability instanceof Availability ? $availability->jurisdiction_ID : null);

        return [
            'version_ID' => [
                'sometimes',
                'integer',
                'exists:versions,ID',
                Rule::unique('availabilities', 'version_ID')->where('jurisdiction_ID', $jurisdictionId)->ignore($availabilityId, 'ID'),
            ],
            'jurisdiction_ID' => [
                'sometimes',
                'integer',
                'exists:jurisdictions,ID',
                Rule::unique('availabilities', 'jurisdiction_ID')->where('version_ID', $versionId)->ignore($availabilityId, 'ID'),
            ],
            'status' => ['sometimes', Rule::in(Availability::STATUSES)],
            'priority' => ['sometimes', Rule::in(Availability::PRIORITIES)],
            'comment' => ['nullable', 'string', 'max:140'],
        ];
    }
}
