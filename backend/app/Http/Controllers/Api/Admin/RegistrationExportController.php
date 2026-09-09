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
        $edition = (int) $request->query('edition', config('event.edition'));
        $filename = sprintf('seri-negara-dialogue-%d-registrations.csv', $edition);

        return response()->streamDownload(function () use ($edition) {
            $handle = fopen('php://output', 'wb');

            // Excel opens UTF-8 CSV as the local codepage unless it sees a BOM,
            // which mangles the Chinese and Tamil the form accepts.
            fwrite($handle, "\xEF\xBB\xBF");

            fputcsv($handle, array_values(Registration::EXPORT_COLUMNS));

            Registration::forEdition($edition)
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
