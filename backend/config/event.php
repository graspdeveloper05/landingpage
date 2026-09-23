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

    // 1.30 PM is when doors open for registration; the programme itself
    // begins at 2.30 PM sharp. Client feedback, September 2026.
    'start_time' => env('EVENT_START_TIME', '13:30'),

    /*
    | The date and time as a visitor reads them, per language. Written, not
    | formatted: "Khamis" and "星期四" are translations, not locale settings.
    | The weekday is the client's; 8 October 2026 is a Thursday.
    */
    'date_label' => [
        'en' => '8 October 2026 (Thursday)',
        'ms' => '8 Oktober 2026 (Khamis)',
        'zh' => '2026 年 10 月 8 日（星期四）',
        'ta' => '8 அக்டோபர் 2026 (வியாழன்)',
    ],

    'time_label' => [
        'en' => '1.30 PM onwards',
        'ms' => '1.30 petang dan seterusnya',
        'zh' => '下午 1.30 起',
        'ta' => 'பிற்பகல் 1.30 முதல்',
    ],

    'venue' => env('EVENT_VENUE', 'Auditorium Muzium Negara'),

    'venue_address' => env('EVENT_VENUE_ADDRESS', 'Jalan Damansara, 50566 Kuala Lumpur, Malaysia'),

    // The place the client pinned, "Department of Museum", with the
    // tracking parameters from their share link removed.
    'maps_url' => env('EVENT_MAPS_URL', 'https://www.google.com/maps/place/Department+of+Museum/@3.1381223,101.6864929,656m/data=!3m2!1e3!4b1!4m6!3m5!1s0x31cc49b9cf358ae5:0xb5d08425b6586292!8m2!3d3.1381223!4d101.6864929!16s%2Fg%2F1tflzzlj'),

    'map_embed_url' => env(
        'EVENT_MAP_EMBED_URL',
        // The same coordinates, so the embedded map and the button agree.
        'https://www.google.com/maps?q=3.1381223,101.6864929&z=17&output=embed'
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
    | Where registration enquiries go. Also the reply-to on confirmations, so
    | a reply reaches the organising team rather than the no-reply mailbox.
    | The Organising Chairman's address, given by the client 23 Sept 2026.
    */
    'contact_email' => env('EVENT_CONTACT_EMAIL', 'vighnes@cheveningmalaysia.org'),

    /*
    | Bearer token guarding the participant export. Generate with:
    |   php artisan dialogue:token
    | and keep it out of version control.
    */
    'admin_token' => env('ADMIN_API_TOKEN'),

];
