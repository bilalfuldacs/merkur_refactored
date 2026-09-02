<?php

namespace App\Http\Requests;

use App\Models\Partner;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePartnerRequest extends FormRequest
{
    public function authorize(): bool
    {
        $partner = $this->route('partner');

        return $partner instanceof Partner
            && $this->user()?->can('update', $partner) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $partner = $this->route('partner');
        $partnerId = $partner instanceof Partner ? $partner->ID : null;

        return [
            'name' => ['sometimes', 'string', 'max:100', Rule::unique('partners', 'name')->ignore($partnerId, 'ID')],
            'website' => ['nullable', 'string', 'max:50'],
            'active' => ['sometimes', 'boolean'],
        ];
    }
}
