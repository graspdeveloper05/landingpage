<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\PageView;
use App\Models\Registration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/** §12 — the analytics summary shown in the panel. */
class AnalyticsController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $input = $request->validate([
            'days' => ['nullable', 'integer', 'in:7,30,90'],
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
        ]);

        $tz = config('event.timezone');
        $today = now($tz)->startOfDay();

        /*
         * Two ways to ask for a window, and an explicit range wins.
         *
         * The presets answer "how are we doing lately", which is the daily
         * question, so they stay. A range answers "what happened around the
         * launch email", which the presets cannot express at all.
         */
        $hasRange = isset($input['from']) || isset($input['to']);

        if ($hasRange) {
            $start = Carbon::parse($input['from'] ?? '2020-01-01', $tz)->startOfDay();
            $end = Carbon::parse($input['to'] ?? $today->toDateString(), $tz)->startOfDay();

            // A range reaching into next week is not an error worth refusing,
            // but charting empty future days makes today look like a cliff.
            if ($end->greaterThan($today)) {
                $end = $today->copy();
            }

            // The series is one row per day, so an unbounded start would draw
            // several thousand columns and send them all to the browser. A
            // year is more than the whole life of this event.
            if ($start->diffInDays($end) > 366) {
                $start = $end->copy()->subDays(366);
            }
        } else {
            $days = (int) ($input['days'] ?? 30);
            $end = $today->copy();
            $start = $today->copy()->subDays($days - 1);
        }

        // Inclusive of both ends: a range of 5 Sept to 5 Sept means that day,
        // not nothing.
        $days = (int) $start->diffInDays($end) + 1;

        $window = PageView::query()
            ->whereBetween('viewed_on', [$start->toDateString(), $end->toDateString()]);

        /*
         * Every figure below is read from its own clone of the query. Reusing
         * one builder would let each aggregate inherit the previous one's
         * group-by, and the numbers would quietly stop meaning what their
         * labels say.
         */
        $views = (clone $window)->count();
        $visitors = (clone $window)->distinct('visitor')->count('visitor');

        $byDay = (clone $window)
            ->selectRaw('viewed_on, count(*) as views, count(distinct visitor) as visitors')
            ->groupBy('viewed_on')
            ->orderBy('viewed_on')
            ->get()
            ->keyBy(fn ($row) => (string) $row->viewed_on->toDateString());

        // Days with no traffic are filled in as zero rather than skipped: a
        // chart that omits them draws a quiet week as a straight line between
        // two busy days, which reads as steady interest.
        $series = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = $end->copy()->subDays($i)->toDateString();
            $row = $byDay->get($date);
            $series[] = [
                'date' => $date,
                'views' => (int) ($row->views ?? 0),
                'visitors' => (int) ($row->visitors ?? 0),
            ];
        }

        $registrations = Registration::query()
            ->where('edition', (int) config('event.edition'))
            // The same window as the views above, so the conversion figure
            // divides two numbers covering the same days. endOfDay because
            // created_at is a timestamp and the bare date would cut the last
            // day of the range off at midnight.
            ->whereBetween('created_at', [$start->copy()->utc(), $end->copy()->endOfDay()->utc()])
            ->count();

        return response()->json([
            'days' => $days,
            // Echoed back so the panel can label the window it is showing
            // rather than assume it got the one it asked for.
            'from' => $start->toDateString(),
            'to' => $end->toDateString(),
            'custom' => $hasRange,
            'views' => $views,
            'visitors' => $visitors,
            'registrations' => $registrations,
            /*
             * Registrations per hundred visitors. The single number that says
             * whether the site is doing its job -- §11 frames the whole
             * journey as Understand, Explore, Register, and this is the only
             * measure of whether people finish it.
             */
            'conversion' => $visitors > 0 ? round(($registrations / $visitors) * 100, 1) : null,
            'series' => $series,
            'pages' => $this->breakdown((clone $window), 'path'),
            'referrers' => $this->breakdown((clone $window)->whereNotNull('referrer_host'), 'referrer_host'),
            'locales' => $this->breakdown((clone $window)->whereNotNull('locale'), 'locale'),
        ]);
    }

    /** Top ten values of one column, with counts. */
    private function breakdown($query, string $column): array
    {
        return $query
            ->selectRaw("{$column} as label, count(*) as views, count(distinct visitor) as visitors")
            ->groupBy($column)
            ->orderByDesc('views')
            ->limit(10)
            ->get()
            ->map(fn ($row) => [
                'label' => (string) $row->label,
                'views' => (int) $row->views,
                'visitors' => (int) $row->visitors,
            ])
            ->all();
    }
}
