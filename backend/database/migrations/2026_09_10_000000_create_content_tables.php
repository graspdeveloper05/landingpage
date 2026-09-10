<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Moves the site's editable content out of PHP config files and into the
 * database, so the organising team can change it without a deploy.
 *
 * §7 and §8 both say speakers and programme timings must be editable by the
 * team. While they lived in config/speakers.php and config/programme.php that
 * meant a developer and a git push for every correction to a job title.
 *
 * The string primary keys ("sp-01", "pr-03") are deliberate: they are the ids
 * the published API already returns and the React app already keys its lists
 * on. Renumbering them to integers would change the public contract for no
 * gain.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('speakers', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            // The four locales of §3 in one JSON column. A column per language
            // would need a migration every time a language is added, and the
            // API hands these to the client as an object anyway.
            $table->json('designation');
            $table->string('organisation');
            $table->string('portrait');
            $table->json('bio');
            // §7 — "relevant official external link", as {label, url}.
            $table->json('link')->nullable();
            $table->string('role')->default('speaker');
            // Marks content the organising team has not confirmed yet, so the
            // placeholder audit can still see it once editing moves here.
            $table->boolean('placeholder')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['role', 'sort_order']);
        });

        Schema::create('programme_items', function (Blueprint $table) {
            $table->string('id')->primary();
            // "HH:MM" rather than a time column: the client formats it for the
            // visitor's locale, and the event has no date-crossing sessions.
            $table->string('time', 5);
            $table->json('title');
            $table->json('detail')->nullable();
            $table->boolean('placeholder')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index('sort_order');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('programme_items');
        Schema::dropIfExists('speakers');
    }
};
