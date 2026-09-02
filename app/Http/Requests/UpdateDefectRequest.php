<?php

namespace App\Http\Requests;

use App\Models\Defect;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDefectRequest extends FormRequest
{
    public function authorize(): bool
    {
        $defect = $this->route('defect');

        return $defect instanceof Defect
            && $this->user()?->can('update', $defect) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $defect = $this->route('defect');
        $defectId = $defect instanceof Defect ? $defect->ID : null;
        $gameId = $this->input('game_ID', $defect instanceof Defect ? $defect->game_ID : null);
        $versionId = $this->exists('version_ID')
            ? $this->input('version_ID')
            : ($defect instanceof Defect ? $defect->version_ID : null);
        $buildId = $this->exists('build_ID')
            ? $this->input('build_ID')
            : ($defect instanceof Defect ? $defect->build_ID : null);

        $versionRules = ['nullable', 'integer', 'exists:versions,ID'];
        $buildRules = ['nullable', 'integer', 'exists:builds,ID'];

        if ($versionId) {
            $versionRules[] = Rule::unique('defects', 'version_ID')->where('game_ID', $gameId)->ignore($defectId, 'ID');
        }

        if ($buildId) {
            $buildRules[] = Rule::unique('defects', 'build_ID')->where('game_ID', $gameId)->ignore($defectId, 'ID');
        }

        return [
            'version_ID' => $versionRules,
            'build_ID' => $buildRules,
            'game_ID' => ['sometimes', 'integer', 'exists:games,ID'],
            'name' => ['sometimes', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
        ];
    }
}
