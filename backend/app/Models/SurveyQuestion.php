<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SurveyQuestion extends Model
{
    /** choice: pick one; checkbox: tick any number; rating: 1-5; text: written. */
    public const TYPES = ['choice', 'checkbox', 'rating', 'text'];

    /** The types answered by picking from a list of options. */
    public const WITH_OPTIONS = ['choice', 'checkbox'];

    protected $fillable = ['type', 'question', 'options', 'is_required', 'status', 'display_order', 'closed_at'];

    protected $casts = [
        'question' => 'array',
        'options' => 'array',
        'is_required' => 'boolean',
        'display_order' => 'integer',
        'closed_at' => 'datetime',
    ];

    protected $attributes = ['status' => 'draft', 'is_required' => false];

    public function survey(): BelongsTo
    {
        return $this->belongsTo(Survey::class);
    }

    public function responses(): HasMany
    {
        return $this->hasMany(SurveyResponse::class);
    }

    public function hasOptions(): bool
    {
        return in_array($this->type, self::WITH_OPTIONS, true);
    }

    /**
     * A stored answer in words: options are stored by number ("0", or "0,2"
     * for checkboxes) and read back as their English labels.
     */
    public function label(string $answer): string
    {
        if (! $this->hasOptions()) {
            return $answer;
        }

        return collect(explode(',', $answer))
            ->map(fn ($i) => $this->options[(int) $i]['en'] ?? $i)
            ->implode('; ');
    }

    /** Both the question and the survey it sits in have to be open. */
    public function isAnswerable(): bool
    {
        return $this->status === 'open' && $this->survey->isOpen();
    }
}
