<?php

namespace App\Http\Requests;

use App\Models\Dongle;
use Illuminate\Foundation\Http\FormRequest;

class StoreDongleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Dongle::class) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:40'],
            'version_ID' => ['required', 'integer', 'exists:versions,ID'],
            'name2' => ['required', 'string', 'max:80'],
            'jurisdiction_ID' => ['required', 'integer', 'exists:jurisdictions,ID'],
            'salesforce_URL' => ['nullable', 'string', 'max:250'],
        ];
    }
}
