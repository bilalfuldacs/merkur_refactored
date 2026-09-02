<?php

namespace App\Http\Requests;

use App\Models\SoftwareRelease;
use Illuminate\Foundation\Http\FormRequest;

class StoreSoftwareReleaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', SoftwareRelease::class) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'build_ID' => ['nullable', 'integer', 'exists:builds,ID', 'unique:releases,build_ID'],
            'release_date' => ['nullable', 'date'],
            'release_by' => ['required', 'integer', 'exists:dynamic__users,ID'],
            'GLI_approval_status' => ['required', 'string', 'max:160'],
            'base_dongle_ID' => ['required', 'integer', 'exists:dongles,ID'],
            'suitable_for_cabinets' => ['required', 'string', 'max:160'],
            'suitable_for_markets' => ['required', 'string', 'max:160'],
            'solved_issues' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
