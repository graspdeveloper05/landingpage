<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PageView;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

/** §12 — records one page view. No cookie, nothing identifying stored. */
class PageViewController extends Controller
{
    /** Paths the site actually has. Anything else is noise or someone probing. */
    private const KNOWN = ['/', '/about', '/speakers', '/programme', '/rsvp'];

    public function store(Request $request): JsonResponse
    {
        /*
         * Do Not Track is honoured. It carries no legal weight in Malaysia,
         * but someone who has set it has said plainly that they do not want
         * counting, and there is nothing here worth overriding that for.
         */
        if ($request->header('DNT') === '1') {
            return response()->json(null, 204);
        }

        $data = $request->validate([
            'path' => ['required', 'string', 'max:255'],
            'locale' => ['nullable', 'string', 'size:2'],
            'referrer' => ['nullable', 'string', 'max:500'],
        ]);

        // An unknown path is recorded as "other" rather than stored verbatim:
        // the column would otherwise fill with whatever a scanner asks for,
        // and the admin list would become a log of attack attempts.
        $path = in_array($data['path'], self::KNOWN, true) ? $data['path'] : 'other';

        try {
            PageView::create([
                'path' => $path,
                'referrer_host' => $this->host($data['referrer'] ?? null, $request),
                'locale' => $data['locale'] ?? null,
                'visitor' => PageView::visitorHash($request),
                'viewed_on' => now(config('event.timezone'))->toDateString(),
            ]);
        } catch (Throwable $e) {
            /*
             * A failure here must never reach the visitor. Analytics is the
             * least important thing on the page, and a 500 from it would show
             * up in their console on a site that is working perfectly.
             */
            Log::warning('Page view not recorded', ['exception' => $e->getMessage()]);
        }

        return response()->json(null, 204);
    }

    /**
     * The referrer's host, or null.
     *
     * Host only, never the path or query: a search referrer can carry the
     * words someone typed, which for a national event might be their own name
     * or their employer's. Same-site referrers are dropped -- they describe
     * our own navigation, not where anyone came from.
     */
    private function host(?string $referrer, Request $request): ?string
    {
        if (blank($referrer)) {
            return null;
        }

        $host = parse_url($referrer, PHP_URL_HOST);

        if (! is_string($host) || $host === '') {
            return null;
        }

        $strip = fn (?string $h) => preg_replace('/^www\./', '', strtolower((string) $h));
        $host = $strip($host);

        /*
         * "Our own site" is both APP_URL and the host actually being served.
         * Comparing only against APP_URL meant that on any other hostname --
         * a staging domain, a local build, the IP before DNS moved -- the
         * site listed itself as its own top traffic source, which is
         * meaningless and crowds out the real referrers.
         */
        $ours = [$strip(parse_url(config('app.url'), PHP_URL_HOST)), $strip($request->getHost())];

        return in_array($host, $ours, true) ? null : substr($host, 0, 120);
    }
}
