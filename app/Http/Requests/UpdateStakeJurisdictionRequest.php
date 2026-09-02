<?php

namespace App\Http\Requests;

use App\Models\StakeJurisdiction;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStakeJurisdictionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $stakeJurisdiction = $this->route('stakeJurisdiction');

        return $stakeJurisdiction instanceof StakeJurisdiction
            && $this->user()?->can('update', $stakeJurisdiction) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $stakeJurisdiction = $this->route('stakeJurisdiction');
        $stakeId = $stakeJurisdiction instanceof StakeJurisdiction ? $stakeJurisdiction->ID : null;
        $personId = $this->input('person_ID', $stakeJurisdiction instanceof StakeJurisdiction ? $stakeJurisdiction->person_ID : null);
        $jurisdictionId = $this->input('jurisdiction_ID', $stakeJurisdiction instanceof StakeJurisdiction ? $stakeJurisdiction->jurisdiction_ID : null);

        return [
            'person_ID' => [
                'sometimes',
                'integer',
                'exists:dynamic__users,ID',
                Rule::unique('stakes_jurisdictions', 'person_ID')->where('jurisdiction_ID', $jurisdictionId)->ignore($stakeId, 'ID'),
            ],
            'jurisdiction_ID' => [
                'sometimes',
                'integer',
                'exists:jurisdictions,ID',
                Rule::unique('stakes_jurisdictions', 'jurisdiction_ID')->where('person_ID', $personId)->ignore($stakeId, 'ID'),
            ],
            'as_deputy' => ['sometimes', 'boolean'],
        ];
    }
}
