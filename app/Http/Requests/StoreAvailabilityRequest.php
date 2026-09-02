<?php

namespace App\Http\Requests;

use App\Models\Availability;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAvailabilityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Availability::class) === true;
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
                Rule::unique('availabilities', 'version_ID')->where('jurisdiction_ID', $this->input('jurisdiction_ID')),
            ],
            'jurisdiction_ID' => ['required', 'integer', 'exists:jurisdictions,ID'],
            'status' => ['sometimes', Rule::in(Availability::STATUSES)],
            'priority' => ['sometimes', Rule::in(Availability::PRIORITIES)],
            'comment' => ['nullable', 'string', 'max:140'],
        ];
    }
}
