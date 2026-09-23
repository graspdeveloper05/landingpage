<?php

namespace Tests\Feature;

use App\Models\Sponsor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** A sponsor's website link, set in the panel and shown on the site. */
class SponsorLinkTest extends TestCase
{
    use RefreshDatabase;

    private function save(array $overrides = [])
    {
        $sponsor = Sponsor::create([
            'name' => 'Intramiles', 'tier' => 'gold', 'logo' => '/partners/intramiles.png', 'sort_order' => 99,
        ]);

        return $this->actingAs(User::factory()->create())->putJson("/api/admin/sponsors/{$sponsor->id}", [
            'name' => 'Intramiles', 'tier' => 'gold', 'logo' => '/partners/intramiles.png',
            ...$overrides,
        ]);
    }

    public function test_a_link_is_saved_and_reaches_the_site(): void
    {
        $this->save(['link' => 'https://www.intramiles.com'])->assertOk();

        $this->assertContains(
            'https://www.intramiles.com',
            array_column($this->getJson('/api/sponsors')->json(), 'link'),
        );
    }

    public function test_the_link_is_optional(): void
    {
        $this->save(['link' => null])->assertOk()->assertJson(['link' => null]);
    }

    public function test_only_web_addresses_are_accepted(): void
    {
        // It becomes a link on the public site; javascript: must never.
        $this->save(['link' => 'javascript:alert(1)'])->assertJsonValidationErrors(['link']);
        $this->save(['link' => 'intramiles.com'])->assertJsonValidationErrors(['link']);
    }
}
