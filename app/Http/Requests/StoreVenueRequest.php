<?php

namespace App\Http\Requests;

use App\Models\Venue;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreVenueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Venue::class) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'partner_ID' => ['nullable', 'integer', 'exists:partners,ID'],
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('venues', 'name')->where('partner_ID', $this->input('partner_ID')),
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
