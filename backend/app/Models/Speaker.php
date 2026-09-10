<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** §7 — a speaker or the moderator. */
class Speaker extends Model
{
    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id', 'name', 'designation', 'organisation', 'portrait',
        'bio', 'link', 'role', 'placeholder', 'sort_order',
    ];

    protected $casts = [
        'designation' => 'array',
        'bio' => 'array',
        'link' => 'array',
        'placeholder' => 'boolean',
        'sort_order' => 'integer',
    ];

    /**
     * The public shape, unchanged from what config/speakers.php returned.
     *
     * Built by hand rather than with $hidden/$appends so that adding a column
     * for the admin panel -- an internal note, a draft flag -- cannot leak
     * into the public API by accident.
     */
    public function toPublicArray(): array
    {
        return array_filter([
            'id' => $this->id,
            'name' => $this->name,
            'designation' => $this->designation,
            'organisation' => $this->organisation,
            'portrait' => $this->portrait,
            'bio' => $this->bio,
            'link' => $this->link ?: null,
            'role' => $this->role,
            'placeholder' => $this->placeholder ?: null,
        ], fn ($v) => $v !== null);
    }
}
