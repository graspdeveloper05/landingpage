<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class SpeakerController extends Controller
{
    /**
     * GET /api/speakers
     *
     * Served from config rather than a database table. §7 needs six fields per
     * speaker and no editing workflow; a table plus an admin UI would be more
     * to build and maintain than the brief asks for. Move it into the database
     * if the team ever needs to edit speakers without a deploy.
     */
    public function index(): JsonResponse
    {
        return response()->json(config('speakers.list'));
    }
}
