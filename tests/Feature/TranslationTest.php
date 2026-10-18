<?php

namespace Tests\Feature;

use Tests\TestCase;

class TranslationTest extends TestCase
{
    public function test_translation_catalog_lists_supported_locales(): void
    {
        $this->getJson('/api/translations')
            ->assertOk()
            ->assertJsonPath('default', 'en')
            ->assertJsonFragment(['code' => 'en', 'native' => 'English'])
            ->assertJsonFragment(['code' => 'de', 'native' => 'Deutsch'])
            ->assertJsonFragment(['code' => 'es', 'native' => 'Español'])
            ->assertJsonFragment(['code' => 'fr', 'native' => 'Français']);
    }

    public function test_translation_file_is_served_for_each_locale(): void
    {
        $this->getJson('/api/translations/en')
            ->assertOk()
            ->assertJsonPath('locale', 'en')
            ->assertJsonPath('messages.nav.products', 'Products');

        $this->getJson('/api/translations/de')
            ->assertOk()
            ->assertJsonPath('messages.nav.products', 'Produkte');

        $this->getJson('/api/translations/es')
            ->assertOk()
            ->assertJsonPath('messages.login.submit', 'Iniciar sesión');

        $this->getJson('/api/translations/fr')
            ->assertOk()
            ->assertJsonPath('messages.nav.logout', 'Déconnexion');
    }

    public function test_catalog_phrases_are_merged_for_translated_locales(): void
    {
        $this->getJson('/api/translations/en')
            ->assertOk()
            ->assertJsonMissingPath('messages.tables.phrases');

        $this->getJson('/api/translations/de')
            ->assertOk()
            ->assertJsonPath(
                'messages.tables.phrases.Game Concepts are fundamental building blocks of our software.',
                'Spielkonzepte sind die grundlegenden Bausteine unserer Software.',
            );

        $this->getJson('/api/translations/es')
            ->assertOk()
            ->assertJsonPath(
                'messages.tables.phrases.This table contains all Game Concepts. By default, it is sorted from most to least recent.',
                'Esta tabla contiene todos los conceptos de juego. De forma predeterminada se ordena del más reciente al más antiguo.',
            );
    }

    public function test_unknown_locale_is_rejected(): void
    {
        $this->getJson('/api/translations/it')->assertNotFound();
        $this->getJson('/api/translations/../en')->assertNotFound();
    }

    public function test_locale_files_share_the_same_keys(): void
    {
        $english = json_decode((string) file_get_contents(lang_path('frontend/en.json')), true);
        $this->assertIsArray($english);

        foreach (['de', 'es', 'fr'] as $locale) {
            $messages = json_decode((string) file_get_contents(lang_path('frontend/'.$locale.'.json')), true);
            $this->assertIsArray($messages);
            $this->assertSame($this->keyPaths($english), $this->keyPaths($messages), $locale);
        }
    }

    /**
     * @param  array<string, mixed>  $tree
     * @return list<string>
     */
    private function keyPaths(array $tree, string $prefix = ''): array
    {
        $paths = [];

        foreach ($tree as $key => $value) {
            $path = $prefix === '' ? (string) $key : $prefix.'.'.$key;

            if (is_array($value)) {
                $paths = array_merge($paths, $this->keyPaths($value, $path));
                continue;
            }

            $paths[] = $path;
        }

        sort($paths);

        return $paths;
    }
}
