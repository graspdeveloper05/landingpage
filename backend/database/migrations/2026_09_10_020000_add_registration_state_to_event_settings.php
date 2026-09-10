<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Whether registration is open, as a decision the organising team can make.
 *
 * Until now the only thing that closed registration was the room filling up,
 * so the site had two states it could not express:
 *
 *  - the event has happened. On 9 October 2026 the homepage would still have
 *    said "Reserve your seat" and the API would still have accepted people
 *    onto an event that finished the day before.
 *  - the team wants to stop early. Catering headcounts and security lists are
 *    due before the door opens, and there was no way to draw that line.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('event_settings', function (Blueprint $table) {
            $table->boolean('registration_open')->default(true)->after('capacity');
        });
    }

    public function down(): void
    {
        Schema::table('event_settings', function (Blueprint $table) {
            $table->dropColumn('registration_open');
        });
    }
};
