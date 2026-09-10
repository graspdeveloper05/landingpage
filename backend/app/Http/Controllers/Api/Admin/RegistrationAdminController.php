<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
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
        ]);

        $edition = (int) config('event.edition');

        $query = Registration::query()
            ->where('edition', $edition)
            ->latest('created_at');

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
                'capacity' => (int) config('event.capacity'),
            ],
        ]);
    }
}
