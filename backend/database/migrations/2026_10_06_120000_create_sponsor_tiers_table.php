<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The groups of the sponsors band, until now fixed in code, become rows the
 * team can add to, rename, reorder and remove. The five there were come in
 * with the same keys, so every sponsor stays in its group, and with the
 * names the site already shows.
 */
return new class extends Migration
{
    private const TIERS = [
        ['foundingPatron', ['en' => 'Founding Patron', 'ms' => 'Penaung Pengasas', 'zh' => '创始赞助人', 'ta' => 'நிறுவனப் புரவலர்']],
        ['convenedBy', ['en' => 'Convened By', 'ms' => 'Dianjurkan Oleh', 'zh' => '主办单位', 'ta' => 'ஏற்பாடு செய்பவர்']],
        ['gold', ['en' => 'Our Gold Sponsors', 'ms' => 'Penaja Emas Kami', 'zh' => '金级赞助商', 'ta' => 'எங்கள் தங்க ஆதரவாளர்கள்']],
        ['silver', ['en' => 'Our Silver Sponsors', 'ms' => 'Penaja Perak Kami', 'zh' => '银级赞助商', 'ta' => 'எங்கள் வெள்ளி ஆதரவாளர்கள்']],
        ['marketing', ['en' => 'Supporting Partners', 'ms' => 'Rakan Sokongan', 'zh' => '支持伙伴', 'ta' => 'ஆதரவு கூட்டாளர்கள்']],
    ];

    public function up(): void
    {
        if (! Schema::hasTable('sponsor_tiers')) {
            Schema::create('sponsor_tiers', function (Blueprint $table) {
                $table->id();
                // What a sponsor row points at; fixed once made, so renaming a
                // group never moves its sponsors.
                $table->string('key', 60)->unique();
                $table->json('name');
                $table->unsignedInteger('sort_order')->default(0);
                $table->timestamps();
            });
        }

        $now = now();
        foreach (self::TIERS as $position => [$key, $name]) {
            if (DB::table('sponsor_tiers')->where('key', $key)->exists()) {
                continue;
            }
            DB::table('sponsor_tiers')->insert([
                'key' => $key,
                'name' => json_encode($name, JSON_UNESCAPED_UNICODE),
                'sort_order' => $position,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('sponsor_tiers');
    }
};
