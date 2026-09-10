<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        /*
         * Session authentication for the admin panel.
         *
         * The panel is part of the same React app, served from the same
         * domain as the API, so Sanctum's stateful mode applies: the browser
         * gets an HttpOnly session cookie instead of a token.
         *
         * That choice is about what is being guarded. /api/admin/registrations
         * returns every attendee's name, email and mobile number -- personal
         * data under the PDPA. A bearer token kept in localStorage is readable
         * by any script that manages to run on the page; an HttpOnly cookie is
         * not. Public /api routes are unaffected: no session, no cookie, no
         * CSRF token needed to read the programme or submit an RSVP.
         */
        $middleware->statefulApi();

        /*
         * The public endpoints are exempt from CSRF.
         *
         * statefulApi() above makes every /api/* request from this domain
         * stateful, which switches on session handling AND CSRF verification.
         * That is what the admin panel needs and what the RSVP form must not
         * have: it is an unauthenticated public form that sends no token, so
         * enabling session auth silently broke every registration with a
         * "CSRF token mismatch" and a generic failure on screen.
         *
         * Exempting it is not a weakening. CSRF protects a browser's ambient
         * authority -- a session cookie being spent without the user meaning
         * it. This endpoint has no session and grants nothing: the worst a
         * forged request achieves is what anyone can already do by opening
         * the page. Laravel's own api.php ships with no CSRF at all for the
         * same reason. Rate limiting and the honeypot are what guard it.
         *
         * Admin routes are deliberately NOT listed here.
         */
        $middleware->validateCsrfTokens(except: [
            'api/registrations',
            'api/analytics/pageview',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
