<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** §10 — one logo in the partners and sponsors band. */
class Sponsor extends Model
{
    protected $fillable = ['name', 'tier', 'logo', 'link', 'width', 'height', 'sort_order'];

    protected $casts = [
        'width' => 'integer',
        'height' => 'integer',
        'sort_order' => 'integer',
    ];

    /** The client's own billing, in the order the band shows them. */
    public const TIERS = ['foundingPatron', 'convenedBy', 'gold', 'silver', 'marketing'];

    public function toPublicArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'tier' => $this->tier,
            'logo' => $this->logo,
            // The sponsor's website, or null: the logo opens it when set.
            'link' => $this->link,
            // The site reserves the tile's space before the logo loads, so
            // the band does not jump as each arrives.
            'width' => $this->width,
            'height' => $this->height,
        ];
    }
}
