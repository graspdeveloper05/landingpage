<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The Chevening questions the organising team's Google Form asks, now asked
 * by the site's form too: whether the person is a Chevening scholar, and if
 * so their cohort, university and CAM membership. See
 * Registration::ANSWER_LABELS for the keys.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->json('answers')->nullable()->after('dietary');
        });
    }

    public function down(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->dropColumn('answers');
        });
    }
};
