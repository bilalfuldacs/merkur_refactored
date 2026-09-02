<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ValidatesMarketOnlinePayload;
use App\Models\MarketOnline;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateMarketOnlineRequest extends FormRequest
{
    use ValidatesMarketOnlinePayload;

    public function authorize(): bool
    {
        $market = $this->route('marketOnline');

        return $market instanceof MarketOnline
            && $this->user()?->can('update', $market) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $market = $this->route('marketOnline');
        $marketId = $market instanceof MarketOnline ? $market->ID : null;

        return [
            'jurisdiction_ID' => [
                'sometimes',
                'integer',
                'exists:jurisdictions,ID',
                Rule::unique('markets_online', 'jurisdiction_ID')->ignore($marketId, 'ID'),
            ],
            ...$this->payloadRules(),
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $market = $this->route('marketOnline');
            $jurisdictionId = $this->exists('jurisdiction_ID')
                ? ($this->integer('jurisdiction_ID') ?: null)
                : ($market instanceof MarketOnline ? (int) $market->jurisdiction_ID : null);

            $this->validateJurisdictionSegment($validator, $jurisdictionId);
        });
    }
}
