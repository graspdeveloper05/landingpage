<?php

namespace Tests\Feature;

use App\Mail\RegistrationConfirmed;
use App\Models\EventSetting;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Registration stays open past the seat limit. The first N registrations
 * (N = capacity) are Confirmed; everyone after is Not confirmed, a waiting
 * list that moves up when a confirmed seat frees.
 */
class SeatStatusTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        Http::preventStrayRequests();
        config(['event.edition' => 2026]);
        EventSetting::create([
            'edition' => 2026, 'date' => now('Asia/Kuala_Lumpur')->addMonth()->toDateString(), 'start_time' => '13:30',
            'date_label' => ['en' => 'x'], 'time_label' => ['en' => 'x'],
            'venue' => 'Muzium Negara', 'venue_address' => 'KL', 'maps_url' => 'x',
            'map_embed_url' => 'x', 'capacity' => 2, 'registration_open' => true,
        ]);
    }

    private int $n = 0;

    private function register()
    {
        $n = ++$this->n;

        return $this->postJson('/api/registrations', [
            'fullName' => "Guest {$n}",
            'email' => "guest{$n}@example.com",
            'mobile' => '+60 12 345 67'.sprintf('%02d', $n),
            'organisation' => 'Org',
            'designation' => 'Role',
            'cheveningScholar' => 'no',
            'pdpaAccepted' => true,
        ]);
    }

    public function test_registration_stays_open_past_the_seat_limit(): void
    {
        $this->register()->assertCreated()->assertJsonPath('seatStatus', 'confirmed');
        $this->register()->assertCreated()->assertJsonPath('seatStatus', 'confirmed');
        $this->register()->assertCreated()->assertJsonPath('seatStatus', 'not_confirmed');

        $this->assertSame(3, Registration::count());
        $this->getJson('/api/event')->assertJsonPath('closedReason', null);
    }

    public function test_only_confirmed_seats_get_the_confirmation_email(): void
    {
        $this->register();
        $this->register();
        $this->register();

        Mail::assertSent(RegistrationConfirmed::class, 2);
        Mail::assertNotSent(RegistrationConfirmed::class, fn ($mail) => $mail->hasTo('guest3@example.com'));
    }

    public function test_the_admin_list_shows_each_status_and_the_counts(): void
    {
        $this->register();
        $this->register();
        $this->register();
        $admin = $this->actingAs(User::factory()->create());

        $admin->getJson('/api/admin/registrations/list')
            ->assertJsonPath('meta.confirmed', 2)
            ->assertJsonPath('meta.notConfirmed', 1)
            ->assertJsonFragment(['email' => 'guest3@example.com', 'seatStatus' => 'not_confirmed'])
            ->assertJsonFragment(['email' => 'guest1@example.com', 'seatStatus' => 'confirmed']);

        $admin->getJson('/api/admin/registrations/list?status=not_confirmed')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.email', 'guest3@example.com');

        $admin->getJson('/api/admin/registrations/list?status=confirmed')->assertJsonCount(2, 'data');
    }

    public function test_the_waiting_list_moves_up_when_a_seat_frees(): void
    {
        $this->register();
        $this->register();
        $this->register();
        $admin = $this->actingAs(User::factory()->create());

        $first = Registration::where('email', 'guest1@example.com')->firstOrFail();
        $admin->deleteJson("/api/admin/registrations/{$first->reference}")->assertSuccessful();

        $admin->getJson('/api/admin/registrations/list')
            ->assertJsonPath('meta.notConfirmed', 0)
            ->assertJsonFragment(['email' => 'guest3@example.com', 'seatStatus' => 'confirmed']);
    }

    public function test_raising_the_capacity_confirms_the_next_in_line(): void
    {
        $this->register();
        $this->register();
        $this->register();
        EventSetting::current()->update(['capacity' => 3]);

        $this->actingAs(User::factory()->create())
            ->getJson('/api/admin/registrations/list')
            ->assertJsonPath('meta.notConfirmed', 0);
    }

    public function test_the_export_has_a_status_column(): void
    {
        $this->register();
        $this->register();
        $this->register();

        $csv = $this->actingAs(User::factory()->create())
            ->get('/api/admin/registrations')->assertOk()->streamedContent();

        $this->assertStringContainsString('Status', strtok($csv, "\n"));
        $this->assertMatchesRegularExpression('/guest3@example\.com.*Not confirmed/', $csv);
        $this->assertMatchesRegularExpression('/guest1@example\.com.*,Confirmed/', $csv);
    }
}
