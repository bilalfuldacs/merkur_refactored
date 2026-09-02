<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ValidatesMarketOnlinePayload;
use App\Models\MarketOnline;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreMarketOnlineRequest extends FormRequest
{
    use ValidatesMarketOnlinePayload;

    public function authorize(): bool
    {
        return $this->user()?->can('create', MarketOnline::class) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'jurisdiction_ID' => ['required', 'integer', 'exists:jurisdictions,ID', 'unique:markets_online,jurisdiction_ID'],
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
