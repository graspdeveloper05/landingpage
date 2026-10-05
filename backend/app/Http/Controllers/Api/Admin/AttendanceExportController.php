<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Registration;
use Symfony\Component\HttpFoundation\StreamedResponse;

/** Everyone registered, with whether and when they arrived. */
class AttendanceExportController extends Controller
{
    public function __invoke(): StreamedResponse
    {
        $name = 'attendance-'.now('Asia/Kuala_Lumpur')->format('Y-m-d').'.csv';

        return response()->streamDownload(function () {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Reference', 'Name', 'Email', 'Mobile', 'Organisation', 'Arrived', 'Arrived at', 'Checked in by']);

            Registration::forEdition((int) config('event.edition'))
                ->orderBy('reference')
                ->chunk(200, function ($rows) use ($out) {
                    foreach ($rows as $r) {
                        fputcsv($out, array_map(fn ($v) => $this->guard((string) $v), [
                            $r->reference,
                            $r->full_name,
                            $r->email,
                            $r->mobile,
                            $r->organisation,
                            $r->checked_in_at ? 'Yes' : 'No',
                            $r->checked_in_at?->timezone('Asia/Kuala_Lumpur')->format('Y-m-d H:i'),
                            match ($r->checked_in_via) {
                                'self' => 'QR (self)',
                                'staff' => 'Staff',
                                default => '',
                            },
                        ]));
                    }
                });

            fclose($out);
        }, $name, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /** A cell starting with = + - @ would run as a formula in Excel. */
    private function guard(string $value): string
    {
        return preg_match('/^[=+\-@\t\r]/', $value) === 1 ? "'".$value : $value;
    }
}
