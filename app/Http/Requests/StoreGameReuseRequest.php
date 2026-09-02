<?php

namespace App\Http\Requests;

use App\Models\Game;
use App\Models\GameReuse;
use App\Models\Version;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreGameReuseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', GameReuse::class) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'original_game_port_ID' => [
                'required',
                'integer',
                'exists:games,ID',
                Rule::unique('game_reuses', 'original_game_port_ID')->where('version_from_ID', $this->input('version_from_ID')),
            ],
            'version_from_ID' => ['required', 'integer', 'exists:versions,ID'],
            'version_removed_ID' => ['nullable', 'integer', 'exists:versions,ID'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $this->validateSamePlatform($validator);
        });
    }

    private function validateSamePlatform(Validator $validator): void
    {
        $gameId = $this->integer('original_game_port_ID') ?: null;
        $versionFromId = $this->integer('version_from_ID') ?: null;
        $versionRemovedId = $this->filled('version_removed_ID') ? $this->integer('version_removed_ID') : null;

        if (! $gameId || ! $versionFromId) {
            return;
        }

        $game = Game::query()->find($gameId);

        if (! $game instanceof Game) {
            return;
        }

        if (! Version::query()->where('ID', $versionFromId)->where('platform_ID', $game->platform_ID)->exists()) {
            $validator->errors()->add('version_from_ID', Game::VERSION_PLATFORM_MISMATCH);
        }

        if ($versionRemovedId && ! Version::query()->where('ID', $versionRemovedId)->where('platform_ID', $game->platform_ID)->exists()) {
            $validator->errors()->add('version_removed_ID', Game::VERSION_PLATFORM_MISMATCH);
        }
    }
}
