<?php

namespace Tests\Feature;

use App\Models\EventSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** The Organising Chairman's LinkedIn profile, set in the panel and linked on the site. */
class ChairmanLinkedInTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['event.edition' => 2026]);
        EventSetting::create([
            'edition' => 2026, 'date' => '2026-10-08', 'start_time' => '13:30',
            'date_label' => ['en' => '8 October 2026'], 'time_label' => ['en' => '1.30 PM'],
            'venue' => 'Auditorium Jabatan Muzium Negara', 'venue_address' => 'Jalan Damansara',
            'maps_url' => 'https://maps.example/muzium', 'map_embed_url' => 'x',
            'capacity' => 600, 'registration_open' => true,
        ]);
    }

    /** A complete chairman, as the panel sends him. */
    private function save(array $overrides = [])
    {
        $four = fn (string $text) => ['en' => $text, 'ms' => $text, 'zh' => $text, 'ta' => $text];

        return $this->actingAs(User::factory()->create())->putJson('/api/admin/chairman', [
            'name' => 'Dr. Vighneswaran N. Vithiatharan',
            'organisation' => 'Chevening Alumni Malaysia',
            'designation' => $four('Organising Chairman, Seri Negara Dialogue'),
            'message' => $four('Welcome.'),
            'quote' => $four('A national conversation.'),
            'portrait' => '',
            ...$overrides,
        ]);
    }

    public function test_a_linkedin_link_is_saved_and_reaches_the_site(): void
    {
        $this->save(['linkedin' => 'https://www.linkedin.com/in/vighneswaran'])
            ->assertOk()
            ->assertJsonPath('chairman.linkedin', 'https://www.linkedin.com/in/vighneswaran');

        $this->getJson('/api/event')
            ->assertJsonPath('chairman.linkedin', 'https://www.linkedin.com/in/vighneswaran');
    }

    public function test_the_link_is_optional(): void
    {
        $this->save(['linkedin' => ''])->assertOk()->assertJsonPath('chairman.linkedin', null);
    }

    public function test_a_link_typed_without_https_gets_it(): void
    {
        $this->save(['linkedin' => 'linkedin.com/in/vighneswaran'])
            ->assertOk()
            ->assertJsonPath('chairman.linkedin', 'https://linkedin.com/in/vighneswaran');
    }

    public function test_only_a_linkedin_address_is_taken(): void
    {
        // It becomes a link on the public site: nothing but LinkedIn, and
        // never javascript: or another site dressed up as one.
        foreach ([
            'https://example.com/in/someone',
            'https://linkedin.com.evil.example/in/x',
            'javascript:alert(1)',
        ] as $link) {
            $this->save(['linkedin' => $link])->assertUnprocessable()->assertJsonValidationErrors('linkedin');
        }
    }

    public function test_a_save_that_leaves_the_link_out_keeps_it(): void
    {
        // An older panel tab that knows nothing of the field must not clear it.
        $this->save(['linkedin' => 'https://www.linkedin.com/in/vighneswaran'])->assertOk();

        $this->save()->assertOk()->assertJsonPath('chairman.linkedin', 'https://www.linkedin.com/in/vighneswaran');
    }
}
