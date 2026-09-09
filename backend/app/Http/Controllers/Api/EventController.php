<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Registration;
use Illuminate\Http\JsonResponse;

class EventController extends Controller
{
    /** GET /api/event — details plus how many seats have gone. */
    public function show(): JsonResponse
    {
        $edition = (int) config('event.edition');
        $capacity = (int) config('event.capacity');
        $registered = Registration::forEdition($edition)->count();

        return response()->json([
            'edition' => $edition,
            'date' => config('event.date'),
            'startTime' => config('event.start_time'),
            'venue' => config('event.venue'),
            'venueAddress' => config('event.venue_address'),
            'mapsUrl' => config('event.maps_url'),
            'mapEmbedUrl' => config('event.map_embed_url'),
            'capacity' => $capacity,
            'registered' => $registered,
        ]);
    }
}
