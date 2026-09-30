<?php

namespace Tests\Feature;

use App\Mail\RegistrationConfirmed;
use App\Models\EventSetting;
use App\Models\Registration;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** The confirmation email an attendee receives after registering on the site. */
class ConfirmationEmailTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_carries_the_details_as_edited_in_the_panel(): void
    {
        config(['event.edition' => 2026, 'event.venue' => 'The venue the code shipped with']);
        EventSetting::create([
            'edition' => 2026, 'date' => '2026-10-08', 'start_time' => '13:30',
            'date_label' => ['en' => '8 October 2026 (Thursday)'],
            'time_label' => ['en' => '1.30 PM onwards'],
            'venue' => 'Auditorium Jabatan Muzium Negara', 'venue_address' => 'Jalan Damansara, 50566 Kuala Lumpur',
            'maps_url' => 'https://maps.example/muzium', 'map_embed_url' => 'x',
            'capacity' => 600, 'registration_open' => true,
        ]);
        $registration = Registration::create([
            'reference' => 'SND26-0002', 'full_name' => 'Aisyah Rahman', 'email' => 'aisyah@example.com',
            'mobile' => '+60 12 345 6789', 'organisation' => 'UM', 'designation' => 'Lecturer',
            'pdpa_accepted' => true, 'edition' => 2026,
        ]);

        $html = (new RegistrationConfirmed($registration))->render();

        $this->assertStringContainsString('SND26-0002', $html);
        $this->assertStringContainsString('Aisyah Rahman', $html);
        $this->assertStringContainsString('8 October 2026 (Thursday)', $html);
        $this->assertStringContainsString('1.30 PM onwards', $html);
        $this->assertStringContainsString('Auditorium Jabatan Muzium Negara', $html);
        $this->assertStringNotContainsString('The venue the code shipped with', $html);
        $this->assertStringContainsString('https://maps.example/muzium', $html);
    }
}
