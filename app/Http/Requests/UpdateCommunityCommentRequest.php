<?php

namespace App\Http\Requests;

use App\Models\DynamicComment;
use Illuminate\Foundation\Http\FormRequest;

class UpdateCommunityCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $dynamicComment = $this->route('dynamicComment');

        return $dynamicComment instanceof DynamicComment
            && $this->user()?->can('update', $dynamicComment) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'note' => ['required', 'string', 'max:1000'],
        ];
    }
}
