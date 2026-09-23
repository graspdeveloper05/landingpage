<?php

namespace Tests\Feature;

use App\Models\EventSetting;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Responses arriving from the organising team's Google Form, as the script on
 * that form sends them -- the client's own questions, their wording.
 */
class GoogleFormIntakeTest extends TestCase
{
    use RefreshDatabase;

    private const KEY = 'test-key-value';

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        config(['event.edition' => 2026, 'event.capacity' => 200]);
        EventSetting::create([
            'edition' => 2026, 'date' => '2026-10-08', 'start_time' => '13:30',
            'date_label' => ['en' => '8 Oct'], 'time_label' => ['en' => '1.30 PM'],
            'venue' => 'Muzium Negara', 'venue_address' => 'KL', 'maps_url' => 'x',
            'map_embed_url' => 'x', 'capacity' => 200, 'registration_open' => true,
            'google_sync_secret' => self::KEY,
        ]);
    }

    private function response(string $id, string $name, string $email, array $extra = []): array
    {
        return [
            'id' => $id,
            'submittedAt' => '2026-09-20T03:15:00Z',
            'email' => $email,
            'items' => [
                ['question' => 'Your Full Name (As Per I.C) ', 'answer' => $name],
                ['question' => 'Your Mobile Contact (+60-xx-xxxxxxxxx)', 'answer' => '+60 12 345 6789'],
                ['question' => 'Current Affiliation', 'answer' => 'Universiti Malaya'],
                ['question' => 'Position', 'answer' => 'Lecturer'],
                ['question' => 'Dietary Restriction ', 'answer' => 'Vegetarian'],
                ['question' => 'Are you a Chevening scholar? ', 'answer' => 'Yes'],
                ['question' => 'Your Chevening Cohort (e.g: 2021/20)', 'answer' => '2019/20'],
                ['question' => 'What is your biggest challenge? (Optional)', 'answer' => ''],
                ...$extra,
            ],
        ];
    }

    private function send(array $responses, string $key = self::KEY)
    {
        return $this->postJson('/api/integrations/google-form', ['responses' => $responses], ['X-Form-Key' => $key]);
    }

    public function test_a_response_becomes_a_registration(): void
    {
        $this->send([$this->response('g-1', 'Aisyah Rahman', 'aisyah@example.com')])
            ->assertOk()
            ->assertJson(['created' => 1, 'updated' => 0]);

        $r = Registration::firstOrFail();
        $this->assertSame('Aisyah Rahman', $r->full_name);
        $this->assertSame('aisyah@example.com', $r->email);
        $this->assertSame('Universiti Malaya', $r->organisation);
        $this->assertSame('Vegetarian', $r->dietary);
        $this->assertSame('google_form', $r->source);
        $this->assertSame('SND26-0001', $r->reference);
        // Not asked on their form, so not claimed either way.
        $this->assertNull($r->pdpa_accepted);
        // Stamped with when they filled it in, not when it reached us.
        $this->assertSame('2026-09-20 03:15:00', $r->created_at->utc()->format('Y-m-d H:i:s'));
        // Their other questions are kept as asked; blank answers are not.
        $this->assertSame([
            'Are you a Chevening scholar?' => 'Yes',
            'Your Chevening Cohort (e.g: 2021/20)' => '2019/20',
        ], $r->answers);
    }

    public function test_the_catch_up_can_be_run_again(): void
    {
        $batch = [
            $this->response('g-1', 'Aisyah Rahman', 'aisyah@example.com'),
            $this->response('g-2', 'Wei Ling Tan', 'weiling@example.com'),
        ];
        $this->send($batch)->assertJson(['created' => 2]);
        $this->send($batch)->assertJson(['created' => 0, 'updated' => 2]);

        $this->assertSame(2, Registration::count());
        $this->assertSame(['SND26-0001', 'SND26-0002'], Registration::orderBy('id')->pluck('reference')->all());
    }

    public function test_somebody_who_registered_here_is_not_listed_twice(): void
    {
        $this->postJson('/api/registrations', [
            'fullName' => 'Aisyah Rahman',
            'email' => 'aisyah@example.com',
            'mobile' => '+60 12 345 6789',
            'organisation' => 'Universiti Malaya',
            'designation' => 'Lecturer',
            'cheveningScholar' => 'no',
            'pdpaAccepted' => true,
        ])->assertCreated();

        $this->send([$this->response('g-1', 'Aisyah Rahman', 'AISYAH@example.com')])
            ->assertJson(['created' => 0, 'updated' => 1]);

        $r = Registration::firstOrFail();
        $this->assertSame(1, Registration::count());
        // Still theirs: the reference and confirmation belong to this row.
        $this->assertSame('website', $r->source);
        $this->assertTrue((bool) $r->pdpa_accepted);
    }

    public function test_a_wrong_or_missing_key_is_refused(): void
    {
        $this->send([$this->response('g-1', 'X', 'x@example.com')], 'wrong')->assertStatus(401);
        $this->postJson('/api/integrations/google-form', [
            'responses' => [$this->response('g-1', 'X', 'x@example.com')],
        ])->assertStatus(401);
        $this->assertSame(0, Registration::count());
    }

    public function test_intake_is_off_until_a_key_is_issued(): void
    {
        EventSetting::find(2026)->forceFill(['google_sync_secret' => null])->save();

        $this->send([$this->response('g-1', 'X', 'x@example.com')], '')->assertStatus(503);
    }

    public function test_the_panel_issues_the_script_with_its_key(): void
    {
        $this->actingAs(User::factory()->create());

        $script = $this->getJson('/api/admin/google-form/script')->assertOk()->json('script');

        $this->assertStringContainsString(self::KEY, $script);
        $this->assertStringContainsString('/api/integrations/google-form', $script);
        $this->assertStringContainsString('function setup()', $script);

        // Re-issuing invalidates the key an old copy of the script carries.
        $reissued = $this->getJson('/api/admin/google-form/script?reissue=1')->json('script');
        $this->assertStringNotContainsString(self::KEY, $reissued);
        $this->send([$this->response('g-1', 'X', 'x@example.com')])->assertStatus(401);
    }
}
