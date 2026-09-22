<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The Google Form each site registration is copied into, per edition.
 *
 * google_form_url is the link the team pasted in the panel; google_form is
 * what the server read from that form's page -- its id, the field number of
 * each question the site answers, and the page each sits on. The visitor's
 * browser submits with those, so a new form needs a new link in the panel,
 * not new code. See App\Support\GoogleFormReader.
 *
 * 2026 starts on the organising team's current form, as read on 22 Sept 2026.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('event_settings', function (Blueprint $table) {
            $table->string('google_form_url', 300)->nullable();
            $table->json('google_form')->nullable();
        });

        DB::table('event_settings')
            ->where('edition', 2026)
            ->whereNull('google_form_url')
            ->update([
                'google_form_url' => 'https://forms.gle/wBqr41qWEWuZy1fG9',
                'google_form' => json_encode([
                    'id' => '1FAIpQLSeIsPbDfMDM-xDdbIng05PSVuMt4x947EchMpnpN9PNGpIh3g',
                    'entries' => [
                        'fullName' => 473554422,
                        'mobile' => 1707445016,
                        'organisation' => 1150494462,
                        'designation' => 8641384,
                        'dietary' => 596513142,
                        'cheveningScholar' => 1120172519,
                        'cheveningCohort' => 1378503810,
                        'cheveningUniversity' => 1443689380,
                        'camMember' => 1220313965,
                    ],
                    'pages' => [
                        'fullName' => 0, 'mobile' => 0, 'organisation' => 0, 'designation' => 0,
                        'dietary' => 0, 'cheveningScholar' => 0,
                        'cheveningCohort' => 1, 'cheveningUniversity' => 1, 'camMember' => 1,
                    ],
                ]),
            ]);
    }

    public function down(): void
    {
        Schema::table('event_settings', function (Blueprint $table) {
            $table->dropColumn(['google_form_url', 'google_form']);
        });
    }
};
