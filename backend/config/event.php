<?php

/*
|--------------------------------------------------------------------------
| Seri Negara Dialogue — event details
|--------------------------------------------------------------------------
|
| Everything the organising team changes year to year. Confirmed values come
| from the client brief; edit here rather than in code.
|
*/

return [

    'edition' => (int) env('EVENT_EDITION', 2026),

    'date' => env('EVENT_DATE', '2026-10-08'),

    'start_time' => env('EVENT_START_TIME', '14:30'),

    'venue' => env('EVENT_VENUE', 'Muzium Negara'),

    'venue_address' => env('EVENT_VENUE_ADDRESS', 'Jalan Damansara, 50566 Kuala Lumpur, Malaysia'),

    'maps_url' => env('EVENT_MAPS_URL', 'https://maps.google.com/?q=Muzium+Negara+Kuala+Lumpur'),

    'map_embed_url' => env(
        'EVENT_MAP_EMBED_URL',
        'https://www.google.com/maps?q=Muzium+Negara,+Jalan+Damansara,+Kuala+Lumpur&output=embed'
    ),

    /*
    | §9 — "The estimated event capacity is approximately 200 participants."
    | Enforced atomically in RegistrationController; changing this number is
    | the only supported way to open or close more seats.
    */
    'capacity' => (int) env('EVENT_CAPACITY', 200),

    /*
    | The venue's timezone, used to decide when the event is over.
    |
    | Not the server's. A cPanel account may well run in UTC, where 8 October
    | in Kuala Lumpur ends eight hours before UTC agrees -- registration would
    | close at 4pm on the day of the Dialogue, while people are still arriving.
    */
    'timezone' => env('EVENT_TIMEZONE', 'Asia/Kuala_Lumpur'),

    /*
    | Prefix for the reference shown to attendees and asked for at the door.
    | Kept short enough to read aloud: SND26-0001.
    */
    'reference_prefix' => env('EVENT_REFERENCE_PREFIX', 'SND26'),

    /*
    | Where registration enquiries go. Also the reply-to on confirmations.
    */
    'contact_email' => env('EVENT_CONTACT_EMAIL', 'hello@serinegaradialogue.org'),

    /*
    | Bearer token guarding the participant export. Generate with:
    |   php artisan dialogue:token
    | and keep it out of version control.
    */
    'admin_token' => env('ADMIN_API_TOKEN'),

];
