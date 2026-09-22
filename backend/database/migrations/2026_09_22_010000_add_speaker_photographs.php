<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The speakers' photographs, from config/speakers.php.
 *
 * Fills a portrait only where there is none yet. If the organising team has
 * already uploaded a photograph for someone through the panel, theirs stays:
 * they are the ones who know what each speaker looks like.
 *
 * Six of these are matched to names by the order the client added them to
 * their deck, not by the client saying so -- see the note in the config. The
 * placeholder audit holds launch until that is confirmed.
 */
return new class extends Migration
{
    public function up(): void
    {
        foreach (config('speakers.list') as $speaker) {
            if (blank($speaker['portrait'] ?? null)) {
                continue;
            }

            DB::table('speakers')
                ->where('id', $speaker['id'])
                ->where(fn ($q) => $q->whereNull('portrait')->orWhere('portrait', ''))
                ->update(['portrait' => $speaker['portrait'], 'updated_at' => now()]);
        }
    }

    /**
     * Clears only the photographs this migration set, leaving any the team
     * uploaded since.
     */
    public function down(): void
    {
        foreach (config('speakers.list') as $speaker) {
            if (blank($speaker['portrait'] ?? null)) {
                continue;
            }

            DB::table('speakers')
                ->where('id', $speaker['id'])
                ->where('portrait', $speaker['portrait'])
                ->update(['portrait' => '']);
        }
    }
};
