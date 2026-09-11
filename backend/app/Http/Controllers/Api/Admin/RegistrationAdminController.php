<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\EventSetting;
use App\Models\Registration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** §9 — "participant list/database", readable from the panel. */
class RegistrationAdminController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'page' => ['nullable', 'integer', 'min:1'],
            // Bounded rather than a bare integer: the value reaches an indexed
            // smallint column, and 2000-2100 is the range the column holds.
            'edition' => ['nullable', 'integer', 'min:2000', 'max:2100'],
        ]);

        $editions = $this->editions();

        // An edition that was asked for but has neither a settings row nor a
        // registration would silently return an empty list that looks like a
        // year with no attendees. Falling back to the current edition says
        // instead that the request did not name a year we know about.
        $requested = $filters['edition'] ?? null;
        $edition = in_array($requested, array_column($editions, 'edition'), true)
            ? (int) $requested
            : (int) config('event.edition');

        $query = Registration::forEdition($edition)->latest('created_at');

        if ($search = $filters['search'] ?? null) {
            // Escaped so a name containing % or _ searches for those
            // characters instead of matching most of the list.
            $term = '%'.addcslashes($search, '%_' . chr(92)).'%';
            $query->where(function ($q) use ($term) {
                $q->where('full_name', 'like', $term)
                    ->orWhere('email', 'like', $term)
                    ->orWhere('organisation', 'like', $term)
                    ->orWhere('reference', 'like', $term);
            });
        }

        $page = $query->paginate(25)->withQueryString();

        return response()->json([
            'data' => collect($page->items())->map(fn (Registration $r) => [
                'reference' => $r->reference,
                'fullName' => $r->full_name,
                'email' => $r->email,
                'mobile' => $r->mobile,
                'organisation' => $r->organisation,
                'designation' => $r->designation,
                'dietary' => $r->dietary,
                'submittedAt' => $r->created_at?->toIso8601String(),
                'confirmationSent' => $r->confirmation_sent_at !== null,
            ]),
            'meta' => [
                'total' => $page->total(),
                'page' => $page->currentPage(),
                'lastPage' => $page->lastPage(),
                'capacity' => $this->capacityFor($edition),
                'edition' => $edition,
                // The years the panel offers in its filter. Sent with every
                // response so a 2027 edition created in another tab appears
                // here on the next load, with no separate endpoint to call.
                'editions' => $editions,
            ],
        ]);
    }

    /**
     * Every edition the panel can show, newest first.
     *
     * Drawn from two places on purpose. event_settings holds the editions
     * somebody has set up, including next year's before anyone has registered
     * for it; the registrations table holds editions that have people in them,
     * including one whose settings row was deleted. A filter built from either
     * alone would hide a year that genuinely exists.
     */
    private function editions(): array
    {
        $settings = EventSetting::query()
            ->orderByDesc('edition')
            ->get()
            ->keyBy('edition');

        $withRegistrations = Registration::query()
            ->select('edition')
            ->selectRaw('count(*) as total')
            ->groupBy('edition')
            ->pluck('total', 'edition');

        $years = $settings->keys()
            ->merge($withRegistrations->keys())
            // The current edition appears even on an empty database, so the
            // filter is never an empty dropdown on a fresh install.
            ->push((int) config('event.edition'))
            ->map(fn ($y) => (int) $y)
            ->unique()
            ->sortDesc()
            ->values();

        return $years->map(function (int $year) use ($settings, $withRegistrations) {
            $setting = $settings->get($year);

            return [
                'edition' => $year,
                // The date is what tells two editions apart at a glance; the
                // year alone does not say whether it has happened yet.
                'date' => $setting?->date,
                'venue' => $setting?->venue,
                'registrations' => (int) ($withRegistrations[$year] ?? 0),
                // An edition with no settings row has no date to judge by, so
                // the year is compared instead. Without this, a 2025 list
                // whose settings were deleted after the event was labelled as
                // still to come.
                'isPast' => $setting?->hasPassed()
                    ?? $year < (int) now(config('event.timezone'))->year,
            ];
        })->all();
    }

    /**
     * The seat count for the edition being viewed, not the one in config.
     *
     * Reading capacity from config would caption a 2026 list with 2027's seat
     * count the moment the team raises it for next year — the list would be
     * right and the "N of 200" above it quietly wrong.
     */
    private function capacityFor(int $edition): int
    {
        return (int) (EventSetting::find($edition)?->capacity ?? config('event.capacity'));
    }
}
