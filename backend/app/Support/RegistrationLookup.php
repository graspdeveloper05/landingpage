<?php

namespace App\Support;

use App\Models\Registration;

/**
 * Finds this edition's registration from what a guest types at the event:
 * the email or the mobile number they registered with. Used by the survey
 * sign-in and by check-in at the door.
 */
class RegistrationLookup
{
    public static function find(string $contact): ?Registration
    {
        $contact = trim($contact);
        $edition = (int) config('event.edition');

        if (str_contains($contact, '@')) {
            return Registration::forEdition($edition)->where('email', strtolower($contact))->first();
        }

        $wanted = Mobile::canonical($contact);
        if (strlen($wanted) < 8) {
            return null;
        }

        // A few hundred rows: compared in PHP because the stored numbers are
        // written every way people type them, which SQL cannot normalise.
        $match = Registration::forEdition($edition)
            ->whereNotNull('mobile')
            ->orderBy('id')
            ->get(['id', 'mobile'])
            ->first(fn (Registration $r) => Mobile::canonical($r->mobile) === $wanted);

        return $match ? Registration::find($match->id) : null;
    }
}
