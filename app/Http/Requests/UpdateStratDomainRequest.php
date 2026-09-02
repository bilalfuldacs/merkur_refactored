<?php

namespace App\Http\Requests;

use App\Models\StratDomain;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStratDomainRequest extends FormRequest
{
    public function authorize(): bool
    {
        $stratDomain = $this->route('stratDomain');

        return $stratDomain instanceof StratDomain
            && $this->user()?->can('update', $stratDomain) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $stratDomain = $this->route('stratDomain');
        $domainId = $stratDomain instanceof StratDomain ? $stratDomain->ID : null;

        return [
            'name' => ['sometimes', 'string', 'max:40', Rule::unique('strat_domains', 'name')->ignore($domainId, 'ID')],
            'color' => ['nullable', 'string', 'size:7', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'purpose' => ['nullable', 'string', 'max:200'],
        ];
    }
}
