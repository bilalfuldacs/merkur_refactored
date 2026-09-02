<?php

namespace App\Http\Requests;

use App\Models\Installation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateInstallationRequest extends FormRequest
{
    public function authorize(): bool
    {
        $installation = $this->route('installation');

        return $installation instanceof Installation
            && $this->user()?->can('update', $installation) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $installation = $this->route('installation');
        $installationId = $installation instanceof Installation ? $installation->ID : null;
        $versionId = $this->input('version_ID', $installation instanceof Installation ? $installation->version_ID : null);
        $venueId = $this->exists('venue_ID')
            ? $this->input('venue_ID')
            : ($installation instanceof Installation ? $installation->venue_ID : null);

        return [
            'version_ID' => [
                'sometimes',
                'integer',
                'exists:versions,ID',
                $this->uniqueVersionVenueRule($installationId, $venueId),
            ],
            'jurisdiction_ID' => ['sometimes', 'integer', 'exists:jurisdictions,ID'],
            'venue_ID' => [
                'nullable',
                'integer',
                'exists:venues,ID',
                Rule::unique('installations', 'venue_ID')->where('version_ID', $versionId)->ignore($installationId, 'ID'),
            ],
            'first_install_date' => ['nullable', 'date'],
            'live' => ['nullable', 'integer', 'min:0'],
            'test' => ['nullable', 'integer', 'min:0'],
            'planned' => ['nullable', 'integer', 'min:0'],
            'perf_rating' => ['nullable', 'integer', 'min:0', 'max:255'],
            'tech_rating' => ['nullable', Rule::in(Installation::TECH_RATINGS)],
            'BI_URL' => ['nullable', 'string', 'max:250'],
            'video_URL' => ['nullable', 'string', 'max:250'],
            'first_install_type' => ['nullable', Rule::in(Installation::FIRST_INSTALL_TYPES)],
            'rtp' => ['nullable', 'string', 'max:10'],
            'test_comment' => ['nullable', 'string'],
            'planned_comment' => ['nullable', 'string'],
            'removal_comment' => ['nullable', 'string'],
            'removal_date' => ['nullable', 'date'],
        ];
    }

    private function uniqueVersionVenueRule(?int $installationId, mixed $venueId): \Illuminate\Validation\Rules\Unique
    {
        return Rule::unique('installations', 'version_ID')->where(function ($query) use ($venueId): void {
            if ($venueId === null) {
                $query->whereNull('venue_ID');
            } else {
                $query->where('venue_ID', $venueId);
            }
        })->ignore($installationId, 'ID');
    }
}
