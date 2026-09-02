<?php

namespace App\Http\Requests;

use App\Models\Cabinet;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCabinetRequest extends FormRequest
{
    public function authorize(): bool
    {
        $cabinet = $this->route('cabinet');

        return $cabinet instanceof Cabinet
            && $this->user()?->can('update', $cabinet) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $cabinet = $this->route('cabinet');
        $cabinetId = $cabinet instanceof Cabinet ? $cabinet->ID : null;

        return [
            'name' => ['sometimes', 'string', 'max:30', Rule::unique('cabinets', 'name')->ignore($cabinetId, 'ID')],
            'code' => ['sometimes', 'string', 'max:10', Rule::unique('cabinets', 'code')->ignore($cabinetId, 'ID')],
            'form_factor' => ['sometimes', Rule::in(Cabinet::FORM_FACTORS)],
            'tagline' => ['nullable', 'string', 'max:50'],
            'blurb' => ['sometimes', 'string'],
        ];
    }
}
