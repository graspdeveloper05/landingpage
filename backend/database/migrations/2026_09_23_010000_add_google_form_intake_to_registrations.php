<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Registrations that arrive from the organising team's Google Form.
 *
 * A script on that form posts each response to the site (see
 * GoogleFormIntakeController), so the panel's list holds everyone: those who
 * registered here, and those who used the team's form directly.
 *
 *  - source: 'website' or 'google_form', so the panel can say which is which.
 *  - external_id: Google's own response id, so the same response arriving
 *    twice -- a re-run of the catch-up, or a respondent editing their answers
 *    -- updates its row instead of adding one.
 *  - google_sync_secret on the settings: what that script sends to prove the
 *    responses come from the team's form rather than from anyone who found
 *    the address.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->string('source', 20)->default('website')->after('edition');
            $table->string('external_id', 100)->nullable()->unique()->after('source');
            // A response from the team's form may carry neither: their form
            // asks no consent question, and email is a setting they could
            // switch off. Recording "false" would claim somebody refused.
            $table->string('email')->nullable()->change();
            $table->boolean('pdpa_accepted')->nullable()->change();
        });

        Schema::table('event_settings', function (Blueprint $table) {
            $table->string('google_sync_secret', 80)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->dropUnique(['external_id']);
            $table->dropColumn(['source', 'external_id']);
        });

        Schema::table('event_settings', function (Blueprint $table) {
            $table->dropColumn('google_sync_secret');
        });
    }
};
