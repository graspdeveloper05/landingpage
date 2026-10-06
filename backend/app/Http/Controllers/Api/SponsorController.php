<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sponsor;
use App\Models\SponsorTier;
use Illuminate\Http\JsonResponse;

class SponsorController extends Controller
{
    /** GET /api/sponsors — the band, in the order the panel arranged it. */
    public function index(): JsonResponse
    {
        return response()->json(
            Sponsor::query()
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get()
                ->map->toPublicArray(),
        );
    }

    /** GET /api/sponsor-tiers — the groups, named and in the panel's order. */
    public function tiers(): JsonResponse
    {
        return response()->json(
            SponsorTier::query()
                ->orderBy('sort_order')
                ->orderBy('id')
                ->get()
                ->map->toPublicArray(),
        );
    }
}
