<?php

namespace App\Http\Requests;

use App\Models\Installation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInstallationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Installation::class) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'version_ID' => [
                'required',
                'integer',
                'exists:versions,ID',
                $this->uniqueVersionVenueRule(),
            ],
            'jurisdiction_ID' => ['required', 'integer', 'exists:jurisdictions,ID'],
            'venue_ID' => ['nullable', 'integer', 'exists:venues,ID'],
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

    private function uniqueVersionVenueRule(): \Illuminate\Validation\Rules\Unique
    {
        return Rule::unique('installations', 'version_ID')->where(function ($query): void {
            $venueId = $this->input('venue_ID');

            if ($venueId === null) {
                $query->whereNull('venue_ID');
            } else {
                $query->where('venue_ID', $venueId);
            }
        });
    }
}
