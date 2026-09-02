<?php

namespace App\Http\Requests;

use App\Models\Venue;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateVenueRequest extends FormRequest
{
    public function authorize(): bool
    {
        $venue = $this->route('venue');

        return $venue instanceof Venue
            && $this->user()?->can('update', $venue) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $venue = $this->route('venue');
        $venueId = $venue instanceof Venue ? $venue->ID : null;
        $partnerId = $this->input('partner_ID', $venue instanceof Venue ? $venue->partner_ID : null);
        $name = $this->input('name', $venue instanceof Venue ? $venue->name : null);

        return [
            'partner_ID' => [
                'nullable',
                'integer',
                'exists:partners,ID',
                Rule::unique('venues', 'partner_ID')->where('name', $name)->ignore($venueId, 'ID'),
            ],
            'name' => [
                'sometimes',
                'string',
                'max:100',
                Rule::unique('venues', 'name')->where('partner_ID', $partnerId)->ignore($venueId, 'ID'),
            ],
            'jurisdiction_ID' => ['nullable', 'integer', 'exists:jurisdictions,ID'],
            'active' => ['sometimes', 'boolean'],
            'location' => ['nullable', 'string', 'max:30'],
            'street_address' => ['nullable', 'string', 'max:50'],
            'city' => ['nullable', 'string', 'max:40'],
            'province' => ['nullable', 'string', 'max:40'],
            'postal_code' => ['nullable', 'string', 'max:20'],
        ];
    }
}
