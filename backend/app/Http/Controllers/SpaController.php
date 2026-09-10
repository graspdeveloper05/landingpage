<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;

/**
 * Serves the built React app for every non-API URL.
 *
 * The site and the API share one domain: deploy.sh copies frontend/dist into
 * this application's public/ directory, and the document root points here. So
 * Apache serves index.html, the hashed assets and the images straight from
 * disk, and anything that is not a real file arrives at Laravel's front
 * controller and lands on this controller instead of a 404.
 *
 * That last part is the whole job. /speakers is a client-side route with no
 * file behind it: typed directly, refreshed, or opened from a shared link it
 * would 404 without this, and the visitor would decide the site is broken.
 */
class SpaController extends Controller
{
    public function __invoke(): Response
    {
        $index = public_path('index.html');

        if (! is_file($index)) {
            /*
             * The API is up but the frontend has never been published here.
             * Say so plainly rather than showing Laravel's generic 404, which
             * would send whoever deployed it looking in the wrong place.
             */
            return response(
                'The site has not been published yet. Run deploy.sh to build '
                .'the frontend into this application\'s public/ directory.',
                503,
            )->header('Content-Type', 'text/plain');
        }

        /*
         * index.html must never be cached: it names the hashed asset files,
         * and a stale copy asks for chunks that were pruned weeks ago, which
         * shows as a blank page. The assets themselves carry content hashes
         * in their names, so Apache is free to cache those forever.
         */
        return response(file_get_contents($index))
            ->header('Content-Type', 'text/html; charset=UTF-8')
            ->header('Cache-Control', 'no-cache, must-revalidate');
    }
}
