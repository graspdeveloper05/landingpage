<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/** One edition's date, venue and capacity. */
class EventSetting extends Model
{
    protected $primaryKey = 'edition';

    protected $keyType = 'int';

    public $incrementing = false;

    protected $fillable = [
        'edition', 'date', 'date_label', 'start_time', 'time_label',
        'venue', 'venue_address', 'maps_url', 'map_embed_url', 'capacity',
        'registration_open',
    ];

    protected $casts = [
        'date_label' => 'array',
        'time_label' => 'array',
        'capacity' => 'integer',
        'edition' => 'integer',
        'registration_open' => 'boolean',
    ];

    /**
     * The public shape. Keys are camelCase because that is what the React app
     * already consumes, from when this came out of config/event.php.
     */
    public function toPublicArray(): array
    {
        return [
            'edition' => $this->edition,
            'date' => $this->date,
            'dateLabel' => $this->date_label,
            'startTime' => $this->start_time,
            'timeLabel' => $this->time_label,
            'venue' => $this->venue,
            'venueAddress' => $this->venue_address,
            'mapsUrl' => $this->maps_url,
            'mapEmbedUrl' => $this->map_embed_url,
            'capacity' => $this->capacity,
            'registrationOpen' => (bool) $this->registration_open,
            'isPast' => $this->hasPassed(),
        ];
    }

    /**
     * True once the day of the event is over.
     *
     * Compared as whole days in the venue's timezone, not as an instant: an
     * event at 2.30pm is still "today" at 6pm to everyone involved, and a
     * cutoff at the start time would close registration on people walking to
     * the door. The server may also be running in UTC, where 8 October in
     * Kuala Lumpur ends eight hours before UTC agrees that it has.
     */
    public function hasPassed(): bool
    {
        return Carbon::parse($this->date, config('event.timezone'))
            ->endOfDay()
            ->isPast();
    }

    /**
     * Why registration is not open, or null when it is.
     *
     * Ordered by what a visitor most needs to know. An event that has already
     * happened is told so even if it also sold out, because "sold out" reads
     * as "try next time" and the seats are not the point any more.
     */
    public function closedReason(int $registered): ?string
    {
        if ($this->hasPassed()) {
            return 'past';
        }

        if (! $this->registration_open) {
            return 'closed';
        }

        if ($registered >= $this->capacity) {
            return 'full';
        }

        return null;
    }

    /**
     * The row for the edition on show, or null.
     *
     * Callers fall back to config/event.php when this is null, so a database
     * that has not been seeded yet serves the shipped details rather than a
     * site with no date on it.
     */
    public static function current(): ?self
    {
        return static::find((int) config('event.edition'));
    }
}
