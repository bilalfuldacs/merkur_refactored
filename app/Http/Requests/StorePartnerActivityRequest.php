<?php

namespace App\Http\Requests;

use App\Models\PartnerActivity;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePartnerActivityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', PartnerActivity::class) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'jurisdiction_ID' => [
                'required',
                'integer',
                'exists:jurisdictions,ID',
                Rule::unique('partner_activities', 'jurisdiction_ID')->where('partner_ID', $this->input('partner_ID')),
            ],
            'partner_ID' => ['required', 'integer', 'exists:partners,ID'],
            'key_customer' => ['required', 'boolean'],
            'total_machines' => ['nullable', 'integer'],
            'share_of_mfrs' => ['nullable', 'string', 'max:200'],
            'total_online_games' => ['nullable', 'integer'],
            'merkur_online_games' => ['nullable', 'integer'],
        ];
    }
}
