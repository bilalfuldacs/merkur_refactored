<?php

/**
 * Local bootstrap diagnostic only.
 * Disabled unless APP_ENV=local and MERKUR_CHECK_KEY matches.
 * Delete this file on any shared / production host.
 */

declare(strict_types=1);

$envFile = dirname(__DIR__).'/.env';
$env = [];
if (is_readable($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || ! str_contains($line, '=')) {
            continue;
        }
        [$key, $value] = explode('=', $line, 2);
        $env[trim($key)] = trim($value, " \t\"'");
    }
}

$appEnv = $env['APP_ENV'] ?? 'production';
$expected = $env['MERKUR_CHECK_KEY'] ?? '';
$provided = (string) ($_GET['key'] ?? '');

if ($appEnv !== 'local' || $expected === '' || ! hash_equals($expected, $provided)) {
    http_response_code(404);
    exit('Not found');
}

header('Content-Type: text/plain; charset=utf-8');
header('X-Robots-Tag: noindex');
header('Cache-Control: no-store');

echo 'PHP '.PHP_VERSION."\n";
echo '.env: '.(is_file($envFile) ? 'yes' : 'NO')."\n";
echo 'storage writable: '.(is_writable(dirname(__DIR__).'/storage') ? 'yes' : 'NO')."\n";
echo 'APP_ENV: '.$appEnv."\n";
echo 'APP_DEBUG: '.(($env['APP_DEBUG'] ?? 'false'))."\n";
echo 'DB_CONNECTION: '.(($env['DB_CONNECTION'] ?? ''))."\n";
echo "ok\n";
