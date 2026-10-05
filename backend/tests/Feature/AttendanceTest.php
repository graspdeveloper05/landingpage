<?php

namespace Tests\Feature;

use App\Models\EventSetting;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Self check-in at the door, and the organisers' attendance tracker. */
class AttendanceTest extends TestCase
{
    use RefreshDatabase;

    private Registration $guest;

    protected function setUp(): void
    {
        parent::setUp();
        config(['event.edition' => 2026]);
        EventSetting::create([
            'edition' => 2026, 'date' => '2026-10-08', 'start_time' => '13:30',
            'date_label' => ['en' => '8 Oct'], 'time_label' => ['en' => '1.30 PM'],
            'venue' => 'Muzium Negara', 'venue_address' => 'KL', 'maps_url' => 'x',
            'map_embed_url' => 'x', 'capacity' => 200, 'registration_open' => true,
            'checkin_open' => true,
        ]);
        $this->guest = $this->registration(['full_name' => 'Aisyah Rahman', 'email' => 'aisyah@example.com', 'mobile' => '+60 12 345 6789']);
    }

    private int $n = 0;

    private function registration(array $attrs = []): Registration
    {
        $n = ++$this->n;

        return Registration::create($attrs + [
            'reference' => sprintf('SND26-%04d', $n),
            'full_name' => "Guest {$n}",
            'email' => "guest{$n}@example.com",
            'mobile' => sprintf('+60 13 000 00%02d', $n),
            'organisation' => 'Org',
            'designation' => 'Role',
            'pdpa_accepted' => true,
            'edition' => 2026,
        ]);
    }

    private function admin()
    {
        return $this->actingAs(User::factory()->create());
    }

    /* Public ---------------------------------------------------------------- */

    public function test_a_registered_guest_checks_in_by_email_or_mobile(): void
    {
        $this->postJson('/api/checkin', ['contact' => 'Aisyah@Example.com'])
            ->assertOk()
            ->assertJsonPath('fullName', 'Aisyah Rahman')
            ->assertJsonPath('reference', 'SND26-0001')
            ->assertJsonPath('alreadyCheckedIn', false)
            ->assertJsonMissingPath('email');

        $this->assertNotNull($this->guest->fresh()->checked_in_at);
        $this->assertSame('self', $this->guest->fresh()->checked_in_via);
    }

    public function test_checking_in_twice_keeps_the_first_arrival_time(): void
    {
        $this->postJson('/api/checkin', ['contact' => '012 345 6789'])->assertOk();
        $first = $this->guest->fresh()->checked_in_at;

        $this->travel(30)->minutes();

        $this->postJson('/api/checkin', ['contact' => 'aisyah@example.com'])
            ->assertOk()
            ->assertJsonPath('alreadyCheckedIn', true);
        $this->assertEquals($first, $this->guest->fresh()->checked_in_at);
    }

    public function test_an_unregistered_contact_is_user_not_found(): void
    {
        $this->postJson('/api/checkin', ['contact' => 'nobody@example.com'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'User not found.');
    }

    public function test_check_in_refuses_while_closed(): void
    {
        EventSetting::current()->update(['checkin_open' => false]);

        $this->getJson('/api/checkin')->assertOk()->assertJsonPath('open', false);
        $this->postJson('/api/checkin', ['contact' => 'aisyah@example.com'])->assertStatus(423);
        $this->assertNull($this->guest->fresh()->checked_in_at);
    }

    public function test_check_in_is_exempt_from_csrf_like_the_rsvp_form(): void
    {
        $excluded = app(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)->getExcludedPaths();

        $this->assertContains('api/checkin', $excluded);
    }

    /* Admin ----------------------------------------------------------------- */

    public function test_attendance_needs_a_session(): void
    {
        $this->getJson('/api/admin/attendance')->assertUnauthorized();
    }

    public function test_the_tracker_counts_and_filters_arrivals(): void
    {
        $this->registration(['full_name' => 'Raj Kumar']);
        $this->registration(['full_name' => 'Mei Ling']);
        $this->guest->update(['checked_in_at' => now(), 'checked_in_via' => 'self']);

        $this->admin()->getJson('/api/admin/attendance')
            ->assertOk()
            ->assertJsonPath('meta.registered', 3)
            ->assertJsonPath('meta.arrived', 1)
            ->assertJsonPath('meta.checkinOpen', true)
            ->assertJsonCount(3, 'data');

        $this->getJson('/api/admin/attendance?filter=arrived')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.fullName', 'Aisyah Rahman')
            ->assertJsonPath('data.0.checkedInVia', 'self');

        $this->getJson('/api/admin/attendance?filter=waiting')->assertJsonCount(2, 'data');
        $this->getJson('/api/admin/attendance?search=raj')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.fullName', 'Raj Kumar');
    }

    public function test_staff_can_mark_someone_arrived_and_undo_it(): void
    {
        $ref = $this->guest->reference;

        $this->admin()->postJson("/api/admin/attendance/{$ref}")->assertOk();
        $this->assertSame('staff', $this->guest->fresh()->checked_in_via);

        $this->deleteJson("/api/admin/attendance/{$ref}")->assertOk();
        $this->assertNull($this->guest->fresh()->checked_in_at);
        $this->assertNull($this->guest->fresh()->checked_in_via);
    }

    public function test_staff_open_and_close_check_in(): void
    {
        $this->admin()->putJson('/api/admin/attendance/settings', ['checkinOpen' => false])
            ->assertOk()
            ->assertJsonPath('checkinOpen', false);

        $this->assertFalse(EventSetting::current()->checkin_open);
    }

    public function test_the_export_lists_everyone_with_their_arrival(): void
    {
        $this->registration(['full_name' => 'Raj Kumar']);
        $this->guest->update(['checked_in_at' => now(), 'checked_in_via' => 'self']);

        $csv = $this->admin()->get('/api/admin/attendance/export')->assertOk()->streamedContent();

        $this->assertStringContainsString('Reference,Name,Email,Mobile,Organisation,Arrived,"Arrived at","Checked in by"', $csv);
        $this->assertStringContainsString('SND26-0001,"Aisyah Rahman",aisyah@example.com', $csv);
        $this->assertMatchesRegularExpression('/"Raj Kumar".*,No,,/', $csv);
    }
}
