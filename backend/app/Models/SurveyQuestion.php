<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SurveyQuestion extends Model
{
    /**
     * choice: pick one; checkbox: tick any number; rating: 1-5; text: written;
     * grid: one choice for each of several statements, on a shared scale.
     */
    public const TYPES = ['choice', 'checkbox', 'rating', 'text', 'grid'];

    /** The types answered by picking from a list of options. */
    public const WITH_OPTIONS = ['choice', 'checkbox', 'grid'];

    /**
     * How a question is shown: a choice as a list or numbered scale cards; a
     * rating as stars (no layout) or smileys. A rating is 1 to 5 either way.
     */
    public const LAYOUTS = ['list', 'scale', 'smileys'];

    protected $fillable = [
        'type', 'question', 'help', 'section', 'options', 'statements', 'layout',
        'max_choices', 'has_other', 'max_length', 'is_required', 'status', 'display_order', 'closed_at',
    ];

    protected $casts = [
        'question' => 'array',
        'help' => 'array',
        'section' => 'array',
        'options' => 'array',
        'statements' => 'array',
        'max_choices' => 'integer',
        'has_other' => 'boolean',
        'max_length' => 'integer',
        'is_required' => 'boolean',
        'display_order' => 'integer',
        'closed_at' => 'datetime',
    ];

    protected $attributes = ['status' => 'draft', 'is_required' => false, 'has_other' => false];

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

    /** "Other" is answered as the number after the last option. */
    public function otherIndex(): ?int
    {
        return $this->has_other && in_array($this->type, ['choice', 'checkbox'], true)
            ? count($this->options ?? [])
            : null;
    }

    /**
     * A stored answer in words: options are stored by number ("0", or "0,2"
     * for checkboxes) and read back as their English labels. A statement
     * table reads "Statement: choice" for each statement in turn.
     */
    public function label(string $answer, ?string $other = null): string
    {
        if ($this->type === 'grid') {
            return collect(explode(',', $answer))
                ->map(fn ($i, $row) => ($this->statements[$row]['en'] ?? '').': '.($this->options[(int) $i]['en'] ?? $i))
                ->implode('; ');
        }

        if (! $this->hasOptions()) {
            return $answer;
        }

        return collect(explode(',', $answer))
            ->map(fn ($i) => (int) $i === $this->otherIndex()
                ? 'Other'.($other !== null && $other !== '' ? ': '.$other : '')
                : ($this->options[(int) $i]['en'] ?? $i))
            ->implode('; ');
    }

    /** Both the question and the survey it sits in have to be open. */
    public function isAnswerable(): bool
    {
        return $this->status === 'open' && $this->survey->isOpen();
    }
}
