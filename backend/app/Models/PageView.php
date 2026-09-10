<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class PageView extends Model
{
    // Only created_at. A page view is an event, not a record that gets edited,
    // and an updated_at column would only ever repeat created_at.
    public const UPDATED_AT = null;

    protected $fillable = ['path', 'referrer_host', 'locale', 'visitor', 'viewed_on'];

    protected $casts = ['viewed_on' => 'date'];

    /**
     * A number standing in for "the same browser, today".
     *
     * IP and user agent are hashed with the app key and today's date, and
     * neither is stored. The date in the salt is the point: the same person
     * visiting tomorrow hashes to something different, so the table cannot be
     * used to follow anyone across days even by whoever holds the database.
     * It buys a daily unique count and nothing more, which is the trade the
     * brief's "privacy/PDPA considerations" line asks for.
     */
    public static function visitorHash(Request $request): string
    {
        return md5(implode('|', [
            config('app.key'),
            now(config('event.timezone'))->toDateString(),
            $request->ip(),
            $request->userAgent(),
        ]));
    }
}
