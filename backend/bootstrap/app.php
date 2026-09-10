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
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
