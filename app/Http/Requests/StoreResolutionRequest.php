<?php

namespace App\Http\Requests;

use App\Models\Resolution;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreResolutionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Resolution::class) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:40', 'unique:resolutions,name'],
            'orientation' => ['required', Rule::in(Resolution::ORIENTATIONS)],
        ];
    }
}
