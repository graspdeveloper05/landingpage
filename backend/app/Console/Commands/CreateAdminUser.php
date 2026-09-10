<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Support\Facades\Validator;

/**
 * §15 — "At handover, provide administrator credentials."
 *
 * Creating the account from the command line rather than seeding a default
 * one: a seeded admin@example.com with a known password is a back door that
 * survives handover and gets forgotten.
 */
class CreateAdminUser extends Command
{
    protected $signature = 'dialogue:admin
                            {email : The organiser\'s email address}
                            {--name= : Their name, shown in the panel}
                            {--password= : Leave unset to have one generated}';

    protected $description = 'Create or update an admin account for the panel';

    public function handle(): int
    {
        $email = strtolower(trim($this->argument('email')));
        $generated = $this->option('password') === null;
        $password = $this->option('password') ?? Str::password(16);

        $validator = Validator::make(
            ['email' => $email, 'password' => $password],
            [
                'email' => ['required', 'email'],
                // A weak password here exposes every attendee's contact
                // details, so this is checked even when set by hand.
                'password' => ['required', Password::min(12)->letters()->numbers()],
            ],
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        $existing = User::where('email', $email)->first();

        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $this->option('name') ?? $existing?->name ?? 'Organiser',
                'password' => Hash::make($password),
            ],
        );

        $this->info($existing ? "Password reset for {$user->email}." : "Admin account created for {$user->email}.");

        if ($generated) {
            $this->newLine();
            $this->line('  Password: '.$password);
            $this->newLine();
            // Said plainly because it is about to scroll off the screen and
            // is not recoverable -- only a new one can be set.
            $this->warn('  Copy it now. It is hashed on save and cannot be shown again.');
        }

        return self::SUCCESS;
    }
}
