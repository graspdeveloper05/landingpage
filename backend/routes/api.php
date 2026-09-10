<?php

use App\Http\Controllers\Api\Admin\RegistrationExportController;
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

Route::middleware(EnsureAdminToken::class)->prefix('admin')->group(function () {
    Route::get('/registrations', RegistrationExportController::class);
});

/*
| An unknown /api/* path must answer as an API, not as the website. Without
| this the web catch-all would return index.html with a 200, and a mistyped
| endpoint would look to the caller like a successful request returning HTML.
*/
Route::fallback(fn () => response()->json(['message' => 'Not found.'], 404));
