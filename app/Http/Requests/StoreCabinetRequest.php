<?php

namespace App\Http\Requests;

use App\Models\Cabinet;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCabinetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Cabinet::class) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:30', 'unique:cabinets,name'],
            'code' => ['required', 'string', 'max:10', 'unique:cabinets,code'],
            'form_factor' => ['required', Rule::in(Cabinet::FORM_FACTORS)],
            'tagline' => ['nullable', 'string', 'max:50'],
            'blurb' => ['required', 'string'],
        ];
    }
}
