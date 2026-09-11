<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Registration extends Model
{
    use HasFactory;

    protected $fillable = [
        'reference',
        'full_name',
        'email',
        'mobile',
        'organisation',
        'designation',
        'dietary',
        'pdpa_accepted',
        'pdpa_accepted_at',
        'edition',
        'ip_address',
        'user_agent',
        'confirmation_sent_at',
    ];

    protected function casts(): array
    {
        return [
            'pdpa_accepted' => 'boolean',
            'pdpa_accepted_at' => 'datetime',
            'confirmation_sent_at' => 'datetime',
        ];
    }

    /**
     * Fields that go into the CSV the organising team downloads (§9).
     * ip_address and user_agent are deliberately excluded — they exist for
     * abuse investigation, not for the attendee list.
     */
    public const EXPORT_COLUMNS = [
        'reference' => 'Reference',
        'created_at' => 'Registered at',
        'full_name' => 'Full name',
        'email' => 'Email',
        'mobile' => 'Mobile',
        'organisation' => 'Organisation',
        'designation' => 'Designation',
        'dietary' => 'Dietary requirement',
    ];

    public function scopeForEdition($query, int $edition)
    {
        return $query->where('edition', $edition);
    }

    /**
     * Registrations received between two dates, inclusive of both.
     *
     * The dates arrive as plain Y-m-d, meaning days in Kuala Lumpur, while
     * created_at is stored in UTC. Comparing them directly would put a
     * registration made at 3am on the 9th into the 8th, because 3am on the
     * 9th in KL is 7pm on the 8th in UTC -- an eight-hour slice of every day
     * filed under the wrong one. Each bound is resolved to the start or end
     * of that day in the venue's timezone first, then compared as an instant.
     */
    public function scopeRegisteredBetween($query, ?string $from, ?string $to)
    {
        $zone = config('event.timezone');

        if ($from) {
            $query->where('created_at', '>=', Carbon::parse($from, $zone)->startOfDay()->utc());
        }

        if ($to) {
            // endOfDay, not the date itself: `<= 2026-10-08` against a
            // timestamp excludes everything that happened after midnight on
            // the 8th, so the last day of any range would come back empty.
            $query->where('created_at', '<=', Carbon::parse($to, $zone)->endOfDay()->utc());
        }

        return $query;
    }
}
