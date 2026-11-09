<?php

/**
 * Temporary boot check. Delete this file from the server after reading the result.
 * Open: /merkur-check.php?key=mf-check-7k2p
 */

if (($_GET['key'] ?? '') !== 'mf-check-7k2p') {
    http_response_code(404);
    exit('Not found');
}

header('Content-Type: text/plain; charset=utf-8');
header('X-Robots-Tag: noindex');
ini_set('display_errors', '1');
error_reporting(E_ALL);

function merkur_check_show(Throwable $e): void
{
    echo "EXCEPTION\n";
    echo $e::class."\n";
    echo $e->getMessage()."\n";
    echo $e->getFile().':'.$e->getLine()."\n\n";
    $lines = explode("\n", $e->getTraceAsString());
    echo implode("\n", array_slice($lines, 0, 12))."\n";
}

echo "PHP ".PHP_VERSION."\n";
echo 'Carbon file: '.(is_file(__DIR__.'/../vendor/nesbot/carbon/src/Carbon/Carbon.php') ? 'yes' : 'NO')."\n";
echo '.env: '.(is_file(__DIR__.'/../.env') ? 'yes' : 'NO')."\n";
echo 'storage writable: '.(is_writable(__DIR__.'/../storage') ? 'yes' : 'NO')."\n";
echo 'logs writable: '.(is_writable(__DIR__.'/../storage/logs') ? 'yes' : 'NO')."\n";
echo 'framework writable: '.(is_writable(__DIR__.'/../storage/framework') ? 'yes' : 'NO')."\n";
echo 'bootstrap/cache writable: '.(is_writable(__DIR__.'/../bootstrap/cache') ? 'yes' : 'NO')."\n";
echo 'config cache: '.(is_file(__DIR__.'/../bootstrap/cache/config.php') ? 'yes' : 'no')."\n\n";

try {
    require __DIR__.'/../vendor/autoload.php';
    echo 'autoload: ok'."\n";
    echo 'Carbon\\Carbon: '.(class_exists(Carbon\Carbon::class) ? 'yes' : 'NO')."\n";
    $app = require __DIR__.'/../bootstrap/app.php';
    echo "bootstrap: ok\n";
} catch (Throwable $e) {
    echo "BOOT FAILED\n";
    merkur_check_show($e);
    exit;
}

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

try {
    $kernel->bootstrap();
    echo 'APP_ENV: '.config('app.env')."\n";
    echo 'APP_DEBUG: '.(config('app.debug') ? 'true' : 'false')."\n";
    echo 'APP_KEY set: '.(config('app.key') ? 'yes' : 'NO')."\n";
    echo 'DB_CONNECTION: '.config('database.default')."\n";
    echo 'SESSION_DRIVER: '.config('session.driver')."\n";
    echo 'CACHE_STORE: '.config('cache.default')."\n\n";
} catch (Throwable $e) {
    echo "CONFIG FAILED\n";
    merkur_check_show($e);
    exit;
}

$bucket = new stdClass();
$bucket->error = null;

$app->instance(Illuminate\Contracts\Debug\ExceptionHandler::class, new class($bucket) implements Illuminate\Contracts\Debug\ExceptionHandler
{
    public function __construct(private object $bucket) {}

    public function report(Throwable $e): void
    {
        $this->bucket->error = $e;
    }

    public function shouldReport(Throwable $e): bool
    {
        return false;
    }

    public function render($request, Throwable $e)
    {
        $this->bucket->error = $e;

        return new Symfony\Component\HttpFoundation\Response('', 500);
    }

    public function renderForConsole($output, Throwable $e): void {}
});

try {
    $request = Illuminate\Http\Request::create('/', 'GET');
    $response = $kernel->handle($request);
    echo 'GET / status: '.$response->getStatusCode()."\n";
} catch (Throwable $e) {
    echo "REQUEST FAILED\n";
    merkur_check_show($e);
    exit;
}

if ($bucket->error instanceof Throwable) {
    merkur_check_show($bucket->error);
    exit;
}

echo "No exception. The homepage booted.\n";
echo "Delete public/merkur-check.php from the server now.\n";
