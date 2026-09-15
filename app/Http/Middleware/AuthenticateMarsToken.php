<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateMarsToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $expected = (string) env('MARS_API_TOKEN', '');
        if ($expected === '') {
            return response()->json(['error' => 'API is not configured'], 503);
        }

        $provided = $this->providedToken($request);
        if ($provided === '' || ! hash_equals($expected, $provided)) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        if ($request->method() !== 'GET') {
            return response()->json(['error' => 'Method not allowed'], 405)
                ->header('Allow', 'GET');
        }

        return $next($request);
    }

    private function providedToken(Request $request): string
    {
        $header = (string) $request->header('Authorization', '');
        if (preg_match('/^Bearer\s+(\S+)/i', $header, $match) === 1) {
            return $match[1];
        }

        return (string) $request->header('X-API-Key', '');
    }
}
