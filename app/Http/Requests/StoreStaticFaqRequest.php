<?php

namespace App\Http\Requests;

use App\Models\StaticFaq;
use Illuminate\Foundation\Http\FormRequest;

class StoreStaticFaqRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', StaticFaq::class) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'order' => ['nullable', 'integer', 'min:0'],
            'title' => ['required', 'string', 'max:500', 'unique:static__faqs,title'],
            'article' => ['required', 'string'],
        ];
    }
}
