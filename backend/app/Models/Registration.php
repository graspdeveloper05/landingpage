<?php

namespace App\Models;

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
}
