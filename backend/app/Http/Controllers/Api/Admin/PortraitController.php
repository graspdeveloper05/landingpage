<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * §7 — "professional photograph". Uploading one has to be part of editing a
 * speaker, or the team can change every field except the picture and still
 * needs a developer.
 *
 * Files go to the public disk, which deploy.sh links into the document root,
 * so the stored path is servable directly by Apache.
 */
class PortraitController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'portrait' => [
                'required',
                'image',
                /*
                 * mimes: on an uploaded file checks the real MIME type, not
                 * the filename, so renaming a .php to .jpg does not get it in.
                 * svg is excluded deliberately: an SVG is a document that can
                 * carry script, and these are served from the site's own
                 * origin where that script would run as us.
                 */
                'mimes:jpeg,jpg,png,webp',
                'max:8192',
                // 5:6 portraits, per docs/IMAGE-SPEC.md. Allowing anything
                // means a landscape photo cropped to a chin in the grid.
                'dimensions:min_width=400,min_height=480',
            ],
        ], [
            'portrait.dimensions' => 'The photograph must be at least 400 × 480. Portrait shape, around 700 × 840, works best.',
            'portrait.max' => 'The photograph must be under 8 MB.',
            'portrait.mimes' => 'Use a JPEG, PNG or WebP image.',
        ]);

        $file = $request->file('portrait');

        /*
         * The stored name is generated, never taken from the upload. A
         * visitor-supplied filename can carry path separators, null bytes or
         * another extension after the first, and it would also leak whatever
         * the organiser happened to call the file on their laptop.
         */
        $name = Str::uuid()->toString().'.'.$file->extension();
        $file->storeAs('portraits', $name, 'public');

        return response()->json([
            'path' => '/storage/portraits/'.$name,
        ], 201);
    }
}
