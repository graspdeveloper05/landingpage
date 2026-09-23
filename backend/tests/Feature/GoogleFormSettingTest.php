<?php

namespace Tests\Feature;

use App\Models\EventSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Setting the Google Form from the panel. Google is faked with a page shaped
 * like a real form's, so no test reaches the network.
 */
class GoogleFormSettingTest extends TestCase
{
    use RefreshDatabase;

    private const ID = '1FAIpQLSfakeFakeFakeFakeFakeFakeFake';

    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
        config(['event.edition' => 2026]);
        EventSetting::create([
            'edition' => 2026, 'date' => '2026-10-08', 'start_time' => '13:30',
            'date_label' => ['en' => '8 Oct'], 'time_label' => ['en' => '1.30 PM'],
            'venue' => 'Muzium Negara', 'venue_address' => 'KL', 'maps_url' => 'x',
            'map_embed_url' => 'x', 'capacity' => 200, 'registration_open' => true,
        ]);
        $this->actingAs(User::factory()->create());
    }

    /** A question as Google's page data lists it. */
    private function q(string $title, int $entry, bool $required = true, ?array $options = null): array
    {
        $opts = $options ? array_map(fn ($o) => [$o, null, null, null, 0], $options) : null;

        return [1, $title, null, $options ? 2 : 0, [[$entry, $opts, $required ? 1 : 0]]];
    }

    private function page(array $items, bool $email = true): string
    {
        $data = json_encode([null, [null, $items]]);

        return '<form action="https://docs.google.com/forms/d/e/'.self::ID.'/formResponse">'
            .($email ? '<div>Your email</div>' : '')
            .'<script>var FB_PUBLIC_LOAD_DATA_ = '.$data.';</script>';
    }

    private function teamForm(array $extra = []): array
    {
        return [
            $this->q('Your Full Name (As Per I.C)', 11),
            $this->q('Your Mobile Contact (+60-xx-xxxxxxxxx)', 12),
            $this->q('Current Affiliation', 13),
            $this->q('Position', 14),
            $this->q('Dietary Restriction', 15),
            $this->q('Are you a Chevening scholar?', 16, true, ['Yes', 'No']),
            [2, 'Chevening Alumni Details', null, 8, null],
            $this->q('Your Chevening Cohort (e.g: 2021/20)', 17),
            $this->q('Your University (Under Chevening Scholarship)', 18),
            $this->q('Are you a CAM Member?', 19, true, ['Yes', 'No']),
            ...$extra,
        ];
    }

    private function save(string $html, string $url = 'https://forms.gle/abc')
    {
        Http::fake(['*' => Http::response($html)]);

        return $this->putJson('/api/admin/google-form', ['url' => $url]);
    }

    public function test_a_form_is_read_and_the_site_sends_to_it(): void
    {
        $this->save($this->page($this->teamForm()))
            ->assertOk()
            ->assertJson(['url' => 'https://forms.gle/abc', 'matched' => 9]);

        $form = $this->getJson('/api/event')->assertOk()->json('googleForm');
        $this->assertSame(self::ID, $form['id']);
        $this->assertSame(11, $form['entries']['fullName']);
        $this->assertSame(16, $form['entries']['cheveningScholar']);
        $this->assertSame(18, $form['entries']['cheveningUniversity']);
        $this->assertSame(0, $form['pages']['cheveningScholar']);
        $this->assertSame(1, $form['pages']['camMember']);
    }

    public function test_a_required_question_on_an_unreached_page_does_not_block(): void
    {
        // The team's real form has an "Essay Application" page nobody reaches.
        $this->save($this->page($this->teamForm([
            [3, 'Essay Application', null, 8, null],
            $this->q('Are you planning to apply for the 2027/2028 Chevening Scholarship?', 20, true, ['Yes', 'No']),
        ])))->assertOk();
    }

    public function test_a_required_question_the_site_cannot_answer_is_refused(): void
    {
        $this->save($this->page([...$this->teamForm(), $this->q('Your IC number', 30)]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['url' => 'Your IC number']);

        $this->assertSame(0, EventSetting::find(2026)->google_form ? 1 : 0);
    }

    public function test_a_form_without_the_dietary_question_is_still_accepted(): void
    {
        // The site stopped asking for dietary requirements, so their form is
        // free to drop the question; everything else it must still have.
        $items = array_values(array_filter($this->teamForm(), fn ($i) => ($i[1] ?? '') !== 'Dietary Restriction'));

        $this->save($this->page($items))->assertOk()->assertJson(['matched' => 8]);
        $this->assertArrayNotHasKey('dietary', $this->getJson('/api/event')->json('googleForm.entries'));
    }

    public function test_a_missing_question_is_named(): void
    {
        $items = array_values(array_filter($this->teamForm(), fn ($i) => ($i[1] ?? '') !== 'Position'));

        $this->save($this->page($items))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['url' => 'position']);
    }

    public function test_an_edit_link_or_other_site_is_refused_without_fetching(): void
    {
        Http::fake();
        $this->putJson('/api/admin/google-form', ['url' => 'https://docs.google.com/forms/d/abc/edit'])
            ->assertJsonValidationErrors(['url' => 'editing link']);
        $this->putJson('/api/admin/google-form', ['url' => 'https://example.com/form'])
            ->assertJsonValidationErrors(['url' => 'Google Form link']);
        Http::assertNothingSent();
    }

    public function test_an_empty_link_switches_copying_off(): void
    {
        $this->save($this->page($this->teamForm()))->assertOk();

        $this->putJson('/api/admin/google-form', ['url' => null])
            ->assertOk()
            ->assertJson(['url' => null, 'matched' => 0]);

        $this->assertNull($this->getJson('/api/event')->json('googleForm'));
    }
}
