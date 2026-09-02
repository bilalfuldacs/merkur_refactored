<?php

namespace App\Http\Requests;

use App\Models\Authority;
use Illuminate\Foundation\Http\FormRequest;

class StoreAuthorityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Authority::class) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:40', 'unique:authorities,name'],
            'website' => ['nullable', 'string', 'max:40'],
        ];
    }
}
