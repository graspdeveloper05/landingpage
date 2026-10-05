<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

/** A survey the organising team runs: a heading and its questions. */
class Survey extends Model
{
    public const STATUSES = ['draft', 'open', 'closed'];

    protected $fillable = ['title', 'description', 'status'];

    protected $casts = [
        'title' => 'array',
        'description' => 'array',
    ];

    protected $attributes = ['status' => 'draft'];

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
