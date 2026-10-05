<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EventSetting;
use App\Support\RegistrationLookup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Self check-in at the door. A QR poster at the entrance opens /checkin; the
 * guest types the email or mobile they registered with and shows the usher
 * the tick on their screen.
 */
class CheckInController extends Controller
{
    /** Whether check-in is open, so the page can say so before anyone types. */
    public function status(): JsonResponse
    {
        return response()->json(['open' => $this->open()]);
    }

    public function store(Request $request): JsonResponse
    {
        if (! $this->open()) {
            return response()->json(['message' => 'Check-in is not open yet.'], 423);
        }

        $contact = (string) $request->validate([
            'contact' => ['required', 'string', 'max:190'],
        ])['contact'];

        $registration = RegistrationLookup::find($contact);
        if (! $registration) {
            throw ValidationException::withMessages(['contact' => 'User not found.']);
        }

        // The first arrival stands: scanning again later does not move it.
        $already = $registration->checked_in_at !== null;
        if (! $already) {
            $registration->forceFill(['checked_in_at' => now(), 'checked_in_via' => 'self'])->save();
        }

        // Name and reference only -- enough for the usher to match the badge,
        // and nothing that confirms someone else's email or number.
        return response()->json([
            'fullName' => $registration->full_name,
            'reference' => $registration->reference,
            'alreadyCheckedIn' => $already,
            'checkedInAt' => $registration->checked_in_at->toIso8601String(),
        ]);
    }

    private function open(): bool
    {
        return (bool) EventSetting::current()?->checkin_open;
    }
}
