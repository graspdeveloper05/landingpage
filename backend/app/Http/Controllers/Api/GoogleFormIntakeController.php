<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EventSetting;
use App\Models\Registration;
use App\Support\GoogleFormSync;
use App\Support\Reference;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Receives responses from the organising team's Google Form.
 *
 * A script on that form (the panel writes it out, with the key filled in)
 * posts each response here as it is submitted, and can post every earlier one
 * in batches. So the panel's list holds everyone: people who registered on
 * the site, and people who used the team's form.
 *
 * The script sends each question as the form words it; the matching to
 * columns happens here, so a reworded question is a fix on the server rather
 * than a new script for the client to paste.
 *
 * Sent twice, a response updates its row rather than adding another: the key
 * is Google's own response id. Running the catch-up again is therefore safe,
 * and a respondent editing their answers updates what the panel shows.
 */
class GoogleFormIntakeController extends Controller
{
    /**
     * Core columns, found by what the question says. First match wins, so a
     * question can only fill one column.
     */
    private const FIELDS = [
        'full_name' => '/\bname\b/i',
        'mobile' => '/\b(mobile|phone|contact)\b/i',
        'organisation' => '/\b(affiliation|organi[sz]ation|company|employer)\b/i',
        'designation' => '/\b(position|designation|job title)\b/i',
        'dietary' => '/\bdiet/i',
        'email' => '/\be-?mail\b/i',
    ];

    public function store(Request $request): JsonResponse
    {
        $setting = EventSetting::current();
        $expected = (string) ($setting?->google_sync_secret ?? '');

        if ($expected === '') {
            abort(503, 'Bringing responses in from the Google Form is switched off.');
        }

        // hash_equals: constant-time, so the key cannot be guessed a
        // character at a time by timing the replies.
        if (! hash_equals($expected, (string) $request->header('X-Form-Key'))) {
            abort(401, 'Unauthorised.');
        }

        $data = $request->validate([
            // Empty only as the last batch of a sync, which says it is done.
            'responses' => ['present', 'array', 'max:200'],
            'final' => ['sometimes', 'boolean'],
            'responses.*.id' => ['required', 'string', 'max:100'],
            'responses.*.submittedAt' => ['required', 'date'],
            'responses.*.email' => ['nullable', 'string', 'max:255'],
            'responses.*.items' => ['present', 'array', 'max:60'],
            'responses.*.items.*.question' => ['required', 'string', 'max:500'],
            'responses.*.items.*.answer' => ['nullable', 'string', 'max:5000'],
        ]);

        $edition = (int) config('event.edition');
        $created = 0;
        $updated = 0;

        foreach ($data['responses'] as $response) {
            $fields = $this->toFields($response);

            // One transaction per response, locked as the site's own form is:
            // the reference is "count + 1", and two arriving together must
            // not be handed the same number.
            DB::transaction(function () use ($response, $fields, $edition, &$created, &$updated) {
                // The same response again -- a re-run of the catch-up, or the
                // respondent editing their answers. Theirs to change, so it
                // is rewritten in full.
                $sameResponse = Registration::query()
                    ->where('external_id', $response['id'])
                    ->lockForUpdate()
                    ->first();

                // A registration this site handed to the form comes back here
                // too, under the id the form gave it. It is the site's row, so
                // the form's copy may fill gaps but never overwrite it -- the
                // form's copy has no email, for one.
                if ($sameResponse && $sameResponse->source === 'website') {
                    $this->fillBlanks($sameResponse, $fields);
                    $updated++;

                    return;
                }

                if ($sameResponse) {
                    $sameResponse->fill($fields)->save();
                    $updated++;

                    return;
                }

                /*
                 * A different response giving an address already on the list.
                 * Usually one person who registered both ways -- (email,
                 * edition) is unique, so a second insert would fail and stop
                 * the batch. But the team's form is public and types its own
                 * email, unverified: anyone could put someone else's address
                 * in it. So this fills what is blank and overwrites nothing,
                 * and never claims the row for the form.
                 */
                $byEmail = $fields['email'] === null ? null : Registration::query()
                    ->where('edition', $edition)
                    ->where('email', $fields['email'])
                    ->lockForUpdate()
                    ->first();

                if ($byEmail) {
                    $this->fillBlanks($byEmail, $fields);
                    $updated++;

                    return;
                }

                $registration = new Registration([
                    ...$fields,
                    'reference' => Reference::next($edition, config('event.reference_prefix')),
                    'edition' => $edition,
                    'source' => 'google_form',
                    'external_id' => $response['id'],
                ]);
                // When they filled the form in, not when it reached us: the
                // catch-up sends weeks of responses at once, and the panel's
                // date filter should still place each on its own day.
                $registration->created_at = Carbon::parse($response['submittedAt'])->utc();
                $registration->save();
                $created++;
            });
        }

        GoogleFormSync::record($created, $updated, (bool) ($data['final'] ?? false));

        return response()->json(['created' => $created, 'updated' => $updated]);
    }

    /** Fills what is empty on a row and overwrites nothing. */
    private function fillBlanks(Registration $row, array $fields): void
    {
        foreach ($fields as $column => $value) {
            if (blank($value) || filled($row->{$column})) {
                continue;
            }
            $row->{$column} = $value;
        }
        $row->save();
    }

    /** One response as registration columns, plus every other answer. */
    private function toFields(array $response): array
    {
        $core = [];
        $answers = [];

        foreach ($response['items'] as $item) {
            $question = trim(preg_replace('/\s+/u', ' ', $item['question']));
            $answer = trim((string) ($item['answer'] ?? ''));

            $column = null;
            foreach (self::FIELDS as $name => $pattern) {
                if (! isset($core[$name]) && preg_match($pattern, $question)) {
                    $column = $name;
                    break;
                }
            }

            if ($column) {
                $core[$column] = $answer;
            } elseif ($answer !== '') {
                $answers[$question] = $answer;
            }
        }

        // Google's own record of the address, where the form collects one, is
        // more trustworthy than an address typed into a question.
        $email = trim((string) ($response['email'] ?? '')) ?: ($core['email'] ?? '');

        return [
            'full_name' => mb_substr($core['full_name'] ?? '', 0, 255),
            'email' => $email !== '' ? mb_strtolower(mb_substr($email, 0, 255)) : null,
            'mobile' => mb_substr($core['mobile'] ?? '', 0, 32),
            'organisation' => mb_substr($core['organisation'] ?? '', 0, 255),
            'designation' => mb_substr($core['designation'] ?? '', 0, 255),
            'dietary' => ($core['dietary'] ?? '') !== '' ? mb_substr($core['dietary'], 0, 255) : null,
            // Everything the form asks beyond the columns, kept as asked, so
            // a question the team adds later is not lost.
            'answers' => $answers ?: null,
        ];
    }
}
