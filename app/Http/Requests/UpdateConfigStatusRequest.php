<?php

namespace App\Http\Requests;

use App\Models\ConfigStatus;
use Illuminate\Foundation\Http\FormRequest;

class UpdateConfigStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        $configStatus = $this->route('configStatus');

        return $configStatus instanceof ConfigStatus
            && $this->user()?->can('update', $configStatus) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:40'],
            'color' => ['sometimes', 'string', 'size:7', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'text_color' => ['sometimes', 'nullable', 'string', 'size:7', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ];
    }
}
