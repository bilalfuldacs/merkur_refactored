<?php

namespace App\Http\Requests;

use App\Models\Game;
use App\Models\GameReuse;
use App\Models\Version;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateGameReuseRequest extends FormRequest
{
    public function authorize(): bool
    {
        $gameReuse = $this->route('gameReuse');

        return $gameReuse instanceof GameReuse
            && $this->user()?->can('update', $gameReuse) === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $gameReuse = $this->route('gameReuse');
        $reuseId = $gameReuse instanceof GameReuse ? $gameReuse->ID : null;
        $gameId = $this->input('original_game_port_ID', $gameReuse instanceof GameReuse ? $gameReuse->original_game_port_ID : null);
        $versionFromId = $this->input('version_from_ID', $gameReuse instanceof GameReuse ? $gameReuse->version_from_ID : null);

        return [
            'original_game_port_ID' => [
                'sometimes',
                'integer',
                'exists:games,ID',
                Rule::unique('game_reuses', 'original_game_port_ID')->where('version_from_ID', $versionFromId)->ignore($reuseId, 'ID'),
            ],
            'version_from_ID' => [
                'sometimes',
                'integer',
                'exists:versions,ID',
                Rule::unique('game_reuses', 'version_from_ID')->where('original_game_port_ID', $gameId)->ignore($reuseId, 'ID'),
            ],
            'version_removed_ID' => ['nullable', 'integer', 'exists:versions,ID'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $gameReuse = $this->route('gameReuse');
            $gameId = $this->input('original_game_port_ID', $gameReuse instanceof GameReuse ? $gameReuse->original_game_port_ID : null);
            $versionFromId = $this->input('version_from_ID', $gameReuse instanceof GameReuse ? $gameReuse->version_from_ID : null);
            $versionRemovedId = $this->exists('version_removed_ID')
                ? $this->input('version_removed_ID')
                : ($gameReuse instanceof GameReuse ? $gameReuse->version_removed_ID : null);

            $game = $gameId ? Game::query()->find($gameId) : null;

            if (! $game instanceof Game) {
                return;
            }

            if ($versionFromId && ! Version::query()->where('ID', $versionFromId)->where('platform_ID', $game->platform_ID)->exists()) {
                $validator->errors()->add('version_from_ID', Game::VERSION_PLATFORM_MISMATCH);
            }

            if ($versionRemovedId && ! Version::query()->where('ID', $versionRemovedId)->where('platform_ID', $game->platform_ID)->exists()) {
                $validator->errors()->add('version_removed_ID', Game::VERSION_PLATFORM_MISMATCH);
            }
        });
    }
}
