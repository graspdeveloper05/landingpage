<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Feedback forms are anonymous, so there is no email to tell one person's
 * answers from another's. Each submit carries an id instead, and the admin
 * lists one response per id.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('survey_responses', function (Blueprint $table) {
            $table->uuid('submission_id')->nullable()->after('mobile')->index();
        });

        // Anonymous answers given before this: a submit sends its questions in
        // order, so a new submission starts where a question comes round again.
        $rows = DB::table('survey_responses')
            ->join('survey_questions', 'survey_questions.id', '=', 'survey_responses.survey_question_id')
            ->whereNull('survey_responses.email')
            ->orderBy('survey_responses.id')
            ->get(['survey_responses.id', 'survey_responses.survey_question_id', 'survey_questions.survey_id']);

        foreach ($rows->groupBy('survey_id') as $answers) {
            $seen = [];
            $id = (string) Str::uuid();
            foreach ($answers as $row) {
                if (isset($seen[$row->survey_question_id])) {
                    $seen = [];
                    $id = (string) Str::uuid();
                }
                $seen[$row->survey_question_id] = true;
                DB::table('survey_responses')->where('id', $row->id)->update(['submission_id' => $id]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('survey_responses', function (Blueprint $table) {
            $table->dropIndex(['submission_id']);
            $table->dropColumn('submission_id');
        });
    }
};
