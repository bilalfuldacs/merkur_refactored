<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ValidatesMarketLandbasedPayload;
use App\Models\MarketLandbased;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreMarketLandbasedRequest extends FormRequest
{
    use ValidatesMarketLandbasedPayload;

    public function authorize(): bool
    {
        return $this->user()?->can('create', MarketLandbased::class) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'jurisdiction_ID' => ['required', 'integer', 'exists:jurisdictions,ID', 'unique:markets_landbased,jurisdiction_ID'],
            ...$this->payloadRules(),
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $this->validateJurisdictionSegment($validator, $this->integer('jurisdiction_ID') ?: null);
        });
    }
}
