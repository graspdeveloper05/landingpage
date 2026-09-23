<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Where people register, chosen in the panel.
 *
 *  'site'   the site's own form, copied into the team's Google Form
 *  'google' every Register button opens the team's Google Form instead, and
 *           the site's form is hidden
 *
 * The second is there for the day the team adds a question to their form:
 * their form then asks it of everyone, with nothing to change here. The cost
 * is the site's own list, its confirmation email and its reference numbers,
 * so it is a choice rather than a default.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('event_settings', function (Blueprint $table) {
            $table->string('registration_mode', 10)->default('site');
        });
    }

    public function down(): void
    {
        Schema::table('event_settings', function (Blueprint $table) {
            $table->dropColumn('registration_mode');
        });
    }
};
