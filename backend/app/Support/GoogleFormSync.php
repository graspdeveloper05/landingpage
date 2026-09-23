<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

/**
 * Where a "Sync now" from the panel has got to.
 *
 * The panel asks the script on the team's form to send every response again;
 * the script does it in batches, each arriving at the intake endpoint, which
 * records it here. The panel reads this every few seconds to show what has
 * come in. Kept in the cache: it describes a few minutes, not history.
 */
class GoogleFormSync
{
    private const KEY = 'google-form-sync';

    /** Started, but Google has not run it yet. It usually does within a minute. */
    private const START_GRACE = 180;

    /** Running, but nothing has arrived for this long: Google stopped it. */
    private const STALL_AFTER = 150;

    public static function start(): void
    {
        Cache::put(self::KEY, [
            'startedAt' => now()->timestamp,
            'lastAt' => null,
            'batches' => 0,
            'received' => 0,
            'created' => 0,
            'finished' => false,
        ], now()->addHours(6));
    }

    public static function forget(): void
    {
        Cache::forget(self::KEY);
    }

    /** One batch arriving. Only counted while a sync from the panel is on. */
    public static function record(int $created, int $updated, bool $final): void
    {
        $state = Cache::get(self::KEY);

        if (! $state || $state['finished']) {
            return;
        }

        $state['lastAt'] = now()->timestamp;
        $state['batches']++;
        $state['received'] += $created + $updated;
        $state['created'] += $created;
        $state['finished'] = $final;

        Cache::put(self::KEY, $state, now()->addHours(6));
    }

    /**
     * idle | starting | running | done | stalled -- and the counts.
     *
     * @return array<string, mixed>
     */
    public static function status(): array
    {
        $state = Cache::get(self::KEY);

        if (! $state) {
            return ['state' => 'idle'];
        }

        $now = now()->timestamp;
        $phase = match (true) {
            $state['finished'] => 'done',
            $state['batches'] === 0 && $now - $state['startedAt'] > self::START_GRACE => 'stalled',
            $state['batches'] === 0 => 'starting',
            $now - $state['lastAt'] > self::STALL_AFTER => 'stalled',
            default => 'running',
        };

        return [
            'state' => $phase,
            'received' => $state['received'],
            'created' => $state['created'],
            'startedAt' => $state['startedAt'],
        ];
    }

    /** True while another sync would only duplicate the work of this one. */
    public static function busy(): bool
    {
        return in_array(self::status()['state'], ['starting', 'running'], true);
    }
}
