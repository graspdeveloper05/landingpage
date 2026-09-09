<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class ProgrammeController extends Controller
{
    /** GET /api/programme — §8, the timeline. */
    public function index(): JsonResponse
    {
        return response()->json(config('programme.list'));
    }
}
