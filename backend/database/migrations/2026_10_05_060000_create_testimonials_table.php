<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Participant testimonials, kept apart from the feedback answers. Each waits
 * for the team's review and appears on the homepage only once approved.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('testimonials', function (Blueprint $table) {
            $table->id();
            $table->text('quote');
            // anonymous | first_name | full_name | full_name_org
            $table->string('credit', 20)->default('anonymous');
            $table->string('name', 120)->nullable();
            $table->string('organisation', 150)->nullable();
            // pending | approved | hidden
            $table->string('status', 10)->default('pending')->index();
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('testimonials');
    }
};
