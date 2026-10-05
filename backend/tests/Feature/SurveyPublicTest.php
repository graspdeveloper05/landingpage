<?php

namespace Tests\Feature;

use App\Models\Registration;
use App\Models\Survey;
use App\Models\SurveyQuestion;
use App\Models\SurveyResponse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SurveyPublicTest extends TestCase
{
    use RefreshDatabase;

    private Registration $guest;

    protected function setUp(): void
    {
        parent::setUp();
        config(['event.edition' => 2026]);
        $this->guest = Registration::create([
            'reference' => 'SND26-0001',
            'full_name' => 'Aisyah Rahman',
            'email' => 'aisyah@example.com',
            'mobile' => '+60 12 345 6789',
            'organisation' => 'UM',
            'designation' => 'Lecturer',
            'pdpa_accepted' => true,
            'edition' => 2026,
        ]);
    }

    private function openQuestion(string $type = 'choice'): SurveyQuestion
    {
        $survey = Survey::create(['title' => ['en' => 'Live poll'], 'status' => 'open']);

        return $survey->questions()->create([
            'type' => $type,
            'question' => ['en' => 'Q?', 'ms' => 'S?'],
            'options' => in_array($type, ['choice', 'checkbox'], true) ? [['en' => 'A'], ['en' => 'B'], ['en' => 'C']] : null,
            'status' => 'open',
        ]);
    }

    private function token(): string
    {
        return $this->postJson('/api/survey/identify', ['contact' => 'aisyah@example.com'])->json('token');
    }

    /**
     * A browser on the site's own domain makes the API stateful, which turns
     * on CSRF. The survey sends no token, like the RSVP form, so its routes
     * have to be exempt. Laravel skips CSRF while tests run, so the request
     * itself cannot show this; the exemption list can.
     */
    public function test_the_survey_endpoints_are_exempt_from_csrf(): void
    {
        $excluded = app(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)->getExcludedPaths();

        $this->assertContains('api/survey/*', $excluded);
    }

    public function test_identify_by_email_is_case_insensitive(): void
    {
        $this->postJson('/api/survey/identify', ['contact' => ' Aisyah@Example.com '])
            ->assertOk()
            ->assertJsonPath('firstName', 'Aisyah')
            ->assertJsonMissingPath('email');
    }

    /** @dataProvider mobiles */
    public function test_identify_by_mobile_in_any_format(string $typed): void
    {
        $this->postJson('/api/survey/identify', ['contact' => $typed])->assertOk();
    }

    public static function mobiles(): array
    {
        return [['+60 12-345 6789'], ['012 345 6789'], ['60123456789'], ['0123456789']];
    }

    public function test_unknown_contact_is_user_not_found(): void
    {
        $this->postJson('/api/survey/identify', ['contact' => 'nobody@example.com'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'User not found.');
        $this->postJson('/api/survey/identify', ['contact' => '0199999999'])
            ->assertUnprocessable();
    }

    public function test_another_editions_registration_is_not_found(): void
    {
        $this->guest->update(['edition' => 2025]);
        $this->postJson('/api/survey/identify', ['contact' => 'aisyah@example.com'])->assertUnprocessable();
    }

    public function test_each_survey_has_its_own_url_showing_only_its_open_questions(): void
    {
        $q = $this->openQuestion();
        $q->survey->questions()->create(['type' => 'text', 'question' => ['en' => 'Draft'], 'status' => 'draft']);
        $other = $this->openQuestion();
        $token = $this->token();
        $url = "/api/survey/{$q->survey_id}?token=".urlencode($token);

        $this->getJson($url)
            ->assertOk()
            ->assertJsonPath('id', $q->survey_id)
            ->assertJsonPath('status', 'open')
            ->assertJsonCount(1, 'questions')
            ->assertJsonPath('questions.0.id', $q->id)
            ->assertJsonPath('questions.0.answered', false);

        $this->postJson("/api/survey/questions/{$q->id}/answer", ['token' => $token, 'answer' => '2'])->assertCreated();

        $this->getJson($url)->assertJsonPath('questions.0.answered', true);
        $this->getJson("/api/survey/{$other->survey_id}")->assertJsonPath('questions.0.id', $other->id);
    }

    public function test_a_survey_that_is_not_open_shows_its_title_but_no_questions(): void
    {
        $q = $this->openQuestion();
        $q->survey->update(['status' => 'draft']);

        $this->getJson("/api/survey/{$q->survey_id}")
            ->assertOk()
            ->assertJsonPath('title.en', 'Live poll')
            ->assertJsonPath('status', 'draft')
            ->assertJsonCount(0, 'questions');
    }

    public function test_an_unknown_survey_is_404(): void
    {
        $this->getJson('/api/survey/999')->assertNotFound();
        $this->getJson('/api/survey/live-poll-999')->assertNotFound();
        $this->getJson('/api/survey/live-poll')->assertNotFound();
    }

    /** Links read "title-id"; the id decides, so a renamed survey's old link still works. */
    public function test_a_survey_link_is_its_title_and_id(): void
    {
        $q = $this->openQuestion();
        $id = $q->survey_id;

        $this->getJson("/api/survey/live-poll-{$id}")->assertOk()->assertJsonPath('id', $id);
        $this->getJson("/api/survey/old-title-{$id}")->assertOk()->assertJsonPath('id', $id);
        $this->getJson("/api/survey/{$id}")->assertOk()->assertJsonPath('id', $id);
    }

    public function test_each_type_accepts_a_valid_answer(): void
    {
        $token = $this->token();
        foreach (['choice' => '0', 'rating' => '5', 'text' => 'Great panel'] as $type => $answer) {
            $q = $this->openQuestion($type);
            $this->postJson("/api/survey/questions/{$q->id}/answer", ['token' => $token, 'answer' => $answer])
                ->assertCreated();
        }
        $this->assertSame(3, SurveyResponse::count());
    }

    /** @dataProvider invalidAnswers */
    public function test_an_answer_that_does_not_fit_the_type_is_refused(string $type, string $answer): void
    {
        $q = $this->openQuestion($type);
        $this->postJson("/api/survey/questions/{$q->id}/answer", ['token' => $this->token(), 'answer' => $answer])
            ->assertUnprocessable();
        $this->assertSame(0, SurveyResponse::count());
    }

    public static function invalidAnswers(): array
    {
        return [
            ['choice', '3'], ['choice', 'abc'], ['choice', '-1'], ['choice', '1.5'],
            ['rating', '0'], ['rating', '6'], ['rating', 'five'],
            ['text', ''], ['text', '   '], ['text', str_repeat('x', 1001)],
        ];
    }

    public function test_an_optional_question_can_be_skipped_and_counts_as_answered(): void
    {
        $q = $this->openQuestion('text');
        $q->update(['is_required' => false]);
        $token = $this->token();

        $this->postJson("/api/survey/questions/{$q->id}/answer", ['token' => $token, 'answer' => ''])
            ->assertCreated();

        $this->assertSame('', $q->responses()->value('answer'));
        $this->getJson("/api/survey/{$q->survey_id}?token=".urlencode($token))
            ->assertJsonPath('questions.0.is_required', false)
            ->assertJsonPath('questions.0.answered', true);
    }

    public function test_an_optional_question_still_checks_an_answer_that_is_given(): void
    {
        $q = $this->openQuestion('rating');
        $q->update(['is_required' => false]);

        $this->postJson("/api/survey/questions/{$q->id}/answer", ['token' => $this->token(), 'answer' => '9'])
            ->assertUnprocessable();
    }

    public function test_a_required_question_cannot_be_skipped(): void
    {
        $q = $this->openQuestion('text');

        $this->postJson("/api/survey/questions/{$q->id}/answer", ['token' => $this->token(), 'answer' => ''])
            ->assertUnprocessable();
    }

    public function test_a_checkbox_question_takes_several_options_stored_in_order(): void
    {
        $q = $this->openQuestion('checkbox');

        $this->postJson("/api/survey/questions/{$q->id}/answer", ['token' => $this->token(), 'answer' => '2,0,2'])
            ->assertCreated();

        $this->assertSame('0,2', $q->responses()->value('answer'));
    }

    /** @dataProvider invalidCheckboxAnswers */
    public function test_a_checkbox_answer_outside_the_options_is_refused(string $answer): void
    {
        $q = $this->openQuestion('checkbox');

        $this->postJson("/api/survey/questions/{$q->id}/answer", ['token' => $this->token(), 'answer' => $answer])
            ->assertUnprocessable();
    }

    public static function invalidCheckboxAnswers(): array
    {
        return [['3'], ['0,3'], ['a,b'], ['0,,1'], ['-1'], ['']];
    }

    public function test_a_second_answer_is_refused_not_overwritten(): void
    {
        $q = $this->openQuestion();
        $token = $this->token();
        $this->postJson("/api/survey/questions/{$q->id}/answer", ['token' => $token, 'answer' => '0'])->assertCreated();
        $this->postJson("/api/survey/questions/{$q->id}/answer", ['token' => $token, 'answer' => '1'])->assertConflict();
        $this->assertSame('0', $q->responses()->value('answer'));
    }

    public function test_a_closed_question_or_closed_survey_refuses_answers(): void
    {
        $token = $this->token();

        $q = $this->openQuestion();
        $q->update(['status' => 'closed']);
        $this->postJson("/api/survey/questions/{$q->id}/answer", ['token' => $token, 'answer' => '0'])->assertUnprocessable();

        $q2 = $this->openQuestion();
        $q2->survey->update(['status' => 'closed']);
        $this->postJson("/api/survey/questions/{$q2->id}/answer", ['token' => $token, 'answer' => '0'])->assertUnprocessable();
    }

    public function test_a_bad_token_is_401(): void
    {
        $q = $this->openQuestion();
        $this->postJson("/api/survey/questions/{$q->id}/answer", ['token' => 'forged', 'answer' => '0'])->assertUnauthorized();
        $this->getJson("/api/survey/{$q->survey_id}?token=forged")->assertOk()->assertJsonPath('questions.0.answered', false);
    }

    public function test_a_token_for_a_deleted_registration_is_401(): void
    {
        $q = $this->openQuestion();
        $token = $this->token();
        $this->guest->delete();
        $this->postJson("/api/survey/questions/{$q->id}/answer", ['token' => $token, 'answer' => '0'])->assertUnauthorized();
    }
}
