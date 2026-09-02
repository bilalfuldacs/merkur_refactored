<?php

namespace App\Http\Requests;

use App\Models\ConfigStatus;
use Illuminate\Foundation\Http\FormRequest;

class StoreConfigStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', ConfigStatus::class) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'ID' => ['required', 'integer', 'min:1', 'unique:config__statuses,ID'],
            'name' => ['required', 'string', 'max:40'],
            'color' => ['required', 'string', 'size:7', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'text_color' => ['nullable', 'string', 'size:7', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ];
    }
}
