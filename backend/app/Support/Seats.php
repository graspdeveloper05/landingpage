<?php

namespace App\Support;

use App\Models\EventSetting;
use App\Models\Registration;
use Illuminate\Support\Collection;

/**
 * Who has a seat. Registration stays open past the limit: the first N
 * registrations of an edition (N = its capacity, in the order they came in)
 * are confirmed, and everyone after is not confirmed, a waiting list. Worked
 * out rather than stored, so a freed seat or a raised capacity moves the next
 * person up on its own.
 */
class Seats
{
    public const CONFIRMED = 'confirmed';

    public const NOT_CONFIRMED = 'not_confirmed';

    public static function capacity(int $edition): int
    {
        return (int) (EventSetting::find($edition)?->capacity ?? config('event.capacity'));
    }

    /** Ids holding a seat, keyed for lookup. */
    public static function confirmedIds(int $edition): Collection
    {
        return Registration::forEdition($edition)
            ->orderBy('id')
            ->limit(self::capacity($edition))
            ->pluck('id')
            ->flip();
    }

    public static function statusOf(Registration $registration): string
    {
        return self::confirmedIds((int) $registration->edition)->has($registration->id)
            ? self::CONFIRMED
            : self::NOT_CONFIRMED;
    }
}
