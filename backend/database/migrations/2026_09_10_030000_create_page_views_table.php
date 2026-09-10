<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * §12 — "basic website analytics", first-party and cookieless.
 *
 * Three lines of the brief decide the shape of this: it wants analytics, it
 * wants "privacy/PDPA considerations", and it says to avoid unnecessary
 * subscriptions. Google Analytics answers the first and costs us the second
 * (third-party cookies, a consent banner, attendee browsing sent abroad);
 * Plausible and Fathom answer the first two and cost the third. Laravel is
 * already running on this domain, so counting page views here is free, sends
 * nothing anywhere, and needs no banner in front of it.
 *
 * Nothing identifying is stored. There is no IP address column and no cookie:
 * `visitor` is a hash of IP and user agent with a salt that changes daily, so
 * repeat visits within a day can be counted and the same person tomorrow is a
 * new, unlinkable number. That is the honest limit of it -- day-by-day unique
 * counts, not a visitor history -- and it is what "basic" asks for.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('page_views', function (Blueprint $table) {
            $table->id();
            $table->string('path', 255)->index();
            // Host only, never the full referring URL: a search query string
            // can carry someone's own name and is not ours to keep.
            $table->string('referrer_host', 120)->nullable()->index();
            $table->string('locale', 5)->nullable();
            $table->char('visitor', 32)->index();
            $table->date('viewed_on')->index();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('page_views');
    }
};
