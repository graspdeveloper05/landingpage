<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EventSetting;
use App\Models\Registration;
use Illuminate\Http\JsonResponse;

class EventController extends Controller
{
    /** GET /api/event — details plus how many seats have gone. */
    public function show(): JsonResponse
    {
        $edition = (int) config('event.edition');

        /*
         * The database row is the editable copy; config/event.php is what the
         * application shipped with. Falling back rather than failing means a
         * database that has not been seeded yet still serves a site with a
         * date and a venue on it, instead of a homepage full of blanks.
         */
        $details = EventSetting::current()?->toPublicArray() ?? [
            'edition' => $edition,
            'date' => config('event.date'),
            'dateLabel' => null,
            'startTime' => config('event.start_time'),
            'timeLabel' => null,
            'venue' => config('event.venue'),
            'venueAddress' => config('event.venue_address'),
            'mapsUrl' => config('event.maps_url'),
            'mapEmbedUrl' => config('event.map_embed_url'),
            'capacity' => (int) config('event.capacity'),
        ];

        return response()->json([
            ...$details,
            'registered' => Registration::forEdition($edition)->count(),
        ]);
    }
}
