<?php

namespace App\Http\Requests;

use App\Models\HardwareType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateHardwareTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        $hardwareType = $this->route('hardwareType');

        return $hardwareType instanceof HardwareType
            && $this->user()?->can('update', $hardwareType) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $hardwareType = $this->route('hardwareType');
        $hardwareTypeId = $hardwareType instanceof HardwareType ? $hardwareType->ID : null;

        return [
            'name' => ['sometimes', 'string', 'max:30', Rule::unique('hardware_types', 'name')->ignore($hardwareTypeId, 'ID')],
        ];
    }
}
