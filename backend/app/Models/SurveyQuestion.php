<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SurveyQuestion extends Model
{
    public const TYPES = ['choice', 'rating', 'text'];

    protected $fillable = ['type', 'question', 'options', 'status', 'display_order', 'closed_at'];

    protected $casts = [
        'question' => 'array',
        'options' => 'array',
        'display_order' => 'integer',
        'closed_at' => 'datetime',
    ];

    protected $attributes = ['status' => 'draft'];

    public function survey(): BelongsTo
    {
        return $this->belongsTo(Survey::class);
    }

    public function responses(): HasMany
    {
        return $this->hasMany(SurveyResponse::class);
    }

    /** Both the question and the survey it sits in have to be open. */
    public function isAnswerable(): bool
    {
        return $this->status === 'open' && $this->survey->isOpen();
    }
}
