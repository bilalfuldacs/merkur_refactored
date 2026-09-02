<?php

namespace App\Http\Requests;

use App\Models\FocusGroup;
use Illuminate\Foundation\Http\FormRequest;

class StoreFocusGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', FocusGroup::class) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'version_ID' => ['required', 'integer', 'exists:versions,ID'],
            'jurisdiction_ID' => ['required', 'integer', 'exists:jurisdictions,ID'],
            'start_date' => ['nullable', 'date'],
            'video_URL' => ['nullable', 'string', 'max:250'],
            'test_comment' => ['nullable', 'string'],
            'ramifications' => ['nullable', 'string'],
        ];
    }
}
