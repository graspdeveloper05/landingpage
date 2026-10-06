<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/** §10 — one group of the sponsors band ("Our Gold Sponsors"), in four languages. */
class SponsorTier extends Model
{
    protected $fillable = ['key', 'name', 'sort_order'];

    protected $casts = [
        'name' => 'array',
        'sort_order' => 'integer',
    ];

    /**
     * A key for a new group, from its English name: "Media Partners" becomes
     * "mediaPartners", and a second "Gold" becomes "gold2".
     */
    public static function keyFor(string $name): string
    {
        $base = Str::limit(Str::camel(preg_replace('/[^A-Za-z0-9 ]+/', ' ', Str::ascii($name))), 50, '') ?: 'group';
        $key = $base;
        for ($n = 2; static::where('key', $key)->exists(); $n++) {
            $key = $base.$n;
        }

        return $key;
    }

    public function toPublicArray(): array
    {
        return ['id' => $this->id, 'key' => $this->key, 'name' => $this->name];
    }
}
