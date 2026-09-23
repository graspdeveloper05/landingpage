<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The organising team's form refuses a submission sent to it from another
 * website -- it sits in a Google Workspace, which Google locks down further
 * than a personal form. So site registrations are handed to the script on
 * that form instead, deployed as a web app, and the script adds them using
 * Google's own tools. This is where the panel keeps that web app's address.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('event_settings', function (Blueprint $table) {
            $table->string('google_webapp_url', 300)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('event_settings', function (Blueprint $table) {
            $table->dropColumn('google_webapp_url');
        });
    }
};
