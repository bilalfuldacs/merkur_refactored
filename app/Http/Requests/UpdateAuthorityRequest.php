<?php

namespace App\Http\Requests;

use App\Models\Authority;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAuthorityRequest extends FormRequest
{
    public function authorize(): bool
    {
        $authority = $this->route('authority');

        return $authority instanceof Authority
            && $this->user()?->can('update', $authority) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $authority = $this->route('authority');
        $authorityId = $authority instanceof Authority ? $authority->ID : null;

        return [
            'name' => ['sometimes', 'string', 'max:40', Rule::unique('authorities', 'name')->ignore($authorityId, 'ID')],
            'website' => ['nullable', 'string', 'max:40'],
        ];
    }
}
