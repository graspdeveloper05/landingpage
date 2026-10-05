<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Surveys no longer sign people in against their registration. The form asks
 * for a name, email and phone, which are kept with each answer; one answer
 * per email per question, as it was one per registration.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('survey_responses', function (Blueprint $table) {
            $table->dropUnique(['survey_question_id', 'registration_id']);
            $table->dropForeign(['registration_id']);
            $table->dropColumn('registration_id');
        });

        Schema::table('survey_responses', function (Blueprint $table) {
            // Nullable only for answers saved before this change.
            $table->string('name', 120)->nullable()->after('survey_question_id');
            $table->string('email', 190)->nullable()->after('name');
            $table->string('mobile', 32)->nullable()->after('email');
            $table->unique(['survey_question_id', 'email']);
        });
    }

    public function down(): void
    {
        Schema::table('survey_responses', function (Blueprint $table) {
            $table->dropUnique(['survey_question_id', 'email']);
            $table->dropColumn(['name', 'email', 'mobile']);
        });

        Schema::table('survey_responses', function (Blueprint $table) {
            $table->foreignId('registration_id')->nullable()->constrained()->cascadeOnDelete();
            $table->unique(['survey_question_id', 'registration_id']);
        });
    }
};
