<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRegistrationRequest;
use App\Mail\RegistrationConfirmed;
use App\Models\EventSetting;
use App\Models\Registration;
use App\Services\GoogleFormHandoff;
use App\Support\Reference;
use App\Support\Seats;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

use function Illuminate\Support\defer;

class RegistrationController extends Controller
{
    /**
     * §9 — registration is an essential Phase 1 function.
     *
     * Returns 201 with the reference and the seat status, or 422 on
     * validation failure. Past the seat limit the registration is still taken,
     * as not confirmed (a waiting list); see Seats.
     */
    public function store(StoreRegistrationRequest $request): JsonResponse
    {
        $edition = (int) config('event.edition');
        $setting = EventSetting::current();
        $capacity = $setting?->capacity ?? (int) config('event.capacity');

        /*
         * Checked before the transaction, because these are not race
         * conditions -- an event does not become un-past between two
         * requests, and the team's decision to stop taking registrations does
         * not need a row lock to be true. Capacity is the only one that has to
         * be settled atomically, and it is, below.
         */
        if ($setting?->hasPassed()) {
            return response()->json([
                'message' => 'This Dialogue has already taken place.',
                'reason' => 'past',
            ], 409);
        }

        if ($setting && ! $setting->registration_open) {
            return response()->json([
                'message' => 'Registration is closed.',
                'reason' => 'closed',
            ], 409);
        }

        try {
            $registration = DB::transaction(function () use ($request, $edition) {
                // Locked so references and seat order follow arrival exactly:
                // whether someone holds a seat is decided by that order.
                Registration::query()->where('edition', $edition)->lockForUpdate()->count();

                return Registration::create([
                    ...$request->toRegistration(),
                    'reference' => Reference::next($edition, config('event.reference_prefix')),
                    'edition' => $edition,
                    'ip_address' => $request->ip(),
                    'user_agent' => substr((string) $request->userAgent(), 0, 512),
                ]);
            });
        } catch (Throwable $e) {
            Log::error('Registration failed', ['exception' => $e]);

            return response()->json([
                'message' => 'The registration did not go through. Try again.',
            ], 500);
        }

        $seat = Seats::statusOf($registration);

        // After the response has gone, like the copy to the Google Form below.
        // The seat is booked; a slow or refusing mail server must not keep
        // the attendee waiting, nor turn their booking into an error message
        // that sends them back to register a second time. Only a confirmed
        // seat is confirmed by email; the waiting list hears from the team.
        if ($seat === Seats::CONFIRMED) {
            defer(fn () => $this->sendConfirmation($registration));
        }

        // To the script on the organising team's form, after the response
        // has gone, so the attendee never waits on Google.
        defer(fn () => app(GoogleFormHandoff::class)->send($registration));

        return response()->json([
            'reference' => $registration->reference,
            'fullName' => $registration->full_name,
            'email' => $registration->email,
            'submittedAt' => $registration->created_at->toIso8601String(),
            'seatStatus' => $seat,
        ], 201);
    }

    /**
     * The seat is already booked at this point, so a mail failure must not
     * turn into a failed registration — it is logged and the attendee still
     * gets their reference on screen.
     */
    private function sendConfirmation(Registration $registration): void
    {
        try {
            Mail::to($registration->email)->send(new RegistrationConfirmed($registration));
            $registration->forceFill(['confirmation_sent_at' => now()])->save();
        } catch (Throwable $e) {
            Log::warning('Confirmation email failed', [
                'reference' => $registration->reference,
                'exception' => $e->getMessage(),
            ]);
        }
    }
}
