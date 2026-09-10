<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRegistrationRequest;
use App\Mail\RegistrationConfirmed;
use App\Models\EventSetting;
use App\Models\Registration;
use App\Support\Reference;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class RegistrationController extends Controller
{
    /**
     * §9 — registration is an essential Phase 1 function.
     *
     * Returns 201 with the reference, 409 when the event is full, or 422 on
     * validation failure. The frontend already handles all three.
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
            $registration = DB::transaction(function () use ($request, $edition, $capacity) {
                /*
                 * The capacity check and the insert must be one atomic step.
                 * Counting outside a transaction lets two simultaneous requests
                 * both read 199 and both insert, putting the room over its
                 * limit — which for a 200-seat venue is a real-world problem,
                 * not a theoretical one.
                 *
                 * lockForUpdate() holds a row lock for the duration, so the
                 * second request waits and then sees the true count.
                 */
                $taken = Registration::query()
                    ->where('edition', $edition)
                    ->lockForUpdate()
                    ->count();

                if ($taken >= $capacity) {
                    return null;
                }

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

        if ($registration === null) {
            return response()->json([
                'message' => 'All seats for this edition are taken.',
                'reason' => 'full',
            ], 409);
        }

        $this->sendConfirmation($registration);

        return response()->json([
            'reference' => $registration->reference,
            'fullName' => $registration->full_name,
            'email' => $registration->email,
            'submittedAt' => $registration->created_at->toIso8601String(),
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
