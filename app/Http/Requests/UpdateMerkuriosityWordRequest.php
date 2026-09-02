<?php

namespace App\Http\Requests;

use App\Models\MerkuriosityWord;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMerkuriosityWordRequest extends FormRequest
{
    public function authorize(): bool
    {
        $merkuriosityWord = $this->route('merkuriosityWord');

        return $merkuriosityWord instanceof MerkuriosityWord
            && $this->user()?->can('update', $merkuriosityWord) === true;
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
        $merkuriosityWord = $this->route('merkuriosityWord');
        $wordId = $merkuriosityWord instanceof MerkuriosityWord ? $merkuriosityWord->id : null;

        return [
            'word' => ['sometimes', 'string', 'size:5', 'alpha', Rule::unique('merkuriosity__words', 'word')->ignore($wordId, 'id')],
        ];
    }
}
