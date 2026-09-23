<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * §10 — the partners and sponsors band, editable by the organising team.
 *
 * Logos arrive through the event, one at a time, and were until now a line of
 * code each. The tiers are fixed because they are the client's own billing:
 * Founding Patron, Convened by, Gold, Silver, Marketing Partner. A tier with
 * nobody in it is simply not shown.
 *
 * Seeded with the six already on the site, so the band is unchanged the
 * moment this runs.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sponsors', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            // foundingPatron | convenedBy | gold | silver | marketing
            $table->string('tier', 20)->index();
            $table->string('logo');
            $table->unsignedSmallInteger('width')->nullable();
            $table->unsignedSmallInteger('height')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        $now = now();
        $rows = [
            ['Kementerian Perpaduan Negara (Ministry of National Unity)', 'foundingPatron', '/partners/ministry-national-unity.png', 363, 284],
            ['Chevening Alumni Malaysia', 'convenedBy', '/partners/chevening-alumni-malaysia.png', 274, 397],
            ['Koperasi Serbaguna Kebangsaan Berhad (NCMSP)', 'gold', '/partners/ncmsp.png', 480, 414],
            ['Perintis Akal', 'gold', '/partners/perintis-akal.png', 383, 368],
            ['Intramiles', 'gold', '/partners/intramiles.png', 560, 558],
            ['HEYA Inc.', 'marketing', '/partners/heya-inc.png', 560, 352],
        ];

        DB::table('sponsors')->insert(array_map(fn ($row, $i) => [
            'name' => $row[0],
            'tier' => $row[1],
            'logo' => $row[2],
            'width' => $row[3],
            'height' => $row[4],
            'sort_order' => $i,
            'created_at' => $now,
            'updated_at' => $now,
        ], $rows, array_keys($rows)));
    }

    public function down(): void
    {
        Schema::dropIfExists('sponsors');
    }
};
