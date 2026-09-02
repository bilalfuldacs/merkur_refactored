<?php

namespace App\Http\Requests;

use App\Models\DynamicComment;
use Illuminate\Foundation\Http\FormRequest;

class StoreCommunityCommentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', DynamicComment::class) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'note' => ['required', 'string', 'max:1000'],
            'parent_ID' => ['nullable', 'integer', 'exists:dynamic__comments,ID'],
        ];
    }
}
