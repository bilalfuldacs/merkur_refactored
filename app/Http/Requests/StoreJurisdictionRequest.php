<?php

namespace App\Http\Requests;

use App\Models\Jurisdiction;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreJurisdictionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Jurisdiction::class) === true;
    }

    protected function prepareForValidation(): void
    {
        if (! $this->exists('segment_name') || $this->input('segment_name') === null) {
            $this->merge(['segment_name' => '']);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:50', 'unique:jurisdictions,name'],
            'name_english' => ['required', 'string', 'max:50', 'unique:jurisdictions,name_english'],
            'iso3166' => [
                'required',
                'string',
                'max:10',
                Rule::unique('jurisdictions', 'iso3166')
                    ->where('segment', $this->input('segment'))
                    ->where('segment_name', $this->input('segment_name')),
            ],
            'parent_ID' => ['nullable', 'integer', 'exists:jurisdictions,ID'],
            'flag' => ['required', 'string', 'max:5'],
            'color' => ['nullable', 'string', 'size:7', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'game_languages' => ['nullable', 'string', 'max:40'],
            'segment' => ['required', Rule::in(Jurisdiction::SEGMENTS)],
            'segment_name' => ['nullable', 'string', 'max:10'],
            'currency_name_english' => ['required', 'string', 'max:50'],
            'iso4217' => ['required', 'string', 'size:3'],
            'currency_symbol' => ['required', 'string', 'max:5'],
            'symbol_position' => ['nullable', Rule::in(Jurisdiction::SYMBOL_POSITIONS)],
            'separators' => ['nullable', Rule::in(Jurisdiction::SEPARATORS)],
            'authority_ID' => ['nullable', 'integer', 'exists:authorities,ID'],
            'xfer_letter_reqd' => ['nullable', 'boolean'],
            'denominations' => ['nullable', 'string', 'max:40'],
            'min_bet' => ['nullable', 'string', 'max:20'],
            'max_bet' => ['nullable', 'string', 'max:20'],
            'min_RTP' => ['nullable', 'string', 'max:20'],
            'max_BG_win' => ['nullable', 'string', 'max:20'],
            'max_JP_win' => ['nullable', 'string', 'max:80'],
            'min_reel_run_time' => ['nullable', 'string', 'max:20'],
            'auto_start' => ['nullable', Rule::in(Jurisdiction::AUTO_START)],
            'gamble' => ['nullable', 'boolean'],
            'dev_URL_HW' => ['nullable', 'string', 'max:250'],
            'dev_URL_SW' => ['nullable', 'string', 'max:250'],
            'comment' => ['nullable', 'string'],
            'attributes' => ['nullable', 'array'],
        ];
    }
}
