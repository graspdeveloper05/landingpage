<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A sponsor's website, entered in the panel. Where there is one, the logo on
 * the site opens it in a new tab; where there is none, the logo is just a
 * logo. Optional, because not every partner gives one.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sponsors', function (Blueprint $table) {
            $table->string('link', 300)->nullable()->after('logo');
        });
    }

    public function down(): void
    {
        Schema::table('sponsors', function (Blueprint $table) {
            $table->dropColumn('link');
        });
    }
};
