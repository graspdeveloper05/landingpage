<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\EventSetting;
use App\Support\GoogleFormReader;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * The Google Form site registrations are copied into, set from the panel.
 *
 * Saving a link reads that form and stores how to fill it in, so when the
 * team moves to a new form -- or rebuilds a question on this one -- pasting
 * the link again is the whole fix. An empty link switches copying off.
 */
class GoogleFormAdminController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json($this->shape(EventSetting::current()));
    }

    public function update(Request $request, GoogleFormReader $reader): JsonResponse
    {
        $setting = EventSetting::current();

        if (! $setting) {
            return response()->json(['message' => 'Save the event details first.'], 409);
        }

        $data = $request->validate([
            'url' => ['nullable', 'string', 'max:300', 'url'],
            'mode' => ['nullable', Rule::in(['site', 'google'])],
        ]);

        $url = trim((string) ($data['url'] ?? ''));
        $mode = $data['mode'] ?? $setting->registration_mode ?? 'site';

        // Sending people to a form nobody has named would send them nowhere.
        if ($mode === 'google' && $url === '') {
            throw ValidationException::withMessages([
                'mode' => 'Add the Google Form link before sending people to it.',
            ]);
        }

        $setting->update([
            'registration_mode' => $mode,
            ...($url === ''
                ? ['google_form_url' => null, 'google_form' => null]
                : ['google_form_url' => $url, 'google_form' => $reader->read($url)]),
        ]);

        return response()->json($this->shape($setting->fresh()));
    }

    private function shape(?EventSetting $setting): array
    {
        return [
            'url' => $setting?->google_form_url,
            // 'site' or 'google' -- which form the Register buttons open.
            'mode' => $setting?->registration_mode ?? 'site',
            // How many of the site's answers were matched, for the panel's
            // "connected" line. The numbers themselves mean nothing to anyone.
            'matched' => count($setting?->google_form['entries'] ?? []),
        ];
    }
}
