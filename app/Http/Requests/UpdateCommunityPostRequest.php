<?php

namespace App\Http\Requests;

use App\Models\DynamicPost;
use Illuminate\Foundation\Http\FormRequest;

class UpdateCommunityPostRequest extends FormRequest
{
    public function authorize(): bool
    {
        $dynamicPost = $this->route('dynamicPost');

        return $dynamicPost instanceof DynamicPost
            && $this->user()?->can('update', $dynamicPost) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'note' => ['required', 'string', 'max:10000'],
        ];
    }
}
