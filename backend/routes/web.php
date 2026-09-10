<?php

use App\Http\Controllers\SpaController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web routes
|--------------------------------------------------------------------------
|
| The React app and the API share one domain. Everything that is not /api/*
| and not a real file on disk is a client-side route, so it all falls through
| to the SPA -- /, /about, /speakers, /programme, /rsvp, and any future route
| the frontend adds without this file needing to know about it.
|
| Real files never reach here: public/.htaccess only forwards a request to the
| front controller when the path does not exist on disk, so index.html, the
| hashed assets and the images are served by Apache directly.
|
*/

/*
 * `api` is excluded explicitly. Fallback routes are registered last whatever
 * file they live in, so without this constraint a catch-all matching `.*`
 * claims /api/anything before routes/api.php's fallback ever sees it -- and a
 * mistyped endpoint answers 200 with the website's HTML, which reads to the
 * caller as a successful request.
 */
Route::get('/{any}', SpaController::class)->where('any', '^(?!api$|api/).*$');
