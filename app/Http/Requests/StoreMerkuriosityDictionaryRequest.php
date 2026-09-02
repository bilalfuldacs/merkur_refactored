<?php

namespace App\Http\Requests;

use App\Models\MerkuriosityDictionary;
use Illuminate\Foundation\Http\FormRequest;

class StoreMerkuriosityDictionaryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', MerkuriosityDictionary::class) === true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('word')) {
            $this->merge(['word' => strtolower((string) $this->input('word'))]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'word' => ['required', 'string', 'size:5', 'alpha', 'unique:merkuriosity__dictionary,word'],
        ];
    }
}
