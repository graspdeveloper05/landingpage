<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * The default seeder, run by a bare `php artisan db:seed`.
 *
 * Laravel shipped this file creating test@example.com with the factory's
 * password — the literal string "password". That is gone: every row in the
 * users table can sign into the admin panel, and a stray `migrate:fresh
 * --seed` would have left a guessable login open on a database holding 200
 * attendees' contact details.
 *
 * AdminSeeder replaces it with a known, documented, changeable account rather
 * than an accidental one. Same convenience, but it announces itself.
 */
class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // The shipped speakers, programme and event details. Safe to run on a
        // fresh database; see ContentSeeder for why it must not be run over
        // one the organising team has edited.
        $this->call(ContentSeeder::class);

        // The default panel login. See AdminSeeder — change it before handover.
        $this->call(AdminSeeder::class);
    }
}
