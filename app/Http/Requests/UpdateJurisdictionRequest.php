<?php

namespace App\Http\Requests;

use App\Models\Jurisdiction;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateJurisdictionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $jurisdiction = $this->route('jurisdiction');

        return $jurisdiction instanceof Jurisdiction
            && $this->user()?->can('update', $jurisdiction) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $jurisdiction = $this->route('jurisdiction');
        $jurisdictionId = $jurisdiction instanceof Jurisdiction ? $jurisdiction->ID : null;
        $segment = $this->input('segment', $jurisdiction instanceof Jurisdiction ? $jurisdiction->segment : null);
        $segmentName = $this->exists('segment_name')
            ? ($this->input('segment_name') ?? '')
            : ($jurisdiction instanceof Jurisdiction ? $jurisdiction->segment_name : '');

        return [
            'name' => ['sometimes', 'string', 'max:50', Rule::unique('jurisdictions', 'name')->ignore($jurisdictionId, 'ID')],
            'name_english' => ['sometimes', 'string', 'max:50', Rule::unique('jurisdictions', 'name_english')->ignore($jurisdictionId, 'ID')],
            'iso3166' => [
                'sometimes',
                'string',
                'max:10',
                Rule::unique('jurisdictions', 'iso3166')
                    ->where('segment', $segment)
                    ->where('segment_name', $segmentName)
                    ->ignore($jurisdictionId, 'ID'),
            ],
            'parent_ID' => [
                'nullable',
                'integer',
                'exists:jurisdictions,ID',
                Rule::notIn([$jurisdictionId]),
            ],
            'flag' => ['sometimes', 'string', 'max:5'],
            'color' => ['nullable', 'string', 'size:7', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'game_languages' => ['nullable', 'string', 'max:40'],
            'segment' => ['sometimes', Rule::in(Jurisdiction::SEGMENTS)],
            'segment_name' => ['nullable', 'string', 'max:10'],
            'currency_name_english' => ['sometimes', 'string', 'max:50'],
            'iso4217' => ['sometimes', 'string', 'size:3'],
            'currency_symbol' => ['sometimes', 'string', 'max:5'],
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
