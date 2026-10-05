<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

/** A survey the organising team runs: a heading and its questions. */
class Survey extends Model
{
    public const STATUSES = ['draft', 'open', 'closed'];

    /** A survey (live polls and the like) or the participant feedback form. */
    public const FORM_TYPES = ['survey', 'feedback'];

    protected $fillable = ['form_type', 'title', 'description', 'status'];

    protected $casts = [
        'title' => 'array',
        'description' => 'array',
    ];

    protected $attributes = ['form_type' => 'survey', 'status' => 'draft'];

    public function questions(): HasMany
    {
        return $this->hasMany(SurveyQuestion::class)->orderBy('display_order')->orderBy('id');
    }

    public function responses(): HasManyThrough
    {
        return $this->hasManyThrough(SurveyResponse::class, SurveyQuestion::class);
    }

    public function isOpen(): bool
    {
        return $this->status === 'open';
    }
}
