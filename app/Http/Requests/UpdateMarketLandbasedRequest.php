<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ValidatesMarketLandbasedPayload;
use App\Models\MarketLandbased;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateMarketLandbasedRequest extends FormRequest
{
    use ValidatesMarketLandbasedPayload;

    public function authorize(): bool
    {
        $market = $this->route('marketLandbased');

        return $market instanceof MarketLandbased
            && $this->user()?->can('update', $market) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $market = $this->route('marketLandbased');
        $marketId = $market instanceof MarketLandbased ? $market->ID : null;

        return [
            'jurisdiction_ID' => [
                'sometimes',
                'integer',
                'exists:jurisdictions,ID',
                Rule::unique('markets_landbased', 'jurisdiction_ID')->ignore($marketId, 'ID'),
            ],
            ...$this->payloadRules(),
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $market = $this->route('marketLandbased');
            $jurisdictionId = $this->exists('jurisdiction_ID')
                ? ($this->integer('jurisdiction_ID') ?: null)
                : ($market instanceof MarketLandbased ? (int) $market->jurisdiction_ID : null);

            $this->validateJurisdictionSegment($validator, $jurisdictionId);
        });
    }
}
