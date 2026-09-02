<?php

namespace App\Http\Requests;

use App\Models\Resolution;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateResolutionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $resolution = $this->route('resolution');

        return $resolution instanceof Resolution
            && $this->user()?->can('update', $resolution) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $resolution = $this->route('resolution');
        $resolutionId = $resolution instanceof Resolution ? $resolution->ID : null;

        return [
            'name' => ['sometimes', 'string', 'max:40', Rule::unique('resolutions', 'name')->ignore($resolutionId, 'ID')],
            'orientation' => ['sometimes', Rule::in(Resolution::ORIENTATIONS)],
        ];
    }
}
