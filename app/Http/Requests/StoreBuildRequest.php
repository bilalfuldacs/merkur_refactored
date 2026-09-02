<?php

namespace App\Http\Requests;

use App\Models\Build;
use Illuminate\Foundation\Http\FormRequest;

class StoreBuildRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Build::class) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'version_ID' => ['required', 'integer', 'exists:versions,ID'],
            'jurisdiction_ID' => ['nullable', 'integer', 'exists:jurisdictions,ID'],
            'name' => ['required', 'string', 'max:25', 'unique:builds,name'],
            'status_ID' => ['required', 'integer', 'exists:config__statuses,ID'],
            'comment' => ['nullable', 'string', 'max:140'],
            'p_label' => ['nullable', 'string', 'max:40'],
            'checksum_system' => ['nullable', 'string', 'max:40'],
            'checksum_verify' => ['nullable', 'string', 'max:40'],
            'checksum_app' => ['nullable', 'string', 'max:40'],
        ];
    }
}
