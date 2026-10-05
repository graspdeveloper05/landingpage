<?php

namespace Tests\Feature;

use App\Models\Survey;
use App\Models\SurveyQuestion;
use App\Models\SurveyResponse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The attendee side of a survey. No sign-in and no link to registrations:
 * the form asks for a name, email and phone and keeps them with each answer.
 */
class SurveyPublicTest extends TestCase
{
    use RefreshDatabase;

    private const PERSON = ['name' => 'Aisyah Rahman', 'email' => 'Aisyah@Example.com', 'mobile' => '+60 12 345 6789'];

    private function openQuestion(string $type = 'choice'): SurveyQuestion
    {
        $survey = Survey::create(['title' => ['en' => 'Live poll'], 'status' => 'open']);

        return $survey->questions()->create([
            'type' => $type,
            'question' => ['en' => 'Q?', 'ms' => 'S?'],
            'options' => in_array($type, ['choice', 'checkbox'], true) ? [['en' => 'A'], ['en' => 'B'], ['en' => 'C']] : null,
            // Required, so the tests of what a valid answer is cannot be
            // passed by skipping; the optional cases switch it off.
            'is_required' => true,
            'status' => 'open',
        ]);
    }

    private function answer(SurveyQuestion $q, string $answer, array $person = self::PERSON)
    {
        return $this->postJson("/api/survey/questions/{$q->id}/answer", $person + ['answer' => $answer]);
    }

    public function test_the_survey_endpoints_are_exempt_from_csrf(): void
    {
        $excluded = app(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)->getExcludedPaths();

        $this->assertContains('api/survey/*', $excluded);
    }

    public function test_an_answer_is_stored_with_the_persons_details_and_no_registration(): void
    {
        $q = $this->openQuestion();

        $this->answer($q, '1')->assertCreated();

        $row = SurveyResponse::firstOrFail();
        $this->assertSame('Aisyah Rahman', $row->name);
        $this->assertSame('aisyah@example.com', $row->email);
        $this->assertSame('+60 12 345 6789', $row->mobile);
        $this->assertSame('1', $row->answer);
        $this->assertArrayNotHasKey('registration_id', $row->getAttributes());
    }

    /** @dataProvider badDetails */
    public function test_name_email_and_phone_are_required_and_checked(array $person, string $field): void
    {
        $q = $this->openQuestion();

        $this->answer($q, '1', $person)->assertUnprocessable()->assertJsonValidationErrors($field);
        $this->assertSame(0, SurveyResponse::count());
    }

    public static function badDetails(): array
    {
        return [
            'no name' => [['name' => '', 'email' => 'a@b.com', 'mobile' => '0123456789'], 'name'],
            'no email' => [['name' => 'A', 'email' => '', 'mobile' => '0123456789'], 'email'],
            'bad email' => [['name' => 'A', 'email' => 'not-an-email', 'mobile' => '0123456789'], 'email'],
            'no phone' => [['name' => 'A', 'email' => 'a@b.com', 'mobile' => ''], 'mobile'],
            'bad phone' => [['name' => 'A', 'email' => 'a@b.com', 'mobile' => 'call me'], 'mobile'],
        ];
    }

    public function test_each_survey_has_its_own_url_showing_only_its_open_questions(): void
    {
        $q = $this->openQuestion();
        $q->survey->questions()->create(['type' => 'text', 'question' => ['en' => 'Draft'], 'status' => 'draft']);
        $other = $this->openQuestion();
        $url = "/api/survey/{$q->survey_id}?email=".urlencode('aisyah@example.com');

        $this->getJson($url)
            ->assertOk()
            ->assertJsonPath('id', $q->survey_id)
            ->assertJsonPath('status', 'open')
            ->assertJsonCount(1, 'questions')
            ->assertJsonPath('questions.0.id', $q->id)
            ->assertJsonPath('questions.0.answered', false);

        $this->answer($q, '2')->assertCreated();

        // The same address however it is typed.
        $this->getJson("/api/survey/{$q->survey_id}?email=".urlencode(' AISYAH@example.com '))
            ->assertJsonPath('questions.0.answered', true);
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
        $id = $this->openQuestion()->survey_id;

        $this->getJson("/api/survey/live-poll-{$id}")->assertOk()->assertJsonPath('id', $id);
        $this->getJson("/api/survey/old-title-{$id}")->assertOk()->assertJsonPath('id', $id);
        $this->getJson("/api/survey/{$id}")->assertOk()->assertJsonPath('id', $id);
    }

    public function test_each_type_accepts_a_valid_answer(): void
    {
        foreach (['choice' => '0', 'rating' => '5', 'text' => 'Great panel'] as $type => $answer) {
            $this->answer($this->openQuestion($type), $answer)->assertCreated();
        }
        $this->assertSame(3, SurveyResponse::count());
    }

    /** @dataProvider invalidAnswers */
    public function test_an_answer_that_does_not_fit_the_type_is_refused(string $type, string $answer): void
    {
        $this->answer($this->openQuestion($type), $answer)->assertUnprocessable();
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

        $this->answer($q, '')->assertCreated();

        $this->assertSame('', $q->responses()->value('answer'));
        $this->getJson("/api/survey/{$q->survey_id}?email=aisyah@example.com")
            ->assertJsonPath('questions.0.is_required', false)
            ->assertJsonPath('questions.0.answered', true);
    }

    public function test_an_optional_question_still_checks_an_answer_that_is_given(): void
    {
        $q = $this->openQuestion('rating');
        $q->update(['is_required' => false]);

        $this->answer($q, '9')->assertUnprocessable();
    }

    public function test_a_required_question_cannot_be_skipped(): void
    {
        $this->answer($this->openQuestion('text'), '')->assertUnprocessable();
    }

    public function test_a_checkbox_question_takes_several_options_stored_in_order(): void
    {
        $q = $this->openQuestion('checkbox');

        $this->answer($q, '2,0,2')->assertCreated();

        $this->assertSame('0,2', $q->responses()->value('answer'));
    }

    /** @dataProvider invalidCheckboxAnswers */
    public function test_a_checkbox_answer_outside_the_options_is_refused(string $answer): void
    {
        $this->answer($this->openQuestion('checkbox'), $answer)->assertUnprocessable();
    }

    public static function invalidCheckboxAnswers(): array
    {
        return [['3'], ['0,3'], ['a,b'], ['0,,1'], ['-1'], ['']];
    }

    public function test_a_second_answer_from_the_same_email_is_refused_not_overwritten(): void
    {
        $q = $this->openQuestion();

        $this->answer($q, '0')->assertCreated();
        $this->answer($q, '1', ['email' => 'aisyah@example.com'] + self::PERSON)->assertConflict();

        $this->assertSame('0', $q->responses()->value('answer'));
    }

    public function test_different_people_each_answer_once(): void
    {
        $q = $this->openQuestion();

        $this->answer($q, '0')->assertCreated();
        $this->answer($q, '1', ['name' => 'Raj', 'email' => 'raj@example.com', 'mobile' => '0198765432'])->assertCreated();

        $this->assertSame(2, $q->responses()->count());
    }

    public function test_a_closed_question_or_closed_survey_refuses_answers(): void
    {
        $q = $this->openQuestion();
        $q->update(['status' => 'closed']);
        $this->answer($q, '0')->assertUnprocessable();

        $q2 = $this->openQuestion();
        $q2->survey->update(['status' => 'closed']);
        $this->answer($q2, '0')->assertUnprocessable();
    }
}
