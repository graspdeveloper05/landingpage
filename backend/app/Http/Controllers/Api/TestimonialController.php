<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Testimonial;
use Illuminate\Http\JsonResponse;

/** Approved testimonials for the homepage. Names appear only as credited. */
class TestimonialController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Testimonial::where('status', 'approved')
                ->orderBy('display_order')->orderBy('id')
                ->get()
                ->map(fn (Testimonial $t) => [
                    'id' => $t->id,
                    'quote' => $t->quote,
                    'attribution' => $t->attribution(),
                ])
                ->values(),
        );
    }
}
