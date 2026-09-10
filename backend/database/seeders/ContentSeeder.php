<?php

namespace Database\Seeders;

use App\Models\ProgrammeItem;
use App\Models\Speaker;
use Illuminate\Database\Seeder;

/**
 * Imports the speakers and programme from the config files they used to live
 * in, so moving to the database costs nobody a retype.
 *
 * updateOrCreate, not create: this seeder is safe to run on every deploy. It
 * fills an empty table on the first run and, on a server where the team has
 * since edited a speaker, it would overwrite their work -- which is why
 * deploy.sh runs it only when the table is empty. Run by hand it is a
 * deliberate reset to the shipped content.
 */
class ContentSeeder extends Seeder
{
    public function run(): void
    {
        foreach (array_values(config('speakers.list', [])) as $i => $speaker) {
            Speaker::updateOrCreate(
                ['id' => $speaker['id']],
                [
                    'name' => $speaker['name'],
                    'designation' => $speaker['designation'],
                    'organisation' => $speaker['organisation'],
                    'portrait' => $speaker['portrait'],
                    'bio' => $speaker['bio'],
                    'link' => $speaker['link'] ?? null,
                    'role' => $speaker['role'] ?? 'speaker',
                    'placeholder' => (bool) ($speaker['placeholder'] ?? false),
                    // Config order was the running order. Nothing else records
                    // it, so it has to be captured here or the grid reshuffles.
                    'sort_order' => $i,
                ],
            );
        }

        foreach (array_values(config('programme.list', [])) as $i => $item) {
            ProgrammeItem::updateOrCreate(
                ['id' => $item['id']],
                [
                    'time' => $item['time'],
                    'title' => $item['title'],
                    'detail' => $item['detail'] ?? null,
                    'placeholder' => (bool) ($item['placeholder'] ?? false),
                    'sort_order' => $i,
                ],
            );
        }
    }
}
