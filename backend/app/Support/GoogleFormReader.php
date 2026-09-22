<?php

namespace App\Support;

use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * Reads a Google Form's public page and works out how to fill it in.
 *
 * Every site registration is copied into the organising team's Google Form
 * from the visitor's browser (frontend/src/lib/googleForm.ts). That needs the
 * form's field numbers, which change when the team swaps forms or rebuilds a
 * question. So the panel takes the form's link, and this reads the numbers
 * off the form itself, matching each question by what it says.
 *
 * Refuses, with the reason, anything the copy would fail on: a question the
 * site answers that the form lacks, a required question the site cannot
 * answer, no email box, or Yes/No questions without "Yes" and "No".
 */
class GoogleFormReader
{
    /**
     * The site's answers, and the wording that identifies each on a form.
     * Checked in this order; each question takes the first unused match.
     */
    private const QUESTIONS = [
        'fullName' => ['/\bname\b/i', 'full name'],
        'mobile' => ['/\b(mobile|phone|contact)\b/i', 'mobile number'],
        'organisation' => ['/\b(affiliation|organi[sz]ation|company|employer)\b/i', 'affiliation / organisation'],
        'designation' => ['/\b(position|designation|job title)\b/i', 'position / designation'],
        'dietary' => ['/\bdiet/i', 'dietary'],
        'cheveningCohort' => ['/\bcohort\b/i', 'Chevening cohort'],
        'cheveningUniversity' => ['/\buniversity\b/i', 'university'],
        'camMember' => ['/\bcam\b/i', 'CAM member'],
        'cheveningScholar' => ['/\bare you a chevening\b/i', '"Are you a Chevening scholar?"'],
    ];

    /** Asked as Yes / No on the site, so the form must offer exactly those. */
    private const YES_NO = ['cheveningScholar', 'camMember'];

    /**
     * @return array{id: string, entries: array<string, int>, pages: array<string, int>}
     *
     * @throws ValidationException naming what is wrong, against the `url` field
     */
    public function read(string $url): array
    {
        $html = $this->fetch($url);

        if (! preg_match('#/forms/d/e/([A-Za-z0-9_-]{20,})/#', $html, $m)
            || ! preg_match('/FB_PUBLIC_LOAD_DATA_ = (.*?);<\/script>/s', $html, $data)) {
            $this->fail('That link did not open a Google Form. Use the link from Publish → copy responder link.');
        }

        $id = $m[1];
        $form = json_decode($data[1], true);
        $items = $form[1][1] ?? null;

        if (! is_array($items)) {
            $this->fail('The form\'s questions could not be read.');
        }

        if (! str_contains($html, 'name="emailAddress"') && ! str_contains($html, 'Your email')) {
            $this->fail('The form does not collect email addresses. In the form: Settings → Responses → Collect email addresses → Responder input.');
        }

        $entries = [];
        $pages = [];
        $unanswerable = [];
        $page = 0;

        foreach ($items as $item) {
            $type = $item[3] ?? null;
            $title = trim(preg_replace('/\s+/u', ' ', (string) ($item[1] ?? '')));

            if ($type === 8) { // a page break
                $page++;

                continue;
            }

            $field = $item[4][0] ?? null;
            if (! is_array($field)) {
                continue; // a title or image, not a question
            }

            $key = $this->match($title, $entries);

            if ($key === null) {
                if (! empty($field[2])) {
                    $unanswerable[] = [$title, $page];
                }

                continue;
            }

            if (in_array($key, self::YES_NO, true)) {
                $options = array_map(fn ($o) => trim((string) ($o[0] ?? '')), $field[1] ?? []);
                if (! in_array('Yes', $options, true) || ! in_array('No', $options, true)) {
                    $this->fail("\"{$title}\" must have the answers \"Yes\" and \"No\".");
                }
            }

            $entries[$key] = (int) $field[0];
            $pages[$key] = $page;
        }

        $missing = array_diff(array_keys(self::QUESTIONS), array_keys($entries));
        if ($missing) {
            $names = array_map(fn ($k) => self::QUESTIONS[$k][1], $missing);
            $this->fail('The form has no question for: '.implode(', ', $names).'.');
        }

        // Only on the pages the site fills in. The team's current form has an
        // "Essay Application" page that neither answer leads to; its required
        // questions are never reached, so they do not stop a submission.
        $used = array_unique(array_values($pages));
        $blocking = array_column(array_filter($unanswerable, fn ($q) => in_array($q[1], $used, true)), 0);

        if ($blocking) {
            $this->fail('The form has required questions the website does not ask: "'.implode('", "', $blocking).'". Make them optional or remove them.');
        }

        return ['id' => $id, 'entries' => $entries, 'pages' => $pages];
    }

    private function match(string $title, array $taken): ?string
    {
        foreach (self::QUESTIONS as $key => [$pattern]) {
            if (! isset($taken[$key]) && preg_match($pattern, $title)) {
                return $key;
            }
        }

        return null;
    }

    private function fetch(string $url): string
    {
        $host = strtolower((string) parse_url($url, PHP_URL_HOST));

        if (! in_array($host, ['forms.gle', 'docs.google.com'], true)) {
            $this->fail('Paste a Google Form link (forms.gle/… or docs.google.com/forms/…).');
        }

        if (str_contains($url, '/edit')) {
            $this->fail('That is the editing link. Use the link from Publish → copy responder link.');
        }

        try {
            $response = Http::withHeaders(['Accept-Language' => 'en'])->timeout(15)->get($url);
        } catch (Throwable) {
            $this->fail('Google could not be reached. Try again in a moment.');
        }

        if (! $response->successful()) {
            $this->fail("The form could not be opened ({$response->status()}). Check it is published to anyone with the link.");
        }

        return $response->body();
    }

    private function fail(string $message): never
    {
        throw ValidationException::withMessages(['url' => $message]);
    }
}
