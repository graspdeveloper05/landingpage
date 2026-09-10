<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\EventSetting;
use App\Models\Registration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** §6 and §9 — the date, time, venue and capacity a visitor is shown. */
class EventAdminController extends Controller
{
    public function show(): JsonResponse
    {
        $edition = (int) config('event.edition');
        $setting = EventSetting::current();

        return response()->json([
            'event' => $setting?->toPublicArray(),
            'closedReason' => $setting?->closedReason(
                Registration::forEdition($edition)->count(),
            ),
            // Shown beside the capacity field so nobody sets it below the
            // number of people already holding a seat without realising.
            'registered' => Registration::forEdition($edition)->count(),
            'edition' => $edition,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $edition = (int) config('event.edition');
        $registered = Registration::forEdition($edition)->count();

        $data = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'startTime' => ['required', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/'],
            'venue' => ['required', 'string', 'max:150'],
            'venueAddress' => ['required', 'string', 'max:255'],
            // Restricted to http(s) so a javascript: or data: URL cannot be
            // saved into a link the whole site renders.
            'mapsUrl' => ['required', 'url:http,https', 'max:500'],
            'mapEmbedUrl' => ['required', 'url:http,https', 'max:500'],

            /*
             * Capacity cannot drop below the seats already taken. §9 makes
             * capacity the gate on registration, so a lower number would put
             * the event over its own limit with no way to correct it short of
             * cancelling on real attendees.
             */
            'capacity' => ['required', 'integer', 'min:'.max(1, $registered), 'max:10000'],
            'registrationOpen' => ['required', 'boolean'],

            'dateLabel' => ['required', 'array'],
            'dateLabel.en' => ['required', 'string', 'max:80'],
            'dateLabel.ms' => ['required', 'string', 'max:80'],
            'dateLabel.zh' => ['required', 'string', 'max:80'],
            'dateLabel.ta' => ['required', 'string', 'max:80'],

            'timeLabel' => ['required', 'array'],
            'timeLabel.en' => ['required', 'string', 'max:80'],
            'timeLabel.ms' => ['required', 'string', 'max:80'],
            'timeLabel.zh' => ['required', 'string', 'max:80'],
            'timeLabel.ta' => ['required', 'string', 'max:80'],
        ], [
            'capacity.min' => $registered > 0
                ? "There are already {$registered} registrations. Capacity cannot be lower than that."
                : 'Capacity must be at least 1.',
            'startTime.regex' => 'Use 24-hour time, for example 14:30.',
            'date.date_format' => 'Use the date picker, or type it as 2026-10-08.',
            'dateLabel.*.required' => 'The date is needed in all four languages.',
            'timeLabel.*.required' => 'The time is needed in all four languages.',
            'mapsUrl.url' => 'Enter a full https:// address.',
            'mapEmbedUrl.url' => 'Enter a full https:// address.',
        ]);

        $setting = EventSetting::updateOrCreate(
            ['edition' => $edition],
            [
                'date' => $data['date'],
                'date_label' => $data['dateLabel'],
                'start_time' => $data['startTime'],
                'time_label' => $data['timeLabel'],
                'venue' => $data['venue'],
                'venue_address' => $data['venueAddress'],
                'maps_url' => $data['mapsUrl'],
                'map_embed_url' => $data['mapEmbedUrl'],
                'capacity' => $data['capacity'],
                'registration_open' => $data['registrationOpen'],
            ],
        );

        return response()->json(['event' => $setting->toPublicArray()]);
    }
}
