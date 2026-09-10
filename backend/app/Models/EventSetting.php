<?php

namespace App\Models;

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
    ];

    protected $casts = [
        'date_label' => 'array',
        'time_label' => 'array',
        'capacity' => 'integer',
        'edition' => 'integer',
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
        ];
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
