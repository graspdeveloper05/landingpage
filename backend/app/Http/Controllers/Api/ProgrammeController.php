<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProgrammeItem;
use Illuminate\Http\JsonResponse;

class ProgrammeController extends Controller
{
    /**
     * GET /api/programme — §8, the timeline.
     *
     * Ordered by sort_order then time, so an item inserted between two others
     * lands where the team put it rather than at the end.
     */
    public function index(): JsonResponse
    {
        return response()->json(
            ProgrammeItem::query()
                ->orderBy('sort_order')
                ->orderBy('time')
                ->get()
                ->map->toPublicArray()
                ->values(),
        );
    }
}
