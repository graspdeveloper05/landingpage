<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Speaker;
use Illuminate\Http\JsonResponse;

class SpeakerController extends Controller
{
    /**
     * GET /api/speakers — §7.
     *
     * Served from the database so the organising team can edit the line-up
     * from the admin panel without a deploy. The response shape is unchanged
     * from when this came out of config/speakers.php.
     *
     * Ordered by sort_order, then id, so the grid never reshuffles between
     * requests -- without a tie-break the order is whatever the storage engine
     * feels like returning, and two people looking at the page can see the
     * speakers in different orders.
     */
    public function index(): JsonResponse
    {
        return response()->json(
            Speaker::query()
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get()
                ->map->toPublicArray()
                ->values(),
        );
    }
}
