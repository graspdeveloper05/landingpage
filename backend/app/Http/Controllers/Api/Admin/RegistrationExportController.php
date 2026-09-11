<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Registration;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RegistrationExportController extends Controller
{
    /**
     * §9 and §12 — CSV/Excel export of the participant list.
     *
     * Streamed and chunked so the response starts immediately and memory stays
     * flat, whether the list is 200 rows or the archive of several editions.
     */
    public function __invoke(Request $request): StreamedResponse
    {
        // Validated, not just cast. `(int) 'all'` is 0, which would have
        // streamed an empty CSV named ...-0-registrations.csv and looked like
        // an event nobody signed up for rather than a bad request.
        $requested = $request->query('edition');
        $edition = filter_var($requested, FILTER_VALIDATE_INT, [
            'options' => ['min_range' => 2000, 'max_range' => 2100],
        ]) ?: (int) config('event.edition');

        // The export carries the same date range as the list it downloads
        // from. Anything that fails to parse is dropped rather than refused:
        // this endpoint also serves a scheduled curl on the server, and a
        // backup that starts 400-ing because of a stray parameter is a backup
        // that stops running.
        $from = $this->date($request->query('from'));
        $to = $this->date($request->query('to'));

        $filename = sprintf(
            'seri-negara-dialogue-%d-registrations%s.csv',
            $edition,
            // The range goes in the filename. Two exports of the same edition
            // otherwise land in the downloads folder as (1) and (2), with
            // nothing to say which one covers which weeks.
            $from || $to ? '-'.($from ?: 'start').'-to-'.($to ?: 'end') : '',
        );

        return response()->streamDownload(function () use ($edition, $from, $to) {
            $handle = fopen('php://output', 'wb');

            // Excel opens UTF-8 CSV as the local codepage unless it sees a BOM,
            // which mangles the Chinese and Tamil the form accepts.
            fwrite($handle, "\xEF\xBB\xBF");

            fputcsv($handle, array_values(Registration::EXPORT_COLUMNS));

            Registration::forEdition($edition)
                ->registeredBetween($from, $to)
                ->orderBy('id')
                ->chunk(200, function ($rows) use ($handle) {
                    foreach ($rows as $row) {
                        fputcsv($handle, array_map(
                            fn (string $column) => $this->guard((string) $row->{$column}),
                            array_keys(Registration::EXPORT_COLUMNS),
                        ));
                    }
                });

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Cache-Control' => 'no-store',
        ]);
    }

    /** A Y-m-d date, or null for anything that is not one. */
    private function date(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $date = \DateTimeImmutable::createFromFormat('!Y-m-d', $value);

        // createFromFormat accepts 2026-13-45 and rolls it forward into the
        // next year, so the round-trip check is what actually rejects it.
        return $date && $date->format('Y-m-d') === $value ? $value : null;
    }

    /**
     * A field beginning =, +, - or @ is executed as a formula when the CSV is
     * opened in Excel or Sheets. Prefixing an apostrophe keeps the value as
     * text — the attendee's own input must never run as a spreadsheet formula.
     */
    private function guard(string $value): string
    {
        return preg_match('/^[=+\-@\t\r]/', $value) === 1 ? "'".$value : $value;
    }
}
