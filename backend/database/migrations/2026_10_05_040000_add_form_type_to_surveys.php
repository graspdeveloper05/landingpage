<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * What kind of form a survey is: a 'survey' (live polls and the like) or the
 * participant 'feedback' form.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('surveys', function (Blueprint $table) {
            $table->string('form_type', 10)->default('survey')->after('id');
        });
    }

    public function down(): void
    {
        Schema::table('surveys', function (Blueprint $table) {
            $table->dropColumn('form_type');
        });
    }
};
