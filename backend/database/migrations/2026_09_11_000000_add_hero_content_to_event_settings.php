<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * §15 — the hero's own wording and photograph, editable without a developer.
 *
 * The date, time and venue already came from here. The two lines above them
 * and the picture behind them did not: they were compiled into the JavaScript
 * bundle, so changing "Seri Negara Dialogue 2026" to 2027 meant a code change
 * and a deploy.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('event_settings', function (Blueprint $table) {
            // Nullable, and the frontend falls back to the wording shipped in
            // the locale files. An edition row created before this migration
            // therefore renders exactly as it did, rather than showing gaps.
            $table->json('event_name')->nullable()->after('time_label');
            $table->json('subtitle')->nullable()->after('event_name');

            // The base path of an uploaded hero, without extension — the
            // Picture component appends .webp and .jpg itself, and a phone
            // gets the -960 variant beside it.
            $table->string('hero_image')->nullable()->after('subtitle');
        });

        /*
         * Backfilled with the wording the site already shows, in all four
         * languages of §3, taken from the locale files as they stand.
         *
         * Without this the admin form would open empty on an existing
         * edition, and the first save would blank the hero. Filling it here
         * means the form opens showing what the visitor currently sees, which
         * is the only sensible starting point for editing it.
         */
        DB::table('event_settings')->whereNull('event_name')->update([
            'event_name' => json_encode([
                'en' => 'Seri Negara Dialogue 2026',
                'ms' => 'Dialog Seri Negara 2026',
                'zh' => '斯里尼加拉对话 2026',
                'ta' => 'சேரி நெகாரா உரையாடல் 2026',
            ], JSON_UNESCAPED_UNICODE),
            'subtitle' => json_encode([
                'en' => "A National Conversation on Malaysia's Future",
                'ms' => 'Perbualan Nasional Mengenai Masa Depan Malaysia',
                'zh' => '一场关于马来西亚未来的全国对话',
                'ta' => 'மலேசியாவின் எதிர்காலம் குறித்த ஒரு தேசிய உரையாடல்',
            ], JSON_UNESCAPED_UNICODE),
        ]);
    }

    public function down(): void
    {
        Schema::table('event_settings', function (Blueprint $table) {
            $table->dropColumn(['event_name', 'subtitle', 'hero_image']);
        });
    }
};
