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
        $days = (int) ($request->validate([
            'days' => ['nullable', 'integer', 'in:7,30,90'],
        ])['days'] ?? 30);

        $tz = config('event.timezone');
        $from = now($tz)->subDays($days - 1)->toDateString();

        $window = PageView::query()->where('viewed_on', '>=', $from);

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
            $date = now($tz)->subDays($i)->toDateString();
            $row = $byDay->get($date);
            $series[] = [
                'date' => $date,
                'views' => (int) ($row->views ?? 0),
                'visitors' => (int) ($row->visitors ?? 0),
            ];
        }

        $registrations = Registration::query()
            ->where('edition', (int) config('event.edition'))
            ->where('created_at', '>=', Carbon::parse($from, $tz)->startOfDay())
            ->count();

        return response()->json([
            'days' => $days,
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
