<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * §6 item 03 and §15 — the Organising Chairman, editable without a developer.
 *
 * Speakers and the programme moved into the database; the chairman did not.
 * He is one record with a different shape -- a welcome message and a pull
 * quote rather than a biography -- so he was left behind in a data file, and
 * changing his photograph meant a code change and a deploy. That was an
 * oversight rather than a decision.
 *
 * He lives on the edition rather than in a table of his own: there is exactly
 * one per edition, and 2027 will have its own.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('event_settings', function (Blueprint $table) {
            // All nullable, and the site falls back to the bundled data when
            // they are. An edition saved before this migration therefore
            // renders exactly as it did.
            $table->string('chairman_name')->nullable()->after('hero_image');
            $table->string('chairman_organisation')->nullable()->after('chairman_name');
            $table->json('chairman_designation')->nullable()->after('chairman_organisation');
            $table->json('chairman_message')->nullable()->after('chairman_designation');
            $table->json('chairman_quote')->nullable()->after('chairman_message');
            $table->string('chairman_portrait')->nullable()->after('chairman_quote');
        });

        /*
         * Backfilled from src/data/editions/2026/speakers.ts as it stands, so
         * the admin form opens showing what the visitor currently sees.
         *
         * Every word of it is marked `placeholder: true` in that file -- the
         * name, the organisation and both quotations are invented. Copying
         * them here does not make them true; it makes them editable, which is
         * the point. They still have to be replaced before launch, and the
         * checklist in the manual says so.
         */
        DB::table('event_settings')->whereNull('chairman_name')->update([
            'chairman_name' => 'Dato’ Rahman bin Abdullah',
            'chairman_organisation' => 'Chevening Alumni Malaysia',
            'chairman_designation' => json_encode([
                'en' => 'Organising Chairman, Seri Negara Dialogue 2026',
                'ms' => 'Pengerusi Penganjur, Dialog Seri Negara 2026',
                'zh' => '2026 年斯里尼加拉对话筹委会主席',
                'ta' => 'ஏற்பாட்டுத் தலைவர், சேரி நெகாரா உரையாடல் 2026',
            ], JSON_UNESCAPED_UNICODE),
            'chairman_message' => json_encode([
                'en' => 'This Dialogue is an invitation — for all of us — to reflect, to listen, and to shape a stronger Malaysia together.',
                'ms' => 'Dialog ini adalah jemputan — untuk kita semua — agar merenung, mendengar, dan membina Malaysia yang lebih kukuh bersama-sama.',
                'zh' => '这场对话是一份邀请——邀请我们每一个人一同反思、聆听，携手塑造更强大的马来西亚。',
                'ta' => 'இந்த உரையாடல் நம் அனைவருக்குமான ஓர் அழைப்பு — சிந்திக்கவும், கேட்கவும், வலிமையான மலேசியாவை இணைந்து உருவாக்கவும்.',
            ], JSON_UNESCAPED_UNICODE),
            'chairman_quote' => json_encode([
                'en' => 'A more united and progressive Malaysia is a future we can build together.',
                'ms' => 'Malaysia yang lebih bersatu dan progresif ialah masa depan yang boleh kita bina bersama.',
                'zh' => '一个更团结、更进步的马来西亚，是我们能够共同建构的未来。',
                'ta' => 'மேலும் ஒற்றுமையான, முன்னேற்றமான மலேசியா — நாம் இணைந்து கட்டியெழுப்பக்கூடிய எதிர்காலம்.',
            ], JSON_UNESCAPED_UNICODE),
            // Empty rather than the generated stand-in's path, so the site's
            // own placeholder logic decides what to draw -- one rule for a
            // missing photograph, shared with the speakers.
            'chairman_portrait' => '',
        ]);
    }

    public function down(): void
    {
        Schema::table('event_settings', function (Blueprint $table) {
            $table->dropColumn([
                'chairman_name', 'chairman_organisation', 'chairman_designation',
                'chairman_message', 'chairman_quote', 'chairman_portrait',
            ]);
        });
    }
};
