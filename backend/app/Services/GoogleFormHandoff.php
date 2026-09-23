<?php

namespace App\Services;

use App\Models\EventSetting;
use App\Models\Registration;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Hands a site registration to the script on the organising team's Google
 * Form, which adds it to the form with Google's own tools.
 *
 * Their form refuses a submission posted to it from another website, so the
 * visitor's browser cannot do this. The script can: it runs inside the team's
 * own account. It answers with the id Google gave the new response, stored as
 * external_id -- which is also how the panel tells a registration that
 * reached their sheet from one that did not.
 *
 * Never throws. The seat is booked before this runs; a Google outage must not
 * turn it into a failed registration. A failure is logged and left visible in
 * the panel, where it can be sent again.
 */
class GoogleFormHandoff
{
    public function send(Registration $registration): bool
    {
        $setting = EventSetting::current();
        $url = (string) ($setting?->google_webapp_url ?? '');
        $key = (string) ($setting?->google_sync_secret ?? '');

        if ($url === '' || $key === '') {
            return false;
        }

        $answers = $registration->answers ?? [];

        try {
            // Apps Script answers a POST with a redirect to the result, which
            // must be followed as a GET -- the HTTP client does that itself.
            $response = Http::timeout(30)->asJson()->post($url, [
                'key' => $key,
                'registration' => [
                    // The script names the sheet row after it, so a resend
                    // is recognisably the same registration.
                    'reference' => $registration->reference,
                    'email' => $registration->email,
                    'fullName' => $registration->full_name,
                    'mobile' => $registration->mobile,
                    'organisation' => $registration->organisation,
                    'designation' => $registration->designation,
                    'dietary' => $registration->dietary,
                    'cheveningScholar' => $answers['chevening_scholar'] ?? null,
                    'cheveningCohort' => $answers['chevening_cohort'] ?? null,
                    'cheveningUniversity' => $answers['chevening_university'] ?? null,
                    'camMember' => $answers['cam_member'] ?? null,
                ],
            ]);

            $id = $response->json('id');

            if (! $response->successful() || ! is_string($id) || $id === '') {
                Log::warning('Registration not added to the Google Form', [
                    'reference' => $registration->reference,
                    'status' => $response->status(),
                    'reply' => mb_substr($response->body(), 0, 300),
                ]);

                return false;
            }
        } catch (Throwable $e) {
            Log::warning('Google Form script could not be reached', [
                'reference' => $registration->reference,
                'exception' => $e->getMessage(),
            ]);

            return false;
        }

        $registration->forceFill(['external_id' => $id])->save();

        return true;
    }
}
