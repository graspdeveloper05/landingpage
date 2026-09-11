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
        'event_name', 'subtitle', 'hero_image',
        'chairman_name', 'chairman_organisation', 'chairman_designation',
        'chairman_message', 'chairman_quote', 'chairman_portrait',
        'venue', 'venue_address', 'maps_url', 'map_embed_url', 'capacity',
        'registration_open',
    ];

    protected $casts = [
        'date_label' => 'array',
        'time_label' => 'array',
        'event_name' => 'array',
        'subtitle' => 'array',
        'chairman_designation' => 'array',
        'chairman_message' => 'array',
        'chairman_quote' => 'array',
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
            // Null until the team edits them, and the frontend then falls
            // back to the wording in the locale files -- the behaviour the
            // site had before any of this was editable.
            'eventName' => $this->event_name,
            'subtitle' => $this->subtitle,
            'heroImage' => $this->hero_image,
            /*
             * Null until the team edits it, and the site then falls back to
             * the chairman shipped in the data file -- the same rule the two
             * hero lines follow. Sent as one object because that is the shape
             * the component already consumes.
             */
            'chairman' => $this->chairmanArray(),
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
     * The chairman as both the site and the panel consume him.
     *
     * Null until the team has edited him, and the site then falls back to the
     * record shipped in the data file -- the same rule the hero's two lines
     * follow. Portrait is normalised to a string here because the site puts
     * it straight into an <img src>, where null would render "null".
     */
    public function chairmanArray(): ?array
    {
        if ($this->chairman_name === null) {
            return null;
        }

        return [
            'name' => $this->chairman_name,
            'organisation' => $this->chairman_organisation,
            'designation' => $this->chairman_designation,
            'message' => $this->chairman_message,
            'quote' => $this->chairman_quote,
            'portrait' => (string) $this->chairman_portrait,
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
