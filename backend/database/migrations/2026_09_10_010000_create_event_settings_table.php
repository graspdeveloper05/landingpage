<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The event's own details — date, time, venue, capacity — editable by the
 * organising team rather than living in config/event.php and .env.
 *
 * Keyed by edition because §13 asks that 2027 and 2028 can be added without a
 * rebuild. One row per edition, and `config('event.edition')` says which one
 * the site is currently showing.
 *
 * Date and time are stored twice on purpose. `date` and `start_time` are
 * machine values -- an ISO date for <time datetime> and structured data, and
 * 24-hour time for ordering -- while the labels are what a visitor reads, in
 * each of the four languages. "8 October 2026" is not a formatting of
 * "2026-10-08" that a machine should be inventing in Tamil.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_settings', function (Blueprint $table) {
            $table->unsignedSmallInteger('edition')->primary();
            $table->string('date');
            $table->json('date_label');
            $table->string('start_time', 5);
            $table->json('time_label');
            $table->string('venue');
            $table->string('venue_address');
            $table->string('maps_url', 500);
            $table->string('map_embed_url', 500);
            // §9 — approximately 200 participants.
            $table->unsignedSmallInteger('capacity')->default(200);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_settings');
    }
};
