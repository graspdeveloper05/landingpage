<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Testimonials written on a feedback form arrive with the form and the email
 * they came from: one per email per form. Ones the team adds by hand have
 * neither.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('testimonials', function (Blueprint $table) {
            $table->foreignId('survey_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->string('email', 190)->nullable()->after('organisation');
            $table->unique(['survey_id', 'email']);
        });
    }

    public function down(): void
    {
        Schema::table('testimonials', function (Blueprint $table) {
            $table->dropUnique(['survey_id', 'email']);
            $table->dropForeign(['survey_id']);
            $table->dropColumn(['survey_id', 'email']);
        });
    }
};
