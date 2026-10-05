<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Whether a question must be answered. Optional ones can be skipped; a skip
 * is stored as an empty answer so the question still counts as done.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('survey_questions', function (Blueprint $table) {
            $table->boolean('is_required')->default(true)->after('options');
        });
    }

    public function down(): void
    {
        Schema::table('survey_questions', function (Blueprint $table) {
            $table->dropColumn('is_required');
        });
    }
};
