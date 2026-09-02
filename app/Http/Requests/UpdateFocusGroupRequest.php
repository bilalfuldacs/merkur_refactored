<?php

namespace App\Http\Requests;

use App\Models\FocusGroup;
use Illuminate\Foundation\Http\FormRequest;

class UpdateFocusGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        $focusGroup = $this->route('focusGroup');

        return $focusGroup instanceof FocusGroup
            && $this->user()?->can('update', $focusGroup) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'version_ID' => ['sometimes', 'integer', 'exists:versions,ID'],
            'jurisdiction_ID' => ['sometimes', 'integer', 'exists:jurisdictions,ID'],
            'start_date' => ['nullable', 'date'],
            'video_URL' => ['nullable', 'string', 'max:250'],
            'test_comment' => ['nullable', 'string'],
            'ramifications' => ['nullable', 'string'],
        ];
    }
}
