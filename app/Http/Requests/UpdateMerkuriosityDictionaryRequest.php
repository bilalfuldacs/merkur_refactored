<?php

namespace App\Http\Requests;

use App\Models\MerkuriosityDictionary;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMerkuriosityDictionaryRequest extends FormRequest
{
    public function authorize(): bool
    {
        $merkuriosityDictionary = $this->route('merkuriosityDictionary');

        return $merkuriosityDictionary instanceof MerkuriosityDictionary
            && $this->user()?->can('update', $merkuriosityDictionary) === true;
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
        $merkuriosityDictionary = $this->route('merkuriosityDictionary');
        $wordId = $merkuriosityDictionary instanceof MerkuriosityDictionary ? $merkuriosityDictionary->id : null;

        return [
            'word' => ['sometimes', 'string', 'size:5', 'alpha', Rule::unique('merkuriosity__dictionary', 'word')->ignore($wordId, 'id')],
        ];
    }
}
