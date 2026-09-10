<?php

use App\Http\Controllers\Api\Admin\EventAdminController;
use App\Http\Controllers\Api\Admin\PortraitController;
use App\Http\Controllers\Api\Admin\ProgrammeAdminController;
use App\Http\Controllers\Api\Admin\RegistrationAdminController;
use App\Http\Controllers\Api\Admin\RegistrationExportController;
use App\Http\Controllers\Api\Admin\SessionController;
use App\Http\Controllers\Api\Admin\SpeakerAdminController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\ProgrammeController;
use App\Http\Controllers\Api\RegistrationController;
use App\Http\Controllers\Api\SpeakerController;
use App\Http\Middleware\EnsureAdminToken;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API routes
|--------------------------------------------------------------------------
|
| The contract the frontend expects is documented in the frontend repository
| at docs/API-CONTRACT.md. Nothing here is wired to the frontend yet — set
| VITE_API_BASE_URL there when you are ready to switch it over.
|
*/

Route::get('/event', [EventController::class, 'show']);
Route::get('/speakers', [SpeakerController::class, 'index']);
Route::get('/programme', [ProgrammeController::class, 'index']);

/*
| §12 — spam protection. Six attempts per minute per IP is generous for a
| person filling one form and hostile to a script working through a list.
*/
Route::post('/registrations', [RegistrationController::class, 'store'])
    ->middleware('throttle:6,1');

/*
|--------------------------------------------------------------------------
| Admin — §7, §8 and §15
|--------------------------------------------------------------------------
|
| §15: "Routine website updates should not require developer involvement."
| These endpoints are what the React admin panel at /admin talks to, so the
| organising team can edit speakers, timings and the line-up themselves.
|
| Authenticated by session cookie, not a token -- see bootstrap/app.php.
|
*/

// Six attempts a minute per IP. Enough for someone mistyping a password,
// useless for working through a password list.
Route::post('/admin/login', [SessionController::class, 'store'])
    ->middleware('throttle:6,1');

Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    Route::get('/me', [SessionController::class, 'me']);
    Route::post('/logout', [SessionController::class, 'destroy']);

    Route::get('/speakers', [SpeakerAdminController::class, 'index']);
    Route::post('/speakers', [SpeakerAdminController::class, 'store']);
    Route::post('/speakers/reorder', [SpeakerAdminController::class, 'reorder']);
    Route::put('/speakers/{speaker}', [SpeakerAdminController::class, 'update']);
    Route::delete('/speakers/{speaker}', [SpeakerAdminController::class, 'destroy']);

    Route::get('/programme', [ProgrammeAdminController::class, 'index']);
    Route::post('/programme', [ProgrammeAdminController::class, 'store']);
    Route::post('/programme/reorder', [ProgrammeAdminController::class, 'reorder']);
    Route::put('/programme/{programme_item}', [ProgrammeAdminController::class, 'update']);
    Route::delete('/programme/{programme_item}', [ProgrammeAdminController::class, 'destroy']);

    Route::get('/event', [EventAdminController::class, 'show']);
    Route::put('/event', [EventAdminController::class, 'update']);

    Route::post('/portraits', [PortraitController::class, 'store']);

    // §9's "participant list", paginated for the panel. The CSV download
    // below is the same data in the form the organising team files it in.
    Route::get('/registrations/list', [RegistrationAdminController::class, 'index']);
});

/*
| The participant export accepts either a signed-in session or the static
| ADMIN_API_TOKEN, so the panel can offer a download button while a scheduled
| curl on the server keeps working unchanged.
*/
Route::middleware(EnsureAdminToken::class)->prefix('admin')->group(function () {
    Route::get('/registrations', RegistrationExportController::class);
});

/*
| An unknown /api/* path must answer as an API, not as the website. Without
| this the web catch-all would return index.html with a 200, and a mistyped
| endpoint would look to the caller like a successful request returning HTML.
*/
Route::fallback(fn () => response()->json(['message' => 'Not found.'], 404));
