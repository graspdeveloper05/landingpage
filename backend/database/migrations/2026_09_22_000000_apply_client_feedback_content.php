<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The client's content feedback of September 2026: the real event details,
 * chairman, speakers and programme, replacing the placeholders the site was
 * built with.
 *
 * A migration rather than a note telling someone to retype it all in the
 * panel, because a migration runs on every server exactly once, on deploy.
 * The content itself lives in config/{event,chairman,speakers,programme}.php,
 * which the ContentSeeder reads too -- one source, so a fresh install and
 * this upgrade arrive at the same site.
 *
 * Each block replaces content only while it is still the shipped
 * placeholder. If the organising team has already entered real speakers or
 * their own programme through the panel, that block leaves theirs alone.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('event_settings', function (Blueprint $table) {
            // The full welcome, shown on the About page. The existing
            // `chairman_message` stays the short one on the home page.
            $table->json('chairman_letter')->nullable()->after('chairman_quote');
        });

        $edition = (int) config('event.edition');
        $now = now();

        /* ---------------- Event details and chairman ---------------- */

        DB::table('event_settings')->where('edition', $edition)->update([
            'date' => config('event.date'),
            'date_label' => json_encode(config('event.date_label'), JSON_UNESCAPED_UNICODE),
            'start_time' => config('event.start_time'),
            'time_label' => json_encode(config('event.time_label'), JSON_UNESCAPED_UNICODE),
            'venue' => config('event.venue'),
            'maps_url' => config('event.maps_url'),
            'map_embed_url' => config('event.map_embed_url'),

            'chairman_name' => config('chairman.name'),
            'chairman_organisation' => config('chairman.organisation'),
            'chairman_designation' => json_encode(config('chairman.designation'), JSON_UNESCAPED_UNICODE),
            'chairman_message' => json_encode(config('chairman.message'), JSON_UNESCAPED_UNICODE),
            'chairman_quote' => json_encode(config('chairman.quote'), JSON_UNESCAPED_UNICODE),
            'chairman_letter' => json_encode(config('chairman.letter'), JSON_UNESCAPED_UNICODE),
            // Cleared on purpose. Whatever photograph was there belonged to
            // the placeholder chairman, and showing it above the real
            // chairman's name would be a portrait of the wrong person.
            'chairman_portrait' => '',
            'updated_at' => $now,
        ]);

        /* ---------------------------- Speakers ---------------------------- */

        // Only while every speaker is still a flagged placeholder -- the
        // invented line-up the site shipped with.
        $realSpeakers = DB::table('speakers')->where('placeholder', false)->exists();

        if (! $realSpeakers) {
            DB::table('speakers')->delete();

            foreach (array_values(config('speakers.list')) as $i => $s) {
                DB::table('speakers')->insert([
                    'id' => $s['id'],
                    'name' => $s['name'],
                    'designation' => json_encode($s['designation'], JSON_UNESCAPED_UNICODE),
                    'organisation' => $s['organisation'],
                    'portrait' => $s['portrait'],
                    'bio' => json_encode($s['bio'], JSON_UNESCAPED_UNICODE),
                    'link' => null,
                    'role' => $s['role'],
                    'placeholder' => false,
                    'sort_order' => $i,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        /* ---------------------------- Programme ---------------------------- */

        // The shipped programme was never flagged as a placeholder, so it is
        // recognised by its ids instead: pr-01 to pr-08 and nothing else.
        $shipped = ['pr-01', 'pr-02', 'pr-03', 'pr-04', 'pr-05', 'pr-06', 'pr-07', 'pr-08'];
        $ids = DB::table('programme_items')->pluck('id')->all();
        $untouched = array_diff($ids, $shipped) === [];

        if ($untouched) {
            DB::table('programme_items')->delete();

            foreach (array_values(config('programme.list')) as $i => $p) {
                DB::table('programme_items')->insert([
                    'id' => $p['id'],
                    'time' => $p['time'],
                    'title' => json_encode($p['title'], JSON_UNESCAPED_UNICODE),
                    'detail' => $p['detail'] === null ? null : json_encode($p['detail'], JSON_UNESCAPED_UNICODE),
                    'placeholder' => false,
                    'sort_order' => $i,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }

    /**
     * Only the column comes back out. The content it replaced was
     * placeholder text; restoring invented speakers is not a rollback anyone
     * would want.
     */
    public function down(): void
    {
        Schema::table('event_settings', function (Blueprint $table) {
            $table->dropColumn('chairman_letter');
        });
    }
};
