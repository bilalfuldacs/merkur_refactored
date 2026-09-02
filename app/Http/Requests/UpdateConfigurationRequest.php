<?php

namespace App\Http\Requests;

use App\Models\Configuration;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateConfigurationRequest extends FormRequest
{
    public function authorize(): bool
    {
        $configuration = $this->route('configuration');

        return $configuration instanceof Configuration
            && $this->user()?->can('update', $configuration) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $configuration = $this->route('configuration');
        $configurationId = $configuration instanceof Configuration ? $configuration->ID : null;

        return [
            'SKU' => ['nullable', 'string', 'size:8', Rule::unique('configurations', 'SKU')->ignore($configurationId, 'ID')],
        ];
    }
}
