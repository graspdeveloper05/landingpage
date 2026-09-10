<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * The default seeder, run by a bare `php artisan db:seed`.
 *
 * NO ADMIN ACCOUNT IS SEEDED, here or anywhere. Accounts are created one at a
 * time with `php artisan dialogue:admin`, which generates a strong password
 * and prints it once.
 *
 * That is not fussiness. Laravel ships this file creating
 * test@example.com with the factory's password — the literal string
 * "password" — and every row in the users table can sign into the admin
 * panel, which returns 200 attendees' names, emails and mobile numbers. Any
 * `db:seed` or `migrate:fresh --seed` run on the server while debugging would
 * have opened that door and left it open, looking like stock framework code
 * the whole time.
 *
 * deploy.sh only ever calls ContentSeeder by name, so it never triggered this
 * — but a landmine that needs a deploy script to keep avoiding it is still a
 * landmine.
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
    }
}
