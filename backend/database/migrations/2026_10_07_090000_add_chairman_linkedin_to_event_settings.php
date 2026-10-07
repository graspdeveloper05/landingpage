<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** The Organising Chairman's LinkedIn profile, linked beside his name on the site. */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('event_settings', 'chairman_linkedin')) {
            return;
        }
        Schema::table('event_settings', function (Blueprint $table) {
            $table->string('chairman_linkedin', 300)->nullable()->after('chairman_portrait');
        });
    }

    public function down(): void
    {
        if (Schema::hasColumn('event_settings', 'chairman_linkedin')) {
            Schema::table('event_settings', function (Blueprint $table) {
                $table->dropColumn('chairman_linkedin');
            });
        }
    }
};
