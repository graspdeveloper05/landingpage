<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Registration;
use Illuminate\Http\JsonResponse;
use App\Support\AttendeeImport;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/** Who has arrived, and the controls the organisers use on the day. */
class AttendanceAdminController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $edition = (int) config('event.edition');
        $search = trim((string) $request->query('search', ''));
        $filter = (string) $request->query('filter', 'all');

        $all = Registration::forEdition($edition);
        $registered = (clone $all)->count();
        $arrived = (clone $all)->whereNotNull('checked_in_at')->count();

        $rows = Registration::forEdition($edition)
            ->when($filter === 'arrived', fn ($q) => $q->whereNotNull('checked_in_at'))
            ->when($filter === 'waiting', fn ($q) => $q->whereNull('checked_in_at'))
            ->when($search !== '', function ($q) use ($search) {
                $term = '%'.$search.'%';
                $q->where(fn ($w) => $w->where('full_name', 'like', $term)
                    ->orWhere('email', 'like', $term)
                    ->orWhere('mobile', 'like', $term)
                    ->orWhere('reference', 'like', $term)
                    ->orWhere('organisation', 'like', $term));
            })
            // Latest arrivals first, then everyone still expected by name.
            ->orderByRaw('checked_in_at IS NULL')
            ->orderByDesc('checked_in_at')
            ->orderBy('full_name')
            ->paginate(50);

        return response()->json([
            'data' => collect($rows->items())->map(fn (Registration $r) => [
                'reference' => $r->reference,
                'fullName' => $r->full_name,
                'email' => $r->email,
                'mobile' => $r->mobile,
                'organisation' => $r->organisation,
                'checkedInAt' => $r->checked_in_at?->toIso8601String(),
                'checkedInVia' => $r->checked_in_via,
                // website, google_form, or import (the organisers' own list).
                'source' => $r->source,
            ])->values(),
            'meta' => [
                'registered' => $registered,
                'arrived' => $arrived,
                'page' => $rows->currentPage(),
                'lastPage' => $rows->lastPage(),
                'total' => $rows->total(),
            ],
        ]);
    }

    /** Staff marking someone in by hand, for a guest without a phone. */
    public function store(Registration $registration): JsonResponse
    {
        if ($registration->checked_in_at === null) {
            $registration->forceFill(['checked_in_at' => now(), 'checked_in_via' => 'staff'])->save();
        }

        return response()->json(['checkedInAt' => $registration->checked_in_at->toIso8601String()]);
    }

    /**
     * Bulk-adds attendees from a CSV or Excel file: people on the organisers'
     * own list who did not register on the website.
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:5120', 'mimes:csv,txt,xlsx'],
        ], [
            'file.mimes' => 'Upload a CSV or Excel (.xlsx) file.',
        ]);

        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension()) === 'xlsx' ? 'xlsx' : 'csv';

        try {
            return response()->json((new AttendeeImport())->run($file->getRealPath(), $extension));
        } catch (\InvalidArgumentException $e) {
            throw ValidationException::withMessages(['file' => $e->getMessage()]);
        }
    }

    /** Undo a mistaken check-in. */
    public function destroy(Registration $registration): JsonResponse
    {
        $registration->forceFill(['checked_in_at' => null, 'checked_in_via' => null])->save();

        return response()->json(['checkedInAt' => null]);
    }
}
