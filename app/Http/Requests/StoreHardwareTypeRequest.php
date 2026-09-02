<?php

namespace App\Http\Requests;

use App\Models\HardwareType;
use Illuminate\Foundation\Http\FormRequest;

class StoreHardwareTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', HardwareType::class) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:30', 'unique:hardware_types,name'],
        ];
    }
}
