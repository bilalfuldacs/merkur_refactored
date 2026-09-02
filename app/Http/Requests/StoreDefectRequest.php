<?php

namespace App\Http\Requests;

use App\Models\Defect;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDefectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Defect::class) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $versionRules = ['nullable', 'integer', 'exists:versions,ID'];
        $buildRules = ['nullable', 'integer', 'exists:builds,ID'];

        if ($this->filled('version_ID')) {
            $versionRules[] = Rule::unique('defects', 'version_ID')->where('game_ID', $this->input('game_ID'));
        }

        if ($this->filled('build_ID')) {
            $buildRules[] = Rule::unique('defects', 'build_ID')->where('game_ID', $this->input('game_ID'));
        }

        return [
            'version_ID' => $versionRules,
            'build_ID' => $buildRules,
            'game_ID' => ['required', 'integer', 'exists:games,ID'],
            'name' => ['required', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
        ];
    }
}
