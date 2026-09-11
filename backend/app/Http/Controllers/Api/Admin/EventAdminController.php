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

            // The two lines under the headline. Required in all four
            // languages for the same reason the date is: a hero that falls
            // back to English for a Tamil reader is worse than one nobody
            // has edited.
            'eventName' => ['required', 'array'],
            'eventName.en' => ['required', 'string', 'max:120'],
            'eventName.ms' => ['required', 'string', 'max:120'],
            'eventName.zh' => ['required', 'string', 'max:120'],
            'eventName.ta' => ['required', 'string', 'max:120'],

            'subtitle' => ['required', 'array'],
            'subtitle.en' => ['required', 'string', 'max:200'],
            'subtitle.ms' => ['required', 'string', 'max:200'],
            'subtitle.zh' => ['required', 'string', 'max:200'],
            'subtitle.ta' => ['required', 'string', 'max:200'],

            /*
             * Only a path this application produced. Accepting any string
             * here would let an admin account point the hero at an arbitrary
             * URL, which is a stored injection into every visitor's page --
             * and null is how the hero is reset to the shipped photograph.
             */
            'heroImage' => ['nullable', 'string', 'regex:#^/storage/hero/[0-9a-f-]{36}$#'],
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
            'eventName.*.required' => 'The event name is needed in all four languages.',
            'subtitle.*.required' => 'The subtitle is needed in all four languages.',
            'heroImage.regex' => 'Upload the image again -- that path is not one of ours.',
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
                'event_name' => $data['eventName'],
                'subtitle' => $data['subtitle'],
                // Absent means "not sent by this form"; null means "cleared".
                'hero_image' => $data['heroImage'] ?? null,
            ],
        );

        return response()->json(['event' => $setting->toPublicArray()]);
    }
}
