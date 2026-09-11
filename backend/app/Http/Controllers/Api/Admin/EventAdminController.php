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

            /*
             * §6 item 03 -- the Organising Chairman. Name and organisation
             * read the same in every language, so they are plain strings;
             * the three that are written prose are needed in all four.
             */
            'chairman' => ['required', 'array'],
            'chairman.name' => ['required', 'string', 'max:150'],
            'chairman.organisation' => ['required', 'string', 'max:150'],

            'chairman.designation' => ['required', 'array'],
            'chairman.designation.en' => ['required', 'string', 'max:200'],
            'chairman.designation.ms' => ['required', 'string', 'max:200'],
            'chairman.designation.zh' => ['required', 'string', 'max:200'],
            'chairman.designation.ta' => ['required', 'string', 'max:200'],

            'chairman.message' => ['required', 'array'],
            'chairman.message.en' => ['required', 'string', 'max:1200'],
            'chairman.message.ms' => ['required', 'string', 'max:1200'],
            'chairman.message.zh' => ['required', 'string', 'max:1200'],
            'chairman.message.ta' => ['required', 'string', 'max:1200'],

            'chairman.quote' => ['required', 'array'],
            'chairman.quote.en' => ['required', 'string', 'max:300'],
            'chairman.quote.ms' => ['required', 'string', 'max:300'],
            'chairman.quote.zh' => ['required', 'string', 'max:300'],
            'chairman.quote.ta' => ['required', 'string', 'max:300'],

            /*
             * Either an upload of ours or empty, never an arbitrary string.
             * The site renders this straight into an <img src>, so anything
             * else is a stored injection into every visitor's page. Empty
             * means no photograph yet, and the placeholder is drawn.
             */
            'chairman.portrait' => [
                'present', 'string', 'max:255',
                'regex:#^$|^/storage/portraits/[0-9a-f-]{36}\.[a-z]{3,4}$|^/portraits/[a-z0-9-]+\.svg$#',
            ],
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
            'chairman.designation.*.required' => 'The designation is needed in all four languages.',
            'chairman.message.*.required' => 'The welcome message is needed in all four languages.',
            'chairman.quote.*.required' => 'The pull quote is needed in all four languages.',
            'chairman.portrait.regex' => 'Upload the photograph again -- that path is not one of ours.',
        ]);

        /*
         * Absent and null mean different things here, and `?? null` treated
         * them alike: a save that simply did not mention the hero erased it.
         *
         * That is not hypothetical. An admin tab left open on an older build
         * has no hero field, so its next save sends no heroImage key at all
         * and silently clears a photograph somebody chose. Confirmed by
         * replaying exactly that request against a set hero.
         *
         * Only an explicit null clears it now; a payload without the key
         * leaves what is stored alone.
         */
        $heroImage = array_key_exists('heroImage', $data)
            ? ['hero_image' => $data['heroImage']]
            : [];

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
                'chairman_name' => $data['chairman']['name'],
                'chairman_organisation' => $data['chairman']['organisation'],
                'chairman_designation' => $data['chairman']['designation'],
                'chairman_message' => $data['chairman']['message'],
                'chairman_quote' => $data['chairman']['quote'],
                'chairman_portrait' => $data['chairman']['portrait'],
                ...$heroImage,
            ],
        );

        return response()->json(['event' => $setting->toPublicArray()]);
    }
}
