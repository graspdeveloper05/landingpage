<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * The default admin login, so the panel can be opened straight after a deploy
 * without running a second command.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  admin@serineg.com  /  admin@123
 * ─────────────────────────────────────────────────────────────────────────
 *
 * CHANGE IT BEFORE HANDOVER. These credentials are in the repository, so
 * anyone who can read the code can sign in, and signing in returns every
 * attendee's name, email and mobile number — personal data under the PDPA.
 * One command replaces it:
 *
 *     php artisan dialogue:admin real@address.com --name="Their Name"
 *     php artisan tinker --execute="App\Models\User::where('email','admin@serineg.com')->delete();"
 *
 * Values can also be overridden per server without touching this file, which
 * is the better habit:
 *
 *     ADMIN_EMAIL=you@example.com
 *     ADMIN_PASSWORD=something-long-and-not-in-git
 *
 * An existing account is never touched. The first version used
 * updateOrCreate, which meant that after the team changed the password, the
 * next `db:seed` silently put admin@123 back — the account would look
 * unchanged while quietly reverting to a credential published in the
 * repository. Creating only what is missing is the safe half of that.
 *
 * A forgotten password is reset with `php artisan dialogue:admin <email>`,
 * which is what that command is for.
 */
class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = (string) env('ADMIN_EMAIL', 'admin@serineg.com');
        $password = (string) env('ADMIN_PASSWORD', 'admin@123');

        $email = strtolower(trim($email));

        if (User::where('email', $email)->exists()) {
            $this->command?->info("Admin account already exists: {$email} — left as it is.");
            $this->command?->line('  To reset it: php artisan dialogue:admin '.$email);

            return;
        }

        User::create([
            'email' => $email,
            'name' => (string) env('ADMIN_NAME', 'Administrator'),
            'password' => Hash::make($password),
        ]);

        $this->command?->info("Admin login created: {$email}");

        // Said out loud, because a default credential is only dangerous once
        // everyone has stopped noticing it.
        if ($password === 'admin@123') {
            $this->command?->warn('  Password is the repository default. Change it before handover.');
        }
    }
}
