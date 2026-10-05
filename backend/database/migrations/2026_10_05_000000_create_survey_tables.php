<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Surveys the organising team runs during and after the event. Answered by
 * registered attendees only, so every response points at a registration.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('surveys', function (Blueprint $table) {
            $table->id();
            $table->json('title');
            $table->json('description')->nullable();
            $table->string('status', 10)->default('draft');
            $table->timestamps();
        });

        Schema::create('survey_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survey_id')->constrained()->cascadeOnDelete();
            $table->string('type', 10);
            $table->json('question');
            $table->json('options')->nullable();
            $table->string('status', 10)->default('draft');
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('survey_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survey_question_id')->constrained()->cascadeOnDelete();
            $table->foreignId('registration_id')->constrained()->cascadeOnDelete();
            $table->text('answer');
            $table->timestamps();

            // One answer per person per question, enforced by the database
            // so two quick taps cannot both land.
            $table->unique(['survey_question_id', 'registration_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('survey_responses');
        Schema::dropIfExists('survey_questions');
        Schema::dropIfExists('surveys');
    }
};
