<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Attendance on the day. Guests check themselves in from a QR poster at the
 * entrance, or staff mark them in the admin panel.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->timestamp('checked_in_at')->nullable()->index();
            // 'self' (the poster) or 'staff' (the admin panel).
            $table->string('checked_in_via', 10)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->dropIndex(['checked_in_at']);
            $table->dropColumn(['checked_in_at', 'checked_in_via']);
        });
    }
};
