<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SurveyResponse extends Model
{
    /**
     * Who answered is what they typed into the form: name, email and phone.
     * Anonymous feedback has none of these; its submission id ties together
     * the answers sent in one go.
     */
    protected $fillable = ['survey_question_id', 'name', 'email', 'mobile', 'submission_id', 'answer'];

    public function question(): BelongsTo
    {
        return $this->belongsTo(SurveyQuestion::class, 'survey_question_id');
    }
}
