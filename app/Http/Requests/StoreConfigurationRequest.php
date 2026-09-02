<?php

namespace App\Http\Requests;

use App\Models\Configuration;
use Illuminate\Foundation\Http\FormRequest;

class StoreConfigurationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Configuration::class) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'SKU' => ['nullable', 'string', 'size:8', 'unique:configurations,SKU'],
        ];
    }
}
