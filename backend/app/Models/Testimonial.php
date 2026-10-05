<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/** A participant's reflection, credited the way they chose. */
class Testimonial extends Model
{
    public const CREDITS = ['anonymous', 'first_name', 'full_name', 'full_name_org'];

    public const STATUSES = ['pending', 'approved', 'hidden'];

    protected $fillable = ['survey_id', 'email', 'quote', 'credit', 'name', 'organisation', 'status', 'display_order'];

    protected $casts = ['display_order' => 'integer'];

    protected $attributes = ['credit' => 'anonymous', 'status' => 'pending', 'display_order' => 0];

    /** The line under the quote, as the participant asked to be credited. */
    public function attribution(): string
    {
        $name = trim((string) $this->name);

        return match ($this->credit) {
            'first_name' => Str::of($name)->before(' ')->toString(),
            'full_name' => $name,
            'full_name_org' => trim($name.', '.trim((string) $this->organisation), ', '),
            default => 'Anonymous participant',
        };
    }
}
