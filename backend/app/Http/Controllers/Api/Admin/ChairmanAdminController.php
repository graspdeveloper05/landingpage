<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\EventSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * §6 item 03 and §15 — the Organising Chairman.
 *
 * His own endpoints rather than a corner of the event payload. Sharing one
 * meant the Event form had to send a whole chairman to change the venue, and
 * the chairman form a whole event to change a photograph: every save carried
 * fields it had no business touching, and one stale tab could overwrite the
 * other's work.
 *
 * The record still lives on event_settings, because there is exactly one per
 * edition and 2027 will have its own.
 */
class ChairmanAdminController extends Controller
{
    public function show(): JsonResponse
    {
        $setting = EventSetting::current();

        return response()->json([
            'chairman' => $setting?->chairmanArray(),
            'edition' => (int) config('event.edition'),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        /*
         * A cleared photograph reaches us as "" from the panel and as null
         * from anything else -- an older tab, or a script. The column is a
         * string and the rule below wants one, so null failed validation with
         * "must be a string", which tells somebody looking at a file picker
         * nothing at all. Normalised before validation instead.
         */
        if ($request->has('portrait') && blank($request->input('portrait'))) {
            $request->merge(['portrait' => '']);
        }

        $data = $request->validate([
            // Name and organisation read the same in every language.
            'name' => ['required', 'string', 'max:150'],
            'organisation' => ['required', 'string', 'max:150'],

            // The three written as prose are needed in all four of §3. A
            // chairman who falls back to English for a Tamil reader is worse
            // than one nobody has edited.
            'designation' => ['required', 'array'],
            'designation.en' => ['required', 'string', 'max:200'],
            'designation.ms' => ['required', 'string', 'max:200'],
            'designation.zh' => ['required', 'string', 'max:200'],
            'designation.ta' => ['required', 'string', 'max:200'],

            'message' => ['required', 'array'],
            'message.en' => ['required', 'string', 'max:1200'],
            'message.ms' => ['required', 'string', 'max:1200'],
            'message.zh' => ['required', 'string', 'max:1200'],
            'message.ta' => ['required', 'string', 'max:1200'],

            'quote' => ['required', 'array'],
            'quote.en' => ['required', 'string', 'max:300'],
            'quote.ms' => ['required', 'string', 'max:300'],
            'quote.zh' => ['required', 'string', 'max:300'],
            'quote.ta' => ['required', 'string', 'max:300'],

            /*
             * An upload of ours, one of the shipped stand-ins, or empty. The
             * site renders this straight into an <img src>, so any other
             * string is a stored injection into every visitor's page.
             */
            'portrait' => [
                'present', 'string', 'max:255',
                'regex:#^$|^/storage/portraits/[0-9a-f-]{36}\.[a-z]{3,4}$|^/portraits/[a-z0-9-]+\.svg$#',
            ],
        ], [
            'designation.*.required' => 'The designation is needed in all four languages.',
            'message.*.required' => 'The welcome message is needed in all four languages.',
            'quote.*.required' => 'The pull quote is needed in all four languages.',
            'portrait.regex' => 'Upload the photograph again -- that path is not one of ours.',
        ]);

        $setting = EventSetting::current();

        if (! $setting) {
            // The chairman hangs off the edition, so there has to be one. This
            // is a 409 rather than a silent create: an edition with a chairman
            // and no date is not a state worth inventing from this form.
            return response()->json([
                'message' => 'Set the event date and venue first — the chairman belongs to an edition.',
            ], 409);
        }

        $setting->update([
            'chairman_name' => $data['name'],
            'chairman_organisation' => $data['organisation'],
            'chairman_designation' => $data['designation'],
            'chairman_message' => $data['message'],
            'chairman_quote' => $data['quote'],
            'chairman_portrait' => $data['portrait'],
        ]);

        return response()->json(['chairman' => $setting->fresh()->chairmanArray()]);
    }
}
