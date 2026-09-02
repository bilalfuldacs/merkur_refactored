<?php

namespace App\Http\Requests;

use App\Models\Dongle;
use Illuminate\Foundation\Http\FormRequest;

class UpdateDongleRequest extends FormRequest
{
    public function authorize(): bool
    {
        $dongle = $this->route('dongle');

        return $dongle instanceof Dongle
            && $this->user()?->can('update', $dongle) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:40'],
            'version_ID' => ['sometimes', 'integer', 'exists:versions,ID'],
            'name2' => ['sometimes', 'string', 'max:80'],
            'jurisdiction_ID' => ['sometimes', 'integer', 'exists:jurisdictions,ID'],
            'salesforce_URL' => ['nullable', 'string', 'max:250'],
        ];
    }
}
