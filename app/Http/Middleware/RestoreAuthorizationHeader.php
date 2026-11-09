<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RestoreAuthorizationHeader
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->headers->has('Authorization')) {
            $header = $request->headers->get('X-Authorization')
                ?: $request->server('HTTP_AUTHORIZATION')
                ?: $request->server('REDIRECT_HTTP_AUTHORIZATION');

            if (is_string($header) && $header !== '') {
                $request->headers->set('Authorization', $header);
            }
        }

        return $next($request);
    }
}
