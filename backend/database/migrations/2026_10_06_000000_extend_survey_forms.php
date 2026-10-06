<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * What the organising team's own forms need (pre-event questionnaire,
 * participant feedback, questions from the floor):
 *
 * - a form: a fixed short link for a printed QR code, the details it asks
 *   for (name, email, phone, organisation) and a note beside them;
 * - a question: a note under it, a section heading that starts a new page,
 *   a numbered scale, "select up to", an "Other" box, a statement table
 *   and a character limit;
 * - an answer: the organisation given and the text typed for "Other".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('surveys', function (Blueprint $table) {
            $table->string('slug', 60)->nullable()->unique()->after('form_type');
            $table->json('fields')->nullable()->after('description');
            $table->json('details_note')->nullable()->after('fields');
        });

        Schema::table('survey_questions', function (Blueprint $table) {
            $table->json('help')->nullable()->after('question');
            $table->json('section')->nullable()->after('help');
            $table->json('statements')->nullable()->after('options');
            $table->string('layout', 10)->nullable()->after('statements');
            $table->unsignedTinyInteger('max_choices')->nullable()->after('layout');
            $table->boolean('has_other')->default(false)->after('max_choices');
            $table->unsignedSmallInteger('max_length')->nullable()->after('has_other');
        });

        Schema::table('survey_responses', function (Blueprint $table) {
            $table->string('organisation', 150)->nullable()->after('mobile');
            $table->string('other_text', 300)->nullable()->after('answer');
        });
    }

    public function down(): void
    {
        Schema::table('survey_responses', function (Blueprint $table) {
            $table->dropColumn(['organisation', 'other_text']);
        });

        Schema::table('survey_questions', function (Blueprint $table) {
            $table->dropColumn(['help', 'section', 'statements', 'layout', 'max_choices', 'has_other', 'max_length']);
        });

        Schema::table('surveys', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->dropColumn(['slug', 'fields', 'details_note']);
        });
    }
};
