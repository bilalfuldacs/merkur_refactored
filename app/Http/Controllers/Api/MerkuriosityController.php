<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\MerkuriosityGuessRequest;
use App\Models\MerkuriosityDictionary;
use App\Models\MerkuriosityWord;
use Illuminate\Http\JsonResponse;

class MerkuriosityController extends Controller
{
    public function dailyWord(): JsonResponse
    {
        $word = $this->todaysWord();

        if ($word === null) {
            return response()->json(['message' => 'No words available.'], 404);
        }

        return response()->json([
            'word' => $word,
            'length' => 5,
        ]);
    }

    public function guess(MerkuriosityGuessRequest $request): JsonResponse
    {
        $guess = $request->validated('guess');
        $target = $this->todaysWord();

        if ($target === null) {
            return response()->json(['message' => 'No words available.'], 404);
        }

        $exists = MerkuriosityDictionary::query()->where('word', $guess)->exists();

        if (! $exists) {
            return response()->json([
                'message' => 'Not a valid English word.',
                'guess' => $guess,
            ], 422);
        }

        return response()->json([
            'guess' => $guess,
            'result' => $this->scoreGuess($guess, $target),
        ]);
    }

    private function todaysWord(): ?string
    {
        $words = MerkuriosityWord::query()->orderBy('id')->pluck('word');

        if ($words->isEmpty()) {
            return null;
        }

        $index = ((int) now()->format('z')) % $words->count();

        return strtolower((string) $words[$index]);
    }

    /**
     * @return list<string>
     */
    private function scoreGuess(string $guess, string $target): array
    {
        $result = [];
        $targetLetters = str_split($target);
        $guessLetters = str_split($guess);
        $used = array_fill(0, 5, false);

        for ($i = 0; $i < 5; $i++) {
            if ($guessLetters[$i] === $targetLetters[$i]) {
                $result[$i] = 'correct';
                $used[$i] = true;
            }
        }

        for ($i = 0; $i < 5; $i++) {
            if (isset($result[$i])) {
                continue;
            }

            $result[$i] = 'absent';

            for ($j = 0; $j < 5; $j++) {
                if (! $used[$j] && $guessLetters[$i] === $targetLetters[$j]) {
                    $result[$i] = 'present';
                    $used[$j] = true;
                    break;
                }
            }
        }

        ksort($result);

        return array_values($result);
    }
}
