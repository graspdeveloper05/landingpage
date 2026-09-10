<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Guards the participant export.
 *
 * A shared bearer token is proportionate for a one-off 200-person event with
 * a handful of organisers. If the Dialogue grows into multiple editions with
 * several staff, replace this with real user accounts (Laravel Breeze or
 * Sanctum) so access can be granted and revoked per person.
 */
class EnsureAdminToken
{
    public function handle(Request $request, Closure $next): Response
    {
        /*
         * A signed-in organiser is already authenticated, so the panel's
         * download button does not need to know the static token -- which it
         * could only get by having it embedded in public JavaScript.
         */
        if ($request->user()) {
            return $next($request);
        }

        $expected = config('event.admin_token');

        if (blank($expected)) {
            abort(503, 'Export is not configured. Set ADMIN_API_TOKEN.');
        }

        $provided = $request->bearerToken() ?? '';

        // hash_equals keeps the comparison constant-time, so the token cannot
        // be guessed a character at a time by measuring response times.
        if (! hash_equals($expected, $provided)) {
            abort(401, 'Unauthorised.');
        }

        return $next($request);
    }
}
