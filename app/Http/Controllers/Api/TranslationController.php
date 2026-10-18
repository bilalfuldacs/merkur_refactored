<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use JsonException;

class TranslationController extends Controller
{
    /**
     * Locales served to the frontend. Messages live in lang/frontend/{code}.json.
     *
     * @var array<string, array{label: string, native: string}>
     */
    private const LOCALES = [
        'en' => ['label' => 'English', 'native' => 'English'],
        'de' => ['label' => 'German', 'native' => 'Deutsch'],
        'es' => ['label' => 'Spanish', 'native' => 'Español'],
        'fr' => ['label' => 'French', 'native' => 'Français'],
    ];

    public function index(): JsonResponse
    {
        $locales = [];

        foreach (self::LOCALES as $code => $meta) {
            $locales[] = [
                'code' => $code,
                'label' => $meta['label'],
                'native' => $meta['native'],
            ];
        }

        return response()->json([
            'default' => 'en',
            'locales' => $locales,
        ]);
    }

    public function show(string $locale): JsonResponse
    {
        $locale = strtolower($locale);

        if (! array_key_exists($locale, self::LOCALES)) {
            abort(404);
        }

        $path = lang_path('frontend/'.$locale.'.json');

        if (! is_file($path)) {
            abort(404);
        }

        $contents = file_get_contents($path);

        if ($contents === false) {
            abort(404);
        }

        try {
            $messages = json_decode($contents, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            abort(500, 'Translation file is invalid.');
        }

        if (! is_array($messages)) {
            abort(500, 'Translation file is invalid.');
        }

        $phrases = $this->phrases($locale);

        if ($phrases !== []) {
            if (! isset($messages['tables']) || ! is_array($messages['tables'])) {
                $messages['tables'] = [];
            }

            $messages['tables']['phrases'] = $phrases;
        }

        $articles = $this->faqArticles($locale);

        if ($articles !== []) {
            if (! isset($messages['help']) || ! is_array($messages['help'])) {
                $messages['help'] = [];
            }

            $messages['help']['articles'] = $articles;
        }

        return response()->json([
            'locale' => $locale,
            'messages' => $messages,
        ]);
    }

    /**
     * Catalog sentences keyed by the English source. English keeps the original text.
     *
     * @return array<string, string>
     */
    private function phrases(string $locale): array
    {
        if ($locale === 'en') {
            return [];
        }

        $path = lang_path('frontend/phrases.json');

        if (! is_file($path)) {
            return [];
        }

        $contents = file_get_contents($path);

        if ($contents === false) {
            return [];
        }

        try {
            $catalog = json_decode($contents, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            return [];
        }

        if (! is_array($catalog)) {
            return [];
        }

        $phrases = [];

        foreach ($catalog as $english => $row) {
            if (! is_string($english) || ! is_array($row) || ! isset($row[$locale]) || ! is_string($row[$locale])) {
                continue;
            }

            $phrases[$english] = $row[$locale];
        }

        return $phrases;
    }

    /**
     * Help articles keyed by the English title stored in static__faqs.
     *
     * @return array<string, array{title: string, article: string}>
     */
    private function faqArticles(string $locale): array
    {
        if ($locale === 'en') {
            return [];
        }

        $catalog = $this->readJson(lang_path('frontend/faqs.json'));

        if ($catalog === null) {
            return [];
        }

        $articles = [];

        foreach ($catalog as $english => $row) {
            if (! is_string($english) || ! is_array($row) || ! isset($row[$locale]) || ! is_array($row[$locale])) {
                continue;
            }

            $copy = $row[$locale];

            if (! isset($copy['title'], $copy['article']) || ! is_string($copy['title']) || ! is_string($copy['article'])) {
                continue;
            }

            $articles[$english] = [
                'title' => $copy['title'],
                'article' => $copy['article'],
            ];
        }

        return $articles;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function readJson(string $path): ?array
    {
        if (! is_file($path)) {
            return null;
        }

        $contents = file_get_contents($path);

        if ($contents === false) {
            return null;
        }

        try {
            $decoded = json_decode($contents, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            return null;
        }

        return is_array($decoded) ? $decoded : null;
    }
}
