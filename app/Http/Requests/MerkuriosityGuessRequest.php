<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MerkuriosityGuessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('guess')) {
            $this->merge(['guess' => strtolower((string) $this->input('guess'))]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'guess' => ['required', 'string', 'size:5', 'alpha'],
        ];
    }
}
