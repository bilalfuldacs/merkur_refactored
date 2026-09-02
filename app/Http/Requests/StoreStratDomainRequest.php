<?php

namespace App\Http\Requests;

use App\Models\StratDomain;
use Illuminate\Foundation\Http\FormRequest;

class StoreStratDomainRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', StratDomain::class) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:40', 'unique:strat_domains,name'],
            'color' => ['nullable', 'string', 'size:7', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'purpose' => ['nullable', 'string', 'max:200'],
        ];
    }
}
