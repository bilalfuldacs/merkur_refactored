<?php

namespace App\Http\Requests;

use App\Models\DynamicPost;
use Illuminate\Foundation\Http\FormRequest;

class StoreCommunityPostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', DynamicPost::class) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'note' => ['required', 'string', 'max:280'],
            'table' => ['nullable', 'required_with:item_ID', 'string', 'max:30', 'exists:config__tables,table'],
            'item_ID' => ['nullable', 'required_with:table', 'integer', 'min:1'],
        ];
    }
}
