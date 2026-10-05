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
            'options' => $type === 'choice' ? [['en' => 'A'], ['en' => 'B'], ['en' => 'C']] : null,
            'status' => 'open',
        ]);
    }

    private function token(): string
    {
        return $this->postJson('/api/survey/identify', ['contact' => 'aisyah@example.com'])->json('token');
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

    public function test_listing_shows_only_open_questions_of_open_surveys_and_what_was_answered(): void
    {
        $q = $this->openQuestion();
        $q->survey->questions()->create(['type' => 'text', 'question' => ['en' => 'Draft'], 'status' => 'draft']);
        Survey::create(['title' => ['en' => 'Hidden'], 'status' => 'draft']);
        $token = $this->token();

        $this->getJson('/api/survey?token='.urlencode($token))
            ->assertOk()
            ->assertJsonCount(1, 'surveys')
            ->assertJsonCount(1, 'surveys.0.questions')
            ->assertJsonPath('surveys.0.questions.0.answered', false);

        $this->postJson("/api/survey/questions/{$q->id}/answer", ['token' => $token, 'answer' => '2'])->assertCreated();

        $this->getJson('/api/survey?token='.urlencode($token))
            ->assertJsonPath('surveys.0.questions.0.answered', true);
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
        $this->getJson('/api/survey?token=forged')->assertOk()->assertJsonPath('surveys.0.questions.0.answered', false);
    }

    public function test_a_token_for_a_deleted_registration_is_401(): void
    {
        $q = $this->openQuestion();
        $token = $this->token();
        $this->guest->delete();
        $this->postJson("/api/survey/questions/{$q->id}/answer", ['token' => $token, 'answer' => '0'])->assertUnauthorized();
    }
}
