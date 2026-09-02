<?php

namespace App\Http\Requests;

use App\Models\StaticFaq;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStaticFaqRequest extends FormRequest
{
    public function authorize(): bool
    {
        $staticFaq = $this->route('staticFaq');

        return $staticFaq instanceof StaticFaq
            && $this->user()?->can('update', $staticFaq) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $staticFaq = $this->route('staticFaq');
        $faqId = $staticFaq instanceof StaticFaq ? $staticFaq->ID : null;

        return [
            'order' => ['nullable', 'integer', 'min:0'],
            'title' => ['sometimes', 'string', 'max:500', Rule::unique('static__faqs', 'title')->ignore($faqId, 'ID')],
            'article' => ['sometimes', 'string'],
        ];
    }
}
