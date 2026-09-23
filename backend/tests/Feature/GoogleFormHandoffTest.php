<?php

namespace Tests\Feature;

use App\Models\EventSetting;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Site registrations handed to the script on the organising team's form. The
 * script is faked: no test reaches Google.
 */
class GoogleFormHandoffTest extends TestCase
{
    use RefreshDatabase;

    private const WEBAPP = 'https://script.google.com/macros/s/AKfycbTEST123/exec';

    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
        Mail::fake();
        config(['event.edition' => 2026, 'event.capacity' => 200]);
        EventSetting::create([
            'edition' => 2026, 'date' => '2026-10-08', 'start_time' => '13:30',
            'date_label' => ['en' => '8 Oct'], 'time_label' => ['en' => '1.30 PM'],
            'venue' => 'Muzium Negara', 'venue_address' => 'KL', 'maps_url' => 'x',
            'map_embed_url' => 'x', 'capacity' => 200, 'registration_open' => true,
            'google_sync_secret' => 'the-key',
            'google_webapp_url' => self::WEBAPP,
        ]);
    }

    private function register()
    {
        return $this->postJson('/api/registrations', [
            'fullName' => 'Aisyah Rahman',
            'email' => 'aisyah@example.com',
            'mobile' => '+60 12 345 6789',
            'organisation' => 'Universiti Malaya',
            'designation' => 'Lecturer',
            'cheveningScholar' => 'yes',
            'cheveningCohort' => '2019/20',
            'cheveningUniversity' => 'University of Edinburgh',
            'camMember' => 'no',
            'pdpaAccepted' => true,
        ]);
    }

    public function test_a_registration_is_handed_to_the_form(): void
    {
        Http::fake([self::WEBAPP => Http::response(['id' => 'resp-123'])]);

        $this->register()->assertCreated();

        $this->assertSame('resp-123', Registration::firstOrFail()->external_id);
        Http::assertSent(fn (Request $r) => $r->url() === self::WEBAPP
            && $r['key'] === 'the-key'
            && $r['registration']['fullName'] === 'Aisyah Rahman'
            && $r['registration']['cheveningScholar'] === 'Yes'
            && $r['registration']['cheveningCohort'] === '2019/20');
    }

    public function test_a_refusal_keeps_the_seat_and_can_be_sent_again(): void
    {
        Http::fake([self::WEBAPP => Http::sequence()
            ->push(['error' => 'Not authorised.'])
            ->push(['id' => 'resp-456'])]);

        $this->register()->assertCreated();
        $r = Registration::firstOrFail();
        $this->assertNull($r->external_id);

        $this->actingAs(User::factory()->create())
            ->postJson("/api/admin/registrations/{$r->reference}/google")
            ->assertOk();

        $this->assertSame('resp-456', $r->fresh()->external_id);
    }

    public function test_the_same_registration_coming_back_from_the_form_is_not_a_second_person(): void
    {
        Http::fake([self::WEBAPP => Http::response(['id' => 'resp-123'])]);
        $this->register()->assertCreated();

        // The form's trigger sends it back, without an email -- the form
        // cannot record one for a response the script created.
        $this->postJson('/api/integrations/google-form', ['responses' => [[
            'id' => 'resp-123',
            'submittedAt' => '2026-09-23T03:00:00Z',
            'email' => null,
            'items' => [['question' => 'Your Full Name (As Per I.C)', 'answer' => 'Aisyah Rahman']],
        ]]], ['X-Form-Key' => 'the-key'])->assertOk();

        $this->assertSame(1, Registration::count());
        $r = Registration::firstOrFail();
        $this->assertSame('aisyah@example.com', $r->email);
        $this->assertSame('website', $r->source);
    }

    public function test_only_a_google_script_address_is_accepted(): void
    {
        $this->actingAs(User::factory()->create());

        $this->putJson('/api/admin/google-form', ['webapp' => 'https://example.com/steal'])
            ->assertJsonValidationErrors(['webapp']);

        $this->putJson('/api/admin/google-form', ['webapp' => self::WEBAPP])
            ->assertOk()
            ->assertJson(['webapp' => self::WEBAPP]);
    }
}
