<?php

namespace Tests\Feature;

use App\Models\Testimonial;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Participant testimonials: stored apart from the feedback, reviewed by the
 * team, and only the approved ones shown on the homepage.
 */
class TestimonialTest extends TestCase
{
    use RefreshDatabase;

    private function admin()
    {
        return $this->actingAs(User::factory()->create());
    }

    private function testimonial(array $attrs = []): Testimonial
    {
        return Testimonial::create($attrs + [
            'quote' => 'A rare space to talk honestly.',
            'credit' => 'full_name_org',
            'name' => 'Aisyah Rahman',
            'organisation' => 'Universiti Malaya',
        ]);
    }

    public function test_a_new_testimonial_waits_for_review(): void
    {
        $this->assertSame('pending', $this->testimonial()->fresh()->status);
        $this->getJson('/api/testimonials')->assertOk()->assertExactJson([]);
    }

    /** @dataProvider credits */
    public function test_only_approved_testimonials_are_public_credited_as_chosen(string $credit, string $shown): void
    {
        $this->testimonial(['credit' => $credit, 'status' => 'approved']);
        $this->testimonial(['quote' => 'Hidden one', 'status' => 'hidden']);

        $this->getJson('/api/testimonials')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.quote', 'A rare space to talk honestly.')
            ->assertJsonPath('0.attribution', $shown)
            ->assertJsonMissingPath('0.name');
    }

    public static function credits(): array
    {
        return [
            'anonymous' => ['anonymous', 'Anonymous participant'],
            'first name' => ['first_name', 'Aisyah'],
            'full name' => ['full_name', 'Aisyah Rahman'],
            'full name and organisation' => ['full_name_org', 'Aisyah Rahman, Universiti Malaya'],
        ];
    }

    public function test_public_order_follows_display_order(): void
    {
        $this->testimonial(['quote' => 'Second', 'status' => 'approved', 'display_order' => 1]);
        $this->testimonial(['quote' => 'First', 'status' => 'approved', 'display_order' => 0]);

        $this->getJson('/api/testimonials')->assertJsonPath('0.quote', 'First')->assertJsonPath('1.quote', 'Second');
    }

    public function test_admin_endpoints_need_a_session(): void
    {
        $this->getJson('/api/admin/testimonials')->assertUnauthorized();
    }

    public function test_the_team_adds_reviews_edits_and_removes_testimonials(): void
    {
        $id = $this->admin()->postJson('/api/admin/testimonials', [
            'quote' => 'It changed how I see my neighbours.',
            'credit' => 'first_name',
            'name' => 'Raj Kumar',
        ])->assertCreated()->assertJsonPath('status', 'pending')->json('id');

        $this->putJson("/api/admin/testimonials/{$id}", [
            'quote' => 'It changed how I see my neighbours!',
            'credit' => 'first_name',
            'name' => 'Raj Kumar',
            'status' => 'approved',
        ])->assertOk()->assertJsonPath('status', 'approved');

        $this->getJson('/api/testimonials')->assertJsonPath('0.attribution', 'Raj');
        $this->getJson('/api/admin/testimonials')->assertJsonPath('0.id', $id);

        $this->deleteJson("/api/admin/testimonials/{$id}")->assertNoContent();
        $this->assertSame(0, Testimonial::count());
    }

    /** @dataProvider invalid */
    public function test_a_credit_needing_a_name_or_organisation_has_one(array $body, string $field): void
    {
        $this->admin()->postJson('/api/admin/testimonials', $body + ['quote' => 'Q'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors($field);
    }

    public static function invalid(): array
    {
        return [
            'no quote' => [['quote' => '', 'credit' => 'anonymous'], 'quote'],
            'unknown credit' => [['credit' => 'nickname'], 'credit'],
            'full name without a name' => [['credit' => 'full_name'], 'name'],
            'organisation missing' => [['credit' => 'full_name_org', 'name' => 'A'], 'organisation'],
        ];
    }

    public function test_reorder(): void
    {
        $a = $this->testimonial();
        $b = $this->testimonial();

        $this->admin()->postJson('/api/admin/testimonials/reorder', ['ids' => [$b->id, $a->id]])->assertOk();

        $this->assertSame([$b->id, $a->id], Testimonial::orderBy('display_order')->pluck('id')->all());
    }
}
