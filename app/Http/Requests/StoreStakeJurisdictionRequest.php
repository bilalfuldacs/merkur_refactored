<?php

namespace App\Http\Requests;

use App\Models\StakeJurisdiction;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStakeJurisdictionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', StakeJurisdiction::class) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'person_ID' => [
                'required',
                'integer',
                'exists:dynamic__users,ID',
                Rule::unique('stakes_jurisdictions', 'person_ID')->where('jurisdiction_ID', $this->input('jurisdiction_ID')),
            ],
            'jurisdiction_ID' => ['required', 'integer', 'exists:jurisdictions,ID'],
            'as_deputy' => ['sometimes', 'boolean'],
        ];
    }
}
