<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('registrations', function (Blueprint $table) {
            $table->id();

            // Shown to the attendee and asked for at the door, e.g. SND26-0001.
            $table->string('reference', 20)->unique();

            // §9 — exactly the fields the brief lists, and no more.
            $table->string('full_name');
            $table->string('email');
            $table->string('mobile', 32);
            $table->string('organisation');
            $table->string('designation');
            $table->string('dietary')->nullable();

            // §12 — evidence of PDPA consent, with when and which wording.
            $table->boolean('pdpa_accepted');
            $table->timestamp('pdpa_accepted_at')->nullable();

            // Which edition this belongs to, so 2027 can share the table.
            $table->unsignedSmallInteger('edition')->index();

            // Kept for abuse investigation only; see the retention note in
            // the privacy notice before extending what is stored here.
            $table->ipAddress('ip_address')->nullable();
            $table->string('user_agent', 512)->nullable();

            $table->timestamp('confirmation_sent_at')->nullable();
            $table->timestamps();

            // One seat per email per edition. The brief caps attendance at
            // ~200, so duplicate sign-ups would quietly eat the allocation.
            $table->unique(['email', 'edition']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registrations');
    }
};
