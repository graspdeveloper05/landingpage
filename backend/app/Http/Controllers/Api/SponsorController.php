<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sponsor;
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
}
