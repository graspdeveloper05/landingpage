<?php

/*
|--------------------------------------------------------------------------
| Cross-Origin Resource Sharing (CORS)
|--------------------------------------------------------------------------
|
| The SPA is served from the primary domain and this API from its own
| subdomain, so every request the browser makes here is cross-origin and
| needs an explicit allow.
|
| Laravel's default config allows '*'. That is fine for a read-only public
| API and wrong for this one: /api/admin/registrations returns the full
| attendee list -- names, emails, mobile numbers -- and '*' invites any page
| on the internet to try its luck with a stolen token. The token is the real
| guard, but there is no reason to widen the blast radius as well.
|
| Extra origins (a staging build, a local `npm run dev` pointed at
| production) go in CORS_ALLOWED_ORIGINS as a comma-separated list.
|
*/

$origins = array_filter(array_map('trim', explode(',', (string) env('CORS_ALLOWED_ORIGINS', ''))));

return [

    'paths' => ['api/*'],

    'allowed_methods' => ['GET', 'POST', 'OPTIONS'],

    'allowed_origins' => $origins !== [] ? $origins : [
        'https://serinegaradialogue.org',
        'https://www.serinegaradialogue.org',
    ],

    'allowed_origins_patterns' => [],

    // Authorization carries the export token as a bearer credential, and any
    // request sending it triggers a preflight -- so it has to be named here.
    'allowed_headers' => ['Accept', 'Authorization', 'Content-Type', 'X-Requested-With'],

    'exposed_headers' => [],

    // Cache the preflight for a day. Without this every registration POST
    // costs two round-trips from a phone on mobile data.
    'max_age' => 86400,

    // No cookies or session are used: the admin endpoint authenticates with a
    // token header. Leaving this false keeps a stolen browser session useless.
    'supports_credentials' => false,

];
