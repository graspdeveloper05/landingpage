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

    /** The details a form can ask for, before its questions. */
    public const DETAILS = ['name', 'email', 'mobile', 'organisation'];

    /** Each detail is asked and required, asked as optional, or not asked. */
    public const DETAIL_MODES = ['required', 'optional', 'off'];

    protected $fillable = ['form_type', 'slug', 'title', 'description', 'fields', 'details_note', 'status'];

    protected $casts = [
        'title' => 'array',
        'description' => 'array',
        'fields' => 'array',
        'details_note' => 'array',
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

    /**
     * Which details this form asks for, every one named. A form that never
     * set them keeps what it always asked: email and phone for a survey,
     * nothing for an (anonymous) feedback form.
     *
     * @return array{name: string, email: string, mobile: string, organisation: string}
     */
    public function fields(): array
    {
        $default = $this->form_type === 'feedback'
            ? []
            : ['email' => 'required', 'mobile' => 'required'];
        $set = $this->fields ?? $default;

        $out = [];
        foreach (self::DETAILS as $detail) {
            $mode = $set[$detail] ?? 'off';
            $out[$detail] = in_array($mode, self::DETAIL_MODES, true) ? $mode : 'off';
        }

        return $out;
    }

    /** Without an email there is no one to recognise: every submit is new. */
    public function isAnonymous(): bool
    {
        return $this->fields()['email'] === 'off';
    }
}
