<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

/** Login and logout for the admin panel. */
class SessionController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials, remember: true)) {
            /*
             * One message for a wrong password and for an address that has no
             * account. Distinguishing them tells an attacker which organisers
             * have logins, which is half of a credential-stuffing attempt.
             */
            throw ValidationException::withMessages([
                'email' => 'Those details do not match an account.',
            ]);
        }

        // A new session id after login, so a session fixed before authenticating
        // cannot be reused afterwards.
        $request->session()->regenerate();

        return response()->json($this->me($request)->getData(true));
    }

    public function destroy(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Signed out.']);
    }

    /** Who is signed in — the panel calls this on load to decide what to show. */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['user' => null], 401);
        }

        return response()->json([
            'user' => ['name' => $user->name, 'email' => $user->email],
        ]);
    }
}
