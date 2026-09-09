<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Str;

/**
 * Named under `dialogue:` rather than `event:` so it does not sit alongside
 * Laravel's own event:cache / event:clear commands and get mistaken for one.
 */
class GenerateAdminToken extends Command
{
    protected $signature = 'dialogue:token';

    protected $description = 'Generate a bearer token for the participant export';

    public function handle(): int
    {
        $token = Str::random(48);
        $base = rtrim((string) config('app.url'), '/');

        $this->newLine();
        $this->line('  Add to .env, then run: php artisan config:clear');
        $this->newLine();
        $this->line('  ADMIN_API_TOKEN=' . $token);
        $this->newLine();
        $this->comment('  Download the participant list:');
        $this->line('  curl -H "Authorization: Bearer ' . $token . '" \\');
        $this->line('       ' . $base . '/api/admin/registrations -o registrations.csv');
        $this->newLine();

        return self::SUCCESS;
    }
}
