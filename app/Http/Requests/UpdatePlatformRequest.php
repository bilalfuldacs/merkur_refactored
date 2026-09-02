<?php

namespace App\Http\Requests;

use App\Models\Platform;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePlatformRequest extends FormRequest
{
    public function authorize(): bool
    {
        $platform = $this->route('platform');

        return $platform instanceof Platform
            && $this->user()?->can('update', $platform) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $platform = $this->route('platform');
        $platformId = $platform instanceof Platform ? $platform->ID : null;

        return [
            'name' => ['sometimes', 'string', 'max:30', Rule::unique('platforms', 'name')->ignore($platformId, 'ID')],
            'color' => ['nullable', 'string', 'size:7', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'tint_roadmap' => ['sometimes', 'boolean'],
        ];
    }
}
