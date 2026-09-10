<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** §8 — one row of the timeline. */
class ProgrammeItem extends Model
{
    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = ['id', 'time', 'title', 'detail', 'placeholder', 'sort_order'];

    protected $casts = [
        'title' => 'array',
        'detail' => 'array',
        'placeholder' => 'boolean',
        'sort_order' => 'integer',
    ];

    /** The public shape, unchanged from what config/programme.php returned. */
    public function toPublicArray(): array
    {
        return array_filter([
            'id' => $this->id,
            'time' => $this->time,
            'title' => $this->title,
            'detail' => $this->detail ?: null,
            'placeholder' => $this->placeholder ?: null,
        ], fn ($v) => $v !== null);
    }
}
