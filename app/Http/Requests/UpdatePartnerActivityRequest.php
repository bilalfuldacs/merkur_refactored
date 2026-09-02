<?php

namespace App\Http\Requests;

use App\Models\PartnerActivity;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePartnerActivityRequest extends FormRequest
{
    public function authorize(): bool
    {
        $partnerActivity = $this->route('partnerActivity');

        return $partnerActivity instanceof PartnerActivity
            && $this->user()?->can('update', $partnerActivity) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $partnerActivity = $this->route('partnerActivity');
        $activityId = $partnerActivity instanceof PartnerActivity ? $partnerActivity->ID : null;
        $partnerId = $this->input('partner_ID', $partnerActivity instanceof PartnerActivity ? $partnerActivity->partner_ID : null);
        $jurisdictionId = $this->input('jurisdiction_ID', $partnerActivity instanceof PartnerActivity ? $partnerActivity->jurisdiction_ID : null);

        return [
            'jurisdiction_ID' => [
                'sometimes',
                'integer',
                'exists:jurisdictions,ID',
                Rule::unique('partner_activities', 'jurisdiction_ID')->where('partner_ID', $partnerId)->ignore($activityId, 'ID'),
            ],
            'partner_ID' => [
                'sometimes',
                'integer',
                'exists:partners,ID',
                Rule::unique('partner_activities', 'partner_ID')->where('jurisdiction_ID', $jurisdictionId)->ignore($activityId, 'ID'),
            ],
            'key_customer' => ['sometimes', 'boolean'],
            'total_machines' => ['nullable', 'integer'],
            'share_of_mfrs' => ['nullable', 'string', 'max:200'],
            'total_online_games' => ['nullable', 'integer'],
            'merkur_online_games' => ['nullable', 'integer'],
        ];
    }
}
